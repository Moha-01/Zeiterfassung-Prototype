
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import type { TimeEntry, Employee, Location } from '@/types';
import { subMonths, eachDayOfInterval, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

interface AppContextType {
  timeEntries: TimeEntry[];
  employees: Employee[];
  locations: Location[];
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'paid'>) => void;
  updateTimeEntry: (updatedEntry: TimeEntry) => void;
  deleteTimeEntry: (id: string) => void;
  deleteTimeEntriesForEmployee: (employeeId: string) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  deleteEmployee: (id: string) => void;
  addLocation: (location: Omit<Location, 'id'>) => void;
  deleteLocation: (id: string) => void;
  getEmployeeName: (id: string) => string;
  getLocationName: (id: string) => string;
  generateDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('timeEntries', []);
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [locations, setLocations] = useLocalStorage<Location[]>('locations', []);
  const { toast } = useToast();
  const { t } = useTranslation();

  const addTimeEntry = (entry: Omit<TimeEntry, 'id' | 'paid'>) => {
    const paid = entry.amount !== undefined && entry.amount > 0;
    const newEntry = { ...entry, id: crypto.randomUUID(), paid };
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
  
  const deleteTimeEntriesForEmployee = (employeeId: string) => {
    setTimeEntries((prev) => prev.filter((entry) => entry.employeeId !== employeeId));
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = { ...employee, id: crypto.randomUUID() };
    setEmployees((prev) => [...prev, newEmployee]);
  };

  const deleteEmployee = (id: string) => {
    const hasEntries = timeEntries.some((entry) => entry.employeeId === id);
    if (hasEntries) {
      toast({
        title: t('deleteErrorTitle'),
        description: t('deleteEmployeeErrorDescription'),
        variant: 'destructive',
      });
      return;
    }
    setEmployees((prev) => prev.filter((employee) => employee.id !== id));
  };

  const addLocation = (location: Omit<Location, 'id'>) => {
    const newLocation = { ...location, id: crypto.randomUUID() };
    setLocations((prev) => [...prev, newLocation]);
  };

  const deleteLocation = (id: string) => {
    const hasEntries = timeEntries.some((entry) => entry.locationId === id);
    if (hasEntries) {
      toast({
        title: t('deleteErrorTitle'),
        description: t('deleteLocationErrorDescription'),
        variant: 'destructive',
      });
      return;
    }
    setLocations((prev) => prev.filter((location) => location.id !== id));
  };

  const getEmployeeName = (id: string) => {
    return employees.find((e) => e.id === id)?.name || t('unknown');
  };

  const getLocationName = (id: string) => {
    return locations.find((l) => l.id === id)?.name || t('unknown');
  };

  const generateDemoData = () => {
    // Reset all data
    setTimeEntries([]);
    setEmployees([]);
    setLocations([]);
  
    // Create employees
    const demoEmployees: Employee[] = [
      { id: 'emp1', name: 'علي حسن' },
      { id: 'emp2', name: 'فاطمة محمد' },
      { id: 'emp3', name: 'أحمد عبدالله' },
      { id: 'emp4', name: 'John Doe' },
      { id: 'emp5', name: 'Jane Smith' },
    ];
    setEmployees(demoEmployees);
  
    // Create locations
    const demoLocations: Location[] = [
      { id: 'loc1', name: 'مكتب بغداد' },
      { id: 'loc2', name: 'موقع بناء الكرادة' },
      { id: 'loc3', name: 'ورشة المنصور' },
      { id: 'loc4', name: 'Main Office' },
      { id: 'loc5', name: 'Downtown Site' },
    ];
    setLocations(demoLocations);
  
    // Create time entries for the last two months
    const now = new Date();
    const twoMonthsAgo = subMonths(now, 2);
    const dateRange = eachDayOfInterval({ start: twoMonthsAgo, end: now });
  
    const demoTimeEntries: TimeEntry[] = [];
  
    dateRange.forEach(day => {
      // Create entries for ~80% of the days
      if (Math.random() > 0.2) {
        // Create 1-3 entries per day
        const numEntries = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numEntries; i++) {
          const employee = demoEmployees[Math.floor(Math.random() * demoEmployees.length)];
          const location = demoLocations[Math.floor(Math.random() * demoLocations.length)];
  
          // Random start time between 8 AM and 10 AM
          const startHour = 8 + Math.floor(Math.random() * 3);
          const startMinute = Math.floor(Math.random() * 60);
          let startTime = setSeconds(setMinutes(setHours(day, startHour), startMinute), 0);
          startTime = setMilliseconds(startTime, 0);
          
          // Random duration between 4 and 9 hours
          const durationHours = 4 + Math.floor(Math.random() * 6);
          const durationMinutes = Math.floor(Math.random() * 60);
          let endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000 + durationMinutes * 60 * 1000);
          
          // isPaid status and amount
          const isPaid = Math.random() > 0.4; // ~60% are paid
          const amount = isPaid ? 25000 + Math.floor(Math.random() * 25) * 1000 : undefined;
  
          demoTimeEntries.push({
            id: crypto.randomUUID(),
            employeeId: employee.id,
            locationId: location.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            paid: isPaid,
            amount: amount,
          });
        }
      }
    });
  
    setTimeEntries(demoTimeEntries);

    toast({
      title: t('demoDataGenerated'),
      description: t('demoDataGeneratedDescription'),
    });
  };

  const value: AppContextType = {
    timeEntries,
    employees,
    locations,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    deleteTimeEntriesForEmployee,
    addEmployee,
    deleteEmployee,
    addLocation,
    deleteLocation,
    getEmployeeName,
    getLocationName,
    generateDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
