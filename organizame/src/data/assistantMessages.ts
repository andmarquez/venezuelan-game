import type { ReactionTrigger } from '../types';

export const ASSISTANT_MESSAGES: Record<string, string[]> = {
  'plan-fits': [
    'This fits. Barely. But I made it work.',
    'Good news: it fits. Bad news: you have to actually do it.',
    'I organized this without destroying your mental health. You\'re welcome.',
    'This schedule is possible, but I need you to behave.',
    'I found a way to make it work. Don\'t ask how.',
    'This fits, but barely. Like a suitcase before a long trip.',
  ],
  'plan-does-not-fit': [
    'You need a clone. This is not humanly possible.',
    'You\'re trying to fit an entire month into a Tuesday.',
    'I love the ambition. I do not love the math.',
    'This needs either more time, fewer tasks, or a second you.',
    'Technically possible. Emotionally questionable.',
    'Let\'s be realistic before your calendar files a complaint.',
  ],
  overbooked: [
    'You\'re overbooked. Deeply. Spiritually. Mathematically.',
    'You are not busy. You are in premium chaos mode.',
    'Cute plan. Completely unhinged, but cute.',
    'This is not a to-do list. This is a cry for help.',
  ],
  rebalance: [
    'Your week is giving chaos. I moved things around so you can function like a person.',
    'I moved things around so you can function like a person.',
    'Your schedule changed. I cleaned up the mess.',
  ],
  taskComplete: [
    'You finished it? Honestly, iconic.',
    'Task complete. Small win, big main character energy.',
    'You did it. I will now pretend I was not worried.',
    'Look at you being organized. Suspicious, but impressive.',
  ],
  reminder: [
    'This is your reminder, not a suggestion.',
    'Get up. The task is not going to complete itself.',
    'Time to focus. Chaos can wait.',
  ],
  greeting: [
    'Ready to stop pretending you have unlimited time?',
    'Let\'s not turn today into a productivity crime scene.',
    'You\'re doing too much. Again. Let me fix it.',
  ],
};

export function pickMessage(key: string, userName = 'friend'): string {
  const pool = ASSISTANT_MESSAGES[key] ?? ASSISTANT_MESSAGES['plan-fits'];
  const msg = pool[Math.floor(Math.random() * pool.length)];
  return msg.replace('Andrea', userName).replace('you', userName.toLowerCase() === 'friend' ? 'you' : userName);
}

export function formatMissingTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
}

export const SUGGESTION_TEMPLATES = [
  'Move some tasks to another day',
  'Reduce task duration estimates',
  'Split tasks into smaller sessions',
  'Remove optional low-priority tasks',
  'Use weekend time for overflow',
  'Protect rest time — no deleting Time Off',
  'Reschedule low-priority tasks to next week',
];

export function getMessageForTrigger(trigger: ReactionTrigger, userName: string): string {
  const map: Partial<Record<ReactionTrigger, string>> = {
    'plan-fits': pickMessage('plan-fits', userName),
    'plan-does-not-fit': pickMessage('plan-does-not-fit', userName),
    overbooked: pickMessage('overbooked', userName),
    'week-rebalance': pickMessage('rebalance', userName),
    'task-complete': pickMessage('taskComplete', userName),
    'day-complete': pickMessage('taskComplete', userName),
    'reminder-start': pickMessage('reminder', userName),
    'too-many-tasks': 'You\'re trying to fit an entire month into one day. Bold. Terrible, but bold.',
    'rest-removed': 'No. I\'m not letting you delete rest like it\'s optional.',
    'late-night-work': 'Are we really working at 11 PM? Let\'s rethink this life choice.',
  };
  return map[trigger] ?? pickMessage('plan-fits', userName);
}
