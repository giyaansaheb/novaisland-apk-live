import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  Heart,
  Plus,
  Search,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { triggerDeviceHaptic } from '../services/deviceHardwareBridge';
import { computeIslandBackground } from '../services/persistenceEngine';
import { IslandConfig, ThemeCategory, ThemePreset } from '../types/novaIsland';

interface ThemeGalleryAndPresetsProps {
  allThemes: ThemePreset[];
  favoriteIds: string[];
  activeConfig: IslandConfig;
  onSelectTheme: (theme: ThemePreset) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicateTheme: (theme: ThemePreset) => void;
  onRenameTheme: (id: string, newName: string) => void;
  onDeleteCustomTheme: (id: string) => void;
  onDownloadAndInstallTheme: (theme: ThemePreset) => void;
  onOpenSavePresetModal: () => void;
}

const CATEGORIES: ThemeCategory[] = [
  'All',
  'Minimal & OLED',
  'Glass & Frosted',
  'Cyber & Neon',
  'Luxury & Editorial',
  'Nature & Atmospheric',
  'Material You',
  'Custom',
];

export const ThemeGalleryAndPresets: React.FC<ThemeGalleryAndPresetsProps> = ({
  allThemes,
  favoriteIds,
  activeConfig,
  onSelectTheme,
  onToggleFavorite,
  onDuplicateTheme,
  onRenameTheme,
  onDeleteCustomTheme,
  onDownloadAndInstallTheme,
  onOpenSavePresetModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const filteredThemes = useMemo(() => {
    return allThemes.filter((theme) => {
      if (selectedCategory !== 'All' && theme.category !== selectedCategory) {
        return false;
      }
      if (onlyFavorites && !favoriteIds.includes(theme.id)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          theme.name.toLowerCase().includes(q) ||
          theme.description.toLowerCase().includes(q) ||
          theme.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allThemes, selectedCategory, onlyFavorites, favoriteIds, searchQuery]);

  const startRename = (theme: ThemePreset) => {
    setRenamingId(theme.id);
    setRenameValue(theme.name);
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameTheme(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleInstallTheme = (theme: ThemePreset) => {
    triggerDeviceHaptic([20, 40, 20]);
    setInstallingId(theme.id);
    setTimeout(() => {
      onDownloadAndInstallTheme(theme);
      setInstallingId(null);
    }, 320);
  };

  return (
    <div className="space-y-5">
      {/* Header & Search Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Dynamic Island Theme Store ({allThemes.length} Premium Themes)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tap any theme to immediately install & run it on your live top-of-screen Dynamic Island.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSavePresetModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Save Current Design as Theme
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search themes by name, shader style, or material..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyFavorites((f) => !f)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              onlyFavorites
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-400 text-rose-400' : ''}`} />
            Favorites ({favoriteIds.length})
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Cards Grid */}
      {filteredThemes.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-300">
            No themes match your current filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setOnlyFavorites(false);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredThemes.map((theme) => {
            const isFav = favoriteIds.includes(theme.id);
            const isCurrentlyActive =
              theme.config.primaryColor === activeConfig.primaryColor &&
              theme.config.secondaryColor === activeConfig.secondaryColor &&
              theme.config.animationStyle === activeConfig.animationStyle &&
              theme.config.shapePreset === activeConfig.shapePreset;
            const isInstalling = installingId === theme.id;

            return (
              <div
                key={theme.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isCurrentlyActive
                    ? 'bg-slate-900 border-emerald-500/80 shadow-lg'
                    : 'bg-slate-900/65 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Mini Live Island Swatch Stage */}
                <div className="h-20 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-center relative overflow-hidden px-4">
                  <div
                    onClick={() => onSelectTheme(theme)}
                    className="cursor-pointer flex items-center justify-between px-3.5 transition-transform hover:scale-105"
                    style={{
                      width: `${Math.min(200, theme.config.compactWidth)}px`,
                      height: `${theme.config.compactHeight}px`,
                      background: computeIslandBackground(theme.config),
                      borderRadius: `${theme.config.cornerRadius}px`,
                      border:
                        theme.config.borderWidth > 0
                          ? `${theme.config.borderWidth}px solid ${theme.config.borderColor}`
                          : 'none',
                      boxShadow: theme.config.neonGlowEnabled
                        ? `0 0 14px ${theme.config.neonGlowColor}80`
                        : '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: theme.config.accentColor }}
                    />
                    <span
                      className="text-[11px] font-medium truncate mx-2"
                      style={{ color: theme.config.textColor }}
                    >
                      {theme.name}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span
                        className="w-1 h-2.5 rounded-full"
                        style={{ backgroundColor: theme.config.accentColor }}
                      />
                      <span
                        className="w-1 h-3.5 rounded-full"
                        style={{ backgroundColor: theme.config.accentColor }}
                      />
                    </div>
                  </div>
                </div>

                {/* Theme Info & Metadata */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    {renamingId === theme.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(theme.id);
                          }}
                          autoFocus
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-indigo-500 text-xs text-white flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => commitRename(theme.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-sm font-semibold text-slate-100">{theme.name}</h3>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleFavorite(theme.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                      title="Toggle Favorite"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Unboxed Metadata with Clean Separators */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <span>{theme.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{theme.config.animationStyle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">
                      {theme.config.compactWidth}×{theme.config.compactHeight}dp
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    {theme.description}
                  </p>
                </div>

                {/* Action Bar: One-Tap Apply on Phone, Download Theme Package, Duplicate, Rename, Delete */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectTheme(theme)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        isCurrentlyActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isCurrentlyActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Active on Phone
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-3.5 h-3.5" />
                          Apply on Phone
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInstallTheme(theme)}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                      title="Download & Install Theme Package (.novatheme)"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isInstalling ? 'Installing...' : 'Download'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateTheme(theme)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Duplicate Theme"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => startRename(theme)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Rename Theme"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {!theme.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomTheme(theme.id)}
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Custom Preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
