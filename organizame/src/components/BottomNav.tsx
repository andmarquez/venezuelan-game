import type { TabId } from '../types';
import { ASSETS } from '../design/tokens';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: ASSETS.navToday },
  { id: 'organizame', label: 'Dump', icon: ASSETS.navDump },
  { id: 'week', label: 'Calendar', icon: ASSETS.navCalendar },
  { id: 'modes', label: 'Goals', icon: ASSETS.navGoals },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-nav-border bg-nav-bg safe-bottom">
      <div className="mx-auto flex max-w-lg items-start justify-between px-6 pt-[13px] pb-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div
                className={`flex h-8 w-[54px] items-center justify-center rounded-[14px] ${
                  active ? 'bg-nav-active-bg' : ''
                }`}
              >
                <img
                  src={tab.icon}
                  alt=""
                  className={`h-[22px] w-[22px] object-contain ${active ? '' : 'opacity-90'}`}
                />
              </div>
              <span
                className={`mt-1 text-[11px] tracking-[0.275px] ${
                  active ? 'font-bold text-navy' : 'font-medium text-ink-nav'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
