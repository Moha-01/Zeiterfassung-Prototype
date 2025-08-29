'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Header } from '@/components/app/header';
import { TimeTracker } from '@/components/app/time-tracker';
import { WorkloadAssistant } from '@/components/app/workload-assistant';
import { TimeLogList } from '@/components/app/time-log-list';
import type { TimeEntry } from '@/types';

export default function Home() {
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('timeEntries', []);

  const addTimeEntry = (entry: Omit<TimeEntry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID() };
    setTimeEntries((prev) => [newEntry, ...prev]);
  };

  const updateTimeEntry = (updatedEntry: TimeEntry) => {
    setTimeEntries((prev) =>
      prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
    );
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header />
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-8">
            <TimeTracker onAddTimeEntry={addTimeEntry} />
            <WorkloadAssistant entries={timeEntries} />
          </div>
          <div className="md:col-span-2">
            <TimeLogList
              entries={timeEntries}
              onAddEntry={addTimeEntry}
              onUpdateEntry={updateTimeEntry}
              onDeleteEntry={deleteTimeEntry}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
