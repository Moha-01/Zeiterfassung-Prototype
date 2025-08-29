'use client';

import { useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TimeEntry, Employee, Location } from '@/types';
import { calculateDuration } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';

interface TimeLogCalendarProps {
  entries: TimeEntry[];
  employees: Employee[];
  locations: Location[];
}

export function TimeLogCalendar({ entries, employees, locations }: TimeLogCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getEmployeeName = (employeeId: string) => employees.find(e => e.id === employeeId)?.name || 'Unbekannt';
  const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'Unbekannt';

  const daysWithEntries = entries.map(entry => parseISO(entry.startTime));

  const entriesForSelectedDay = selectedDate
    ? entries.filter(entry => isSameDay(parseISO(entry.startTime), selectedDate))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalenderübersicht</CardTitle>
        <CardDescription>Wählen Sie einen Tag, um die Einträge anzuzeigen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
          locale={de}
          modifiers={{
            withEntries: daysWithEntries,
          }}
          modifiersClassNames={{
            withEntries: 'bg-primary/20',
          }}
        />
        <div className="space-y-2">
          <h4 className="font-semibold">
            Einträge für {selectedDate ? format(selectedDate, 'dd. MMMM yyyy', { locale: de }) : '...'}
          </h4>
          {entriesForSelectedDay.length > 0 ? (
            <div className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
              {entriesForSelectedDay.map(entry => (
                <div key={entry.id} className="p-2 bg-secondary/50 rounded-md">
                  <p className="font-medium">{getEmployeeName(entry.employeeId)}</p>
                  <p className="text-muted-foreground">
                    {getLocationName(entry.locationId)} |{' '}
                    <span className="font-mono">{calculateDuration(entry.startTime, entry.endTime)}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keine Einträge für diesen Tag.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
