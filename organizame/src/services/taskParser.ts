import type { ParsedTaskDraft, TaskParseResult } from './taskParserTypes';

const DURATION_PATTERNS: [RegExp, (m: RegExpMatchArray) => number][] = [
  [/(\d+)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?/i, (m) => parseInt(m[1]) * 60 + (m[2] ? parseInt(m[2]) : 0)],
  [/(\d+)\s*m(?:in(?:utes?)?)?/i, (m) => parseInt(m[1])],
  [/(\d+)\s*hours?/i, (m) => parseInt(m[1]) * 60],
  [/half\s*hour/i, () => 30],
  [/one\s*hour/i, () => 60],
];

const COUNT_PATTERNS: [RegExp, (m: RegExpMatchArray) => { count: number; unitMinutes: number }][] = [
  [/(\d+)\s*times?/i, (m) => ({ count: parseInt(m[1]), unitMinutes: 60 })],
  [/(\d+)\s*days?/i, (m) => ({ count: parseInt(m[1]), unitMinutes: 60 })],
  [/(\d+)\s*reels?/i, (m) => ({ count: parseInt(m[1]), unitMinutes: 45 })],
  [/(\d+)\s*sessions?/i, (m) => ({ count: parseInt(m[1]), unitMinutes: 60 })],
];

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/gym|workout|exercise|yoga|run/i, 'workout'],
  [/cook|meal|dinner|lunch|recipe/i, 'cooking'],
  [/rest|free|night off|time off|relax/i, 'time-off'],
  [/art|creative|design|paint|draw/i, 'creative'],
  [/admin|invoice|email|paperwork/i, 'admin'],
  [/reel|content|video|record|edit|flashforge|presentation|adobe/i, 'content'],
  [/errand|grocery|shop|buy/i, 'errands'],
  [/work|meeting|client|project/i, 'work'],
];

const PRIORITY_KEYWORDS: [RegExp, 'urgent' | 'high' | 'medium' | 'low'][] = [
  [/urgent|asap|critical/i, 'urgent'],
  [/important|priority/i, 'high'],
  [/optional|maybe|if time/i, 'low'],
];

function extractDuration(line: string): number {
  for (const [pattern, fn] of DURATION_PATTERNS) {
    const m = line.match(pattern);
    if (m) return fn(m);
  }
  for (const [pattern, fn] of COUNT_PATTERNS) {
    const m = line.match(pattern);
    if (m) {
      const { count, unitMinutes } = fn(m);
      return count * unitMinutes;
    }
  }
  return 60;
}

function extractCategory(line: string): string {
  for (const [pattern, cat] of CATEGORY_KEYWORDS) {
    if (pattern.test(line)) return cat;
  }
  return 'work';
}

function extractPriority(line: string): 'urgent' | 'high' | 'medium' | 'low' {
  for (const [pattern, pri] of PRIORITY_KEYWORDS) {
    if (pattern.test(line)) return pri;
  }
  return 'medium';
}

function cleanTaskName(line: string): string {
  return line
    .replace(/\bfor\s+\d+\s*(hours?|h|minutes?|min|days?|times?)\b/gi, '')
    .replace(/\b\d+\s*(hours?|h|minutes?|min)\b/gi, '')
    .replace(/\b\d+\s*times?\b/gi, '')
    .replace(/\b\d+\s*days?\b/gi, '')
    .replace(/\b\d+\s*reels?\b/gi, '')
    .replace(/\bkeep\s+one\s+night\s+free\b/gi, 'Keep one night free')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isRestConstraint(line: string): boolean {
  return /keep.*night.*free|protect.*rest|no work.*night/i.test(line);
}

export function parseBrainDump(text: string): TaskParseResult {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  const tasks: ParsedTaskDraft[] = [];
  const constraints: string[] = [];

  for (const line of lines) {
    if (isRestConstraint(line)) {
      constraints.push(line);
      tasks.push({
        name: 'Protected rest time',
        durationMinutes: 120,
        category: 'time-off',
        priority: 'high',
        canSplit: false,
        preferredTimeOfDay: 'evening',
        flexibility: 'fixed',
        isConstraint: true,
      });
      continue;
    }

    const duration = extractDuration(line);
    const category = extractCategory(line);
    const priority = extractPriority(line);
    const name = cleanTaskName(line) || line;

    tasks.push({
      name,
      durationMinutes: Math.max(15, duration),
      category,
      priority,
      canSplit: category !== 'workout',
      preferredTimeOfDay: category === 'workout' ? 'morning' : category === 'time-off' ? 'evening' : 'any',
      flexibility: priority === 'urgent' ? 'fixed' : 'flexible',
    });
  }

  return { tasks, constraints };
}

export function estimateDurationIfMissing(taskName: string): number {
  const lower = taskName.toLowerCase();
  if (/email|call|quick/i.test(lower)) return 15;
  if (/meeting|review/i.test(lower)) return 45;
  if (/edit|record|video|presentation/i.test(lower)) return 90;
  if (/gym|workout/i.test(lower)) return 60;
  if (/cook/i.test(lower)) return 45;
  return 60;
}
