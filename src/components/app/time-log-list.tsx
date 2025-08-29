'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse, parseISO, startOfDay, isSameDay } from 'date-fns';
import { PlusCircle, Edit, Trash2, Loader2, CalendarDays, Clock, MapPin, Calendar as CalendarIcon, ChevronDown, User, Info, DollarSign } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';


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

interface TimeLogListProps {
  entries: TimeEntry[];
  employees: Employee[];
  locations: Location[];
  onAddEntry: (entry: Omit<TimeEntry, 'id' | 'paid'>) => void;
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
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);


  const form = useForm<z.infer<typeof timeEntrySchema>>({
    resolver: zodResolver(timeEntrySchema),
  });

  const getEmployeeName = (employeeId: string) => employees.find(e => e.id === employeeId)?.name || 'Unbekannt';
  const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'Unbekannt';

  const openDialogForEdit = (entry: TimeEntry) => {
    setIsDetailDialogOpen(false);
    setEditingEntry(entry);
    setSelectedDate(startOfDay(parseISO(entry.startTime)));
    form.reset({
      employeeId: entry.employeeId,
      locationId: entry.locationId,
      startTime: format(parseISO(entry.startTime), "HH:mm"),
      endTime: format(parseISO(entry.endTime), "HH:mm"),
    });
    setIsFormDialogOpen(true);
  };
  
  const openDialogForAdd = () => {
    setEditingEntry(null);
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endTime = now;

    form.reset({
      employeeId: '',
      locationId: '',
      startTime: format(startTime, "HH:mm"),
      endTime: format(endTime, "HH:mm"),
    });
    setIsFormDialogOpen(true);
  };
  
  const openDialogForDetails = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsDetailDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof timeEntrySchema>) => {
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
    } else {
      onAddEntry(entryData);
    }
    setIsFormDialogOpen(false);
  };
  
  const dayEntries = entries
    .filter((entry) => isSameDay(parseISO(entry.startTime), selectedDate))
    .sort((a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime());

  const togglePaidStatus = (entry: TimeEntry, event: React.MouseEvent) => {
    event.stopPropagation();
    onUpdateEntry({ ...entry, paid: !entry.paid });
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Erfasste Stunden</CardTitle>
          <CardDescription>
            Eine Übersicht aller erfassten Arbeitszeiten.
          </CardDescription>
        </div>
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
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
                 <FormItem>
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                         <Popover>
                            <PopoverTrigger asChild>
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
                    </FormControl>
                    <FormMessage />
                </FormItem>

                <div className="flex gap-4">
                    <FormField
                    control={form.control}
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
                    control={form.control}
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
                      variant={"secondary"}
                      className={cn(
                        "w-full justify-between text-left font-semibold",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? formatDate(selectedDate.toISOString()) : <span>Datum auswählen</span>}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
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
                        <div className="md:hidden space-y-2">
                          {dayEntries.map((entry) => (
                           <div key={entry.id} className="border rounded-lg p-3 space-y-1.5 cursor-pointer hover:bg-muted/50" onClick={() => openDialogForDetails(entry)}>
                              <div className="flex justify-between items-center">
                                <p className="font-medium truncate">
                                  {getEmployeeName(entry.employeeId)}
                                  <span className="text-muted-foreground font-normal"> @ {getLocationName(entry.locationId)}</span>
                                </p>
                                <button onClick={(e) => togglePaidStatus(entry, e)} className="p-1 -m-1 border rounded-md">
                                  {entry.paid ? <DollarSign className="h-5 w-5 text-green-500" /> : <DollarSign className="h-5 w-5 text-destructive" />}
                                </button>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
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
                              <TableHead>Bezahlt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dayEntries.map((entry) => (
                              <TableRow key={entry.id} onClick={() => openDialogForDetails(entry)} className="cursor-pointer">
                                <TableCell className="font-medium">{getEmployeeName(entry.employeeId)}</TableCell>
                                <TableCell>{getLocationName(entry.locationId)}</TableCell>
                                <TableCell>{formatTime(entry.startTime)}</TableCell>
                                <TableCell>{formatTime(entry.endTime)}</TableCell>
                                <TableCell>{calculateDuration(entry.startTime, entry.endTime)}</TableCell>
                                <TableCell>
                                   <button onClick={(e) => togglePaidStatus(entry, e)} className="p-1 border rounded-md">
                                    {entry.paid ? <DollarSign className="h-5 w-5 text-green-500" /> : <DollarSign className="h-5 w-5 text-destructive" />}
                                  </button>
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
        
        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
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
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mitarbeiter</p>
                      <p className="font-medium">{getEmployeeName(selectedEntry.employeeId)}</p>
                    </div>
                  </div>
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

      </CardContent>
    </Card>
  );
}
