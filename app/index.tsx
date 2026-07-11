import { ThemeColors } from '@/constants/colors';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withRepeat, 
  withSequence,
  withDelay,
  SharedValue
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LaundrySpacing } from '@/constants/spacing';
import { LaundryTypography } from '@/constants/typography';
import InteractiveButton from '@/components/ui/InteractiveButton';



export default function WelcomeScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();

  // Animations (Reanimated)
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const illustrationFade = useSharedValue(0);
  const contentFade = useSharedValue(0);
  const contentSlide = useSharedValue(30);
  const buttonFade = useSharedValue(0);
  const buttonSlide = useSharedValue(20);
  
  // Carousel state
  const [activeSlide, setActiveSlide] = useState(0);

  const features = [
    {
      id: '1',
      title: 'Pickup Mudah',
      desc: 'Jemput cucian langsung dari lokasi Anda.',
      icon: 'truck-delivery-outline',
      iconFamily: 'MaterialCommunityIcons',
    },
    {
      id: '2',
      title: 'Tracking Real-Time',
      desc: 'Pantau status cucian Anda secara langsung dan transparan.',
      icon: 'location',
      iconFamily: 'Ionicons',
    },
    {
      id: '3',
      title: 'Delivery Cepat',
      desc: 'Cucian bersih diantar kembali tepat waktu ke rumah Anda.',
      icon: 'truck-fast-outline',
      iconFamily: 'MaterialCommunityIcons',
    },
  ];

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = SCREEN_WIDTH;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (activeSlide !== roundIndex && roundIndex >= 0 && roundIndex < features.length) {
      setActiveSlide(roundIndex);
    }
  };

  // Floating bubbles
  const bubble1 = useSharedValue(0);
  const bubble2 = useSharedValue(0);
  const bubble3 = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 500 });
    
    illustrationFade.value = withDelay(200, withTiming(1, { duration: 500 }));
    
    contentFade.value = withDelay(400, withTiming(1, { duration: 400 }));
    contentSlide.value = withDelay(400, withTiming(0, { duration: 400 }));
    
    buttonFade.value = withDelay(600, withTiming(1, { duration: 300 }));
    buttonSlide.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 90 }));

    // Floating bubbles loop
    const float = (anim: SharedValue<number>, dur: number) => {
      anim.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: dur }),
          withTiming(10, { duration: dur })
        ),
        -1, // infinite
        true // reverse
      );
    };
    float(bubble1, 2400);
    float(bubble2, 3000);
    float(bubble3, 2700);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const illustStyle = useAnimatedStyle(() => ({
    opacity: illustrationFade.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentFade.value,
    transform: [{ translateY: contentSlide.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonFade.value,
    transform: [{ translateY: buttonSlide.value }],
  }));

  const b1Style = useAnimatedStyle(() => ({ transform: [{ translateY: bubble1.value }] }));
  const b2Style = useAnimatedStyle(() => ({ transform: [{ translateY: bubble2.value }] }));
  const b3Style = useAnimatedStyle(() => ({ transform: [{ translateY: bubble3.value }] }));

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
          <Animated.View style={[styles.bubble, styles.bubbleTopRight, b1Style]} />
          <Animated.View style={[styles.bubble, styles.bubbleTopLeft, b2Style]} />
          <Animated.View style={[styles.bubble, styles.bubbleMidRight, b3Style]} />
          <Animated.View style={[styles.bubble, styles.bubbleSmall1, b1Style]} />
          <Animated.View style={[styles.bubble, styles.bubbleSmall2, b2Style]} />

          {/* Logo */}
          <Animated.View style={[styles.logoArea, logoStyle]}>
            <View style={styles.logoIcon}>
              <Ionicons name="water" size={30} color={LaundryColors.primary} />
            </View>
            <Text style={styles.logoText}>
              Laundry<Text style={styles.logoAccent}>Ku</Text>
            </Text>
            <Text style={styles.logoSub}>Laundry online terpercaya</Text>
          </Animated.View>

          {/* Illustration area with icons */}
          <Animated.View style={[styles.illustrationArea, { width: SCREEN_WIDTH }, illustStyle]}>
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
        <Animated.View style={[styles.contentCard, contentStyle]}>
          <Text style={styles.welcomeTitle}>
            Selamat Datang{'\n'}di <Text style={styles.welcomeTitleAccent}>LaundryKu</Text>
          </Text>
          <Text style={styles.welcomeDesc}>
            Laundry online dengan pickup, tracking{'\n'}real-time, dan delivery dalam satu aplikasi.{'\n'}
            Praktis, cepat, dan terpercaya.
          </Text>

          {/* Feature cards carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.featuresScroll}
          >
            {features.map((item) => (
              <View key={item.id} style={[styles.featureCardWrap, { width: SCREEN_WIDTH }]}>
                <View style={styles.featureCard}>
                  <View style={[styles.featureIconWrap, { backgroundColor: LaundryColors.rolePelangganBg }]}>
                    {item.iconFamily === 'Ionicons' ? (
                      <Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>["name"]} size={36} color={LaundryColors.primary} />
                    ) : (
                      <MaterialCommunityIcons name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={36} color={LaundryColors.primary} />
                    )}
                  </View>
                  <Text style={styles.featureTitleBig}>{item.title}</Text>
                  <Text style={styles.featureDescBig}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Buttons */}
          <Animated.View style={[styles.buttonsArea, buttonStyle]}>
            {/* Masuk button */}
            <InteractiveButton
              style={styles.masukButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Ionicons name="log-in-outline" size={20} color={LaundryColors.textWhite} />
              <Text style={styles.masukText}>Masuk</Text>
            </InteractiveButton>

            {/* Daftar button */}
            <InteractiveButton
              style={styles.daftarButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Ionicons name="person-add-outline" size={20} color={LaundryColors.primary} />
              <Text style={styles.daftarText}>Daftar</Text>
            </InteractiveButton>

            {/* Pagination dots */}
            <View style={styles.dotsRow}>
              {features.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, activeSlide === index && styles.dotActive]}
                />
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
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
    borderRadius: LaundrySpacing.radius.full,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  bubbleTopRight: { width: 120, height: 120, top: -30, right: -40 },
  bubbleTopLeft: { width: 80, height: 80, top: 20, left: -25 },
  bubbleMidRight: { width: 50, height: 50, top: '40%', right: 10 },
  bubbleSmall1: { width: 30, height: 30, top: '30%', left: 40, backgroundColor: 'rgba(37, 99, 235, 0.08)' },
  bubbleSmall2: { width: 20, height: 20, top: 50, right: 80, backgroundColor: 'rgba(37, 99, 235, 0.1)' },

  /* Logo */
  logoArea: { alignItems: 'center', marginBottom: LaundrySpacing.spacing.lg },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: LaundrySpacing.radius.xl,
    backgroundColor: LaundryColors.backgroundWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LaundrySpacing.spacing.sm,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: { fontSize: LaundryTypography.size.xxl, fontWeight: LaundryTypography.weight.bold, color: LaundryColors.textPrimary, letterSpacing: -0.5 },
  logoAccent: { color: LaundryColors.primary },
  logoSub: { fontSize: LaundryTypography.size.base, color: LaundryColors.textSecondary, marginTop: LaundrySpacing.spacing.xs },

  /* Illustration */
  illustrationArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: LaundrySpacing.spacing.lg,
    height: 130,
    marginTop: LaundrySpacing.spacing.sm,
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
    borderRadius: LaundrySpacing.radius.xl,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LaundrySpacing.spacing.xs,
  },
  illustStack: {
    width: 32,
    height: 32,
    borderRadius: LaundrySpacing.radius.md,
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
    borderRadius: LaundrySpacing.radius.xl,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustBagLabel: {
    fontSize: LaundryTypography.size.xs,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.primary,
    marginTop: -2,
  },
  illustHanger: {
    flexDirection: 'row',
    gap: 6,
    marginTop: LaundrySpacing.spacing.xs,
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
    borderRadius: LaundrySpacing.radius.xl,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LaundrySpacing.spacing.xs,
  },

  /* ========== CONTENT CARD ========== */
  contentCard: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -LaundrySpacing.spacing.xl,
    paddingHorizontal: LaundrySpacing.spacing.xl,
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
    fontSize: LaundryTypography.size.xxl,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: LaundrySpacing.spacing.sm,
  },
  welcomeTitleAccent: { color: LaundryColors.primary },
  welcomeDesc: {
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: LaundrySpacing.spacing.xl,
  },

  /* Features */
  featuresScroll: {
    marginHorizontal: -LaundrySpacing.spacing.xl,
    marginBottom: 26,
  },
  featureCardWrap: {
    paddingHorizontal: LaundrySpacing.spacing.xl,
  },
  featureCard: {
    flex: 1,
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: LaundrySpacing.radius.xl,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    paddingVertical: LaundrySpacing.spacing.xl,
    paddingHorizontal: LaundrySpacing.spacing.lg,
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 64,
    height: 64,
    borderRadius: LaundrySpacing.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LaundrySpacing.spacing.base,
  },
  featureTitleBig: {
    fontSize: LaundryTypography.size.lg,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    marginBottom: LaundrySpacing.spacing.sm,
  },
  featureDescBig: {
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  /* Buttons */
  buttonsArea: {
    gap: LaundrySpacing.spacing.md,
  },
  masukButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.primary,
    borderRadius: LaundrySpacing.radius.xl,
    height: 54,
    gap: LaundrySpacing.spacing.sm,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  masukText: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textWhite,
  },
  daftarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: LaundrySpacing.radius.xl,
    height: 54,
    gap: LaundrySpacing.spacing.sm,
    borderWidth: 1.5,
    borderColor: LaundryColors.inputBorder,
  },
  daftarText: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
  },

  /* Dots */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: LaundrySpacing.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: LaundrySpacing.radius.sm,
    backgroundColor: LaundryColors.inputBorder,
  },
  dotActive: {
    width: LaundrySpacing.spacing.xl,
    backgroundColor: LaundryColors.primary,
    borderRadius: LaundrySpacing.radius.sm,
  },
});
