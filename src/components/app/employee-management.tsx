'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse, parseISO, startOfDay } from 'date-fns';
import { Users, PlusCircle, Trash2, Loader2, History, Edit, Calendar as CalendarIcon, MapPin, CalendarDays, Clock, Info, Check } from 'lucide-react';
import type { Employee, TimeEntry, Location } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateDuration, formatDate, cn, formatTime } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich.'),
});

const timeEntrySchema = z.object({
  employeeId: z.string().min(1, 'Mitarbeiter ist erforderlich.'),
  locationId: z.string().min(1, 'Arbeitsort ist erforderlich.'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Ungültiges Zeitformat (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Ungültiges Zeitformat (HH:mm)'),
}).refine(data => {
  const start = parse(data.startTime, 'HH:mm', new Date());
  const end = parse(data.endTime, 'HH:mm', new Date());
  return start < end;
}, {
  message: 'Endzeit muss nach der Startzeit liegen.',
  path: ['endTime'],
});


interface EmployeeManagementProps {
  employees: Employee[];
  timeEntries: TimeEntry[];
  locations: Location[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
  onUpdateEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const ENTRIES_PER_PAGE = 5;

export function EmployeeManagement({ employees, timeEntries, locations, onAddEmployee, onDeleteEmployee, onUpdateEntry, onDeleteEntry }: EmployeeManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormDialogOpen, setIsEditFormDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);


  const timeEntryForm = useForm<z.infer<typeof timeEntrySchema>>({
    resolver: zodResolver(timeEntrySchema),
  });

  const employeeForm = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '' },
  });

  async function onEmployeeSubmit(values: z.infer<typeof employeeSchema>) {
    setIsSubmitting(true);
    onAddEmployee({ name: values.name });
    employeeForm.reset();
    setIsSubmitting(false);
    setIsAddFormOpen(false);
  }

  function onTimeEntrySubmit(values: z.infer<typeof timeEntrySchema>) {
    const createDate = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date(selectedDate);
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date.toISOString();
    }
    
    const entryData = {
      employeeId: values.employeeId,
      locationId: values.locationId,
      startTime: createDate(values.startTime),
      endTime: createDate(values.endTime),
    };

    if (editingEntry) {
      onUpdateEntry({ ...entryData, id: editingEntry.id, paid: editingEntry.paid });
    }
    setIsEditFormDialogOpen(false);
  }
  
  const openDialogForEdit = (entry: TimeEntry) => {
    setIsDetailDialogOpen(false);
    setEditingEntry(entry);
    setSelectedDate(startOfDay(parseISO(entry.startTime)));
    timeEntryForm.reset({
      employeeId: entry.employeeId,
      locationId: entry.locationId,
      startTime: format(parseISO(entry.startTime), "HH:mm"),
      endTime: format(parseISO(entry.endTime), "HH:mm"),
    });
    setIsEditFormDialogOpen(true);
  };
  
  const openDialogForDetails = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsDetailDialogOpen(true);
  };


  const getLocationName = (locationId: string) => locations.find((l) => l.id === locationId)?.name || 'Unbekannt';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Mitarbeiter verwalten
          </CardTitle>
          <CardDescription>Fügen Sie neue Mitarbeiter hinzu oder sehen Sie ihre Arbeitszeiten ein.</CardDescription>
        </div>
        <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
          <DialogTrigger asChild>
             <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Mitarbeiter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Mitarbeiter hinzufügen</DialogTitle>
            </DialogHeader>
             <Form {...employeeForm}>
              <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-4">
                <FormField
                  control={employeeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mitarbeitername</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Max Mustermann" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Abbrechen</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Speichern
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {employees.length > 0 ? (
            employees.map((employee) => {
              const employeeWorkHistory = timeEntries
                .filter((entry) => entry.employeeId === employee.id)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
              
              const hasEntries = employeeWorkHistory.length > 0;
              const totalPages = Math.ceil(employeeWorkHistory.length / ENTRIES_PER_PAGE);
              const paginatedEntries = employeeWorkHistory.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE);

              return (
                <Collapsible key={employee.id} onOpenChange={(isOpen) => {
                  if (selectedEmployeeId === employee.id && !isOpen) {
                     setSelectedEmployeeId(null);
                  } else if (isOpen) {
                    setSelectedEmployeeId(employee.id);
                  }
                  setCurrentPage(1);
                }} open={selectedEmployeeId === employee.id}>
                  <div className={`flex items-center justify-between rounded-md border p-2 ${selectedEmployeeId === employee.id ? 'bg-secondary' : ''}`}>
                    <CollapsibleTrigger asChild>
                      <div className="flex-grow cursor-pointer px-2">
                        <p className="font-medium">{employee.name}</p>
                      </div>
                    </CollapsibleTrigger>
                    
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Mitarbeiter löschen"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Diese Aktion kann nicht rückgängig gemacht werden. Der Mitarbeiter wird dauerhaft gelöscht.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteEmployee(employee.id)}>Löschen</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                  </div>

                  <CollapsibleContent>
                    <div className="p-4 mt-2 border rounded-md">
                      <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Arbeitshistorie
                      </h4>
                      {hasEntries ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Ort</TableHead>
                                <TableHead>Dauer</TableHead>
                                <TableHead>Bezahlt</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedEntries.map(entry => (
                                 <TableRow key={entry.id} onClick={() => openDialogForDetails(entry)} className="cursor-pointer">
                                   <TableCell>{formatDate(entry.startTime)}</TableCell>
                                   <TableCell>{getLocationName(entry.locationId)}</TableCell>
                                   <TableCell>{calculateDuration(entry.startTime, entry.endTime)}</TableCell>
                                   <TableCell>
                                     {entry.paid && <Check className="h-5 w-5 text-green-500" />}
                                   </TableCell>
                                 </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {totalPages > 1 && (
                            <div className="flex justify-end items-center gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                              >
                                Zurück
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Seite {currentPage} von {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                              >
                                Weiter
                              </Button>
                            </div>
                          )}
                        </>
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
       {/* Edit Entry Dialog */}
        <Dialog open={isEditFormDialogOpen} onOpenChange={setIsEditFormDialogOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Eintrag bearbeiten</DialogTitle>
                <DialogDescription>
                    Ändern Sie die Details und speichern Sie.
                </DialogDescription>
                </DialogHeader>
                <Form {...timeEntryForm}>
                <form onSubmit={timeEntryForm.handleSubmit(onTimeEntrySubmit)} className="space-y-4">
                    <FormField
                    control={timeEntryForm.control}
                    name="employeeId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mitarbeiter</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                               <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mitarbeiter auswählen" />
                                </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                               </SelectContent>
                            </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={timeEntryForm.control}
                    name="locationId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Arbeitsort</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Arbeitsort auswählen" />
                                </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                    {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                               </SelectContent>
                            </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormItem>
                        <FormLabel>Datum</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDate(selectedDate.toISOString())}
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(startOfDay(date))}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    <div className="flex gap-4">
                        <FormField
                        control={timeEntryForm.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormLabel>Startzeit</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={timeEntryForm.control}
                        name="endTime"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormLabel>Endzeit</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Abbrechen</Button>
                    </DialogClose>
                    <Button type="submit" disabled={timeEntryForm.formState.isSubmitting}>
                        {timeEntryForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Speichern
                    </Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={(isOpen) => {
            setIsDetailDialogOpen(isOpen)
            if (!isOpen) {
               const currentEmployee = selectedEmployeeId;
               setSelectedEmployeeId(null); // Force re-render
               setTimeout(() => setSelectedEmployeeId(currentEmployee), 0)
            }
        }}>
          <DialogContent>
             {selectedEntry && (
              <>
                <DialogHeader>
                  <DialogTitle>Eintrag Details</DialogTitle>
                   <DialogDescription>
                      Details für den ausgewählten Zeiteintrag.
                   </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Arbeitsort</p>
                      <p className="font-medium">{getLocationName(selectedEntry.locationId)}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-4">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Datum</p>
                      <p className="font-medium">{formatDate(selectedEntry.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Zeit</p>
                      <p className="font-medium">{formatTime(selectedEntry.startTime)} - {formatTime(selectedEntry.endTime)}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-4">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dauer</p>
                      <p className="font-medium">{calculateDuration(selectedEntry.startTime, selectedEntry.endTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox
                        id="paid"
                        checked={selectedEntry.paid}
                        onCheckedChange={(checked) => {
                            const newEntry = { ...selectedEntry, paid: !!checked };
                            onUpdateEntry(newEntry);
                            setSelectedEntry(newEntry);
                        }}
                    />
                    <label
                        htmlFor="paid"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Als bezahlt markieren
                    </label>
                 </div>
                </div>
                <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" /> Löschen
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Dieser Zeiteintrag wird dauerhaft gelöscht.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => {
                            onDeleteEntry(selectedEntry.id);
                            setIsDetailDialogOpen(false);
                          }}>Löschen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button type="button" variant="secondary" onClick={() => setIsDetailDialogOpen(false)} className="w-full">Schließen</Button>
                    <Button type="button" onClick={() => openDialogForEdit(selectedEntry)} className="w-full">
                        <Edit className="mr-2 h-4 w-4" /> Bearbeiten
                    </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
    </Card>
  );
}
