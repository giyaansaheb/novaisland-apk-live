import React, { useState } from 'react';
import { Droplets, Eye, Palette, Sparkles, SunMedium } from 'lucide-react';
import { computeIslandBackground, hexToRgb, rgbToHex } from '../services/persistenceEngine';
import { FillMode, IslandConfig } from '../types/novaIsland';

interface ColorAndSurfaceStudioProps {
  config: IslandConfig;
  onUpdate: (patch: Partial<IslandConfig>) => void;
}

type ColorChannelTarget =
  | 'primaryColor'
  | 'secondaryColor'
  | 'tertiaryColor'
  | 'accentColor'
  | 'textColor'
  | 'neonGlowColor'
  | 'borderColor';

const SWATCH_PALETTE = [
  '#000000',
  '#0F172A',
  '#1E1B4B',
  '#311042',
  '#064E3B',
  '#451A03',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#38BDF8',
  '#E5A985',
  '#F8FAFC',
];

export const ColorAndSurfaceStudio: React.FC<ColorAndSurfaceStudioProps> = ({
  config,
  onUpdate,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<ColorChannelTarget>('primaryColor');
  const activeHex = config[selectedTarget] as string;
  const activeRgb = hexToRgb(activeHex);

  const handleHexInput = (raw: string) => {
    const formatted = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(formatted)) {
      if (formatted.length === 7 || formatted.length === 4) {
        onUpdate({ [selectedTarget]: formatted.toUpperCase() } as Partial<IslandConfig>);
      }
    }
  };

  const handleRgbSlider = (channel: 'r' | 'g' | 'b', val: number) => {
    const nextRgb = { ...activeRgb, [channel]: val };
    const nextHex = rgbToHex(nextRgb);
    onUpdate({ [selectedTarget]: nextHex } as Partial<IslandConfig>);
  };

  const targetMeta: { id: ColorChannelTarget; label: string; color: string }[] = [
    { id: 'primaryColor', label: 'Primary / Stop 1', color: config.primaryColor },
    { id: 'secondaryColor', label: 'Secondary / Stop 2', color: config.secondaryColor },
    ...(config.useThreeStopGradient
      ? [{ id: 'tertiaryColor' as const, label: 'Tertiary / Stop 3', color: config.tertiaryColor }]
      : []),
    { id: 'accentColor', label: 'Accent & Controls', color: config.accentColor },
    { id: 'textColor', label: 'Typography Ink', color: config.textColor },
    { id: 'neonGlowColor', label: 'Neon Perimeter', color: config.neonGlowColor },
    { id: 'borderColor', label: 'Bezel Stroke', color: config.borderColor },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Fill Mode & Gradient Engine */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              Surface Fill & Multi-Stop Gradient Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure solid OLED fills, linear vectors, radial cores, or conic sweep shaders.
            </p>
          </div>

          {/* Fill Mode Segmented Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'solid', label: 'Solid' },
                { id: 'linear-gradient', label: 'Linear' },
                { id: 'radial-gradient', label: 'Radial' },
                { id: 'conic-gradient', label: 'Conic Sweep' },
              ] as { id: FillMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onUpdate({ fillMode: mode.id })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  config.fillMode === mode.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Gradient Strip Preview & Angle Control */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-5">
            <div
              className="h-20 w-full rounded-xl border border-slate-700/80 flex items-end justify-between p-3 shadow-inner"
              style={{ background: computeIslandBackground(config) }}
            >
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/65 text-slate-200">
                {config.fillMode}
              </span>
              {config.fillMode !== 'solid' && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/65 text-indigo-300">
                  {config.gradientAngle}° Vector
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Gradient Angle ({config.gradientAngle}°)
              </label>
              <div className="flex items-center gap-1.5">
                {[0, 45, 90, 135, 180, 225, 315].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => onUpdate({ gradientAngle: deg })}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      config.gradientAngle === deg
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={config.gradientAngle}
              disabled={config.fillMode === 'solid'}
              onChange={(e) => onUpdate({ gradientAngle: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">Enable 3-Stop Prism Gradient</span>
              <button
                type="button"
                onClick={() =>
                  onUpdate({ useThreeStopGradient: !config.useThreeStopGradient })
                }
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  config.useThreeStopGradient
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {config.useThreeStopGradient ? '3-Stop Active' : '2-Stop Standard'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Precision RGB & HEX Color Laboratory */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              RGB & HEX Color Channel Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a target surface token below to tune its exact 8-bit RGB channels or HEX code.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Active Token:</span>
            <span className="font-mono text-xs font-semibold text-indigo-400">{activeHex}</span>
          </div>
        </div>

        {/* Target Token Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {targetMeta.map((target) => {
            const isSelected = selectedTarget === target.id;
            return (
              <button
                key={target.id}
                type="button"
                onClick={() => setSelectedTarget(target.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-slate-800/95 border-indigo-500 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-lg border border-white/20 shrink-0 shadow-sm"
                  style={{ backgroundColor: target.color }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">{target.label}</div>
                  <div className="text-[11px] font-mono text-slate-400">{target.color}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* RGB Sliders + Direct HEX Input + Native Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
          <div className="lg:col-span-5 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={activeHex.length === 7 ? activeHex : '#6366F1'}
                onChange={(e) =>
                  onUpdate({
                    [selectedTarget]: e.target.value.toUpperCase(),
                  } as Partial<IslandConfig>)
                }
                className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
              />
              <div className="flex-1">
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Direct HEX Value
                </label>
                <input
                  type="text"
                  defaultValue={activeHex}
                  key={`${selectedTarget}-${activeHex}`}
                  onBlur={(e) => handleHexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleHexInput((e.target as HTMLInputElement).value);
                    }
                  }}
                  maxLength={7}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Curated Swatches */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Quick Calibration Swatches
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {SWATCH_PALETTE.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() =>
                      onUpdate({ [selectedTarget]: swatch } as Partial<IslandConfig>)
                    }
                    className={`h-6 rounded-md border transition-transform hover:scale-110 ${
                      activeHex.toUpperCase() === swatch
                        ? 'border-white scale-110'
                        : 'border-white/15'
                    }`}
                    style={{ backgroundColor: swatch }}
                    title={swatch}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* R, G, B Individual 0-255 Sliders */}
          <div className="lg:col-span-7 space-y-3.5">
            {(
              [
                { channel: 'r', label: 'Red Channel (R)', value: activeRgb.r, accent: 'accent-rose-500' },
                { channel: 'g', label: 'Green Channel (G)', value: activeRgb.g, accent: 'accent-emerald-500' },
                { channel: 'b', label: 'Blue Channel (B)', value: activeRgb.b, accent: 'accent-sky-500' },
              ] as const
            ).map((ch) => (
              <div key={ch.channel} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{ch.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={ch.value}
                      onChange={(e) => handleRgbSlider(ch.channel, Number(e.target.value))}
                      className="w-16 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-right text-slate-200"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={ch.value}
                  onChange={(e) => handleRgbSlider(ch.channel, Number(e.target.value))}
                  className={`w-full cursor-pointer ${ch.accent}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Neon Glow, Transparency, Saturation & Brightness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Neon Glow Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Neon Perimeter Glow
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ambient outer bloom around the Dynamic Island capsule.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ neonGlowEnabled: !config.neonGlowEnabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                config.neonGlowEnabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.neonGlowEnabled ? 'Glow Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Glow Luminance Intensity</span>
                <span className="font-mono text-indigo-400">{config.neonGlowIntensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                disabled={!config.neonGlowEnabled}
                value={config.neonGlowIntensity}
                onChange={(e) => onUpdate({ neonGlowIntensity: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Bloom Spread Radius</span>
                <span className="font-mono text-indigo-400">{config.neonGlowSpread}px</span>
              </div>
              <input
                type="range"
                min={2}
                max={48}
                disabled={!config.neonGlowEnabled}
                value={config.neonGlowSpread}
                onChange={(e) => onUpdate({ neonGlowSpread: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Transparency, Blur, Saturation & Brightness Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-3.5">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <SunMedium className="w-4 h-4 text-indigo-400" />
            Optical Transparency, Saturation & Brightness
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Surface Opacity (Transparency)
              </span>
              <span className="font-mono text-slate-200">{config.opacity}%</span>
            </div>
            <input
              type="range"
              min={15}
              max={100}
              value={config.opacity}
              onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-slate-400" />
                Frosted Backdrop Blur
              </span>
              <span className="font-mono text-slate-200">{config.backdropBlur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              value={config.backdropBlur}
              onChange={(e) => onUpdate({ backdropBlur: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Saturation</span>
                <span className="font-mono text-slate-200">{config.saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={config.saturation}
                onChange={(e) => onUpdate({ saturation: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Brightness</span>
                <span className="font-mono text-slate-200">{config.brightness}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={config.brightness}
                onChange={(e) => onUpdate({ brightness: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
