'use client';

import * as React from 'react';
import { exportDb, importDb, resetDb } from '@/lib/db';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const USER_ID = 'local-user';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [showReset, setShowReset] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportDb();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dicenso-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.name.endsWith('.json') && !file.type.includes('json')) {
      toast.error('Please select a JSON backup file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large (max 50MB)');
      return;
    }

    // Validate JSON structure before importing
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.data || !data.dataOrigin || typeof data.formatVersion !== 'number') {
        toast.error('Invalid backup file format');
        return;
      }
      // Also check for expected tables
      const expectedTables = ['notes', 'tasks', 'prompts', 'lessons', 'tags'];
      const hasExpectedTables = expectedTables.some(
        (t) => data.data[t] && Array.isArray(data.data[t])
      );
      if (!hasExpectedTables) {
        toast.error('Backup file missing expected data tables');
        return;
      }
    } catch {
      toast.error('Invalid JSON file');
      return;
    }

    setImporting(true);
    try {
      await importDb(file, true);
      toast.success('Backup imported. Refreshing...');
      window.location.reload();
    } catch {
      toast.error('Import failed. The backup may be corrupted.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = async () => {
    await resetDb();
    toast.success('Database reset');
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="premium-panel rounded-3xl p-6">
        <h1 className="text-3xl font-extrabold tracking-[-0.05em]">Settings</h1>
        <p className="text-sm font-medium text-muted-foreground">Customize your DiCenso experience</p>
      </div>

      {/* Appearance */}
      <section className="premium-panel rounded-3xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'entity-card flex flex-col items-center gap-2 rounded-2xl p-4 transition-all active:scale-[0.99]',
                theme === t
                  ? 'ring-2 ring-ring/35'
                  : ''
              )}
            >
              {t === 'light' && <Sun className="h-5 w-5" />}
              {t === 'dark' && <Moon className="h-5 w-5" />}
              {t === 'system' && <Monitor className="h-5 w-5" />}
              <span className="text-sm font-medium capitalize">{t}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Data Management */}
      <section className="premium-panel rounded-3xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">Data</h2>
        <div className="space-y-3">
          <div className="entity-card flex items-center justify-between rounded-2xl p-4">
            <div>
              <p className="font-medium">Export Backup</p>
              <p className="text-sm text-muted-foreground">Download all your data as JSON</p>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="entity-card flex items-center justify-between rounded-2xl p-4">
            <div>
              <p className="font-medium">Import Backup</p>
              <p className="text-sm text-muted-foreground">Restore from a previous backup</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="sr-only"
              />
              <Button asChild disabled={importing}>
                <span className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </span>
              </Button>
            </label>
          </div>

          <div className="rounded-2xl border border-destructive/45 bg-destructive/5 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Reset All Data</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowReset(!showReset)}
              >
                {showReset ? 'Cancel' : 'Reset'}
              </Button>
            </div>
            {showReset && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your notes, tasks, prompts, and lessons.
                  Make sure you have exported a backup first.
                </p>
                <Button variant="destructive" size="sm" onClick={handleReset}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Confirm Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="premium-panel rounded-3xl p-5 space-y-2">
        <h2 className="text-lg font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">
          DiCenso v0.1.0 — Your personal knowledge and execution operating system.
        </p>
        <p className="text-sm text-muted-foreground">
          All data is stored locally in your browser using IndexedDB.
        </p>
      </section>
    </div>
  );
}
