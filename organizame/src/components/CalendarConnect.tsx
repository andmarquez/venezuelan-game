import { motion } from 'framer-motion';
import { useApp } from '../store/appStore';

export function CalendarConnect() {
  const { calendarConnected, connectCalendar, disconnectCalendar } = useApp();

  if (calendarConnected) {
    return (
      <div className="rounded-2xl bg-lime/20 border border-lime/40 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="font-bold text-navy">Google Calendar connected</p>
            <p className="text-xs text-navy/60 mt-0.5">Sample events loaded. Real OAuth coming soon.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={disconnectCalendar}
          className="mt-3 text-xs font-semibold text-navy/50 hover:text-red-500"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={connectCalendar}
      className="w-full rounded-2xl bg-white border-2 border-dashed border-navy/20 p-5 text-left hover:border-work hover:bg-work/5 transition"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">📅</span>
        <div>
          <p className="font-display font-bold text-navy">Connect Google Calendar</p>
          <p className="text-sm text-navy/60 mt-0.5">
            Let me see your real chaos. Mock flow for MVP.
          </p>
        </div>
      </div>
    </motion.button>
  );
}
