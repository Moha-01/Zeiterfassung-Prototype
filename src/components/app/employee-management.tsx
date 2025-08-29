'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, PlusCircle, Trash2, Loader2, History } from 'lucide-react';
import type { Employee, TimeEntry, Location } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateDuration, formatDate } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

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

  const getLocationName = (locationId: string) => locations.find((l) => l.id === locationId)?.name || 'Unbekannt';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Mitarbeiter verwalten
        </CardTitle>
        <CardDescription>Fügen Sie neue Mitarbeiter hinzu oder sehen Sie ihre Arbeitszeiten ein.</CardDescription>
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
        <div className="space-y-2">
          {employees.length > 0 ? (
            employees.map((employee) => {
              const employeeWorkHistory = timeEntries
                .filter((entry) => entry.employeeId === employee.id)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
              
              const hasEntries = employeeWorkHistory.length > 0;

              return (
                <Collapsible key={employee.id} onOpenChange={(isOpen) => setSelectedEmployeeId(isOpen ? employee.id : null)} open={selectedEmployeeId === employee.id}>
                  <div className={`flex items-center justify-between rounded-md border p-2 ${selectedEmployeeId === employee.id ? 'bg-secondary' : ''}`}>
                    <CollapsibleTrigger asChild>
                      <div className="flex-grow cursor-pointer px-2">
                        <p className="font-medium">{employee.name}</p>
                      </div>
                    </CollapsibleTrigger>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); onDeleteEmployee(employee.id); }}
                      disabled={hasEntries}
                      aria-label={hasEntries ? "Mitarbeiter hat noch Zeiteinträge" : "Mitarbeiter löschen"}
                    >
                      <Trash2 className={`h-4 w-4 ${hasEntries ? 'text-muted-foreground' : 'text-destructive'}`} />
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <div className="p-4 mt-2 border rounded-md">
                      <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Arbeitshistorie
                      </h4>
                      {hasEntries ? (
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          ) : (
            <div className="text-center text-muted-foreground border rounded-md p-4">
              Keine Mitarbeiter angelegt.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
