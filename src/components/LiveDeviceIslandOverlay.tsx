import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Compass,
  Download,
  Headphones,
  Maximize2,
  Music2,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Timer,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  novaAudioEngine,
  RealBatteryState,
  triggerDeviceHaptic,
} from '../services/deviceHardwareBridge';
import {
  computeIslandBackground,
  computeIslandBorderRadius,
} from '../services/persistenceEngine';
import {
  ActiveActivityType,
  IslandConfig,
  IslandDisplayMode,
  LiveNotificationPayload,
} from '../types/novaIsland';

interface LiveDeviceIslandOverlayProps {
  config: IslandConfig;
  enabled: boolean;
  fullScreenPhoneMode: boolean;
  onToggleFullScreenMode: (val: boolean) => void;
  displayMode: IslandDisplayMode;
  onChangeDisplayMode: (mode: IslandDisplayMode) => void;
  activeActivity: ActiveActivityType;
  onChangeActivity: (act: ActiveActivityType) => void;
  liveNotification: LiveNotificationPayload;
  realBattery: RealBatteryState;
  onOpenInstallModal: () => void;
}

const DEFAULT_SONGS = [
  { title: 'Nova Horizon Synth (Live Audio)', artist: 'Nova Island Audio Engine', bpm: 118 },
  { title: 'Cyberpunk Neon Pulse (Live Audio)', artist: 'Synthwave Generator', bpm: 128 },
  { title: 'Kyoto Midnight Lo-Fi (Live Audio)', artist: 'Ambient Oscillators', bpm: 92 },
];

export const LiveDeviceIslandOverlay: React.FC<LiveDeviceIslandOverlayProps> = ({
  config,
  enabled,
  fullScreenPhoneMode,
  onToggleFullScreenMode,
  displayMode,
  onChangeDisplayMode,
  activeActivity,
  onChangeActivity,
  liveNotification,
  realBattery,
  onOpenInstallModal,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [songIndex, setSongIndex] = useState(0);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customSongTitle, setCustomSongTitle] = useState<string | null>(null);
  const [progressSec, setProgressSec] = useState(14);
  const [timerSec, setTimerSec] = useState(120);
  const [timerRunning, setTimerRunning] = useState(true);
  const [callAccepted, setCallAccepted] = useState(false);
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isExpanded = displayMode === 'expanded';
  const isSplit = displayMode === 'split' || (config.splitIslandEnabled && !isExpanded);

  // Sync clock
  useEffect(() => {
    const id = setInterval(() => {
      setClockText(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      if (isPlayingAudio) {
        setProgressSec((p) => (p + 1) % 210);
      }
      if (timerRunning && timerSec > 0) {
        setTimerSec((t) => (t > 0 ? t - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isPlayingAudio, timerRunning, timerSec]);

  // Handle real audio playback (either custom MP3 from user's phone or Web Audio Synth)
  useEffect(() => {
    if (isPlayingAudio) {
      if (customAudioUrl && audioElementRef.current) {
        novaAudioEngine.stopAmbientSynth();
        audioElementRef.current.play().catch(() => {});
      } else {
        const bpm = DEFAULT_SONGS[songIndex % DEFAULT_SONGS.length].bpm;
        novaAudioEngine.startAmbientSynth(bpm);
      }
    } else {
      novaAudioEngine.stopAmbientSynth();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    }
    return () => {
      novaAudioEngine.stopAmbientSynth();
    };
  }, [isPlayingAudio, songIndex, customAudioUrl]);

  const handleToggleAudioPlay = () => {
    triggerDeviceHaptic(20);
    setIsPlayingAudio((prev) => !prev);
  };

  const handleLocalAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customAudioUrl) {
      URL.revokeObjectURL(customAudioUrl);
    }
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    onChangeActivity('music');
    onChangeDisplayMode('expanded');
    setIsPlayingAudio(true);
    triggerDeviceHaptic([20, 40, 20]);
  };

  const backgroundCss = useMemo(() => computeIslandBackground(config), [config]);
  const borderRadiusCss = useMemo(
    () => computeIslandBorderRadius(config, isExpanded),
    [config, isExpanded]
  );

  const transitionStyle = useMemo(() => {
    const baseMs = Math.round(360 / Math.max(0.25, config.animationSpeed));
    return `all ${baseMs}ms cubic-bezier(0.22, 1.28, 0.36, 1)`;
  }, [config.animationSpeed]);

  const boxShadowCss = useMemo(() => {
    const list: string[] = ['0 12px 32px rgba(0,0,0,0.65)'];
    if (config.neonGlowEnabled && config.neonGlowIntensity > 0) {
      const alphaHex = Math.round(Math.min(1, config.neonGlowIntensity / 100) * 255)
        .toString(16)
        .padStart(2, '0');
      list.push(
        `0 0 ${config.neonGlowSpread}px ${Math.round(config.neonGlowSpread * 0.35)}px ${config.neonGlowColor}${alphaHex}`
      );
    }
    return list.join(', ');
  }, [
    config.neonGlowEnabled,
    config.neonGlowIntensity,
    config.neonGlowSpread,
    config.neonGlowColor,
  ]);

  if (!enabled && !fullScreenPhoneMode) return null;

  const currentSongTitle =
    customSongTitle || DEFAULT_SONGS[songIndex % DEFAULT_SONGS.length].title;
  const currentSongArtist = customSongTitle
    ? 'Local Phone Storage Audio'
    : DEFAULT_SONGS[songIndex % DEFAULT_SONGS.length].artist;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const renderLiveIslandCapsule = () => (
    <div
      className="fixed left-1/2 z-[100] flex items-center justify-center select-none"
      style={{
        top: `${Math.max(4, config.positionY)}px`,
        transform: `translateX(calc(-50% + ${config.positionX}px))`,
        transition: transitionStyle,
      }}
    >
      {/* Hidden Audio Element for user-selected MP3 files from their phone */}
      {customAudioUrl && <audio ref={audioElementRef} src={customAudioUrl} loop />}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleLocalAudioFileSelect}
        className="hidden"
      />

      {/* Primary Live Dynamic Island Capsule */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          triggerDeviceHaptic(18);
          onChangeDisplayMode(isExpanded ? 'compact' : 'expanded');
        }}
        style={{
          width: isExpanded
            ? `min(94vw, ${config.expandedWidth}px)`
            : `${config.compactWidth}px`,
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
        }}
        className={`relative cursor-pointer overflow-hidden flex flex-col justify-center ${
          config.animationStyle === 'glow-pulse' ? 'animate-glow-pulse' : ''
        } ${config.animationStyle === 'liquid-morph' ? 'animate-liquid-morph' : ''}`}
      >
        {/* COMPACT VIEW */}
        {!isExpanded && (
          <div className="w-full h-full flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${config.accentColor}26`,
                  color: config.accentColor,
                }}
              >
                {activeActivity === 'music' && <Music2 className="w-3 h-3" />}
                {activeActivity === 'call' && <Phone className="w-3 h-3 text-emerald-400" />}
                {activeActivity === 'timer' && <Timer className="w-3 h-3 text-amber-400" />}
                {activeActivity === 'charging' && (
                  <BatteryCharging className="w-3 h-3 text-emerald-400" />
                )}
                {activeActivity === 'navigation' && <Compass className="w-3 h-3 text-sky-400" />}
                {activeActivity === 'bluetooth' && (
                  <Headphones className="w-3 h-3 text-purple-400" />
                )}
                {activeActivity === 'notification' && <Bell className="w-3 h-3" />}
              </span>

              {config.showCameraCutout && (
                <span className="w-3 h-3 rounded-full bg-black border border-slate-800 shrink-0" />
              )}

              <span
                className="text-xs font-medium truncate"
                style={{ color: config.textColor }}
              >
                {activeActivity === 'music' && currentSongTitle}
                {activeActivity === 'call' && (callAccepted ? 'Connected' : 'Incoming Call')}
                {activeActivity === 'timer' && formatTime(timerSec)}
                {activeActivity === 'charging' && `${realBattery.levelPercent}% Charging`}
                {activeActivity === 'navigation' && '240m Turn Right'}
                {activeActivity === 'bluetooth' && 'Buds Pro 2'}
                {activeActivity === 'notification' && liveNotification.title}
              </span>
            </div>

            {/* Right Live Equalizer Bars */}
            <div className="flex items-center gap-0.5 h-3.5 shrink-0">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-1 rounded-full transition-all duration-200"
                  style={{
                    height: isPlayingAudio
                      ? `${6 + ((progressSec * (i + 2)) % 10)}px`
                      : '5px',
                    backgroundColor: config.accentColor,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* EXPANDED VIEW */}
        {isExpanded && (
          <div
            className="w-full h-full flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {activeActivity === 'music' && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${config.accentColor}26`,
                        color: config.accentColor,
                      }}
                    >
                      <Music2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-semibold truncate text-xs"
                        style={{ color: config.textColor }}
                      >
                        {currentSongTitle}
                      </p>
                      <p
                        className="text-[11px] opacity-75 truncate"
                        style={{ color: config.textColor }}
                      >
                        {currentSongArtist}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                    style={{ color: config.textColor }}
                    title="Pick MP3 song from your phone"
                  >
                    <Upload className="w-3 h-3" />
                    Phone MP3
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="my-1">
                  <div
                    className="flex justify-between text-[10px] font-mono opacity-75 mb-1"
                    style={{ color: config.textColor }}
                  >
                    <span>{formatTime(progressSec)}</span>
                    <span>{isPlayingAudio ? 'LIVE AUDIO ON' : 'PAUSED'}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (progressSec / 210) * 100)}%`,
                        backgroundColor: config.accentColor,
                      }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onChangeDisplayMode('compact')}
                    className="text-[11px] font-medium opacity-75 hover:opacity-100"
                    style={{ color: config.textColor }}
                  >
                    Minimize
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        triggerDeviceHaptic(15);
                        setCustomAudioUrl(null);
                        setCustomSongTitle(null);
                        setSongIndex((s) => (s - 1 + DEFAULT_SONGS.length) % DEFAULT_SONGS.length);
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10"
                      style={{ color: config.textColor }}
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleAudioPlay}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold shadow-md active:scale-95"
                      style={{ backgroundColor: config.accentColor }}
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerDeviceHaptic(15);
                        setCustomAudioUrl(null);
                        setCustomSongTitle(null);
                        setSongIndex((s) => (s + 1) % DEFAULT_SONGS.length);
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10"
                      style={{ color: config.textColor }}
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAudioPlay}
                    className="p-1 rounded-lg opacity-80"
                    style={{ color: config.textColor }}
                  >
                    {isPlayingAudio ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </>
            )}

            {activeActivity === 'call' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: config.textColor }}>
                        Incoming Voice Call
                      </p>
                      <p className="text-[11px] opacity-75" style={{ color: config.textColor }}>
                        {callAccepted ? 'Call Active · HD Audio' : 'Aarav Sharma · Mobile'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerDeviceHaptic(30);
                      setCallAccepted(false);
                      onChangeDisplayMode('compact');
                    }}
                    className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    End
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerDeviceHaptic([25, 50, 25]);
                      novaAudioEngine.playNotificationChime();
                      setCallAccepted(true);
                    }}
                    className="px-3 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-semibold flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {callAccepted ? 'On Call' : 'Accept'}
                  </button>
                </div>
              </div>
            )}

            {activeActivity === 'charging' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BatteryCharging className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: config.textColor }}>
                        {realBattery.charging ? 'Fast Charging Active' : 'Phone Battery Telemetry'}
                      </p>
                      <p className="text-[11px] opacity-75" style={{ color: config.textColor }}>
                        {realBattery.supported
                          ? 'Synced with Real Device Battery Sensor'
                          : 'SuperVOOC Warp Charge Ready'}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-lg font-bold text-emerald-400">
                    {realBattery.levelPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${realBattery.levelPercent}%` }}
                  />
                </div>
              </div>
            )}

            {(activeActivity === 'timer' ||
              activeActivity === 'navigation' ||
              activeActivity === 'bluetooth' ||
              activeActivity === 'notification') && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: config.textColor }}>
                      {activeActivity === 'timer' && `Countdown Timer · ${formatTime(timerSec)}`}
                      {activeActivity === 'navigation' && '240m · Turn Right onto Ring Road'}
                      {activeActivity === 'bluetooth' && 'Bluetooth Spatial Buds Connected'}
                      {activeActivity === 'notification' &&
                        `${liveNotification.appName}: ${liveNotification.title}`}
                    </p>
                    <p className="text-[11px] opacity-75 mt-0.5" style={{ color: config.textColor }}>
                      {activeActivity === 'notification'
                        ? liveNotification.subtitle
                        : 'Tap Minimize to return to compact capsule'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {activeActivity === 'timer' && (
                    <button
                      type="button"
                      onClick={() => setTimerRunning((r) => !r)}
                      className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold"
                    >
                      {timerRunning ? 'Pause' : 'Resume'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onChangeDisplayMode('compact')}
                    className="px-3 py-1 rounded-lg bg-white/15 text-xs font-medium"
                    style={{ color: config.textColor }}
                  >
                    Minimize
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Split Secondary Satellite Pill */}
      {isSplit && !isExpanded && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            triggerDeviceHaptic(15);
            onChangeDisplayMode('expanded');
          }}
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
            transition: transitionStyle,
          }}
          className="flex items-center justify-center cursor-pointer shrink-0"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.accentColor }}
          />
        </div>
      )}
    </div>
  );

  // If Full-Screen Phone Launcher Mode is active, render an immersive full-screen phone experience!
  if (fullScreenPhoneMode) {
    return (
      <div className="fixed inset-0 z-[90] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-white flex flex-col justify-between p-6 overflow-y-auto">
        {renderLiveIslandCapsule()}

        {/* Top System Status Bar around the Live Island */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
          <span>{clockText}</span>
          <span>{realBattery.levelPercent}% BAT</span>
        </div>

        {/* Center Full-Screen Phone Launcher Content */}
        <div className="my-auto max-w-md w-full mx-auto space-y-6 pt-16">
          <div className="text-center space-y-1">
            <p className="text-5xl font-bold tracking-tight font-mono">{clockText}</p>
            <p className="text-xs text-slate-400">
              Nova Island Live Active Overlay Mode · Tap the top capsule anytime
            </p>
          </div>

          {/* Quick Interactive Triggers for the User's Phone */}
          <div className="p-4 rounded-3xl bg-slate-900/75 border border-slate-800 backdrop-blur-xl space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">
              Test Live Dynamic Island Activities on Your Screen
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'music', label: 'Play Music', icon: Music2 },
                  { id: 'call', label: 'Incoming Call', icon: Phone },
                  { id: 'charging', label: 'Battery Charge', icon: BatteryCharging },
                  { id: 'timer', label: 'Start Timer', icon: Timer },
                  { id: 'navigation', label: 'Navigation', icon: Compass },
                  { id: 'notification', label: 'Popup Alert', icon: Bell },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activeActivity === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      triggerDeviceHaptic(20);
                      onChangeActivity(item.id);
                      onChangeDisplayMode('expanded');
                      if (item.id === 'music') {
                        setIsPlayingAudio(true);
                      } else {
                        novaAudioEngine.playNotificationChime();
                      }
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons to Open Studio or Install App */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onToggleFullScreenMode(false)}
              className="py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              Customize Island
            </button>
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install on Phone
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Swipe or tap Customize Island to adjust colors, shapes & themes
        </div>
      </div>
    );
  }

  // Standard Live Top-of-Screen Floating Island Overlay
  return renderLiveIslandCapsule();
};
