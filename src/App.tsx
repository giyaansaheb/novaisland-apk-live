import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BatteryCharging,
  Bell,
  BoxSelect,
  Check,
  Download,
  Maximize2,
  Palette,
  Smartphone,
  X,
} from 'lucide-react';
import { AnimationAndPerformanceStudio } from './components/AnimationAndPerformanceStudio';
import { ColorAndSurfaceStudio } from './components/ColorAndSurfaceStudio';
import { GeometryAndShapeStudio } from './components/GeometryAndShapeStudio';
import { LiveDeviceIslandOverlay } from './components/LiveDeviceIslandOverlay';
import { NotificationIconLayoutStudio } from './components/NotificationIconLayoutStudio';
import { PersistenceAndKotlinView } from './components/PersistenceAndKotlinView';
import { PhonePreview } from './components/PhonePreview';
import { ProfilesSchedulesAndBackup } from './components/ProfilesSchedulesAndBackup';
import { ThemeGalleryAndPresets } from './components/ThemeGalleryAndPresets';
import { BUILT_IN_THEMES, DEFAULT_ISLAND_CONFIG } from './data/premiumThemes';
import {
  novaAudioEngine,
  triggerDeviceHaptic,
  usePWAInstall,
  useRealDeviceBattery,
} from './services/deviceHardwareBridge';
import { PersistenceEngine } from './services/persistenceEngine';
import {
  ActiveActivityType,
  IslandConfig,
  IslandDisplayMode,
  IslandProfile,
  LiveNotificationPayload,
  RoomTestAssertion,
  RoomTransactionLog,
  ScheduleRule,
  ThemePreset,
} from './types/novaIsland';

type TopNavSection = 'studio' | 'themes' | 'automation' | 'persistence' | 'kotlin';
type StudioSubTab = 'color' | 'geometry' | 'animation' | 'notifications';

export default function App() {
  // Navigation State
  const [activeNav, setActiveNav] = useState<TopNavSection>('studio');
  const [studioTab, setStudioTab] = useState<StudioSubTab>('color');

  // Real Top-of-Phone Floating Island & Full-Screen Phone Launcher State
  const [liveTopOverlayEnabled, setLiveTopOverlayEnabled] = useState(true);
  const [fullScreenPhoneMode, setFullScreenPhoneMode] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Persisted State from DataStore & Room Engine
  const [appliedConfig, setAppliedConfig] = useState<IslandConfig>(() =>
    PersistenceEngine.loadAppliedConfig()
  );
  const [draftConfig, setDraftConfig] = useState<IslandConfig>(() =>
    PersistenceEngine.loadAppliedConfig()
  );
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>(() =>
    PersistenceEngine.loadCustomPresets()
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    PersistenceEngine.loadFavoriteThemeIds()
  );
  const [profiles, setProfiles] = useState<IslandProfile[]>(() =>
    PersistenceEngine.loadProfiles()
  );
  const [schedules, setSchedules] = useState<ScheduleRule[]>(() =>
    PersistenceEngine.loadSchedules()
  );

  // Interactive Phone Preview Simulation State
  const [displayMode, setDisplayMode] = useState<IslandDisplayMode>('compact');
  const [activeActivity, setActiveActivity] = useState<ActiveActivityType>('music');
  const [animationTriggerKey, setAnimationTriggerKey] = useState(0);
  const [liveNotification, setLiveNotification] = useState<LiveNotificationPayload>({
    id: 'notif-init',
    appName: 'WhatsApp',
    title: 'Aarav · Dynamic Island Ready',
    subtitle: 'Tap the live capsule at the top of your phone screen!',
    accentHex: '#10B981',
    timestamp: 'Now',
  });

  // Real Device Battery Hook (automatically triggers Charging Island when charger is plugged in)
  const realBattery = useRealDeviceBattery((charging, pct) => {
    if (charging) {
      setActiveActivity('charging');
      setDisplayMode('expanded');
      triggerDeviceHaptic([20, 50, 20]);
      novaAudioEngine.playNotificationChime();
      showToast(`Charger Connected (${pct}%) — Activated Charging Island!`);
    }
  });

  // Modals & Toast Feedback
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Room & DataStore Verification Results & Logs
  const [testResults, setTestResults] = useState<RoomTestAssertion[]>([]);
  const [txLogs, setTxLogs] = useState<RoomTransactionLog[]>([]);

  const refreshLogsAndTests = (cfg: IslandConfig) => {
    const res = PersistenceEngine.runRoomAndDataStoreTests(cfg);
    setTestResults(res);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
  };

  useEffect(() => {
    refreshLogsAndTests(appliedConfig);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const [builtInNameOverrides, setBuiltInNameOverrides] = useState<Record<string, string>>({});

  const allThemes = useMemo(() => {
    const mappedBuiltIn = BUILT_IN_THEMES.map((t) => ({
      ...t,
      name: builtInNameOverrides[t.id] || t.name,
      isFavorite: favoriteIds.includes(t.id),
    }));
    const mappedCustom = customPresets.map((t) => ({
      ...t,
      isFavorite: favoriteIds.includes(t.id),
    }));
    return [...mappedCustom, ...mappedBuiltIn];
  }, [customPresets, favoriteIds, builtInNameOverrides]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draftConfig) !== JSON.stringify(appliedConfig);
  }, [draftConfig, appliedConfig]);

  const updateDraftConfig = (patch: Partial<IslandConfig>) => {
    setDraftConfig((prev) => ({ ...prev, ...patch }));
  };

  // Apply, Save, Cancel, Reset Handlers
  const handleApplyChanges = () => {
    triggerDeviceHaptic(25);
    PersistenceEngine.saveAppliedConfig(draftConfig);
    setAppliedConfig({ ...draftConfig });
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast('Applied & saved settings to your live Phone Dynamic Island!');
  };

  const handleCancelChanges = () => {
    setDraftConfig({ ...appliedConfig });
    showToast('Reverted draft settings to last saved state.');
  };

  const handleResetToDefaults = () => {
    setDraftConfig({ ...DEFAULT_ISLAND_CONFIG });
    PersistenceEngine.saveAppliedConfig(DEFAULT_ISLAND_CONFIG);
    setAppliedConfig({ ...DEFAULT_ISLAND_CONFIG });
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast('Reset Dynamic Island to factory defaults.');
  };

  const handleSaveCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPresetName.trim() || `Custom Island #${customPresets.length + 1}`;
    const desc =
      newPresetDesc.trim() ||
      `Custom ${draftConfig.fillMode} preset (${draftConfig.compactWidth}×${draftConfig.compactHeight}dp, ${draftConfig.animationStyle}).`;

    const preset: ThemePreset = {
      id: `custom-${Date.now()}`,
      name,
      category: 'Custom',
      description: desc,
      isBuiltIn: false,
      isFavorite: true,
      updatedAt: new Date().toISOString(),
      config: { ...draftConfig },
    };

    const nextCustom = [preset, ...customPresets];
    const nextFavs = [preset.id, ...favoriteIds];
    setCustomPresets(nextCustom);
    setFavoriteIds(nextFavs);
    PersistenceEngine.saveCustomPresets(
      nextCustom,
      `Inserted custom preset "${name}" into room_theme_presets`
    );
    PersistenceEngine.saveFavoriteThemeIds(nextFavs);
    PersistenceEngine.saveAppliedConfig(draftConfig);
    setAppliedConfig({ ...draftConfig });
    setTxLogs(PersistenceEngine.loadTransactionLogs());

    setNewPresetName('');
    setNewPresetDesc('');
    setSaveModalOpen(false);
    showToast(`Saved "${name}" & activated on your phone!`);
  };

  // Theme Gallery Handlers: Immediately apply & save to phone!
  const handleSelectTheme = (theme: ThemePreset) => {
    triggerDeviceHaptic(20);
    setDraftConfig({ ...theme.config });
    setAppliedConfig({ ...theme.config });
    PersistenceEngine.saveAppliedConfig(theme.config);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    setAnimationTriggerKey((k) => k + 1);
    showToast(`Activated "${theme.name}" on your live Phone Dynamic Island!`);
  };

  const handleDownloadAndInstallTheme = (theme: ThemePreset) => {
    // 1. Immediately apply and persist the theme on the user's phone
    setDraftConfig({ ...theme.config });
    setAppliedConfig({ ...theme.config });
    PersistenceEngine.saveAppliedConfig(theme.config);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    setAnimationTriggerKey((k) => k + 1);

    // 2. Also save a copy into the user's installed custom presets if not already there
    const existsInCustom = customPresets.some((p) => p.name === theme.name);
    if (!existsInCustom && theme.isBuiltIn) {
      const installedCopy: ThemePreset = {
        ...theme,
        id: `installed-${Date.now()}`,
        isBuiltIn: false,
        isFavorite: true,
        updatedAt: new Date().toISOString(),
      };
      const nextCustom = [installedCopy, ...customPresets];
      setCustomPresets(nextCustom);
      PersistenceEngine.saveCustomPresets(
        nextCustom,
        `Downloaded & installed theme "${theme.name}"`
      );
    }

    // 3. Trigger real file download (.novatheme.json) to phone Downloads folder
    const safeSlug = theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([JSON.stringify(theme, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeSlug}.novatheme.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Downloaded & applied "${theme.name}" to your phone!`);
  };

  const handleSelectThemeById = (themeId: string) => {
    const found = allThemes.find((t) => t.id === themeId);
    if (found) {
      handleSelectTheme(found);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((fid) => fid !== id)
      : [...favoriteIds, id];
    setFavoriteIds(next);
    PersistenceEngine.saveFavoriteThemeIds(next);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
  };

  const handleDuplicateTheme = (theme: ThemePreset) => {
    const copy: ThemePreset = {
      ...theme,
      id: `custom-copy-${Date.now()}`,
      name: `${theme.name} (Copy)`,
      category: 'Custom',
      isBuiltIn: false,
      updatedAt: new Date().toISOString(),
      config: { ...theme.config },
    };
    const next = [copy, ...customPresets];
    setCustomPresets(next);
    PersistenceEngine.saveCustomPresets(
      next,
      `Duplicated "${theme.name}" -> "${copy.name}"`
    );
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast(`Duplicated "${theme.name}" to Custom Themes.`);
  };

  const handleRenameTheme = (id: string, newName: string) => {
    const isCustom = customPresets.some((p) => p.id === id);
    if (isCustom) {
      const next = customPresets.map((p) =>
        p.id === id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
      );
      setCustomPresets(next);
      PersistenceEngine.saveCustomPresets(
        next,
        `Renamed preset ${id} to "${newName}"`
      );
    } else {
      setBuiltInNameOverrides((prev) => ({ ...prev, [id]: newName }));
    }
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast(`Renamed theme to "${newName}".`);
  };

  const handleDeleteCustomTheme = (id: string) => {
    const target = customPresets.find((p) => p.id === id);
    const next = customPresets.filter((p) => p.id !== id);
    setCustomPresets(next);
    PersistenceEngine.saveCustomPresets(
      next,
      `Deleted custom preset "${target?.name || id}"`
    );
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast(`Deleted custom preset "${target?.name || id}".`);
  };

  // Profile & Schedule Handlers
  const handleActivateProfile = (prof: IslandProfile) => {
    const nextProfiles = profiles.map((p) => ({
      ...p,
      isActive: p.id === prof.id,
    }));
    setProfiles(nextProfiles);
    PersistenceEngine.saveProfiles(
      nextProfiles,
      `Activated profile "${prof.name}" (${prof.batteryMode})`
    );

    const linkedTheme = allThemes.find((t) => t.id === prof.themeId);
    const baseCfg = linkedTheme ? linkedTheme.config : draftConfig;
    const hz =
      prof.batteryMode === 'ultra-saver'
        ? 60
        : prof.batteryMode === 'performance'
        ? 120
        : 90;

    const updatedCfg: IslandConfig = {
      ...baseCfg,
      targetFrameRate: hz,
      batterySaverAutoDim: prof.batteryMode === 'ultra-saver',
    };
    setDraftConfig(updatedCfg);
    PersistenceEngine.saveAppliedConfig(updatedCfg);
    setAppliedConfig(updatedCfg);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast(`Activated "${prof.name}" profile (${hz}Hz).`);
  };

  const handleAddProfile = (prof: IslandProfile) => {
    const next = [...profiles, prof];
    setProfiles(next);
    PersistenceEngine.saveProfiles(next, `Created profile "${prof.name}"`);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast(`Created profile "${prof.name}".`);
  };

  const handleDeleteProfile = (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    PersistenceEngine.saveProfiles(next, `Deleted profile ${id}`);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
  };

  const handleToggleSchedule = (id: string) => {
    const next = schedules.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setSchedules(next);
    PersistenceEngine.saveSchedules(next, `Toggled schedule rule ${id}`);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
  };

  const handleAddSchedule = (rule: ScheduleRule) => {
    const next = [rule, ...schedules];
    setSchedules(next);
    PersistenceEngine.saveSchedules(next, `Added schedule rule "${rule.name}"`);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
    showToast(`Added schedule rule "${rule.name}".`);
  };

  const handleDeleteSchedule = (id: string) => {
    const next = schedules.filter((s) => s.id !== id);
    setSchedules(next);
    PersistenceEngine.saveSchedules(next, `Removed schedule rule ${id}`);
    setTxLogs(PersistenceEngine.loadTransactionLogs());
  };

  // Backup & Restore JSON
  const backupJsonText = useMemo(
    () =>
      PersistenceEngine.createBackupBundle(
        draftConfig,
        customPresets,
        favoriteIds,
        profiles,
        schedules
      ),
    [draftConfig, customPresets, favoriteIds, profiles, schedules]
  );

  const handleRestoreBackupJson = (
    jsonString: string
  ): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.appliedConfig) {
        const merged = { ...DEFAULT_ISLAND_CONFIG, ...parsed.appliedConfig };
        setDraftConfig(merged);
        setAppliedConfig(merged);
        PersistenceEngine.saveAppliedConfig(merged);
        if (Array.isArray(parsed.customPresets)) {
          setCustomPresets(parsed.customPresets);
          PersistenceEngine.saveCustomPresets(
            parsed.customPresets,
            'Restored custom presets from JSON backup'
          );
        }
        if (Array.isArray(parsed.favoriteIds)) {
          setFavoriteIds(parsed.favoriteIds);
          PersistenceEngine.saveFavoriteThemeIds(parsed.favoriteIds);
        }
        if (Array.isArray(parsed.profiles)) {
          setProfiles(parsed.profiles);
          PersistenceEngine.saveProfiles(parsed.profiles);
        }
        if (Array.isArray(parsed.schedules)) {
          setSchedules(parsed.schedules);
          PersistenceEngine.saveSchedules(parsed.schedules);
        }
        setTxLogs(PersistenceEngine.loadTransactionLogs());
        showToast('Restored full Nova Island backup bundle.');
        return {
          ok: true,
          message: 'Successfully restored complete Nova Island backup bundle.',
        };
      } else if (parsed.config && parsed.name) {
        const importedPreset: ThemePreset = {
          ...parsed,
          id: `imported-${Date.now()}`,
          category: 'Custom',
          isBuiltIn: false,
          updatedAt: new Date().toISOString(),
          config: { ...DEFAULT_ISLAND_CONFIG, ...parsed.config },
        };
        const nextCustom = [importedPreset, ...customPresets];
        setCustomPresets(nextCustom);
        PersistenceEngine.saveCustomPresets(
          nextCustom,
          `Imported single theme JSON "${importedPreset.name}"`
        );
        setDraftConfig(importedPreset.config);
        PersistenceEngine.saveAppliedConfig(importedPreset.config);
        setAppliedConfig(importedPreset.config);
        setTxLogs(PersistenceEngine.loadTransactionLogs());
        showToast(`Imported & applied theme "${importedPreset.name}".`);
        return {
          ok: true,
          message: `Imported theme "${importedPreset.name}" and applied to Phone.`,
        };
      } else if (parsed.primaryColor && parsed.compactWidth) {
        const merged = { ...DEFAULT_ISLAND_CONFIG, ...parsed };
        setDraftConfig(merged);
        PersistenceEngine.saveAppliedConfig(merged);
        setAppliedConfig(merged);
        return { ok: true, message: 'Imported direct IslandConfig JSON.' };
      }
      return {
        ok: false,
        message: 'Unrecognized JSON structure. Expected Nova Island backup or theme preset.',
      };
    } catch (e) {
      return {
        ok: false,
        message: `Invalid JSON syntax: ${(e as Error).message}`,
      };
    }
  };

  const handleInstallButtonClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        showToast('Nova Island installed onto your phone Home Screen!');
        return;
      }
    }
    setInstallModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* LIVE TOP-OF-PHONE FLOATING DYNAMIC ISLAND OVERLAY (Works directly on user's phone screen!) */}
      <LiveDeviceIslandOverlay
        config={draftConfig}
        enabled={liveTopOverlayEnabled}
        fullScreenPhoneMode={fullScreenPhoneMode}
        onToggleFullScreenMode={setFullScreenPhoneMode}
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
        activeActivity={activeActivity}
        onChangeActivity={setActiveActivity}
        liveNotification={liveNotification}
        realBattery={realBattery}
        onOpenInstallModal={handleInstallButtonClick}
      />

      {/* Top Spacer so the Live Top-of-Screen Dynamic Island never covers the header */}
      {liveTopOverlayEnabled && <div className="h-14 bg-slate-950 shrink-0" />}

      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md z-40">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            setActiveNav('studio');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Nova Island
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {(
            [
              { id: 'studio', label: 'Studio' },
              { id: 'themes', label: 'Theme Gallery' },
              { id: 'automation', label: 'Profiles & Schedules' },
              { id: 'persistence', label: 'Room & DataStore' },
              { id: 'kotlin', label: 'Kotlin Source' },
            ] as { id: TopNavSection; label: string }[]
          ).map((nav) => (
            <a
              key={nav.id}
              href={`#${nav.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveNav(nav.id);
              }}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-white hover:underline underline-offset-8 ${
                activeNav === nav.id ? 'text-white underline decoration-indigo-500 decoration-2' : ''
              }`}
            >
              {nav.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleApplyChanges}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (visible on phones) */}
      <div className="flex md:hidden items-center gap-1.5 px-4 py-2.5 bg-slate-900 border-b border-slate-800 overflow-x-auto">
        {(
          [
            { id: 'studio', label: 'Studio' },
            { id: 'themes', label: 'Theme Store' },
            { id: 'automation', label: 'Schedules' },
            { id: 'persistence', label: 'Database' },
            { id: 'kotlin', label: 'Android APK Code' },
          ] as { id: TopNavSection; label: string }[]
        ).map((nav) => (
          <button
            key={nav.id}
            type="button"
            onClick={() => setActiveNav(nav.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
              activeNav === nav.id ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            {nav.label}
          </button>
        ))}
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN 1440px WORKSPACE GRID */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 flex-1 space-y-6">
        {/* LIVE PHONE OVERLAY & APP INSTALLER CONTROL STRIP */}
        <div className="p-4 rounded-2xl bg-indigo-950/35 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Live Phone Dynamic Island Overlay is Running at the Top of Your Screen
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Tap the floating capsule at the very top of your phone to play real music, test calls, or view real battery ({realBattery.levelPercent}%{' '}
                {realBattery.charging ? 'Charging' : 'Battery'}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerDeviceHaptic(20);
                setFullScreenPhoneMode(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Launch Full-Screen Phone Mode
            </button>

            <button
              type="button"
              onClick={() => setLiveTopOverlayEnabled((v) => !v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                liveTopOverlayEnabled
                  ? 'bg-slate-900 border-indigo-500/60 text-indigo-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {liveTopOverlayEnabled ? 'Top Screen Island: ON' : 'Top Screen Island: OFF'}
            </button>

            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallButtonClick}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Install App on Phone
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT / MAIN STUDIO WORKSPACE (7 Columns on XL) */}
          <div className="xl:col-span-7 space-y-6">
            {activeNav === 'studio' && (
              <>
                {/* Studio Workspace Header & 4-Module Segmented Bar */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                        Dynamic Island Personalization Studio
                      </h1>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Every slider updates the live Dynamic Island at the top of your phone & the preview below
                      </p>
                    </div>
                  </div>

                  {/* 4 Studio Sub-Module Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    {(
                      [
                        {
                          id: 'color',
                          label: 'Color & Glow',
                          icon: Palette,
                        },
                        {
                          id: 'geometry',
                          label: 'Dimensions & Shape',
                          icon: BoxSelect,
                        },
                        {
                          id: 'animation',
                          label: 'Motion & Battery',
                          icon: Activity,
                        },
                        {
                          id: 'notifications',
                          label: 'Alerts, Icons & Layout',
                          icon: Bell,
                        },
                      ] as const
                    ).map((tab) => {
                      const Icon = tab.icon;
                      const active = studioTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStudioTab(tab.id)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Studio Sub-Module Content */}
                {studioTab === 'color' && (
                  <ColorAndSurfaceStudio
                    config={draftConfig}
                    onUpdate={updateDraftConfig}
                  />
                )}

                {studioTab === 'geometry' && (
                  <GeometryAndShapeStudio
                    config={draftConfig}
                    onUpdate={updateDraftConfig}
                  />
                )}

                {studioTab === 'animation' && (
                  <AnimationAndPerformanceStudio
                    config={draftConfig}
                    onUpdate={updateDraftConfig}
                    onTriggerReplay={() => setAnimationTriggerKey((k) => k + 1)}
                  />
                )}

                {studioTab === 'notifications' && (
                  <NotificationIconLayoutStudio
                    config={draftConfig}
                    onUpdate={updateDraftConfig}
                    liveNotification={liveNotification}
                    onDispatchNotification={(payload) => {
                      triggerDeviceHaptic([25, 50, 25]);
                      novaAudioEngine.playNotificationChime();
                      setLiveNotification(payload);
                      setActiveActivity('notification');
                      setDisplayMode('expanded');
                      setAnimationTriggerKey((k) => k + 1);
                      showToast(`Dispatched "${payload.title}" to your live Dynamic Island!`);
                    }}
                  />
                )}
              </>
            )}

            {activeNav === 'themes' && (
              <ThemeGalleryAndPresets
                allThemes={allThemes}
                favoriteIds={favoriteIds}
                activeConfig={draftConfig}
                onSelectTheme={handleSelectTheme}
                onToggleFavorite={handleToggleFavorite}
                onDuplicateTheme={handleDuplicateTheme}
                onRenameTheme={handleRenameTheme}
                onDeleteCustomTheme={handleDeleteCustomTheme}
                onDownloadAndInstallTheme={handleDownloadAndInstallTheme}
                onOpenSavePresetModal={() => setSaveModalOpen(true)}
              />
            )}

            {activeNav === 'automation' && (
              <ProfilesSchedulesAndBackup
                allThemes={allThemes}
                profiles={profiles}
                schedules={schedules}
                onActivateProfile={handleActivateProfile}
                onAddProfile={handleAddProfile}
                onDeleteProfile={handleDeleteProfile}
                onToggleSchedule={handleToggleSchedule}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onSelectThemeById={handleSelectThemeById}
                backupJsonText={backupJsonText}
                onRestoreBackupJson={handleRestoreBackupJson}
              />
            )}

            {activeNav === 'persistence' && (
              <PersistenceAndKotlinView
                mode="persistence"
                config={draftConfig}
                customPresets={customPresets}
                schedules={schedules}
                testResults={testResults}
                transactionLogs={txLogs}
                onRunVerificationSuite={() => {
                  refreshLogsAndTests(draftConfig);
                  showToast('Executed all 7 Room & DataStore verification tests.');
                }}
                onClearLogs={() => {
                  PersistenceEngine.clearTransactionLogs();
                  setTxLogs([]);
                }}
              />
            )}

            {activeNav === 'kotlin' && (
              <PersistenceAndKotlinView
                mode="kotlin"
                config={draftConfig}
                customPresets={customPresets}
                schedules={schedules}
                testResults={testResults}
                transactionLogs={txLogs}
                onRunVerificationSuite={() => refreshLogsAndTests(draftConfig)}
                onClearLogs={() => {
                  PersistenceEngine.clearTransactionLogs();
                  setTxLogs([]);
                }}
              />
            )}
          </div>

          {/* RIGHT STICKY INTERACTIVE PHONE PREVIEW (5 Columns on XL) */}
          <div className="xl:col-span-5 xl:sticky xl:top-20 flex flex-col items-center">
            <PhonePreview
              config={draftConfig}
              hasUnsavedChanges={hasUnsavedChanges}
              displayMode={displayMode}
              onChangeDisplayMode={setDisplayMode}
              activeActivity={activeActivity}
              onChangeActivity={setActiveActivity}
              liveNotification={liveNotification}
              animationTriggerKey={animationTriggerKey}
              onApply={handleApplyChanges}
              onOpenSavePresetModal={() => setSaveModalOpen(true)}
              onCancel={handleCancelChanges}
              onReset={handleResetToDefaults}
            />
          </div>
        </div>
      </main>

      {/* MODAL 1: Save Unlimited Custom Preset */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                Save Custom Theme to Phone
              </h3>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPreset} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Theme Name
                </label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Cyber Samurai Glass v2"
                  autoFocus
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Description / Notes
                </label>
                <input
                  type="text"
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="Optional description of colors, blur, and shape"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Install Nova Island App on Phone Guide */}
      {installModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                Install Nova Island on Your Phone
              </h3>
              <button
                type="button"
                onClick={() => setInstallModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                To run <strong>Nova Island</strong> as a full-screen standalone app on your phone:
              </p>

              {isIOS ? (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <p className="font-semibold text-white">On iPhone / Safari:</p>
                  <p>1. Tap the <strong>Share</strong> button at the bottom of Safari.</p>
                  <p>2. Tap <strong>Add to Home Screen</strong>.</p>
                  <p>3. Open <strong>NovaIsland</strong> from your Home Screen for full-screen mode.</p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <p className="font-semibold text-white">On Android (Chrome / Samsung Internet):</p>
                  <p>1. Tap the <strong>⋮ (Three Dots Menu)</strong> in the top-right corner of Chrome.</p>
                  <p>2. Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</p>
                  <p>3. Or tap <strong>Launch Full-Screen Phone Mode</strong> below to immediately run the full-screen Dynamic Island launcher right now!</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInstallModalOpen(false);
                  setFullScreenPhoneMode(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Launch Full-Screen Mode Now
              </button>
              <button
                type="button"
                onClick={() => setInstallModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
