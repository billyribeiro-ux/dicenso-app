import type { Prompt } from '@/types';

export interface SharedPromptRecord {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  body: string;
  category: string;
  isFavorite: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toPrompt(record: SharedPromptRecord): Prompt {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

export function toSharedPrompt(prompt: Prompt): SharedPromptRecord {
  return {
    ...prompt,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  };
}

