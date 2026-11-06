import React, { useEffect, useMemo, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Check,
  Compass,
  Headphones,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Phone,
  PhoneOff,
  Play,
  RotateCcw,
  Save,
  SkipBack,
  SkipForward,
  Sparkles,
  SplitSquareHorizontal,
  Timer,
  Undo2,
  Volume2,
  Wifi,
} from 'lucide-react';
import {
  computeIslandBackground,
  computeIslandBorderRadius,
} from '../services/persistenceEngine';
import {
  ActiveActivityType,
  IslandConfig,
  IslandDisplayMode,
  LiveNotificationPayload,
  SlotItemType,
} from '../types/novaIsland';

interface PhonePreviewProps {
  config: IslandConfig;
  hasUnsavedChanges: boolean;
  displayMode: IslandDisplayMode;
  onChangeDisplayMode: (mode: IslandDisplayMode) => void;
  activeActivity: ActiveActivityType;
  onChangeActivity: (activity: ActiveActivityType) => void;
  liveNotification: LiveNotificationPayload;
  animationTriggerKey: number;
  onApply: () => void;
  onOpenSavePresetModal: () => void;
  onCancel: () => void;
  onReset: () => void;
}

type WallpaperStyle = 'oled-mesh' | 'slate-arch' | 'aurora-night' | 'daylight-pearl';

const TRACKS = [
  { title: 'Midnight Horizon', artist: 'ODESZA · The Last Goodbye', duration: 224 },
  { title: 'Solaris Echoes', artist: 'Bicep · Isles Deluxe', duration: 198 },
  { title: 'Kyoto Raindrop', artist: 'Bonobo · Fragments', duration: 245 },
];

export const PhonePreview: React.FC<PhonePreviewProps> = ({
  config,
  hasUnsavedChanges,
  displayMode,
  onChangeDisplayMode,
  activeActivity,
  onChangeActivity,
  liveNotification,
  animationTriggerKey,
  onApply,
  onOpenSavePresetModal,
  onCancel,
  onReset,
}) => {
  const [wallpaper, setWallpaper] = useState<WallpaperStyle>('oled-mesh');
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [trackProgressSec, setTrackProgressSec] = useState(84);
  const [timerSec, setTimerSec] = useState(175);
  const [timerRunning, setTimerRunning] = useState(true);
  const [callStatus, setCallStatus] = useState<'incoming' | 'connected'>('incoming');
  const [callSec, setCallSec] = useState(0);
  const [spatialAudioOn, setSpatialAudioOn] = useState(true);
  const [pulseReplay, setPulseReplay] = useState(false);

  const currentTrack = TRACKS[trackIndex % TRACKS.length];

  // Trigger visual replay when animationTriggerKey changes
  useEffect(() => {
    if (animationTriggerKey > 0) {
      setPulseReplay(true);
      const t = setTimeout(() => setPulseReplay(false), 650);
      return () => clearTimeout(t);
    }
  }, [animationTriggerKey]);

  // Live timer & music progress ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        setTrackProgressSec((prev) => (prev + 1) % currentTrack.duration);
      }
      if (timerRunning && timerSec > 0) {
        setTimerSec((prev) => (prev > 0 ? prev - 1 : 0));
      }
      if (callStatus === 'connected') {
        setCallSec((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, timerRunning, timerSec, callStatus, currentTrack.duration]);

  const isExpanded = displayMode === 'expanded';
  const isSplit = displayMode === 'split' || (config.splitIslandEnabled && !isExpanded);

  const backgroundCss = useMemo(() => computeIslandBackground(config), [config]);
  const borderRadiusCss = useMemo(
    () => computeIslandBorderRadius(config, isExpanded),
    [config, isExpanded]
  );

  // Compute CSS transition curve from animationStyle & animationSpeed
  const transitionStyle = useMemo(() => {
    const baseMs = Math.round(380 / Math.max(0.25, config.animationSpeed));
    let easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
    if (config.animationStyle === 'bounce') {
      easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
    } else if (config.animationStyle === 'elastic') {
      easing = 'cubic-bezier(0.68, -0.55, 0.26, 1.55)';
    } else if (config.animationStyle === 'fade') {
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
    } else if (config.animationStyle === 'spring') {
      const bounceFactor = Math.min(1.65, Math.max(1.05, 1 + (30 - config.springDamping) * 0.02));
      easing = `cubic-bezier(0.2, ${bounceFactor.toFixed(2)}, 0.35, 1)`;
    }
    return `all ${baseMs}ms ${easing}`;
  }, [config.animationStyle, config.animationSpeed, config.springDamping]);

  // Box shadow + Neon glow computation
  const boxShadowCss = useMemo(() => {
    const shadows: string[] = [];
    if (config.shadowDepth > 0 && config.shadowOpacity > 0) {
      const alpha = (config.shadowOpacity / 100).toFixed(2);
      shadows.push(
        `0 ${Math.round(config.shadowDepth * 0.6)}px ${config.shadowDepth * 1.5}px rgba(0, 0, 0, ${alpha})`
      );
    }
    if (config.neonGlowEnabled && config.neonGlowIntensity > 0) {
      const glowAlpha = Math.min(1, config.neonGlowIntensity / 100).toFixed(2);
      shadows.push(
        `0 0 ${config.neonGlowSpread}px ${Math.round(config.neonGlowSpread * 0.35)}px ${config.neonGlowColor}${Math.round(
          Number(glowAlpha) * 255
        )
          .toString(16)
          .padStart(2, '0')}`
      );
    }
    return shadows.length > 0 ? shadows.join(', ') : 'none';
  }, [
    config.shadowDepth,
    config.shadowOpacity,
    config.neonGlowEnabled,
    config.neonGlowIntensity,
    config.neonGlowSpread,
    config.neonGlowColor,
  ]);

  // Deterministic particle coordinates around the island
  const particles = useMemo(() => {
    if (!config.particlesEnabled && config.animationStyle !== 'particles') return [];
    const count = Math.min(36, Math.max(4, config.particleCount));
    return Array.from({ length: count }).map((_, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const rx = (isExpanded ? config.expandedWidth : config.compactWidth) * 0.46;
      const ry = (isExpanded ? config.expandedHeight : config.compactHeight) * 0.44;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      const size = (idx % 3) + 2.5;
      return { id: idx, x, y, size, delay: (idx * 0.14).toFixed(2) };
    });
  }, [
    config.particlesEnabled,
    config.animationStyle,
    config.particleCount,
    isExpanded,
    config.expandedWidth,
    config.compactWidth,
    config.expandedHeight,
    config.compactHeight,
  ]);

  const formatSeconds = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Icon Container according to Icon Studio settings
  const renderIconBadge = (iconNode: React.ReactNode, customAccent?: string) => {
    const activeAccent = customAccent || config.iconTintColor || config.accentColor;
    let shapeClass = 'rounded-full';
    if (config.iconContainerShape === 'squircle') shapeClass = 'rounded-lg';
    if (config.iconContainerShape === 'hexagon') shapeClass = 'rounded-sm rotate-45';
    if (config.iconContainerShape === 'none') {
      return (
        <div
          className="relative flex items-center justify-center shrink-0"
          style={{ color: activeAccent, width: config.iconSize, height: config.iconSize }}
        >
          {iconNode}
        </div>
      );
    }

    let bgStyle: React.CSSProperties = {
      width: config.iconSize + 8,
      height: config.iconSize + 8,
      color: activeAccent,
    };

    if (config.iconPackStyle === 'tinted-glass') {
      bgStyle.backgroundColor = `${activeAccent}26`;
      bgStyle.border = `1px solid ${activeAccent}4D`;
    } else if (config.iconPackStyle === 'solid-accent') {
      bgStyle.backgroundColor = activeAccent;
      bgStyle.color = '#09090B';
    } else if (config.iconPackStyle === 'neon-outline') {
      bgStyle.backgroundColor = 'transparent';
      bgStyle.border = `1.5px solid ${activeAccent}`;
      bgStyle.boxShadow = `0 0 8px ${activeAccent}80`;
    } else if (config.iconPackStyle === 'duotone') {
      bgStyle.background = `linear-gradient(135deg, ${activeAccent}40, ${config.primaryColor})`;
      bgStyle.border = `1px solid ${activeAccent}66`;
    } else {
      bgStyle.backgroundColor = 'rgba(255,255,255,0.08)';
    }

    return (
      <div className={`relative flex items-center justify-center shrink-0 ${shapeClass}`} style={bgStyle}>
        <div className={config.iconContainerShape === 'hexagon' ? '-rotate-45' : ''}>{iconNode}</div>
        {config.showNotificationBadge && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-black"
            style={{ backgroundColor: config.accentColor }}
          />
        )}
      </div>
    );
  };

  // Render Live Audio Visualizer based on config.visualizerStyle
  const renderVisualizer = (color = config.accentColor) => {
    if (config.visualizerStyle === 'dots') {
      return (
        <div className="flex items-center gap-1 shrink-0">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className=" rounded-full transition-transform duration-300"
              style={{
                width: 5,
                height: 5,
                backgroundColor: color,
                opacity: isPlaying ? 0.4 + ((i + trackProgressSec) % 3) * 0.3 : 0.35,
                transform: isPlaying && (i + trackProgressSec) % 2 === 0 ? 'scale(1.35)' : 'scale(0.9)',
              }}
            />
          ))}
        </div>
      );
    }

    if (config.visualizerStyle === 'orbital') {
      return (
        <div
          className="relative flex items-center justify-center shrink-0"
          style={{ width: config.iconSize + 2, height: config.iconSize + 2 }}
        >
          <div
            className={`w-full h-full rounded-full border-2 border-dashed ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ borderColor: color, animationDuration: '4s' }}
          />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
      );
    }

    if (config.visualizerStyle === 'sine-wave') {
      return (
        <svg width="32" height="16" viewBox="0 0 32 16" className="shrink-0 overflow-visible">
          <path
            d={
              isPlaying && trackProgressSec % 2 === 0
                ? 'M 2 8 Q 8 1, 16 8 T 30 8'
                : 'M 2 8 Q 8 15, 16 8 T 30 8'
            }
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
      );
    }

    // Default: 'bars'
    const heights = isPlaying
      ? [
          10 + ((trackProgressSec * 3) % 8),
          16 - ((trackProgressSec * 2) % 9),
          8 + ((trackProgressSec * 5) % 10),
          14 - ((trackProgressSec * 4) % 7),
        ]
      : [5, 5, 5, 5];

    return (
      <div className="flex items-center gap-0.5 h-4 shrink-0">
        {heights.map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full transition-all duration-200"
            style={{
              height: `${h}px`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
    );
  };

  // Render customizable compact slot item
  const renderCompactSlot = (slot: SlotItemType) => {
    if (slot === 'none') return null;

    if (slot === 'camera-cutout') {
      return (
        <div
          className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 flex items-center justify-center shrink-0"
          title="Front Camera Cutout"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/90" />
        </div>
      );
    }

    if (slot === 'media-art' || slot === 'app-icon') {
      if (activeActivity === 'call') {
        return renderIconBadge(<Phone size={Math.max(12, config.iconSize - 6)} />, '#10B981');
      }
      if (activeActivity === 'timer') {
        return renderIconBadge(<Timer size={Math.max(12, config.iconSize - 6)} />, '#F59E0B');
      }
      if (activeActivity === 'charging') {
        return renderIconBadge(
          <BatteryCharging size={Math.max(12, config.iconSize - 6)} />,
          '#34D399'
        );
      }
      if (activeActivity === 'navigation') {
        return renderIconBadge(<Compass size={Math.max(12, config.iconSize - 6)} />, '#38BDF8');
      }
      if (activeActivity === 'bluetooth') {
        return renderIconBadge(<Headphones size={Math.max(12, config.iconSize - 6)} />, '#A78BFA');
      }
      if (activeActivity === 'notification') {
        return renderIconBadge(
          <Bell size={Math.max(12, config.iconSize - 6)} />,
          config.perAppAccentOverride ? liveNotification.accentHex : config.accentColor
        );
      }
      return renderIconBadge(<Music2 size={Math.max(12, config.iconSize - 6)} />);
    }

    if (slot === 'title-marquee') {
      let label = currentTrack.title;
      if (activeActivity === 'call') label = callStatus === 'incoming' ? 'Elena Vance' : formatSeconds(callSec);
      if (activeActivity === 'timer') label = formatSeconds(timerSec);
      if (activeActivity === 'charging') label = '88% · SuperVOOC';
      if (activeActivity === 'navigation') label = '240m · Turn Right';
      if (activeActivity === 'bluetooth') label = 'Pixel Buds Pro 2';
      if (activeActivity === 'notification') label = liveNotification.title;

      return (
        <span
          className="font-medium truncate max-w-[105px] select-none"
          style={{
            color: config.textColor,
            fontSize: `${Math.min(15, config.titleTextSize)}px`,
          }}
        >
          {label}
        </span>
      );
    }

    if (slot === 'waveform') {
      return renderVisualizer();
    }

    if (slot === 'timer-readout') {
      return (
        <span
          className="font-mono font-semibold text-xs shrink-0"
          style={{ color: config.accentColor }}
        >
          {formatSeconds(timerSec)}
        </span>
      );
    }

    if (slot === 'battery-chip') {
      return (
        <span
          className="font-mono text-[11px] font-semibold shrink-0"
          style={{ color: '#34D399' }}
        >
          88%
        </span>
      );
    }

    return null;
  };

  // Wallpaper background classes
  const wallpaperStyles: Record<WallpaperStyle, string> = {
    'oled-mesh':
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/60 via-slate-950 to-black',
    'slate-arch':
      'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950',
    'aurora-night':
      'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/50 via-slate-900 to-indigo-950',
    'daylight-pearl':
      'bg-gradient-to-b from-slate-100 via-indigo-50 to-slate-200 text-slate-900',
  };

  const isLightWallpaper = wallpaper === 'daylight-pearl';

  return (
    <div className="flex flex-col items-center">
      {/* Top Preview Mode & Activity Controls */}
      <div className="w-full mb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400">
            Interactive Android 16 Viewport
          </span>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onChangeDisplayMode('compact')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                displayMode === 'compact'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Minimize2 className="w-3 h-3" />
              Compact
            </button>
            <button
              type="button"
              onClick={() => onChangeDisplayMode('split')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                displayMode === 'split'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareHorizontal className="w-3 h-3" />
              Split
            </button>
            <button
              type="button"
              onClick={() => onChangeDisplayMode('expanded')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                displayMode === 'expanded'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              Expanded
            </button>
          </div>
        </div>

        {/* Live Activity Selector Bar */}
        <div className="grid grid-cols-7 gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          {(
            [
              { id: 'music', label: 'Music', icon: Music2 },
              { id: 'call', label: 'Call', icon: Phone },
              { id: 'timer', label: 'Timer', icon: Timer },
              { id: 'charging', label: 'Charge', icon: BatteryCharging },
              { id: 'navigation', label: 'Nav', icon: Compass },
              { id: 'bluetooth', label: 'Buds', icon: Headphones },
              { id: 'notification', label: 'Alert', icon: Bell },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeActivity === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeActivity(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  active
                    ? 'bg-slate-800 text-indigo-400 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mb-0.5" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flagship Android Phone Frame */}
      <div className="relative w-[372px] h-[648px] rounded-[46px] p-2.5 bg-slate-900 border-[3px] border-slate-700/80 shadow-2xl select-none overflow-hidden">
        {/* Inner AMOLED Display */}
        <div
          className={`relative w-full h-full rounded-[38px] overflow-hidden flex flex-col justify-between transition-colors duration-500 ${wallpaperStyles[wallpaper]}`}
        >
          {/* Status Bar */}
          <div
            className={`w-full px-6 pt-3.5 pb-2 flex items-center justify-between text-xs font-semibold z-10 ${
              isLightWallpaper ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            <span className="font-mono tracking-tight">09:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">5G</span>
              <div
                className={`w-5 h-2.5 rounded-sm border p-0.5 flex items-center ${
                  isLightWallpaper ? 'border-slate-700' : 'border-slate-300'
                }`}
              >
                <div className="w-3.5 h-full bg-emerald-400 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* DYNAMIC ISLAND STAGE */}
          <div className="relative w-full flex-1 flex flex-col items-center">
            <div
              className="relative flex items-center justify-center z-30"
              style={{
                transform: `translate(${config.positionX}px, ${config.positionY}px) ${
                  pulseReplay ? 'scale(1.06)' : 'scale(1)'
                }`,
                transition: transitionStyle,
              }}
            >
              {/* Floating Particles Layer */}
              {particles.length > 0 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {particles.map((p) => (
                    <span
                      key={p.id}
                      className="absolute rounded-full animate-ping"
                      style={{
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: config.particleColor || config.accentColor,
                        transform: `translate(${p.x}px, ${p.y}px)`,
                        animationDuration: `${(1.8 / config.animationSpeed).toFixed(2)}s`,
                        animationDelay: `${p.delay}s`,
                        opacity: 0.65,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Primary Island Capsule */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  onChangeDisplayMode(displayMode === 'expanded' ? 'compact' : 'expanded')
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onChangeDisplayMode(displayMode === 'expanded' ? 'compact' : 'expanded');
                  }
                }}
                style={
                  {
                    width: isExpanded ? `${config.expandedWidth}px` : `${config.compactWidth}px`,
                    height: isExpanded ? `${config.expandedHeight}px` : `${config.compactHeight}px`,
                    background: backgroundCss,
                    borderRadius: borderRadiusCss,
                    padding: `${config.innerPadding}px`,
                    borderWidth: `${config.borderWidth}px`,
                    borderStyle: config.borderWidth > 0 ? 'solid' : 'none',
                    borderColor: config.borderColor,
                    boxShadow: boxShadowCss,
                    opacity: config.opacity / 100,
                    backdropFilter: `blur(${config.backdropBlur}px) saturate(${config.saturation}%) brightness(${config.brightness}%)`,
                    WebkitBackdropFilter: `blur(${config.backdropBlur}px) saturate(${config.saturation}%) brightness(${config.brightness}%)`,
                    transition: transitionStyle,
                    '--island-glow-color': config.neonGlowColor,
                  } as React.CSSProperties
                }
                className={`relative cursor-pointer overflow-hidden flex flex-col justify-center ${
                  config.animationStyle === 'glow-pulse' ? 'animate-glow-pulse' : ''
                } ${config.animationStyle === 'liquid-morph' ? 'animate-liquid-morph' : ''}`}
              >
                {/* COMPACT OR SPLIT PRIMARY CONTENT */}
                {!isExpanded && (
                  <div
                    className="w-full h-full flex items-center"
                    style={{
                      justifyContent: config.contentAlignment,
                      gap: `${config.elementSpacing}px`,
                    }}
                  >
                    {renderCompactSlot(config.leftSlot)}
                    {config.showCameraCutout && config.centerSlot !== 'camera-cutout' && (
                      <div
                        className="w-3 h-3 rounded-full bg-black/95 border border-slate-800/90 shrink-0"
                        title="Hardware Camera Sensor"
                      />
                    )}
                    {renderCompactSlot(config.centerSlot)}
                    {renderCompactSlot(config.rightSlot)}
                  </div>
                )}

                {/* EXPANDED PANEL CONTENT */}
                {isExpanded && (
                  <div
                    className="w-full h-full flex flex-col justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {activeActivity === 'music' && (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {renderIconBadge(<Music2 size={config.iconSize} />)}
                            <div className="min-w-0">
                              <p
                                className="font-semibold truncate leading-tight"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.titleTextSize}px`,
                                }}
                              >
                                {currentTrack.title}
                              </p>
                              <p
                                className="truncate opacity-75 mt-0.5"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.subtitleTextSize}px`,
                                }}
                              >
                                {currentTrack.artist}
                              </p>
                            </div>
                          </div>
                          {renderVisualizer()}
                        </div>

                        {/* Interactive Seek Bar */}
                        <div className="my-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono opacity-75 mb-1" style={{ color: config.textColor }}>
                            <span>{formatSeconds(trackProgressSec)}</span>
                            <span>-{formatSeconds(currentTrack.duration - trackProgressSec)}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={currentTrack.duration}
                            value={trackProgressSec}
                            onChange={(e) => setTrackProgressSec(Number(e.target.value))}
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/20"
                            style={{ accentColor: config.accentColor }}
                          />
                        </div>

                        {/* Media Transport Controls */}
                        <div className="flex items-center justify-between px-2">
                          <button
                            type="button"
                            onClick={() => onChangeDisplayMode('compact')}
                            className="text-[11px] font-medium opacity-70 hover:opacity-100 transition-opacity"
                            style={{ color: config.textColor }}
                          >
                            Collapse
                          </button>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setTrackIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length);
                                setTrackProgressSec(0);
                              }}
                              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                              style={{ color: config.textColor }}
                            >
                              <SkipBack className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsPlaying((p) => !p)}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95"
                              style={{
                                backgroundColor: config.accentColor,
                                color: '#09090B',
                              }}
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTrackIndex((i) => (i + 1) % TRACKS.length);
                                setTrackProgressSec(0);
                              }}
                              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                              style={{ color: config.textColor }}
                            >
                              <SkipForward className="w-4 h-4" />
                            </button>
                          </div>
                          <Volume2 className="w-4 h-4 opacity-75" style={{ color: config.textColor }} />
                        </div>
                      </>
                    )}

                    {activeActivity === 'call' && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {renderIconBadge(<Phone size={config.iconSize} />, '#10B981')}
                            <div>
                              <p
                                className="font-semibold"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.titleTextSize}px`,
                                }}
                              >
                                Elena Vance · Product Design
                              </p>
                              <p
                                className="opacity-75 font-mono"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.subtitleTextSize}px`,
                                }}
                              >
                                {callStatus === 'incoming'
                                  ? 'Incoming HD Voice Call...'
                                  : `Connected · ${formatSeconds(callSec)}`}
                              </p>
                            </div>
                          </div>
                          {renderVisualizer('#10B981')}
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCallStatus('incoming');
                              setCallSec(0);
                              onChangeDisplayMode('compact');
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <PhoneOff className="w-3.5 h-3.5" />
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCallStatus((s) => (s === 'incoming' ? 'connected' : 'incoming'))
                            }
                            className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {callStatus === 'incoming' ? 'Accept Call' : 'Hold'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActivity === 'timer' && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {renderIconBadge(<Timer size={config.iconSize} />, '#F59E0B')}
                            <div>
                              <p
                                className="font-semibold"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.titleTextSize}px`,
                                }}
                              >
                                Espresso Extraction
                              </p>
                              <p
                                className="opacity-70"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.subtitleTextSize}px`,
                                }}
                              >
                                Nova Precision Timer
                              </p>
                            </div>
                          </div>
                          <span
                            className="font-mono text-2xl font-bold tracking-tight"
                            style={{ color: config.accentColor }}
                          >
                            {formatSeconds(timerSec)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setTimerSec(180)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium"
                            style={{ color: config.textColor }}
                          >
                            Reset 3:00
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimerRunning((r) => !r)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950"
                            style={{ backgroundColor: config.accentColor }}
                          >
                            {timerRunning ? 'Pause' : 'Resume'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActivity === 'charging' && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {renderIconBadge(<BatteryCharging size={config.iconSize} />, '#34D399')}
                            <div>
                              <p
                                className="font-semibold"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.titleTextSize}px`,
                                }}
                              >
                                SuperVOOC 100W Charging
                              </p>
                              <p
                                className="opacity-75"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.subtitleTextSize}px`,
                                }}
                              >
                                Full charge in 11 mins · 34.2°C Nominal
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-bold text-emerald-400">88%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: '88%',
                              background: `linear-gradient(90deg, #10B981, ${config.accentColor})`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {activeActivity === 'navigation' && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {renderIconBadge(<Compass size={config.iconSize} />, '#38BDF8')}
                            <div>
                              <p
                                className="font-semibold"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.titleTextSize}px`,
                                }}
                              >
                                Turn Right onto Omotesando Ave
                              </p>
                              <p
                                className="opacity-75"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.subtitleTextSize}px`,
                                }}
                              >
                                240 meters · Arrival 18:52 (Fastest Route)
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-sm font-bold text-sky-400">240m</span>
                        </div>
                        <div className="flex items-center justify-between text-xs opacity-80 pt-1" style={{ color: config.textColor }}>
                          <span>Lane Assist: Keep Right 2 Lanes</span>
                          <button
                            type="button"
                            onClick={() => onChangeDisplayMode('compact')}
                            className="underline font-medium"
                          >
                            Minimize
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActivity === 'bluetooth' && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {renderIconBadge(<Headphones size={config.iconSize} />, '#A78BFA')}
                            <div>
                              <p
                                className="font-semibold"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.titleTextSize}px`,
                                }}
                              >
                                Pixel Buds Pro 2 Connected
                              </p>
                              <p
                                className="opacity-75 font-mono"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.subtitleTextSize}px`,
                                }}
                              >
                                L: 96% · R: 94% · Case: 82% · LDAC 990kbps
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs opacity-75" style={{ color: config.textColor }}>
                            Head Tracking Spatial Audio
                          </span>
                          <button
                            type="button"
                            onClick={() => setSpatialAudioOn((s) => !s)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                              backgroundColor: spatialAudioOn ? config.accentColor : 'rgba(255,255,255,0.12)',
                              color: spatialAudioOn ? '#09090B' : config.textColor,
                            }}
                          >
                            {spatialAudioOn ? 'Spatial Active' : 'Stereo Only'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActivity === 'notification' && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            {renderIconBadge(
                              <Bell size={config.iconSize} />,
                              config.perAppAccentOverride
                                ? liveNotification.accentHex
                                : config.accentColor
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-[10px] font-semibold opacity-75"
                                  style={{ color: config.textColor }}
                                >
                                  {liveNotification.appName} · {liveNotification.timestamp}
                                </span>
                              </div>
                              <p
                                className="font-semibold leading-snug"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.titleTextSize}px`,
                                }}
                              >
                                {liveNotification.title}
                              </p>
                              <p
                                className="opacity-80 line-clamp-1"
                                style={{
                                  color: config.textColor,
                                  fontSize: `${config.subtitleTextSize}px`,
                                }}
                              >
                                {liveNotification.subtitle}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onChangeDisplayMode('compact')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              config.actionButtonStyle === 'outlined'
                                ? 'border border-white/30'
                                : 'bg-white/10 hover:bg-white/15'
                            }`}
                            style={{ color: config.textColor }}
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            onClick={() => onChangeDisplayMode('compact')}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-950"
                            style={{
                              backgroundColor: config.perAppAccentOverride
                                ? liveNotification.accentHex
                                : config.accentColor,
                            }}
                          >
                            Mark Read
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Split Secondary Satellite Capsule */}
              {isSplit && !isExpanded && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onChangeDisplayMode('expanded')}
                  style={{
                    marginLeft: `${config.splitGap}px`,
                    width: `${config.splitSecondarySize}px`,
                    height: `${config.compactHeight}px`,
                    background: backgroundCss,
                    borderRadius: `${config.cornerRadius}px`,
                    borderWidth: `${config.borderWidth}px`,
                    borderStyle: config.borderWidth > 0 ? 'solid' : 'none',
                    borderColor: config.borderColor,
                    boxShadow: boxShadowCss,
                    opacity: config.opacity / 100,
                    backdropFilter: `blur(${config.backdropBlur}px)`,
                    transition: transitionStyle,
                  }}
                  className="flex items-center justify-center cursor-pointer shrink-0"
                  title="Split Secondary Capsule (Tap to Expand)"
                >
                  {renderVisualizer()}
                </div>
              )}
            </div>

            {/* Subtle Helper Caption */}
            <div className="mt-14 text-center px-6">
              <p
                className={`text-[11px] font-medium ${
                  isLightWallpaper ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Tap the Dynamic Island above to toggle Compact / Expanded physics
              </p>
            </div>

            {/* Simulated Android Home Screen Widgets */}
            <div className="w-full px-5 mt-5 space-y-3">
              <div
                className={`p-3.5 rounded-2xl border backdrop-blur-md flex items-center justify-between ${
                  isLightWallpaper
                    ? 'bg-white/70 border-slate-300/80 text-slate-900'
                    : 'bg-slate-900/55 border-slate-800/80 text-slate-100'
                }`}
              >
                <div>
                  <span className="text-[11px] opacity-60 block">Live Telemetry</span>
                  <span className="text-sm font-semibold">
                    {config.compactWidth}×{config.compactHeight}dp · {config.targetFrameRate}Hz
                  </span>
                </div>
                <div className="text-right font-mono text-xs opacity-80">
                  <div>{config.fillMode}</div>
                  <div>{config.animationStyle}</div>
                </div>
              </div>

              {/* Wallpaper Switcher Strip inside Phone */}
              <div
                className={`p-3 rounded-2xl border backdrop-blur-md ${
                  isLightWallpaper
                    ? 'bg-white/70 border-slate-300/80 text-slate-900'
                    : 'bg-slate-900/55 border-slate-800/80 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium opacity-75">
                    Test Screen Wallpaper Luminance
                  </span>
                  <span className="text-[10px] font-mono opacity-60">Blur: {config.backdropBlur}px</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'oled-mesh', label: 'OLED Dark' },
                      { id: 'slate-arch', label: 'Slate' },
                      { id: 'aurora-night', label: 'Aurora' },
                      { id: 'daylight-pearl', label: 'Daylight' },
                    ] as const
                  ).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWallpaper(w.id)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap ${
                        wallpaper === w.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-semibold'
                          : 'border-transparent bg-black/20 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Android Navigation Gesture Pill */}
          <div className="w-full py-2.5 flex justify-center">
            <div
              className={`w-32 h-1 rounded-full ${
                isLightWallpaper ? 'bg-slate-900/40' : 'bg-white/40'
              }`}
            />
          </div>
        </div>
      </div>

      {/* APPLY / SAVE / CANCEL / RESET ACTION BAR */}
      <div className="w-full mt-3.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="text-slate-400">
            DataStore Status:{' '}
            <strong className={hasUnsavedChanges ? 'text-amber-400' : 'text-emerald-400'}>
              {hasUnsavedChanges ? 'Uncommitted Draft Edits' : 'Synced with Preferences'}
            </strong>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Opacity {config.opacity}% · {config.cornerRadius}dp
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={onApply}
            className="col-span-1 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            Apply
          </button>

          <button
            type="button"
            onClick={onOpenSavePresetModal}
            className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            Save
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={!hasUnsavedChanges}
            className={`col-span-1 py-2 px-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 border transition-colors whitespace-nowrap ${
              hasUnsavedChanges
                ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer'
                : 'bg-slate-900 text-slate-600 border-slate-800/60 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="button"
            onClick={onReset}
            className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-800/70 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/60 text-slate-300 border border-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
