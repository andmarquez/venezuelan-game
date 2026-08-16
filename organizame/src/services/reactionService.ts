import type { ReactionGif, ReactionTrigger } from '../types';
import { DEFAULT_REACTIONS } from '../data/defaultReactions';

const STORAGE_KEY = 'organizame.reactions';

function loadReactions(): ReactionGif[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReactionGif[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_REACTIONS];
}

let reactions: ReactionGif[] = loadReactions();

function saveReactions(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reactions));
}

export const reactionService = {
  getAll(): ReactionGif[] {
    return [...reactions];
  },

  getByTrigger(trigger: ReactionTrigger): ReactionGif | undefined {
    return reactions.find((r) => r.trigger === trigger);
  },

  add(reaction: Omit<ReactionGif, 'id'>): ReactionGif {
    const newReaction: ReactionGif = {
      ...reaction,
      id: `reaction-${Date.now()}`,
    };
    reactions = [...reactions, newReaction];
    saveReactions();
    return newReaction;
  },

  update(id: string, updates: Partial<ReactionGif>): ReactionGif | undefined {
    const idx = reactions.findIndex((r) => r.id === id);
    if (idx < 0) return undefined;
    reactions = reactions.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveReactions();
    return reactions[idx];
  },

  delete(id: string): void {
    reactions = reactions.filter((r) => r.id !== id);
    saveReactions();
  },

  reset(): void {
    reactions = [...DEFAULT_REACTIONS];
    saveReactions();
  },
};

// Future: upload to Supabase Storage
export async function uploadReactionToStorage(_file: File): Promise<string> {
  // Placeholder for Supabase integration
  return URL.createObjectURL(_file);
}
