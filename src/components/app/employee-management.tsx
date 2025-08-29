'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, PlusCircle, Trash2, Loader2, History, XCircle } from 'lucide-react';
import type { Employee, TimeEntry, Location } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateDuration, formatDate, formatTime } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich.'),
});

interface EmployeeManagementProps {
  employees: Employee[];
  timeEntries: TimeEntry[];
  locations: Location[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
}

export function EmployeeManagement({ employees, timeEntries, locations, onAddEmployee, onDeleteEmployee }: EmployeeManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: z.infer<typeof employeeSchema>) {
    setIsSubmitting(true);
    onAddEmployee({ name: values.name });
    form.reset();
    setIsSubmitting(false);
  }

  const handleSelectEmployee = (employee: Employee) => {
    if (selectedEmployee?.id === employee.id) {
      setSelectedEmployee(null);
    } else {
      setSelectedEmployee(employee);
    }
  };

  const employeeWorkHistory = selectedEmployee
    ? timeEntries
        .filter((entry) => entry.employeeId === selectedEmployee.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    : [];

  const getLocationName = (locationId: string) => locations.find((l) => l.id === locationId)?.name || 'Unbekannt';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Mitarbeiter verwalten
        </CardTitle>
        <CardDescription>Fügen Sie neue Mitarbeiter hinzu, entfernen Sie sie oder sehen Sie ihre Arbeitszeiten ein.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2 mb-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Mitarbeitername</FormLabel>
                  <FormControl>
                    <Input placeholder="Max Mustermann" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            </Button>
          </form>
        </Form>
        <ScrollArea className="max-h-60 mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow 
                    key={employee.id} 
                    onClick={() => handleSelectEmployee(employee)}
                    className={`cursor-pointer ${selectedEmployee?.id === employee.id ? 'bg-secondary' : ''}`}
                  >
                    <TableCell>{employee.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDeleteEmployee(employee.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Keine Mitarbeiter angelegt.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        {selectedEmployee && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className='flex items-center gap-2'>
                  <History className="h-6 w-6" />
                  Arbeitshistorie für {selectedEmployee.name}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeeWorkHistory.length > 0 ? (
                <ScrollArea className="h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Ort</TableHead>
                      <TableHead>Dauer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeWorkHistory.map(entry => (
                       <TableRow key={entry.id}>
                         <TableCell>{formatDate(entry.startTime)}</TableCell>
                         <TableCell>{getLocationName(entry.locationId)}</TableCell>
                         <TableCell>{calculateDuration(entry.startTime, entry.endTime)}</TableCell>
                       </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </ScrollArea>
              ) : (
                <p className='text-sm text-muted-foreground text-center py-4'>Keine Arbeitshistorie für diesen Mitarbeiter vorhanden.</p>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
