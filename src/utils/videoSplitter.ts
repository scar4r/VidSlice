import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

export interface SplitSegment {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  uri?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  size: number;
  name: string;
}

/**
 * Get video duration and info using FFprobe via FFmpegKit
 */
export async function getVideoInfo(uri: string): Promise<{ duration: number }> {
  return new Promise((resolve) => {
    FFmpegKit.execute(`-i "${uri}" -hide_banner`)
      .then(async (session) => {
        const output = await session.getOutput();
        const durationMatch = output?.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (durationMatch) {
          const h = parseInt(durationMatch[1]);
          const m = parseInt(durationMatch[2]);
          const s = parseFloat(durationMatch[3]);
          resolve({ duration: h * 3600 + m * 60 + s });
        } else {
          resolve({ duration: 0 });
        }
      });
  });
}

/**
 * Calculate segments based on total duration and segment duration
 */
export function calculateSegments(
  totalDuration: number,
  segmentDuration: number
): SplitSegment[] {
  const segments: SplitSegment[] = [];
  let start = 0;
  let index = 0;

  while (start < totalDuration) {
    const end = Math.min(start + segmentDuration, totalDuration);
    segments.push({
      index,
      startTime: start,
      endTime: end,
      duration: end - start,
      status: 'pending',
      progress: 0,
    });
    start = end;
    index++;
  }

  return segments;
}

/**
 * Split a single segment from the video using FFmpeg
 * Uses stream copy (no re-encoding) for maximum speed and quality preservation
 */
export async function splitSegment(
  inputUri: string,
  segment: SplitSegment,
  outputDir: string,
  videoName: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const safeName = videoName.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^/.]+$/, '');
  const outputFileName = `${safeName}_part${String(segment.index + 1).padStart(3, '0')}.mp4`;
  const outputPath = `${outputDir}${outputFileName}`;

  // Enable statistics callback for progress
  FFmpegKitConfig.enableStatisticsCallback((stats) => {
    const timeMs = stats.getTime();
    if (timeMs > 0 && segment.duration > 0) {
      const progress = Math.min((timeMs / 1000) / segment.duration, 1);
      onProgress?.(progress);
    }
  });

  const startStr = formatTime(segment.startTime);
  const durationStr = segment.duration.toFixed(3);

  // -c copy = stream copy, no re-encoding = full quality, very fast
  const command = `-ss ${startStr} -i "${inputUri}" -t ${durationStr} -c copy -avoid_negative_ts make_zero -y "${outputPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    return outputPath;
  } else {
    const logs = await session.getLogs();
    throw new Error(`FFmpeg failed for segment ${segment.index}: ${logs}`);
  }
}

/**
 * Split ALL segments sequentially with progress callbacks
 */
export async function splitVideoIntoSegments(
  inputUri: string,
  segments: SplitSegment[],
  videoName: string,
  onSegmentStart: (index: number) => void,
  onSegmentProgress: (index: number, progress: number) => void,
  onSegmentDone: (index: number, uri: string) => void,
  onSegmentError: (index: number, error: string) => void,
): Promise<void> {
  const outputDir = `${FileSystem.cacheDirectory}vidslice/`;

  // Ensure output dir exists
  const dirInfo = await FileSystem.getInfoAsync(outputDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
  }

  for (const segment of segments) {
    onSegmentStart(segment.index);
    try {
      const uri = await splitSegment(
        inputUri,
        segment,
        outputDir,
        videoName,
        (progress) => onSegmentProgress(segment.index, progress),
      );
      onSegmentDone(segment.index, uri);
    } catch (e: any) {
      onSegmentError(segment.index, e.message);
    }
  }
}

/**
 * Format seconds to HH:MM:SS.mmm
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
}

/**
 * Format duration nicely for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}ث`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}د ${s}ث` : `${m}د`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Clean up temp files
 */
export async function cleanupTempFiles(): Promise<void> {
  const outputDir = `${FileSystem.cacheDirectory}vidslice/`;
  const dirInfo = await FileSystem.getInfoAsync(outputDir);
  if (dirInfo.exists) {
    await FileSystem.deleteAsync(outputDir, { idempotent: true });
  }
}
