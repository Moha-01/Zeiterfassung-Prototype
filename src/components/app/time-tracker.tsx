'use client';

import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TimeEntry } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

interface TimeTrackerProps {
  onAddTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
}

export function TimeTracker({ onAddTimeEntry }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useLocalStorage<boolean>('isTracking', false);
  const [startTime, setStartTime] = useLocalStorage<string | null>('startTime', null);
  const [employeeName, setEmployeeName] = useLocalStorage<string>('trackingEmployeeName', '');
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
    if (!employeeName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bitte geben Sie einen Mitarbeiternamen ein.',
      });
      return;
    }
    setIsTracking(true);
    setStartTime(new Date().toISOString());
  };

  const handleStop = () => {
    if (startTime) {
      onAddTimeEntry({
        employeeName,
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
          <Label htmlFor="employeeNameTracker">Mitarbeitername</Label>
          <Input
            id="employeeNameTracker"
            placeholder="Max Mustermann"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            disabled={isTracking}
          />
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
