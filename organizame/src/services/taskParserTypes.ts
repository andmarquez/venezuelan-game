import type { Flexibility, Priority, TimeOfDay } from '../types';

export interface ParsedTaskDraft {
  name: string;
  durationMinutes: number;
  category: string;
  priority: Priority;
  canSplit: boolean;
  preferredTimeOfDay: TimeOfDay;
  flexibility: Flexibility;
  deadline?: string;
  isConstraint?: boolean;
}

export interface TaskParseResult {
  tasks: ParsedTaskDraft[];
  constraints: string[];
}
