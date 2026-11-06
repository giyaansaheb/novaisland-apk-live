import React from 'react';
import {
  BoxSelect,
  Lock,
  Maximize2,
  Move,
  Sliders,
  SplitSquareHorizontal,
  Unlock,
} from 'lucide-react';
import { IslandConfig, IslandShapePreset } from '../types/novaIsland';

interface GeometryAndShapeStudioProps {
  config: IslandConfig;
  onUpdate: (patch: Partial<IslandConfig>) => void;
}

const SHAPE_PRESETS: {
  id: IslandShapePreset;
  name: string;
  subtitle: string;
  previewRadius: string;
}[] = [
  {
    id: 'pill',
    name: 'Classic Capsule Pill',
    subtitle: 'Full semicircular ends',
    previewRadius: '999px',
  },
  {
    id: 'squircle',
    name: 'Continuous Squircle',
    subtitle: 'Super-ellipse hardware curve',
    previewRadius: '10px',
  },
  {
    id: 'teardrop',
    name: 'Fluid Teardrop',
    subtitle: 'Pinched bottom-left edge',
    previewRadius: '20px 20px 20px 4px',
  },
  {
    id: 'notched',
    name: 'Bezel Notch Bridge',
    subtitle: 'Flush top edge dock',
    previewRadius: '3px 3px 18px 18px',
  },
  {
    id: 'hex-tech',
    name: 'Cyber Angular Cut',
    subtitle: 'Alternating chamfered corners',
    previewRadius: '4px 16px 4px 16px',
  },
  {
    id: 'asymmetric',
    name: 'Asymmetric Blade',
    subtitle: 'Diagonal aerodynamic profile',
    previewRadius: '22px 6px 22px 6px',
  },
  {
    id: 'custom-corners',
    name: 'Custom 4-Corner Matrix',
    subtitle: 'Independent TL/TR/BR/BL radii',
    previewRadius: '18px 8px 18px 8px',
  },
];

export const GeometryAndShapeStudio: React.FC<GeometryAndShapeStudioProps> = ({
  config,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      {/* Section 1: Interactive Shape Editor */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <BoxSelect className="w-4 h-4 text-indigo-400" />
              Island Silhouette & Shape Editor
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose an architectural capsule silhouette or unlock all 4 corners for bespoke radii.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdate({
                lockCorners: !config.lockCorners,
                shapePreset: config.lockCorners ? 'custom-corners' : 'pill',
              })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              !config.lockCorners || config.shapePreset === 'custom-corners'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {!config.lockCorners || config.shapePreset === 'custom-corners' ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                4-Corner Unlocked
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Uniform Radius
              </>
            )}
          </button>
        </div>

        {/* 7 Shape Preset Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {SHAPE_PRESETS.map((preset) => {
            const active = config.shapePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onUpdate({
                    shapePreset: preset.id,
                    lockCorners: preset.id !== 'custom-corners' && preset.id !== 'asymmetric',
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  active
                    ? 'bg-indigo-950/50 border-indigo-500 text-slate-100'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="w-full h-8 flex items-center justify-center mb-2">
                  <div
                    className="w-16 h-6 bg-indigo-500/30 border border-indigo-400"
                    style={{ borderRadius: preset.previewRadius }}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {preset.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Independent 4-Corner Sliders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
          {(
            [
              { key: 'radiusTopLeft', label: 'Top-Left Radius', val: config.radiusTopLeft },
              { key: 'radiusTopRight', label: 'Top-Right Radius', val: config.radiusTopRight },
              {
                key: 'radiusBottomLeft',
                label: 'Bottom-Left Radius',
                val: config.radiusBottomLeft,
              },
              {
                key: 'radiusBottomRight',
                label: 'Bottom-Right Radius',
                val: config.radiusBottomRight,
              },
            ] as const
          ).map((corner) => (
            <div key={corner.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{corner.label}</span>
                <span className="font-mono text-indigo-400">{corner.val}dp</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={corner.val}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (config.lockCorners && config.shapePreset !== 'custom-corners') {
                    onUpdate({
                      cornerRadius: v,
                      radiusTopLeft: v,
                      radiusTopRight: v,
                      radiusBottomLeft: v,
                      radiusBottomRight: v,
                    });
                  } else {
                    onUpdate({
                      shapePreset: 'custom-corners',
                      lockCorners: false,
                      [corner.key]: v,
                    } as Partial<IslandConfig>);
                  }
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Compact & Expanded Panel Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Compact Capsule Geometry */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Compact Capsule Dimensions
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Island Width (Compact)</span>
              <span className="font-mono text-slate-200">{config.compactWidth}dp</span>
            </div>
            <input
              type="range"
              min={96}
              max={260}
              value={config.compactWidth}
              onChange={(e) => onUpdate({ compactWidth: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Island Height (Compact)</span>
              <span className="font-mono text-slate-200">{config.compactHeight}dp</span>
            </div>
            <input
              type="range"
              min={26}
              max={56}
              value={config.compactHeight}
              onChange={(e) => onUpdate({ compactHeight: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Master Corner Radius</span>
              <span className="font-mono text-slate-200">{config.cornerRadius}dp</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={config.cornerRadius}
              onChange={(e) => {
                const r = Number(e.target.value);
                onUpdate({
                  cornerRadius: r,
                  radiusTopLeft: r,
                  radiusTopRight: r,
                  radiusBottomLeft: r,
                  radiusBottomRight: r,
                });
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Inner Content Padding</span>
              <span className="font-mono text-slate-200">{config.innerPadding}dp</span>
            </div>
            <input
              type="range"
              min={4}
              max={24}
              value={config.innerPadding}
              onChange={(e) => onUpdate({ innerPadding: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Expanded Panel Dimensions */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-indigo-400" />
            Expanded Panel Dimensions & Split Mode
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Expanded Panel Width</span>
              <span className="font-mono text-slate-200">{config.expandedWidth}dp</span>
            </div>
            <input
              type="range"
              min={260}
              max={356}
              value={config.expandedWidth}
              onChange={(e) => onUpdate({ expandedWidth: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Expanded Panel Height</span>
              <span className="font-mono text-slate-200">{config.expandedHeight}dp</span>
            </div>
            <input
              type="range"
              min={130}
              max={240}
              value={config.expandedHeight}
              onChange={(e) => onUpdate({ expandedHeight: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Expanded Panel Corner Radius</span>
              <span className="font-mono text-slate-200">{config.expandedRadius}dp</span>
            </div>
            <input
              type="range"
              min={12}
              max={48}
              value={config.expandedRadius}
              onChange={(e) => onUpdate({ expandedRadius: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Split Dual-Island Controls */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <SplitSquareHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Split Secondary Satellite Pill
            </span>
            <button
              type="button"
              onClick={() => onUpdate({ splitIslandEnabled: !config.splitIslandEnabled })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                config.splitIslandEnabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.splitIslandEnabled ? 'Split Active' : 'Single Capsule'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Screen Position, Bezel Stroke & Drop Shadow */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-4">
          <Move className="w-4 h-4 text-indigo-400" />
          Cutout Position Alignment, Bezel Border & Shadow Depth
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Horizontal X Offset</span>
              <span className="font-mono text-slate-200">{config.positionX}dp</span>
            </div>
            <input
              type="range"
              min={-65}
              max={65}
              value={config.positionX}
              onChange={(e) => onUpdate({ positionX: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Vertical Y Offset</span>
              <span className="font-mono text-slate-200">{config.positionY}dp</span>
            </div>
            <input
              type="range"
              min={0}
              max={48}
              value={config.positionY}
              onChange={(e) => onUpdate({ positionY: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Border Stroke Width</span>
              <span className="font-mono text-slate-200">{config.borderWidth}dp</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={config.borderWidth}
              onChange={(e) => onUpdate({ borderWidth: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Elevation Shadow Depth</span>
              <span className="font-mono text-slate-200">{config.shadowDepth}dp</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={config.shadowDepth}
              onChange={(e) => onUpdate({ shadowDepth: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Shadow Opacity</span>
              <span className="font-mono text-slate-200">{config.shadowOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={config.shadowOpacity}
              onChange={(e) => onUpdate({ shadowOpacity: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
