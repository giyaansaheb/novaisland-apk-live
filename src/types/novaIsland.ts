export type FillMode = 'solid' | 'linear-gradient' | 'radial-gradient' | 'conic-gradient';

export type IslandShapePreset =
  | 'pill'
  | 'squircle'
  | 'teardrop'
  | 'notched'
  | 'hex-tech'
  | 'asymmetric'
  | 'custom-corners';

export type AnimationStyle =
  | 'spring'
  | 'bounce'
  | 'fade'
  | 'liquid-morph'
  | 'glow-pulse'
  | 'particles'
  | 'elastic';

export type NotificationBannerStyle =
  | 'compact-pill'
  | 'expanded-card'
  | 'split-capsule'
  | 'minimal-ticker'
  | 'edge-illumination';

export type IconPackStyle =
  | 'monochrome'
  | 'tinted-glass'
  | 'duotone'
  | 'neon-outline'
  | 'solid-accent';

export type IconContainerShape = 'circle' | 'squircle' | 'hexagon' | 'none';

export type VisualizerStyle = 'bars' | 'sine-wave' | 'orbital' | 'dots';

export type SlotItemType =
  | 'media-art'
  | 'app-icon'
  | 'title-marquee'
  | 'waveform'
  | 'timer-readout'
  | 'battery-chip'
  | 'camera-cutout'
  | 'none';

export type IslandDisplayMode = 'compact' | 'split' | 'expanded';

export type ActiveActivityType =
  | 'music'
  | 'call'
  | 'timer'
  | 'charging'
  | 'navigation'
  | 'bluetooth'
  | 'notification';

export type ThemeCategory =
  | 'All'
  | 'Minimal & OLED'
  | 'Glass & Frosted'
  | 'Cyber & Neon'
  | 'Luxury & Editorial'
  | 'Nature & Atmospheric'
  | 'Material You'
  | 'Custom';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface IslandConfig {
  // Color & Gradients
  fillMode: FillMode;
  primaryColor: string; // HEX
  secondaryColor: string; // HEX
  tertiaryColor: string; // HEX
  useThreeStopGradient: boolean;
  gradientAngle: number; // 0 - 360
  textColor: string; // HEX
  accentColor: string; // HEX

  // Glow & Surface Filters
  neonGlowEnabled: boolean;
  neonGlowColor: string;
  neonGlowIntensity: number; // 0 - 100
  neonGlowSpread: number; // 2 - 48 px
  opacity: number; // 15 - 100 %
  backdropBlur: number; // 0 - 32 px
  saturation: number; // 0 - 200 %
  brightness: number; // 50 - 150 %

  // Geometry & Dimensions (Compact & Split)
  compactWidth: number; // 96 - 260 px
  compactHeight: number; // 26 - 56 px
  cornerRadius: number; // 0 - 40 px
  positionX: number; // -70 to +70 px
  positionY: number; // 4 to 48 px
  innerPadding: number; // 4 to 24 px
  borderWidth: number; // 0 to 5 px
  borderColor: string;
  shadowDepth: number; // 0 to 40
  shadowOpacity: number; // 0 to 100

  // Expanded Panel Dimensions
  expandedWidth: number; // 260 - 364 px
  expandedHeight: number; // 130 - 250 px
  expandedRadius: number; // 12 - 48 px

  // Shape Editor
  shapePreset: IslandShapePreset;
  lockCorners: boolean;
  radiusTopLeft: number;
  radiusTopRight: number;
  radiusBottomLeft: number;
  radiusBottomRight: number;
  splitIslandEnabled: boolean;
  splitGap: number; // 6 - 24 px
  splitSecondarySize: number; // 28 - 54 px

  // Animation Studio
  animationStyle: AnimationStyle;
  animationSpeed: number; // 0.25x to 2.5x
  springStiffness: number; // 120 - 500
  springDamping: number; // 10 - 40
  particlesEnabled: boolean;
  particleCount: number; // 6 - 36
  particleColor: string;

  // Notification Design Studio
  notificationStyle: NotificationBannerStyle;
  iconSize: number; // 14 - 34 px
  titleTextSize: number; // 11 - 18 px
  subtitleTextSize: number; // 10 - 15 px
  actionButtonStyle: 'filled' | 'outlined' | 'ghost' | 'icon-only';
  autoDismissSeconds: number; // 2 - 15 s
  perAppAccentOverride: boolean;

  // Icon Studio
  iconPackStyle: IconPackStyle;
  iconContainerShape: IconContainerShape;
  iconTintColor: string;
  showNotificationBadge: boolean;
  visualizerStyle: VisualizerStyle;

  // Layout Studio
  leftSlot: SlotItemType;
  centerSlot: SlotItemType;
  rightSlot: SlotItemType;
  contentAlignment: 'space-between' | 'center' | 'start';
  elementSpacing: number; // 4 - 20 px
  showCameraCutout: boolean;

  // Performance & Battery Saving
  targetFrameRate: 60 | 90 | 120;
  batterySaverAutoDim: boolean;
  oledBurnInProtection: boolean;
  hardwareAcceleration: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  category: Exclude<ThemeCategory, 'All'>;
  description: string;
  isBuiltIn: boolean;
  isFavorite: boolean;
  updatedAt: string;
  config: IslandConfig;
}

export interface IslandProfile {
  id: string;
  name: string;
  description: string;
  themeId: string;
  isActive: boolean;
  batteryMode: 'balanced' | 'performance' | 'ultra-saver';
  autoExpandNotifications: boolean;
  hapticFeedbackStrength: number; // 0 - 100
}

export interface ScheduleRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: 'time' | 'charging' | 'dnd' | 'low-battery';
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  themeId: string;
  days: string[]; // ['Mon', 'Tue', ...]
}

export interface LiveNotificationPayload {
  id: string;
  appName: string;
  title: string;
  subtitle: string;
  accentHex: string;
  timestamp: string;
}

export interface RoomTransactionLog {
  id: string;
  timestamp: string;
  table: 'datastore_preferences' | 'room_theme_presets' | 'room_profiles' | 'room_schedules';
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'QUERY' | 'MIGRATE';
  summary: string;
  durationMs: number;
}

export interface RoomTestAssertion {
  id: string;
  suite: 'DataStore<Preferences>' | 'Room SQLite DAO' | 'Compose State Sync';
  testName: string;
  passed: boolean;
  durationMs: number;
  details: string;
}
