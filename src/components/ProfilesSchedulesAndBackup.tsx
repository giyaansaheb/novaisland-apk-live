import React, { useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Download,
  FileJson,
  Layers,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  IslandConfig,
  IslandProfile,
  ScheduleRule,
  ThemePreset,
} from '../types/novaIsland';

interface ProfilesSchedulesAndBackupProps {
  allThemes: ThemePreset[];
  profiles: IslandProfile[];
  schedules: ScheduleRule[];
  onActivateProfile: (profile: IslandProfile) => void;
  onAddProfile: (profile: IslandProfile) => void;
  onDeleteProfile: (id: string) => void;
  onToggleSchedule: (id: string) => void;
  onAddSchedule: (rule: ScheduleRule) => void;
  onDeleteSchedule: (id: string) => void;
  onSelectThemeById: (themeId: string) => void;
  backupJsonText: string;
  onRestoreBackupJson: (jsonString: string) => { ok: boolean; message: string };
}

export const ProfilesSchedulesAndBackup: React.FC<ProfilesSchedulesAndBackupProps> = ({
  allThemes,
  profiles,
  schedules,
  onActivateProfile,
  onAddProfile,
  onDeleteProfile,
  onToggleSchedule,
  onAddSchedule,
  onDeleteSchedule,
  onSelectThemeById,
  backupJsonText,
  onRestoreBackupJson,
}) => {
  // New Profile Form
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileThemeId, setNewProfileThemeId] = useState(
    allThemes[0]?.id || 'theme-nova-hyperdrive'
  );
  const [newProfileBattery, setNewProfileBattery] = useState<
    'balanced' | 'performance' | 'ultra-saver'
  >('balanced');

  // New Schedule Form
  const [newSchedName, setNewSchedName] = useState('');
  const [newSchedTrigger, setNewSchedTrigger] = useState<
    'time' | 'charging' | 'dnd' | 'low-battery'
  >('time');
  const [newSchedStart, setNewSchedStart] = useState('18:00');
  const [newSchedEnd, setNewSchedEnd] = useState('23:30');
  const [newSchedThemeId, setNewSchedThemeId] = useState(
    allThemes[0]?.id || 'theme-oled-pitch'
  );

  // Interactive 24-Hour Schedule Simulator
  const [simulatedHour, setSimulatedHour] = useState(14); // 14:00 default
  const [simulatedMatchedRule, setSimulatedMatchedRule] = useState<string | null>(null);

  // JSON Import / Export state
  const [jsonEditorText, setJsonEditorText] = useState(backupJsonText);
  const [jsonStatusMessage, setJsonStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedFlag, setCopiedFlag] = useState(false);

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const created: IslandProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName.trim(),
      description:
        newProfileDesc.trim() || 'Custom user-configured Nova Island profile.',
      themeId: newProfileThemeId,
      isActive: false,
      batteryMode: newProfileBattery,
      autoExpandNotifications: newProfileBattery !== 'ultra-saver',
      hapticFeedbackStrength: newProfileBattery === 'performance' ? 90 : 60,
    };
    onAddProfile(created);
    setNewProfileName('');
    setNewProfileDesc('');
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedName.trim()) return;
    const rule: ScheduleRule = {
      id: `sched-${Date.now()}`,
      name: newSchedName.trim(),
      enabled: true,
      triggerType: newSchedTrigger,
      startTime: newSchedStart,
      endTime: newSchedEnd,
      themeId: newSchedThemeId,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    };
    onAddSchedule(rule);
    setNewSchedName('');
  };

  const handleSimulateTimeScrub = (hour: number) => {
    setSimulatedHour(hour);
    // Find enabled time schedule matching this hour
    const timeRules = schedules.filter((s) => s.enabled && s.triggerType === 'time');
    for (const rule of timeRules) {
      const startH = parseInt(rule.startTime.split(':')[0], 10);
      const endH = parseInt(rule.endTime.split(':')[0], 10);
      const matches =
        startH <= endH
          ? hour >= startH && hour < endH
          : hour >= startH || hour < endH; // overnight wrap e.g. 23:00 -> 07:00
      if (matches) {
        setSimulatedMatchedRule(`${rule.name} (${rule.startTime}–${rule.endTime})`);
        onSelectThemeById(rule.themeId);
        return;
      }
    }
    setSimulatedMatchedRule('No active time rule for this hour');
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(backupJsonText);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadJsonFile = () => {
    const blob = new Blob([backupJsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-island-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const res = onRestoreBackupJson(jsonEditorText);
    setJsonStatusMessage({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Context Profiles */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Multi-Context Profiles & Hardware Modes
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bind a theme preset, refresh rate governor, and haptic feedback profile to one-tap scenarios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((prof) => {
            const linkedTheme = allThemes.find((t) => t.id === prof.themeId);
            return (
              <div
                key={prof.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  prof.isActive
                    ? 'bg-indigo-950/35 border-indigo-500'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-100">{prof.name}</h4>
                    <span className="text-[11px] font-mono text-indigo-400">
                      {prof.batteryMode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{prof.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                    <span>Theme: {linkedTheme?.name || 'Default'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Haptics: {prof.hapticFeedbackStrength}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onActivateProfile(prof)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      prof.isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {prof.isActive ? 'Active Profile' : 'Activate Profile'}
                  </button>

                  {profiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProfile(prof.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Profile Form */}
        <form
          onSubmit={handleCreateProfile}
          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
        >
          <div className="md:col-span-3">
            <label className="text-[11px] text-slate-400 block mb-1">Profile Name</label>
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="e.g. Cinema OLED"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-[11px] text-slate-400 block mb-1">Linked Theme</label>
            <select
              value={newProfileThemeId}
              onChange={(e) => setNewProfileThemeId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
            >
              {allThemes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-[11px] text-slate-400 block mb-1">Power Governor</label>
            <select
              value={newProfileBattery}
              onChange={(e) =>
                setNewProfileBattery(
                  e.target.value as 'balanced' | 'performance' | 'ultra-saver'
                )
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
            >
              <option value="balanced">Balanced (Adaptive Hz)</option>
              <option value="performance">Performance (120Hz Lock)</option>
              <option value="ultra-saver">Ultra Battery Saver (60Hz)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Profile
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Automated Theme Scheduling & 24-Hour Time Scrubbing Simulator */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Automated Theme Scheduling & Time Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transition themes automatically by time of day, charging state, or Do Not Disturb.
            </p>
          </div>
        </div>

        {/* Interactive 24-Hour Time Simulator */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-200">
              Interactive 24-Hour Schedule Verification Scrubber
            </span>
            <span className="font-mono text-indigo-400">
              Simulated Clock: {simulatedHour.toString().padStart(2, '0')}:00 ·{' '}
              {simulatedMatchedRule || 'Drag slider to test'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={23}
            value={simulatedHour}
            onChange={(e) => handleSimulateTimeScrub(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>00:00 Midnight</span>
            <span>06:00 Dawn</span>
            <span>12:00 Noon</span>
            <span>18:00 Dusk</span>
            <span>23:00 Night</span>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-2.5">
          {schedules.map((rule) => {
            const theme = allThemes.find((t) => t.id === rule.themeId);
            return (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100">{rule.name}</span>
                    <span className="text-[11px] font-mono text-indigo-400">
                      {rule.triggerType === 'time'
                        ? `${rule.startTime} – ${rule.endTime}`
                        : `Trigger: ${rule.triggerType.toUpperCase()}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Switches to: <strong className="text-slate-200">{theme?.name || rule.themeId}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectThemeById(rule.themeId)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleSchedule(rule.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSchedule(rule.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                    title="Delete Schedule Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Schedule Form */}
        <form
          onSubmit={handleCreateSchedule}
          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
        >
          <div className="lg:col-span-3">
            <label className="text-[11px] text-slate-400 block mb-1">Rule Label</label>
            <input
              type="text"
              value={newSchedName}
              onChange={(e) => setNewSchedName(e.target.value)}
              placeholder="e.g. Late Night Study"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-[11px] text-slate-400 block mb-1">Trigger</label>
            <select
              value={newSchedTrigger}
              onChange={(e) =>
                setNewSchedTrigger(
                  e.target.value as 'time' | 'charging' | 'dnd' | 'low-battery'
                )
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
            >
              <option value="time">Time Window</option>
              <option value="charging">When Charging</option>
              <option value="dnd">Do Not Disturb</option>
              <option value="low-battery">Battery &lt; 20%</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-[11px] text-slate-400 block mb-1">Start / End</label>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={newSchedStart}
                disabled={newSchedTrigger !== 'time'}
                onChange={(e) => setNewSchedStart(e.target.value)}
                className="w-full px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-100 disabled:opacity-40"
              />
              <input
                type="time"
                value={newSchedEnd}
                disabled={newSchedTrigger !== 'time'}
                onChange={(e) => setNewSchedEnd(e.target.value)}
                className="w-full px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-100 disabled:opacity-40"
              />
            </div>
          </div>
          <div className="lg:col-span-3">
            <label className="text-[11px] text-slate-400 block mb-1">Target Theme</label>
            <select
              value={newSchedThemeId}
              onChange={(e) => setNewSchedThemeId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
            >
              {allThemes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rule
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: JSON Import / Export & Full Backup / Restore */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-indigo-400" />
              JSON Import / Export & Full Backup / Restore
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export your complete DataStore & Room state as a portable JSON bundle, or paste JSON to restore.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setJsonEditorText(backupJsonText)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Refresh Snapshot
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedFlag ? 'Copied JSON!' : 'Copy JSON'}
            </button>
            <button
              type="button"
              onClick={handleDownloadJsonFile}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download .json Backup
            </button>
          </div>
        </div>

        <textarea
          value={jsonEditorText}
          onChange={(e) => setJsonEditorText(e.target.value)}
          rows={9}
          spellCheck={false}
          className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {jsonStatusMessage && (
              <span
                className={`text-xs font-medium ${
                  jsonStatusMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {jsonStatusMessage.text}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleImportJson}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import & Restore JSON Payload
          </button>
        </div>
      </div>
    </div>
  );
};
