import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { AndsiosaAssistant } from './AndsiosaAssistant';
import { ReactionPopup } from './ReactionPopup';
import { AssistantMessagePopup } from './AssistantMessagePopup';
import { useApp } from '../store/appStore';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="min-h-dvh bg-bg">
      <main className="mx-auto max-w-lg px-[22px] pb-[100px] safe-top">{children}</main>
      <AndsiosaAssistant />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <ReactionPopup />
      <AssistantMessagePopup />
    </div>
  );
}
