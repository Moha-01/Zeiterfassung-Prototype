'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { PlusCircle, Edit, Trash2, Loader2, CalendarDays } from 'lucide-react';
import type { TimeEntry, Employee, Location } from '@/types';
import {
  calculateDuration,
  calculateDurationInHours,
  formatDate,
  formatTime,
} from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
    form.reset({
      employeeId: '',
      locationId: '',
      startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
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

  const sortedEntries = [...entries].sort(
    (a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime()
  );

  const groupedEntries = sortedEntries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const day = startOfDay(parseISO(entry.startTime)).toISOString();
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(entry);
    return acc;
  }, {});

  const weeklyTotalHours = entries
    .filter(entry => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return parseISO(entry.startTime) > sevenDaysAgo;
    })
    .reduce((acc, entry) => acc + calculateDurationInHours(entry.startTime, entry.endTime), 0);

  return (
    <Card className="col-span-1 md:col-span-2">
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
      <CardContent>
        {Object.keys(groupedEntries).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([day, dayEntries]) => {
              const dailyTotal = dayEntries.reduce(
                (acc, entry) => acc + calculateDurationInHours(entry.startTime, entry.endTime),
                0
              );
              return (
                <div key={day}>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    {formatDate(day)} - <span className="text-primary">{dailyTotal.toFixed(2)} Stunden</span>
                  </h3>
                  <Table>
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>Noch keine Zeiteinträge vorhanden.</p>
            <p>Fügen Sie manuell einen neuen Eintrag hinzu.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-lg font-bold text-primary">
            Wöchentliche Gesamtzeit (letzte 7 Tage): {weeklyTotalHours.toFixed(2)} Stunden
        </div>
      </CardFooter>
    </Card>
  );
}
