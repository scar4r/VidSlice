import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, StatusBar, Platform, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';

import {
  getVideoInfo, calculateSegments, splitVideoIntoSegments,
  formatDuration, formatFileSize, SplitSegment,
} from '../src/utils/videoSplitter';

const { width } = Dimensions.get('window');

const PRESET_DURATIONS = [
  { label: '15ث', value: 15, icon: 'instagram', color: '#E1306C', desc: 'ريلز قصير' },
  { label: '30ث', value: 30, icon: 'whatsapp', color: '#25D366', desc: 'واتساب ستوري' },
  { label: '60ث', value: 60, icon: 'facebook', color: '#1877F2', desc: 'فيسبوك ستوري' },
  { label: '90ث', value: 90, icon: 'youtube', color: '#FF0000', desc: 'يوتيوب شورتس' },
];

export default function SplitScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { uri, name, size } = params as { uri: string; name: string; size: string };

  const [videoDuration, setVideoDuration] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState(30);
  const [useCustom, setUseCustom] = useState(false);
  const [segments, setSegments] = useState<SplitSegment[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadVideoInfo();
  }, []);

  useEffect(() => {
    const dur = useCustom ? customDuration : selectedDuration;
    if (videoDuration > 0) {
      setSegments(calculateSegments(videoDuration, dur));
    }
  }, [videoDuration, selectedDuration, customDuration, useCustom]);

  useEffect(() => {
    if (isSplitting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSplitting]);

  const loadVideoInfo = async () => {
    setLoadingInfo(true);
    try {
      const info = await getVideoInfo(uri);
      setVideoDuration(info.duration || 120); // fallback
    } catch {
      setVideoDuration(120);
    }
    setLoadingInfo(false);
  };

  const handleStartSplit = async () => {
    if (segments.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSplitting(true);

    const updatedSegments = [...segments.map(s => ({ ...s, status: 'pending' as const, progress: 0 }))];
    setSegments(updatedSegments);

    await splitVideoIntoSegments(
      uri,
      segments,
      name || 'video.mp4',
      (index) => {
        setSegments(prev => prev.map(s =>
          s.index === index ? { ...s, status: 'processing' } : s
        ));
      },
      (index, progress) => {
        setSegments(prev => prev.map(s =>
          s.index === index ? { ...s, progress } : s
        ));
        // overall progress
        const overall = (index + progress) / segments.length;
        Animated.timing(progressAnim, { toValue: overall, duration: 200, useNativeDriver: false }).start();
      },
      (index, segUri) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSegments(prev => prev.map(s =>
          s.index === index ? { ...s, status: 'done', uri: segUri, progress: 1 } : s
        ));
      },
      (index, error) => {
        setSegments(prev => prev.map(s =>
          s.index === index ? { ...s, status: 'error' } : s
        ));
      }
    );

    setIsSplitting(false);
    setIsDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const goToResults = () => {
    router.push({
      pathname: '/result',
      params: { segments: JSON.stringify(segments), videoName: name },
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const activeDuration = useCustom ? customDuration : selectedDuration;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient colors={['#0A0A0F', '#0D0B1E']} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.orb, styles.orb1]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تقسيم الفيديو</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video info card */}
        <BlurView intensity={25} tint="dark" style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialCommunityIcons name="file-video" size={28} color="#6C63FF" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoName} numberOfLines={1}>{name || 'video.mp4'}</Text>
            <View style={styles.infoMeta}>
              <Text style={styles.infoMetaText}>{formatDuration(videoDuration)}</Text>
              <View style={styles.infoDot} />
              <Text style={styles.infoMetaText}>{formatFileSize(Number(size) || 0)}</Text>
            </View>
          </View>
        </BlurView>

        {/* Duration presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ اختار مدة كل جزء</Text>
          <View style={styles.presets}>
            {PRESET_DURATIONS.map((preset) => {
              const isActive = !useCustom && selectedDuration === preset.value;
              return (
                <TouchableOpacity
                  key={preset.value}
                  onPress={() => {
                    setSelectedDuration(preset.value);
                    setUseCustom(false);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.presetCard, isActive && styles.presetCardActive]}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <LinearGradient
                      colors={['#6C63FF22', '#6C63FF44']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <MaterialCommunityIcons
                    name={preset.icon as any}
                    size={22}
                    color={isActive ? '#6C63FF' : '#555'}
                  />
                  <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>
                    {preset.label}
                  </Text>
                  <Text style={styles.presetDesc}>{preset.desc}</Text>
                  {isActive && <View style={styles.presetActiveDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom duration */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.customHeader}
            onPress={() => { setUseCustom(!useCustom); Haptics.selectionAsync(); }}
          >
            <Text style={styles.sectionTitle}>🎛️ مدة مخصصة</Text>
            <View style={[styles.toggle, useCustom && styles.toggleOn]}>
              <View style={[styles.toggleKnob, useCustom && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>

          {useCustom && (
            <BlurView intensity={20} tint="dark" style={styles.sliderCard}>
              <Text style={styles.sliderValue}>{customDuration} ثانية</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={300}
                step={5}
                value={customDuration}
                onValueChange={setCustomDuration}
                minimumTrackTintColor="#6C63FF"
                maximumTrackTintColor="#2A2A3A"
                thumbTintColor="#6C63FF"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>5ث</Text>
                <Text style={styles.sliderLabelText}>5د</Text>
              </View>
            </BlurView>
          )}
        </View>

        {/* Segments preview */}
        {segments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📦 {segments.length} {segments.length === 1 ? 'جزء' : 'أجزاء'}
            </Text>
            <View style={styles.segmentsTimeline}>
              {segments.map((seg, i) => (
                <View key={i} style={styles.segmentItem}>
                  <View style={[
                    styles.segmentBar,
                    seg.status === 'done' && styles.segmentDone,
                    seg.status === 'processing' && styles.segmentProcessing,
                    seg.status === 'error' && styles.segmentError,
                  ]}>
                    {seg.status === 'processing' && (
                      <Animated.View
                        style={[styles.segmentProgress, { width: `${seg.progress * 100}%` }]}
                      />
                    )}
                    {seg.status === 'done' && (
                      <View style={StyleSheet.absoluteFillObject}>
                        <LinearGradient
                          colors={['#4CAF5044', '#4CAF5022']}
                          style={StyleSheet.absoluteFillObject}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.segmentInfo}>
                    <Text style={styles.segmentIndex}>#{i + 1}</Text>
                    <Text style={styles.segmentTime}>{formatDuration(seg.duration)}</Text>
                    {seg.status === 'done' && <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />}
                    {seg.status === 'processing' && <Ionicons name="hourglass" size={14} color="#6C63FF" />}
                    {seg.status === 'error' && <Ionicons name="close-circle" size={14} color="#FF4444" />}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Progress bar while splitting */}
        {isSplitting && (
          <BlurView intensity={20} tint="dark" style={styles.progressCard}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <MaterialCommunityIcons name="scissors-cutting" size={28} color="#6C63FF" />
            </Animated.View>
            <Text style={styles.progressTitle}>جاري التقسيم...</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </BlurView>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {isDone ? (
          <TouchableOpacity onPress={goToResults} activeOpacity={0.9}>
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.splitBtn}
            >
              <Ionicons name="checkmark-done" size={22} color="#fff" />
              <Text style={styles.splitBtnText}>عرض النتائج ({segments.length} فيديو)</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStartSplit}
            activeOpacity={0.9}
            disabled={isSplitting || loadingInfo}
          >
            <LinearGradient
              colors={isSplitting ? ['#333', '#222'] : ['#6C63FF', '#9B59B6']}
              style={styles.splitBtn}
            >
              {isSplitting ? (
                <>
                  <MaterialCommunityIcons name="loading" size={22} color="#fff" />
                  <Text style={styles.splitBtnText}>جاري التقسيم...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="scissors-cutting" size={22} color="#fff" />
                  <Text style={styles.splitBtnText}>
                    ابدأ التقسيم إلى {segments.length} أجزاء
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  orb1: {
    position: 'absolute', width: 250, height: 250,
    backgroundColor: '#6C63FF22', borderRadius: 999,
    top: -50, right: -50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF10',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF10',
    overflow: 'hidden',
  },
  infoIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#6C63FF22',
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  infoMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  infoDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#555' },
  infoMetaText: { color: '#888', fontSize: 13 },

  section: { gap: 12 },
  sectionTitle: { color: '#CCCCDD', fontSize: 15, fontWeight: '700', textAlign: 'right' },

  presets: { flexDirection: 'row', gap: 10 },
  presetCard: {
    flex: 1,
    backgroundColor: '#12121E',
    borderWidth: 1,
    borderColor: '#2A2A3A',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  presetCardActive: { borderColor: '#6C63FF88' },
  presetLabel: { color: '#666', fontSize: 16, fontWeight: '800' },
  presetLabelActive: { color: '#9B8EFF' },
  presetDesc: { color: '#444', fontSize: 10, textAlign: 'center' },
  presetActiveDot: {
    position: 'absolute', top: 8, right: 8,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#6C63FF',
  },

  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: '#2A2A3A',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: '#6C63FF' },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleKnobOn: { alignSelf: 'flex-end' },

  sliderCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF10',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 8,
  },
  sliderValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
  },
  sliderLabelText: { color: '#555', fontSize: 12 },

  segmentsTimeline: { gap: 8 },
  segmentItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  segmentBar: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: '#1E1E2E',
    overflow: 'hidden',
  },
  segmentDone: { backgroundColor: '#4CAF5022' },
  segmentProcessing: { backgroundColor: '#6C63FF22' },
  segmentError: { backgroundColor: '#FF444422' },
  segmentProgress: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 4,
  },
  segmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  segmentIndex: { color: '#555', fontSize: 12 },
  segmentTime: { color: '#888', fontSize: 12, fontWeight: '600' },

  progressCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C63FF33',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 12,
  },
  progressTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressTrack: {
    width: '100%', height: 6, backgroundColor: '#1E1E2E', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#6C63FF',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF08',
  },
  splitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  splitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
