'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { PlusCircle, Edit, Trash2, Loader2, CalendarDays, Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import type { TimeEntry, Employee, Location } from '@/types';
import {
  calculateDuration,
  formatDate,
  formatTime,
  cn,
} from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


const timeEntrySchema = z.object({
  employeeId: z.string().min(1, 'Mitarbeiter ist erforderlich.'),
  locationId: z.string().min(1, 'Arbeitsort ist erforderlich.'),
  startTime: z.string().min(1, 'Startzeit ist erforderlich.'),
  endTime: z.string().min(1, 'Endzeit ist erforderlich.'),
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: 'Endzeit muss nach der Startzeit liegen.',
  path: ['endTime'],
});

interface TimeLogListProps {
  entries: TimeEntry[];
  employees: Employee[];
  locations: Location[];
  onAddEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  onUpdateEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export function TimeLogList({
  entries,
  employees,
  locations,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: TimeLogListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);


  const form = useForm<z.infer<typeof timeEntrySchema>>({
    resolver: zodResolver(timeEntrySchema),
  });

  const getEmployeeName = (employeeId: string) => employees.find(e => e.id === employeeId)?.name || 'Unbekannt';
  const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'Unbekannt';

  const openDialogForEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    form.reset({
      employeeId: entry.employeeId,
      locationId: entry.locationId,
      startTime: format(parseISO(entry.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(parseISO(entry.endTime), "yyyy-MM-dd'T'HH:mm"),
    });
    setIsDialogOpen(true);
  };

  const openDialogForAdd = () => {
    setEditingEntry(null);
    const now = new Date();
    const startTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), now.getHours(), now.getMinutes());
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    form.reset({
      employeeId: '',
      locationId: '',
      startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(endTime, "yyyy-MM-dd'T'HH:mm"),
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof timeEntrySchema>) => {
    const entryData = {
      employeeId: values.employeeId,
      locationId: values.locationId,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    };

    if (editingEntry) {
      onUpdateEntry({ ...entryData, id: editingEntry.id });
    } else {
      onAddEntry(entryData);
    }
    setIsDialogOpen(false);
  };
  
  const dayEntries = entries
    .filter((entry) => isSameDay(parseISO(entry.startTime), selectedDate))
    .sort((a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime());


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Erfasste Stunden</CardTitle>
          <CardDescription>
            Eine Übersicht aller erfassten Arbeitszeiten.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialogForAdd}>
              <PlusCircle className="mr-2 h-4 w-4" /> Eintrag hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Eintrag bearbeiten' : 'Neuen Eintrag hinzufügen'}</DialogTitle>
              <DialogDescription>
                {editingEntry ? 'Ändern Sie die Details und speichern Sie.' : 'Fügen Sie einen neuen Zeiteintrag hinzu.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mitarbeiter</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  control={form.control}
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
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startzeit</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endzeit</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Abbrechen</Button>
                  </DialogClose>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Speichern
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
                 <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? formatDate(selectedDate.toISOString()) : <span>Datum auswählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date || startOfDay(new Date()));
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                 {dayEntries.length > 0 ? (
                    <>
                        <div className="md:hidden space-y-4">
                          {dayEntries.map((entry) => (
                            <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{getEmployeeName(entry.employeeId)}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{getLocationName(entry.locationId)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(entry)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
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
                                        <AlertDialogAction onClick={() => onDeleteEntry(entry.id)}>Löschen</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
                                </div>
                                <p className="font-medium">{calculateDuration(entry.startTime, entry.endTime)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Table className="hidden md:table">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Mitarbeiter</TableHead>
                              <TableHead>Arbeitsort</TableHead>
                              <TableHead>Start</TableHead>
                              <TableHead>Ende</TableHead>
                              <TableHead>Dauer</TableHead>
                              <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dayEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="font-medium">{getEmployeeName(entry.employeeId)}</TableCell>
                                <TableCell>{getLocationName(entry.locationId)}</TableCell>
                                <TableCell>{formatTime(entry.startTime)}</TableCell>
                                <TableCell>{formatTime(entry.endTime)}</TableCell>
                                <TableCell>{calculateDuration(entry.startTime, entry.endTime)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(entry)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
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
                                        <AlertDialogAction onClick={() => onDeleteEntry(entry.id)}>Löschen</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </>
                 ) : (
                    <div className="text-center py-10 text-muted-foreground border rounded-md h-full flex flex-col justify-center items-center">
                        <p>Keine Einträge für diesen Tag.</p>
                    </div>
                 )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
