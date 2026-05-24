import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [picking, setPicking] = useState(false);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
          pathname: '/split',
          params: {
            uri: asset.uri,
            name: asset.name,
            size: asset.size,
          },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPicking(false);
    }
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Background gradient mesh */}
      <LinearGradient
        colors={['#0A0A0F', '#0D0B1E', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.orb, styles.orb2, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.orb, styles.orb3, { opacity: glowOpacity }]} />

      {/* Grid lines */}
      <View style={styles.gridOverlay} />

      <View style={styles.content}>
        {/* Logo + Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#6C63FF', '#FF6584']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <MaterialCommunityIcons name="scissors-cutting" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>VidSlice</Text>
          <Text style={styles.tagline}>قسّم. شارك. انتشر.</Text>
        </View>

        {/* Feature pills */}
        <View style={styles.pills}>
          {['واتساب ستوري', 'ريلز', 'تيك توك', 'فيسبوك'].map((label, i) => (
            <View key={i} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Main CTA */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={handlePickVideo}
            activeOpacity={0.9}
            disabled={picking}
          >
            <LinearGradient
              colors={['#6C63FF', '#9B59B6', '#FF6584']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <View style={styles.ctaInner}>
                <Ionicons name="cloud-upload-outline" size={36} color="#fff" />
                <Text style={styles.ctaTitle}>اختار الفيديو</Text>
                <Text style={styles.ctaSubtitle}>MP4 · MOV · AVI · MKV</Text>
              </View>
              {/* Shine effect */}
              <View style={styles.ctaShine} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* How it works */}
        <View style={styles.stepsContainer}>
          <BlurView intensity={20} tint="dark" style={styles.stepsBlur}>
            <Text style={styles.stepsTitle}>كيف يشتغل؟</Text>
            {[
              { icon: 'folder-video', label: 'اختار الفيديو من جهازك', step: '١' },
              { icon: 'scissors-cutting', label: 'حدد مدة كل جزء', step: '٢' },
              { icon: 'download-circle-outline', label: 'حمّل الأجزاء بجودة عالية', step: '٣' },
            ].map((item, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{item.step}</Text>
                </View>
                <MaterialCommunityIcons name={item.icon as any} size={20} color="#6C63FF" />
                <Text style={styles.stepLabel}>{item.label}</Text>
              </View>
            ))}
          </BlurView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },

  // Background orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: '#6C63FF33',
    top: -80,
    left: -80,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: '#FF658422',
    bottom: 100,
    right: -60,
  },
  orb3: {
    width: 150,
    height: 150,
    backgroundColor: '#9B59B622',
    top: height * 0.4,
    left: 30,
  },

  // Grid
  gridOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.03,
    // Using border to simulate grid
    borderWidth: 1,
    borderColor: '#fff',
  },

  // Header
  header: { alignItems: 'center', gap: 8 },
  logoContainer: { marginBottom: 4 },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#8B8BA0',
    letterSpacing: 2,
    fontWeight: '500',
  },

  // Pills
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#6C63FF44',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillText: { color: '#9B8EFF', fontSize: 13, fontWeight: '600' },

  // CTA Button
  ctaButton: {
    width: width - 48,
    borderRadius: 28,
    padding: 2,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  ctaInner: {
    backgroundColor: 'transparent',
    borderRadius: 26,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    letterSpacing: 1,
  },
  ctaShine: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ skewX: '-20deg' }],
  },

  // Steps
  stepsContainer: {
    width: width - 48,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF10',
  },
  stepsBlur: {
    padding: 20,
    gap: 14,
  },
  stepsTitle: {
    color: '#FFFFFF60',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'right',
  },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6C63FF22',
    borderWidth: 1,
    borderColor: '#6C63FF66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { color: '#6C63FF', fontSize: 13, fontWeight: '700' },
  stepLabel: { color: '#CCCCDD', fontSize: 14, flex: 1, textAlign: 'right' },
});
