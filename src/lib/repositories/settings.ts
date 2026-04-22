import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { UserSettings, FocusSession, TimerPreset, DailyPlan } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

class SettingsRepository extends BaseRepository<UserSettings> {
  constructor() {
    super(async () => (await getDb()).settings);
  }

  async getByUser(userId: string): Promise<UserSettings | undefined> {
    const t = await this.table();
    return t.where({ userId }).first();
  }

  async getOrCreate(userId: string): Promise<UserSettings> {
    const existing = await this.getByUser(userId);
    if (existing) return existing;
    return this.create({
      userId,
      theme: 'system',
      density: 'comfortable',
      fontSize: 'medium',
      sidebarCollapsed: false,
      sidebarWidth: 280,
      startPage: 'today',
      reducedMotion: false,
      reminderDefaults: {},
    });
  }
}

class FocusSessionsRepository extends BaseRepository<FocusSession> {
  constructor() {
    super(async () => (await getDb()).focusSessions);
  }

  async getByUser(userId: string, limit = 50): Promise<FocusSession[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .reverse()
      .sortBy('startedAt')
      .then((items) => items.slice(0, limit));
  }

  async getToday(userId: string, date = new Date()): Promise<FocusSession[]> {
    const t = await this.table();
    const start = startOfDay(date);
    const end = endOfDay(date);
    return t
      .where({ userId })
      .filter((s) => s.startedAt >= start && s.startedAt <= end)
      .reverse()
      .sortBy('startedAt');
  }
}

class TimerPresetsRepository extends BaseRepository<TimerPreset> {
  constructor() {
    super(async () => (await getDb()).timerPresets);
  }

  async getByWorkspace(workspaceId: string): Promise<TimerPreset[]> {
    const t = await this.table();
    return t.where({ workspaceId }).sortBy('createdAt');
  }
}

class DailyPlansRepository extends BaseRepository<DailyPlan> {
  constructor() {
    super(async () => (await getDb()).dailyPlans);
  }

  async getByDate(workspaceId: string, date: Date): Promise<DailyPlan | undefined> {
    const t = await this.table();
    const start = startOfDay(date);
    const end = endOfDay(date);
    return t
      .where({ workspaceId })
      .filter((p) => p.date >= start && p.date <= end)
      .first();
  }

  async getOrCreate(workspaceId: string, userId: string, date: Date): Promise<DailyPlan> {
    const existing = await this.getByDate(workspaceId, date);
    if (existing) return existing;
    return this.create({ workspaceId, userId, date });
  }
}

export const settingsRepo = new SettingsRepository();
export const focusSessionsRepo = new FocusSessionsRepository();
export const timerPresetsRepo = new TimerPresetsRepository();
export const dailyPlansRepo = new DailyPlansRepository();
