'use client';

import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TimeEntry, Employee, Location } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

interface TimeTrackerProps {
  onAddTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  employees: Employee[];
  locations: Location[];
}

export function TimeTracker({ onAddTimeEntry, employees, locations }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useLocalStorage<boolean>('isTracking', false);
  const [startTime, setStartTime] = useLocalStorage<string | null>('startTime', null);
  const [employeeId, setEmployeeId] = useLocalStorage<string | undefined>('trackingEmployeeId', undefined);
  const [locationId, setLocationId] = useLocalStorage<string | undefined>('trackingLocationId', undefined);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const difference = now - start;

        const hours = String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        const minutes = String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, '0');
        const seconds = String(Math.floor((difference / 1000) % 60)).padStart(2, '0');

        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    } else {
        setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const handleStart = () => {
    if (!employeeId) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Mitarbeiter aus.',
      });
      return;
    }
    if (!locationId) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Arbeitsort aus.',
      });
      return;
    }
    setIsTracking(true);
    setStartTime(new Date().toISOString());
  };

  const handleStop = () => {
    if (startTime && employeeId && locationId) {
      onAddTimeEntry({
        employeeId,
        locationId,
        startTime,
        endTime: new Date().toISOString(),
      });
    }
    setIsTracking(false);
    setStartTime(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live-Zeiterfassung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mitarbeiter</Label>
          <Select value={employeeId} onValueChange={setEmployeeId} disabled={isTracking}>
            <SelectTrigger>
              <SelectValue placeholder="Mitarbeiter auswählen" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Arbeitsort</Label>
          <Select value={locationId} onValueChange={setLocationId} disabled={isTracking}>
            <SelectTrigger>
              <SelectValue placeholder="Arbeitsort auswählen" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <span className="text-2xl font-mono text-secondary-foreground">{elapsedTime}</span>
          {isTracking ? (
            <Button onClick={handleStop} variant="destructive" className="w-24">
              <Square className="mr-2 h-4 w-4" /> Stopp
            </Button>
          ) : (
            <Button onClick={handleStart} className="w-24">
              <Play className="mr-2 h-4 w-4" /> Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
