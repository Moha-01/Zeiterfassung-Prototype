'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Header } from '@/components/app/header';
import { TimeLogList } from '@/components/app/time-log-list';
import { EmployeeManagement } from '@/components/app/employee-management';
import { LocationManagement } from '@/components/app/location-management';
import type { TimeEntry, Employee, Location } from '@/types';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('timeEntries', []);
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [locations, setLocations] = useLocalStorage<Location[]>('locations', []);
  const { toast } = useToast();

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
  
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = { ...employee, id: crypto.randomUUID() };
    setEmployees((prev) => [...prev, newEmployee]);
  };

  const deleteEmployee = (id: string) => {
    const hasEntries = timeEntries.some((entry) => entry.employeeId === id);
    if (hasEntries) {
      toast({
        title: "Fehler beim Löschen",
        description: "Mitarbeiter kann nicht gelöscht werden, da noch Zeiteinträge vorhanden sind.",
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
        title: "Fehler beim Löschen",
        description: "Arbeitsort kann nicht gelöscht werden, da noch Zeiteinträge vorhanden sind.",
        variant: "destructive",
      });
      return;
    }
    setLocations((prev) => prev.filter((location) => location.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header />
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <EmployeeManagement 
              employees={employees} 
              onAddEmployee={addEmployee} 
              onDeleteEmployee={deleteEmployee}
              timeEntries={timeEntries}
              locations={locations}
            />
            <LocationManagement 
              locations={locations} 
              onAddLocation={addLocation} 
              onDeleteLocation={deleteLocation}
              timeEntries={timeEntries} 
            />
          </div>
          <div className="lg:col-span-2">
            <TimeLogList
              entries={timeEntries}
              employees={employees}
              locations={locations}
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
