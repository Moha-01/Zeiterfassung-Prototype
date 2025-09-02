'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Header } from '@/components/app/header';
import { TimeLogList } from '@/components/app/time-log-list';
import { EmployeeManagement } from '@/components/app/employee-management';
import { LocationManagement } from '@/components/app/location-management';
import { BottomNavbar } from '@/components/app/bottom-navbar';
import type { TimeEntry, Employee, Location } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/hooks/use-translation';
import { subMonths, eachDayOfInterval, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';


export type View = 'time' | 'employees' | 'locations';

export default function Home() {
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('timeEntries', []);
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [locations, setLocations] = useLocalStorage<Location[]>('locations', []);
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<View>('time');
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
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }
    setLocations((prev) => prev.filter((location) => location.id !== id));
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
    ];
    setEmployees(demoEmployees);
  
    // Create locations
    const demoLocations: Location[] = [
      { id: 'loc1', name: 'مكتب بغداد' },
      { id: 'loc2', name: 'موقع بناء الكرادة' },
      { id: 'loc3', name: 'ورشة المنصور' },
    ];
    setLocations(demoLocations);
  
    // Create time entries for the last two months
    const now = new Date();
    const twoMonthsAgo = subMonths(now, 2);
    const dateRange = eachDayOfInterval({ start: twoMonthsAgo, end: now });
  
    const demoTimeEntries: TimeEntry[] = [];
  
    dateRange.forEach(day => {
      // Create entries for ~70% of the days
      if (Math.random() > 0.3) {
        // Create 1-2 entries per day
        const numEntries = Math.random() > 0.7 ? 2 : 1;
        for (let i = 0; i < numEntries; i++) {
          const employee = demoEmployees[Math.floor(Math.random() * demoEmployees.length)];
          const location = demoLocations[Math.floor(Math.random() * demoLocations.length)];
  
          // Random start time between 8 AM and 10 AM
          const startHour = 8 + Math.floor(Math.random() * 3);
          const startMinute = Math.floor(Math.random() * 60);
          let startTime = setSeconds(setMinutes(setHours(day, startHour), startMinute), 0);
          startTime = setMilliseconds(startTime, 0);
          
          // Random duration between 6 and 9 hours
          const durationHours = 6 + Math.floor(Math.random() * 4);
          const durationMinutes = Math.floor(Math.random() * 60);
          let endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000 + durationMinutes * 60 * 1000);
          
          // isPaid status and amount
          const isPaid = Math.random() > 0.4; // ~60% are paid
          const amount = isPaid ? 25000 + Math.floor(Math.random() * 15) * 1000 : undefined;
  
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
      title: 'Demo Data Generated',
      description: 'The app has been populated with sample data.',
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 pb-24 md:pb-8">
        <Header onGenerateDemoData={generateDemoData} />
        <main className="space-y-8">
            <div className="hidden md:block">
              <EmployeeManagement 
                employees={employees} 
                onAddEmployee={addEmployee} 
                onDeleteEmployee={deleteEmployee}
                timeEntries={timeEntries}
                locations={locations}
                onUpdateEntry={updateTimeEntry}
                onDeleteEntry={deleteTimeEntry}
                onDeleteAllEntries={deleteTimeEntriesForEmployee}
              />
            </div>
            <div className="hidden md:block">
              <LocationManagement 
                locations={locations} 
                onAddLocation={addLocation} 
                onDeleteLocation={deleteLocation}
                timeEntries={timeEntries} 
              />
            </div>
             <div className="hidden md:block">
              <TimeLogList
                entries={timeEntries}
                employees={employees}
                locations={locations}
                onAddEntry={addTimeEntry}
                onUpdateEntry={updateTimeEntry}
                onDeleteEntry={deleteTimeEntry}
              />
            </div>

            <div className="md:hidden">
              {activeView === 'employees' && (
                <EmployeeManagement 
                  employees={employees} 
                  onAddEmployee={addEmployee} 
                  onDeleteEmployee={deleteEmployee}
                  timeEntries={timeEntries}
                  locations={locations}
                  onUpdateEntry={updateTimeEntry}
                  onDeleteEntry={deleteTimeEntry}
                  onDeleteAllEntries={deleteTimeEntriesForEmployee}
                />
              )}
              {activeView === 'locations' && (
                <LocationManagement 
                  locations={locations} 
                  onAddLocation={addLocation} 
                  onDeleteLocation={deleteLocation}
                  timeEntries={timeEntries} 
                />
              )}
              {activeView === 'time' && (
                <TimeLogList
                  entries={timeEntries}
                  employees={employees}
                  locations={locations}
                  onAddEntry={addTimeEntry}
                  onUpdateEntry={updateTimeEntry}
                  onDeleteEntry={deleteTimeEntry}
                />
              )}
            </div>
        </main>
      </div>
      <BottomNavbar activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
