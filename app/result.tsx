import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, StatusBar, Platform, Alert, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { SplitSegment, formatDuration } from '../src/utils/videoSplitter';

const { width } = Dimensions.get('window');

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const segments: SplitSegment[] = JSON.parse(params.segments as string || '[]');
  const videoName = params.videoName as string;

  const [savedSegments, setSavedSegments] = useState<Set<number>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  const successSegments = segments.filter(s => s.status === 'done' && s.uri);
  const errorSegments = segments.filter(s => s.status === 'error');

  const saveToGallery = async (segment: SplitSegment) => {
    if (!segment.uri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'تحتاج إذن الوصول للمكتبة لحفظ الفيديوهات');
      return;
    }

    try {
      await MediaLibrary.createAssetAsync(segment.uri);
      setSavedSegments(prev => new Set([...prev, segment.index]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('خطأ', 'فشل حفظ الفيديو');
    }
  };

  const shareSegment = async (segment: SplitSegment) => {
    if (!segment.uri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(segment.uri, {
        mimeType: 'video/mp4',
        dialogTitle: `مشاركة الجزء ${segment.index + 1}`,
      });
    }
  };

  const saveAllToGallery = async () => {
    setSavingAll(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'تحتاج إذن الوصول للمكتبة');
      setSavingAll(false);
      return;
    }

    for (const seg of successSegments) {
      if (seg.uri && !savedSegments.has(seg.index)) {
        try {
          await MediaLibrary.createAssetAsync(seg.uri);
          setSavedSegments(prev => new Set([...prev, seg.index]));
        } catch { }
      }
    }

    setSavingAll(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅ تم الحفظ!', `تم حفظ ${successSegments.length} فيديو في المعرض`);
  };

  const renderSegment = ({ item: seg }: { item: SplitSegment }) => {
    const isSaved = savedSegments.has(seg.index);
    const isError = seg.status === 'error';

    return (
      <BlurView intensity={20} tint="dark" style={[styles.segCard, isError && styles.segCardError]}>
        {/* Thumbnail placeholder */}
        <LinearGradient
          colors={isError ? ['#FF444422', '#FF444411'] : ['#6C63FF22', '#9B59B611']}
          style={styles.segThumb}
        >
          <MaterialCommunityIcons
            name={isError ? 'alert-circle' : 'video'}
            size={28}
            color={isError ? '#FF4444' : '#6C63FF'}
          />
        </LinearGradient>

        {/* Info */}
        <View style={styles.segInfo}>
          <Text style={styles.segTitle}>
            الجزء {seg.index + 1}
          </Text>
          <Text style={styles.segMeta}>
            {formatDuration(seg.startTime)} ← {formatDuration(seg.endTime)}
          </Text>
          <Text style={styles.segDur}>{formatDuration(seg.duration)}</Text>
        </View>

        {/* Actions */}
        {!isError && (
          <View style={styles.segActions}>
            <TouchableOpacity
              onPress={() => saveToGallery(seg)}
              style={[styles.actionBtn, isSaved && styles.actionBtnSaved]}
            >
              <Ionicons
                name={isSaved ? 'checkmark' : 'download-outline'}
                size={18}
                color={isSaved ? '#4CAF50' : '#6C63FF'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => shareSegment(seg)}
              style={styles.actionBtn}
            >
              <Ionicons name="share-outline" size={18} color="#9B59B6" />
            </TouchableOpacity>
          </View>
        )}
      </BlurView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A0F', '#0D0B1E']} style={StyleSheet.absoluteFillObject} />

      {/* Success orb */}
      <View style={styles.successOrb} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backBtn}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>النتائج</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <BlurView intensity={20} tint="dark" style={styles.statCard}>
          <Text style={styles.statNum}>{successSegments.length}</Text>
          <Text style={styles.statLabel}>أجزاء ناجحة</Text>
        </BlurView>
        {errorSegments.length > 0 && (
          <BlurView intensity={20} tint="dark" style={[styles.statCard, styles.statCardError]}>
            <Text style={[styles.statNum, { color: '#FF4444' }]}>{errorSegments.length}</Text>
            <Text style={styles.statLabel}>أخطاء</Text>
          </BlurView>
        )}
        <BlurView intensity={20} tint="dark" style={styles.statCard}>
          <Text style={styles.statNum}>{savedSegments.size}</Text>
          <Text style={styles.statLabel}>محفوظ</Text>
        </BlurView>
      </View>

      {/* Segments list */}
      <FlatList
        data={segments}
        keyExtractor={s => String(s.index)}
        renderItem={renderSegment}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom bar */}
      {successSegments.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={saveAllToGallery}
            activeOpacity={0.9}
            disabled={savingAll}
          >
            <LinearGradient
              colors={
                savedSegments.size === successSegments.length
                  ? ['#4CAF50', '#45a049']
                  : ['#6C63FF', '#9B59B6']
              }
              style={styles.saveAllBtn}
            >
              <Ionicons
                name={savedSegments.size === successSegments.length ? 'checkmark-done' : 'download'}
                size={22}
                color="#fff"
              />
              <Text style={styles.saveAllText}>
                {savingAll
                  ? 'جاري الحفظ...'
                  : savedSegments.size === successSegments.length
                  ? 'تم حفظ الكل ✓'
                  : `حفظ الكل (${successSegments.length} فيديو)`
                }
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/')}
            style={styles.newBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.newBtnText}>+ تقسيم فيديو جديد</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  successOrb: {
    position: 'absolute', width: 300, height: 300,
    backgroundColor: '#4CAF5015', borderRadius: 999,
    top: -100, left: -100,
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

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF10',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 4,
  },
  statCardError: { borderColor: '#FF444433' },
  statNum: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 12 },

  list: { paddingHorizontal: 20, paddingBottom: 180, gap: 10 },

  segCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF10',
    overflow: 'hidden',
  },
  segCardError: { borderColor: '#FF444422' },
  segThumb: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  segInfo: { flex: 1 },
  segTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  segMeta: { color: '#666', fontSize: 12, marginTop: 2 },
  segDur: { color: '#9B8EFF', fontSize: 13, fontWeight: '600', marginTop: 2 },

  segActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#1A1A2E',
    borderWidth: 1, borderColor: '#2A2A3A',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnSaved: { borderColor: '#4CAF5066', backgroundColor: '#4CAF5011' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF08',
    gap: 10,
  },
  saveAllBtn: {
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
  saveAllText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  newBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF15',
  },
  newBtnText: { color: '#888', fontSize: 15, fontWeight: '600' },
});
