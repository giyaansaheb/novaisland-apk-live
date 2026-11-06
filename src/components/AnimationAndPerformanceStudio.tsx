import React from 'react';
import {
  Activity,
  BatteryCharging,
  Cpu,
  Flame,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AnimationStyle, IslandConfig } from '../types/novaIsland';

interface AnimationAndPerformanceStudioProps {
  config: IslandConfig;
  onUpdate: (patch: Partial<IslandConfig>) => void;
  onTriggerReplay: () => void;
}

const ANIMATION_STYLES: {
  id: AnimationStyle;
  name: string;
  caption: string;
}[] = [
  {
    id: 'spring',
    name: 'Jetpack Spring',
    caption: 'Critically damped Compose spring() physics',
  },
  {
    id: 'bounce',
    name: 'Expressive Bounce',
    caption: 'Overshoot rebound on island expansion',
  },
  {
    id: 'liquid-morph',
    name: 'Liquid Viscous Morph',
    caption: 'Continuous organic surface breathing',
  },
  {
    id: 'glow-pulse',
    name: 'Neon Glow Pulse',
    caption: 'Rhythmic luminance oscillation',
  },
  {
    id: 'particles',
    name: 'Orbital Particles',
    caption: 'Ambient floating micro-spores around island',
  },
  {
    id: 'elastic',
    name: 'Elastic Whip Snap',
    caption: 'High-velocity tension & snap release',
  },
  {
    id: 'fade',
    name: 'Clean Crossfade',
    caption: 'Zero-overshoot linear alpha transition',
  },
];

export const AnimationAndPerformanceStudio: React.FC<AnimationAndPerformanceStudioProps> = ({
  config,
  onUpdate,
  onTriggerReplay,
}) => {
  return (
    <div className="space-y-6">
      {/* Section 1: Choreographed Animation Style Picker */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Motion Physics & Animation Choreography
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select the transition engine for island expansion, notification morphing, and idle loops.
            </p>
          </div>

          <button
            type="button"
            onClick={onTriggerReplay}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Test Impulse in Phone Preview
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ANIMATION_STYLES.map((style) => {
            const active = config.animationStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  onUpdate({
                    animationStyle: style.id,
                    particlesEnabled:
                      style.id === 'particles' ? true : config.particlesEnabled,
                    neonGlowEnabled:
                      style.id === 'glow-pulse' ? true : config.neonGlowEnabled,
                  });
                  onTriggerReplay();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-indigo-950/50 border-indigo-500 text-slate-100'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{style.name}</span>
                  {active && (
                    <span className="text-[10px] font-mono text-indigo-400">ACTIVE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{style.caption}</p>
              </button>
            );
          })}
        </div>

        {/* Speed, Stiffness, Damping Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-slate-800/80">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Animation Speed Multiplier</span>
              <span className="font-mono text-indigo-400">{config.animationSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.25}
              max={2.5}
              step={0.05}
              value={config.animationSpeed}
              onChange={(e) => onUpdate({ animationSpeed: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Spring Stiffness Constant</span>
              <span className="font-mono text-slate-200">{config.springStiffness} N/m</span>
            </div>
            <input
              type="range"
              min={120}
              max={500}
              step={10}
              value={config.springStiffness}
              onChange={(e) => onUpdate({ springStiffness: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Spring Damping Ratio</span>
              <span className="font-mono text-slate-200">{config.springDamping}</span>
            </div>
            <input
              type="range"
              min={10}
              max={40}
              value={config.springDamping}
              onChange={(e) => onUpdate({ springDamping: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Particle Emitter & Performance / Battery Optimizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Particle Emitter Controls */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Particle Emitter Studio
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure orbital particle count and chromatic tint around the island.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ particlesEnabled: !config.particlesEnabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                config.particlesEnabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.particlesEnabled ? 'Particles On' : 'Particles Off'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Active Particle Density</span>
              <span className="font-mono text-indigo-400">{config.particleCount} nodes</span>
            </div>
            <input
              type="range"
              min={6}
              max={36}
              value={config.particleCount}
              onChange={(e) => onUpdate({ particleCount: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300">Particle Emission Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.particleColor}
                onChange={(e) => onUpdate({ particleColor: e.target.value.toUpperCase() })}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-slate-300">{config.particleColor}</span>
            </div>
          </div>
        </div>

        {/* Android Performance & Battery Optimization */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Android SurfaceFlinger & Battery Tuning
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Optimize GPU layer caching, LTPO refresh rate, and OLED pixel longevity.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              ~{config.targetFrameRate === 60 ? '0.4%' : config.targetFrameRate === 90 ? '0.7%' : '1.1%'}/hr
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Target Display Refresh Rate</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {([60, 90, 120] as const).map((hz) => (
                <button
                  key={hz}
                  type="button"
                  onClick={() => onUpdate({ targetFrameRate: hz })}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    config.targetFrameRate === hz
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {hz}Hz
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {[
              {
                key: 'oledBurnInProtection' as const,
                label: 'OLED Sub-Pixel Burn-In Shift (1dp/10min)',
                val: config.oledBurnInProtection,
                icon: Flame,
              },
              {
                key: 'batterySaverAutoDim' as const,
                label: 'Suspend Blur & Glow when Battery < 20%',
                val: config.batterySaverAutoDim,
                icon: BatteryCharging,
              },
              {
                key: 'hardwareAcceleration' as const,
                label: 'Compose GraphicsLayer Offscreen Hardware Cache',
                val: config.hardwareAcceleration,
                icon: Zap,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <span className="text-xs text-slate-300 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    {item.label}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({ [item.key]: !item.val } as Partial<IslandConfig>)
                    }
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      item.val
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.val ? 'Enabled' : 'Off'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
