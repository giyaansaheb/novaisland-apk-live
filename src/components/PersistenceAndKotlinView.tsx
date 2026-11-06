import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Download,
  Play,
  Trash2,
  XCircle,
} from 'lucide-react';
import { generateKotlinSourceFiles } from '../services/kotlinCodeGenerator';
import {
  IslandConfig,
  RoomTestAssertion,
  RoomTransactionLog,
  ScheduleRule,
  ThemePreset,
} from '../types/novaIsland';

interface PersistenceAndKotlinViewProps {
  mode: 'persistence' | 'kotlin';
  config: IslandConfig;
  customPresets: ThemePreset[];
  schedules: ScheduleRule[];
  testResults: RoomTestAssertion[];
  transactionLogs: RoomTransactionLog[];
  onRunVerificationSuite: () => void;
  onClearLogs: () => void;
}

export const PersistenceAndKotlinView: React.FC<PersistenceAndKotlinViewProps> = ({
  mode,
  config,
  customPresets,
  schedules,
  testResults,
  transactionLogs,
  onRunVerificationSuite,
  onClearLogs,
}) => {
  const kotlinFiles = useMemo(
    () => generateKotlinSourceFiles(config, customPresets, schedules),
    [config, customPresets, schedules]
  );

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeFile = kotlinFiles[selectedFileIndex] || kotlinFiles[0];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadKt = () => {
    const blob = new Blob([activeFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (mode === 'kotlin') {
    return (
      <div className="space-y-5">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                Live Kotlin, Jetpack Compose, DataStore & Room Code Generator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every slider and color change in the Studio updates these Android Kotlin modules in real time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCode ? 'Copied Kotlin!' : 'Copy Source'}
              </button>
              <button
                type="button"
                onClick={handleDownloadKt}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download {activeFile.filename}
              </button>
            </div>
          </div>

          {/* File Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {kotlinFiles.map((file, idx) => (
              <button
                key={file.filename}
                type="button"
                onClick={() => setSelectedFileIndex(idx)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedFileIndex === idx
                    ? 'bg-indigo-950/50 border-indigo-500 text-slate-100'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-xs font-semibold text-indigo-300 truncate">
                  {file.filename}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{file.module}</div>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-300 bg-slate-950/70 px-3.5 py-2.5 rounded-xl border border-slate-800">
            {activeFile.description}
          </p>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-[540px] leading-relaxed">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    );
  }

  // Persistence & Room Verification Mode
  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="space-y-6">
      {/* Room & DataStore Verification Test Runner */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              DataStore & Room Local Persistence Verification Suite
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute real local CRUD assertions against Preferences DataStore and Room DAO tables.
            </p>
          </div>

          <button
            type="button"
            onClick={onRunVerificationSuite}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Re-Run All 7 Room & DataStore Tests ({passedCount}/{testResults.length} Passed)
          </button>
        </div>

        {/* Assertions Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Target Layer</th>
                <th className="py-2.5 px-3.5">Instrumentation Test Method</th>
                <th className="py-2.5 px-3.5">Verification Assertion Details</th>
                <th className="py-2.5 px-3.5 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {testResults.map((res) => (
                <tr key={res.id} className="bg-slate-950/40 hover:bg-slate-900/80">
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {res.passed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        FAIL
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-indigo-300 whitespace-nowrap">
                    {res.suite}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-200 whitespace-nowrap">
                    {res.testName}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-400">{res.details}</td>
                  <td className="py-2.5 px-3.5 font-mono text-right text-slate-300 whitespace-nowrap">
                    {res.durationMs.toFixed(2)} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Room & DataStore Transaction Audit Log */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Live DataStore & Room SQLite Transaction Log ({transactionLogs.length} entries)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time record of every preference commit, preset insert/rename/delete, and query.
            </p>
          </div>

          {transactionLogs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log History
            </button>
          )}
        </div>

        {transactionLogs.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
            No transactions logged yet. Click Apply, Save Preset, or Run Tests above to inspect persistence events.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Storage Table</th>
                  <th className="py-2 px-3">Op</th>
                  <th className="py-2 px-3">Transaction Summary</th>
                  <th className="py-2 px-3 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {transactionLogs.map((log) => (
                  <tr key={log.id} className="bg-slate-950/40">
                    <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2 px-3 font-mono text-indigo-300 whitespace-nowrap">
                      {log.table}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                      {log.operation}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{log.summary}</td>
                    <td className="py-2 px-3 font-mono text-right text-slate-400 whitespace-nowrap">
                      {log.durationMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
