import React, { useState } from 'react';
import {
  Bell,
  Columns,
  LayoutGrid,
  Send,
  Shapes,
  Sparkles,
  Type,
} from 'lucide-react';
import {
  IconContainerShape,
  IconPackStyle,
  IslandConfig,
  LiveNotificationPayload,
  NotificationBannerStyle,
  SlotItemType,
  VisualizerStyle,
} from '../types/novaIsland';

interface NotificationIconLayoutStudioProps {
  config: IslandConfig;
  onUpdate: (patch: Partial<IslandConfig>) => void;
  liveNotification: LiveNotificationPayload;
  onDispatchNotification: (payload: LiveNotificationPayload) => void;
}

const SLOT_OPTIONS: { id: SlotItemType; label: string }[] = [
  { id: 'media-art', label: 'Album Art / Activity Icon' },
  { id: 'app-icon', label: 'App Badge Icon' },
  { id: 'title-marquee', label: 'Title / Track Marquee' },
  { id: 'waveform', label: 'Live Audio Visualizer' },
  { id: 'timer-readout', label: 'Digital Timer Readout' },
  { id: 'battery-chip', label: 'Battery Percentage' },
  { id: 'camera-cutout', label: 'Camera Cutout Lens' },
  { id: 'none', label: 'Empty Slot' },
];

export const NotificationIconLayoutStudio: React.FC<NotificationIconLayoutStudioProps> = ({
  config,
  onUpdate,
  liveNotification,
  onDispatchNotification,
}) => {
  const [draftAppName, setDraftAppName] = useState(liveNotification.appName);
  const [draftTitle, setDraftTitle] = useState(liveNotification.title);
  const [draftSubtitle, setDraftSubtitle] = useState(liveNotification.subtitle);
  const [draftAccent, setDraftAccent] = useState(liveNotification.accentHex);

  const handleFireNotification = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatchNotification({
      id: `notif-${Date.now()}`,
      appName: draftAppName.trim() || 'Signal',
      title: draftTitle.trim() || 'New Encrypted Message',
      subtitle: draftSubtitle.trim() || 'Tap to reply from Nova Island',
      accentHex: draftAccent,
      timestamp: 'Just now',
    });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Notification Design Studio & Live Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Notification Typography, Sizes & Banner Style */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              Notification Design Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize notification banner presentation, icon & typography scale, and action buttons.
            </p>
          </div>

          {/* Notification Banner Style */}
          <div>
            <span className="text-xs font-medium text-slate-300 block mb-2">
              Notification Presentation Template
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: 'compact-pill', label: 'Compact Pill' },
                  { id: 'expanded-card', label: 'Expanded Card' },
                  { id: 'split-capsule', label: 'Split Capsule' },
                  { id: 'minimal-ticker', label: 'Ticker Strip' },
                  { id: 'edge-illumination', label: 'Edge Bloom' },
                ] as { id: NotificationBannerStyle; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdate({ notificationStyle: item.id })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                    config.notificationStyle === item.id
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Size, Title Size, Subtitle Size, Auto-Dismiss */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  Title Font Size
                </span>
                <span className="font-mono text-indigo-400">{config.titleTextSize}sp</span>
              </div>
              <input
                type="range"
                min={11}
                max={18}
                value={config.titleTextSize}
                onChange={(e) => onUpdate({ titleTextSize: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Subtitle / Body Size</span>
                <span className="font-mono text-indigo-400">{config.subtitleTextSize}sp</span>
              </div>
              <input
                type="range"
                min={10}
                max={15}
                value={config.subtitleTextSize}
                onChange={(e) => onUpdate({ subtitleTextSize: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Icon Badge Size</span>
                <span className="font-mono text-indigo-400">{config.iconSize}dp</span>
              </div>
              <input
                type="range"
                min={14}
                max={34}
                value={config.iconSize}
                onChange={(e) => onUpdate({ iconSize: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Auto-Dismiss Timeout</span>
                <span className="font-mono text-indigo-400">{config.autoDismissSeconds}s</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                value={config.autoDismissSeconds}
                onChange={(e) => onUpdate({ autoDismissSeconds: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">Action Button Style:</span>
              {(['filled', 'outlined', 'ghost'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onUpdate({ actionButtonStyle: style })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                    config.actionButtonStyle === style
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onUpdate({ perAppAccentOverride: !config.perAppAccentOverride })
              }
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                config.perAppAccentOverride
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.perAppAccentOverride ? 'Per-App Tint On' : 'Global Accent Only'}
            </button>
          </div>
        </div>

        {/* Right: Live Test Notification Dispatcher */}
        <form
          onSubmit={handleFireNotification}
          className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex flex-col justify-between space-y-4"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              Live Notification Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dispatch a custom Android notification payload straight into the interactive phone preview.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">Source App Name</label>
                <input
                  type="text"
                  value={draftAppName}
                  onChange={(e) => setDraftAppName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">App Tint</label>
                <input
                  type="color"
                  value={draftAccent}
                  onChange={(e) => setDraftAccent(e.target.value.toUpperCase())}
                  className="w-full h-8 rounded-lg cursor-pointer bg-slate-950 border border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Notification Title</label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Message Body</label>
              <input
                type="text"
                value={draftSubtitle}
                onChange={(e) => setDraftSubtitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Fire Live Alert to Island Preview
          </button>
        </form>
      </div>

      {/* Section 2: Icon Studio & Audio Visualizer */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Shapes className="w-4 h-4 text-indigo-400" />
            Icon Studio & Audio Waveform Visualizer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Style icon containers, shader treatment, notification badges, and real-time audio visualizers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Icon Pack Shader */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300 block">Icon Pack Treatment</span>
            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  { id: 'tinted-glass', label: 'Tinted Frosted Glass' },
                  { id: 'solid-accent', label: 'Solid High-Contrast Fill' },
                  { id: 'duotone', label: 'Duotone Gradient Badge' },
                  { id: 'neon-outline', label: 'Neon Laser Wireframe' },
                  { id: 'monochrome', label: 'Pure Monochrome Glyph' },
                ] as { id: IconPackStyle; label: string }[]
              ).map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => onUpdate({ iconPackStyle: pack.id })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-left border transition-colors ${
                    config.iconPackStyle === pack.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pack.label}
                </button>
              ))}
            </div>
          </div>

          {/* Container Shape & Tint */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-slate-300 block mb-2">
                Icon Container Geometry
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'circle', label: 'Circle' },
                    { id: 'squircle', label: 'Squircle' },
                    { id: 'hexagon', label: 'Hexagon' },
                    { id: 'none', label: 'Unboxed Glyph' },
                  ] as { id: IconContainerShape; label: string }[]
                ).map((shape) => (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => onUpdate({ iconContainerShape: shape.id })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                      config.iconContainerShape === shape.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-300">Icon Tint Override</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.iconTintColor}
                  onChange={(e) => onUpdate({ iconTintColor: e.target.value.toUpperCase() })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-xs text-slate-300">{config.iconTintColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-300">Unread Corner Dot Badge</span>
              <button
                type="button"
                onClick={() =>
                  onUpdate({ showNotificationBadge: !config.showNotificationBadge })
                }
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  config.showNotificationBadge
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {config.showNotificationBadge ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Visualizer Style */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300 block">
              Audio & Activity Visualizer Style
            </span>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  { id: 'bars', label: '4-Band Spectrum Equalizer Bars' },
                  { id: 'sine-wave', label: 'Harmonic Sine Wave Oscilloscope' },
                  { id: 'orbital', label: 'Orbital Gyroscope Ring' },
                  { id: 'dots', label: 'Minimalist Pulse Matrix Dots' },
                ] as { id: VisualizerStyle; label: string }[]
              ).map((vis) => (
                <button
                  key={vis.id}
                  type="button"
                  onClick={() => onUpdate({ visualizerStyle: vis.id })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium text-left border transition-colors ${
                    config.visualizerStyle === vis.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {vis.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Layout Studio (Slot Architecture) */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Columns className="w-4 h-4 text-indigo-400" />
              Layout Studio & Capsule Slot Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign widgets to the Left, Center, and Right Dynamic Island slots and tune spacing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpdate({ showCameraCutout: !config.showCameraCutout })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              config.showCameraCutout
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {config.showCameraCutout ? 'Camera Cutout Visible' : 'Hide Camera Cutout'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { key: 'leftSlot', label: 'Left Anchor Slot', value: config.leftSlot },
              { key: 'centerSlot', label: 'Center Core Slot', value: config.centerSlot },
              { key: 'rightSlot', label: 'Right Wing Slot', value: config.rightSlot },
            ] as const
          ).map((slot) => (
            <div
              key={slot.key}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
            >
              <label className="text-xs font-semibold text-slate-200 block">{slot.label}</label>
              <select
                value={slot.value}
                onChange={(e) =>
                  onUpdate({ [slot.key]: e.target.value as SlotItemType } as Partial<IslandConfig>)
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {SLOT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Inter-Slot Spacing</span>
              <span className="font-mono text-indigo-400">{config.elementSpacing}dp</span>
            </div>
            <input
              type="range"
              min={4}
              max={20}
              value={config.elementSpacing}
              onChange={(e) => onUpdate({ elementSpacing: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Split Satellite Gap</span>
              <span className="font-mono text-indigo-400">{config.splitGap}dp</span>
            </div>
            <input
              type="range"
              min={6}
              max={24}
              value={config.splitGap}
              onChange={(e) => onUpdate({ splitGap: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <span className="text-xs text-slate-300 block mb-1">Horizontal Alignment</span>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(
                [
                  { id: 'space-between', label: 'Spread' },
                  { id: 'center', label: 'Centered' },
                  { id: 'start', label: 'Left Pack' },
                ] as const
              ).map((align) => (
                <button
                  key={align.id}
                  type="button"
                  onClick={() => onUpdate({ contentAlignment: align.id })}
                  className={`py-1 rounded text-xs font-medium transition-colors ${
                    config.contentAlignment === align.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {align.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
