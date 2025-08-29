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


export type View = 'time' | 'employees' | 'locations';

export default function Home() {
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('timeEntries', []);
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [locations, setLocations] = useLocalStorage<Location[]>('locations', []);
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<View>('time');
  const { t } = useTranslation();


  const addTimeEntry = (entry: Omit<TimeEntry, 'id' | 'paid'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID(), paid: false };
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 pb-24 md:pb-8">
        <Header />
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
