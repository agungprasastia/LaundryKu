import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const illustrationFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;
  const masukScale = useRef(new Animated.Value(1)).current;
  const daftarScale = useRef(new Animated.Value(1)).current;

  // Floating bubbles
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(illustrationFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(buttonSlide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();

    // Floating bubbles loop
    const float = (anim: Animated.Value, dur: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -10, duration: dur, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 10, duration: dur, useNativeDriver: true }),
        ])
      ).start();
    };
    float(bubble1, 2400);
    float(bubble2, 3000);
    float(bubble3, 2700);
  }, [bubble1, bubble2, bubble3, buttonFade, buttonSlide, contentFade, contentSlide, illustrationFade, logoOpacity, logoScale]);

  const animatePress = (anim: Animated.Value, down: boolean) => {
    Animated.spring(anim, { toValue: down ? 0.96 : 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={LaundryColors.headerBg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ===== HEADER SECTION ===== */}
        <View style={styles.headerSection}>
          {/* Floating bubbles */}
          <Animated.View style={[styles.bubble, styles.bubbleTopRight, { transform: [{ translateY: bubble1 }] }]} />
          <Animated.View style={[styles.bubble, styles.bubbleTopLeft, { transform: [{ translateY: bubble2 }] }]} />
          <Animated.View style={[styles.bubble, styles.bubbleMidRight, { transform: [{ translateY: bubble3 }] }]} />
          <Animated.View style={[styles.bubble, styles.bubbleSmall1, { transform: [{ translateY: bubble1 }] }]} />
          <Animated.View style={[styles.bubble, styles.bubbleSmall2, { transform: [{ translateY: bubble2 }] }]} />

          {/* Logo */}
          <Animated.View style={[styles.logoArea, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoIcon}>
              <Ionicons name="water" size={30} color={LaundryColors.primary} />
            </View>
            <Text style={styles.logoText}>
              Laundry<Text style={styles.logoAccent}>Ku</Text>
            </Text>
            <Text style={styles.logoSub}>Laundry online terpercaya</Text>
          </Animated.View>

          {/* Illustration area with icons */}
          <Animated.View style={[styles.illustrationArea, { opacity: illustrationFade }]}>
            {/* Left side - basket/folded clothes */}
            <View style={styles.illustLeft}>
              <View style={styles.illustPlant}>
                <MaterialCommunityIcons name="leaf" size={22} color={LaundryColors.leaf} />
              </View>
              <View style={styles.illustBasket}>
                <MaterialCommunityIcons name="basket" size={36} color={LaundryColors.primary} />
              </View>
              <View style={styles.illustStack}>
                <Ionicons name="shirt" size={18} color={LaundryColors.primaryLight} />
              </View>
            </View>

            {/* Center - bag */}
            <View style={styles.illustCenter}>
              <View style={styles.illustBag}>
                <Ionicons name="bag-handle" size={40} color={LaundryColors.primary} />
                <Text style={styles.illustBagLabel}>LaundryKu</Text>
              </View>
              {/* Hanger rack */}
              <View style={styles.illustHanger}>
                <MaterialCommunityIcons name="hanger" size={20} color={LaundryColors.primaryLight} />
                <MaterialCommunityIcons name="hanger" size={20} color={LaundryColors.primaryLight} />
              </View>
            </View>

            {/* Right side - truck & pin */}
            <View style={styles.illustRight}>
              <View style={styles.illustPin}>
                <Ionicons name="location" size={24} color={LaundryColors.primary} />
              </View>
              <View style={styles.illustTruck}>
                <MaterialCommunityIcons name="truck-delivery" size={32} color={LaundryColors.primaryLight} />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ===== CONTENT CARD ===== */}
        <Animated.View
          style={[
            styles.contentCard,
            { opacity: contentFade, transform: [{ translateY: contentSlide }] },
          ]}
        >
          <Text style={styles.welcomeTitle}>
            Selamat Datang{'\n'}di <Text style={styles.welcomeTitleAccent}>LaundryKu</Text>
          </Text>
          <Text style={styles.welcomeDesc}>
            Laundry online dengan pickup, tracking{'\n'}real-time, dan delivery dalam satu aplikasi.{'\n'}
            Praktis, cepat, dan terpercaya.
          </Text>

          {/* Feature cards row */}
          <View style={styles.featuresRow}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: LaundryColors.rolePelangganBg }]}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={24} color={LaundryColors.primary} />
              </View>
              <Text style={styles.featureTitle}>Pickup Mudah</Text>
              <Text style={styles.featureDesc}>
                Jemput cucian langsung dari lokasi Anda.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: LaundryColors.rolePelangganBg }]}>
                <Ionicons name="location" size={24} color={LaundryColors.primary} />
              </View>
              <Text style={styles.featureTitle}>Tracking Real-Time</Text>
              <Text style={styles.featureDesc}>
                Pantau status cucian Anda secara langsung dan transparan.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: LaundryColors.rolePelangganBg }]}>
                <MaterialCommunityIcons name="truck-fast-outline" size={24} color={LaundryColors.primary} />
              </View>
              <Text style={styles.featureTitle}>Delivery Cepat</Text>
              <Text style={styles.featureDesc}>
                Cucian bersih diantar kembali tepat waktu ke rumah Anda.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonsArea, { opacity: buttonFade, transform: [{ translateY: buttonSlide }] }]}>
            {/* Masuk button */}
            <Animated.View style={{ transform: [{ scale: masukScale }] }}>
              <TouchableOpacity
                style={styles.masukButton}
                onPress={() => router.push('/(auth)/login')}
                onPressIn={() => animatePress(masukScale, true)}
                onPressOut={() => animatePress(masukScale, false)}
                activeOpacity={0.9}
              >
                <Ionicons name="log-in-outline" size={20} color={LaundryColors.textWhite} />
                <Text style={styles.masukText}>Masuk</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Daftar button */}
            <Animated.View style={{ transform: [{ scale: daftarScale }] }}>
              <TouchableOpacity
                style={styles.daftarButton}
                onPress={() => router.push('/(auth)/register')}
                onPressIn={() => animatePress(daftarScale, true)}
                onPressOut={() => animatePress(daftarScale, false)}
                activeOpacity={0.9}
              >
                <Ionicons name="person-add-outline" size={20} color={LaundryColors.primary} />
                <Text style={styles.daftarText}>Daftar</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Pagination dots */}
            <View style={styles.dotsRow}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LaundryColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* ========== HEADER ========== */
  headerSection: {
    backgroundColor: LaundryColors.headerBg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 50,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  /* Bubbles */
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  bubbleTopRight: { width: 120, height: 120, top: -30, right: -40 },
  bubbleTopLeft: { width: 80, height: 80, top: 20, left: -25 },
  bubbleMidRight: { width: 50, height: 50, top: '40%', right: 10 },
  bubbleSmall1: { width: 30, height: 30, top: '30%', left: 40, backgroundColor: 'rgba(37, 99, 235, 0.08)' },
  bubbleSmall2: { width: 20, height: 20, top: 50, right: 80, backgroundColor: 'rgba(37, 99, 235, 0.1)' },

  /* Logo */
  logoArea: { alignItems: 'center', marginBottom: 20 },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: LaundryColors.backgroundWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: { fontSize: 26, fontWeight: '800', color: LaundryColors.textPrimary, letterSpacing: -0.5 },
  logoAccent: { color: LaundryColors.primary },
  logoSub: { fontSize: 13, color: LaundryColors.textSecondary, marginTop: 2 },

  /* Illustration */
  illustrationArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    height: 130,
    marginTop: 10,
  },
  illustLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  illustPlant: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LaundryColors.leafBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustBasket: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  illustStack: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    right: 10,
  },
  illustCenter: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  illustBag: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustBagLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: LaundryColors.primary,
    marginTop: -2,
  },
  illustHanger: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    opacity: 0.5,
  },
  illustRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  illustPin: {
    position: 'absolute',
    top: 5,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustTruck: {
    width: 60,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  /* ========== CONTENT CARD ========== */
  contentCard: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 28,
    flex: 1,
    shadowColor: LaundryColors.shadowDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  welcomeTitleAccent: { color: LaundryColors.primary },
  welcomeDesc: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  /* Features row */
  featuresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 26,
  },
  featureCard: {
    flex: 1,
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },

  /* Buttons */
  buttonsArea: {
    gap: 12,
  },
  masukButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.primary,
    borderRadius: 14,
    height: 54,
    gap: 8,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  masukText: {
    fontSize: 16,
    fontWeight: '700',
    color: LaundryColors.textWhite,
  },
  daftarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 14,
    height: 54,
    gap: 8,
    borderWidth: 1.5,
    borderColor: LaundryColors.inputBorder,
  },
  daftarText: {
    fontSize: 16,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
  },

  /* Dots */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LaundryColors.inputBorder,
  },
  dotActive: {
    width: 24,
    backgroundColor: LaundryColors.primary,
    borderRadius: 4,
  },
});

