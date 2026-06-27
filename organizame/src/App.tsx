import { AnimatePresence } from 'framer-motion';
import { AppShell } from './components/AppShell';
import { useApp } from './store/appStore';
import { TodayScreen } from './screens/TodayScreen';
import { OrganizameScreen } from './screens/OrganizameScreen';
import { WeekScreen } from './screens/WeekScreen';
import { InboxScreen } from './screens/InboxScreen';
import { ModesScreen } from './screens/ModesScreen';
import { SettingsScreen } from './screens/SettingsScreen';

function ScreenRouter() {
  const { activeTab } = useApp();

  return (
    <AnimatePresence mode="wait">
      <div key={activeTab}>
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'organizame' && <OrganizameScreen />}
        {activeTab === 'week' && <WeekScreen />}
        {activeTab === 'inbox' && <InboxScreen />}
        {activeTab === 'modes' && <ModesScreen />}
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppShell>
      <ScreenRouter />
      <SettingsScreen />
    </AppShell>
  );
}
