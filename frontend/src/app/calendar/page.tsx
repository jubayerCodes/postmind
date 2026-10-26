'use client';

import * as React from 'react';
import { AppShell } from '@/components/navigation/app-shell';
import { CalendarView } from '@/components/calendar/calendar-view';

export default function CalendarPage() {
  return (
    <AppShell activeTab="calendar">
      <CalendarView />
    </AppShell>
  );
}
