
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { Users, PlusCircle, Trash2, Loader2, History, Edit, Calendar as CalendarIcon, MapPin, CalendarDays, Clock, Info, DollarSign, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/app-context';
import { useTranslation } from '@/hooks/use-translation';
import { calculateDuration, cn, formatDate, formatTime } from '@/lib/utils';
import { generatePdfReport } from '@/lib/pdf-generator';
import type { TimeEntry, Employee } from '@/types';


const employeeSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('employeeNameRequired')),
});

const timeEntrySchema = (t: (key: string) => string) => z.object({
  employeeId: z.string().min(1, t('employeeIsRequired')),
  locationId: z.string().min(1, t('locationIsRequired')),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, t('invalidTimeFormat')),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, t('invalidTimeFormat')),
  amount: z.coerce.number().optional(),
}).refine(data => {
  const start = new Date(`1970-01-01T${data.startTime}:00`);
  const end = new Date(`1970-01-01T${data.endTime}:00`);
  return start < end;
}, {
  message: t('endTimeAfterStartTime'),
  path: ['endTime'],
});

const paymentSchema = (t: (key: string) => string) => z.object({
  amount: z.coerce.number().min(0, t('paymentAmountRequired')),
});

const ENTRIES_PER_PAGE = 5;

export function EmployeeManagement() {
  const { t, language, dir } = useTranslation();
  const { 
    employees, 
    locations, 
    timeEntries, 
    addEmployee, 
    deleteEmployee, 
    updateTimeEntry, 
    deleteTimeEntry,
    deleteTimeEntriesForEmployee, 
    getLocationName,
  } = useAppContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({});
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormDialogOpen, setIsEditFormDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const timeEntryForm = useForm<z.infer<ReturnType<typeof timeEntrySchema>>>({
    resolver: zodResolver(timeEntrySchema(t)),
  });
  
  const paymentForm = useForm<z.infer<ReturnType<typeof paymentSchema>>>({
    resolver: zodResolver(paymentSchema(t)),
  });

  const employeeForm = useForm<z.infer<ReturnType<typeof employeeSchema>>>({
    resolver: zodResolver(employeeSchema(t)),
    defaultValues: { name: '' },
  });

  async function onEmployeeSubmit(values: z.infer<ReturnType<typeof employeeSchema>>) {
    setIsSubmitting(true);
    addEmployee({ name: values.name });
    employeeForm.reset();
    setIsSubmitting(false);
    setIsAddFormOpen(false);
  }

  function onTimeEntrySubmit(values: z.infer<ReturnType<typeof timeEntrySchema>>) {
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
      amount: values.amount,
    };

    if (editingEntry) {
      updateTimeEntry({ ...entryData, id: editingEntry.id, paid: editingEntry.paid });
    }
    setIsEditFormDialogOpen(false);
  }

  function onPaymentSubmit(values: z.infer<ReturnType<typeof paymentSchema>>) {
    if (selectedEntry) {
      updateTimeEntry({ ...selectedEntry, paid: true, amount: values.amount });
      setSelectedEntry({ ...selectedEntry, paid: true, amount: values.amount });
    }
    setIsPaymentDialogOpen(false);
    paymentForm.reset();
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
      amount: entry.amount,
    });
    setIsEditFormDialogOpen(true);
  };
  
  const openDialogForDetails = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsDetailDialogOpen(true);
  };

  const handleGenerateReport = (employee: Employee) => {
    const employeeEntries = timeEntries
      .filter(entry => entry.employeeId === employee.id)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    generatePdfReport(employee, employeeEntries, {
      t,
      language,
      dir,
      getLocationName,
    });
  };
  
  const handlePaymentClick = (entry: TimeEntry, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!entry.paid) {
        setSelectedEntry(entry);
        paymentForm.reset({ amount: entry.amount || 0 });
        setIsPaymentDialogOpen(true);
    }
  };

  const handleMarkAsUnpaid = (entry: TimeEntry, event: React.MouseEvent) => {
    event.stopPropagation();
    updateTimeEntry({ ...entry, paid: false, amount: undefined });
  };


  const handlePageChange = (employeeId: string, newPage: number) => {
    setCurrentPage(prev => ({...prev, [employeeId]: newPage}));
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              {t('manageEmployees')}
            </CardTitle>
            <CardDescription>{t('manageEmployeesDescription')}</CardDescription>
          </div>
          <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('employee')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addNewEmployee')}</DialogTitle>
              </DialogHeader>
              <Form {...employeeForm}>
                <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-4">
                  <FormField
                    control={employeeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('employeeName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('employeeNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">{t('cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('save')}
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
                const employeeCurrentPage = currentPage[employee.id] || 1;
                const totalPages = Math.ceil(employeeWorkHistory.length / ENTRIES_PER_PAGE);
                const paginatedEntries = employeeWorkHistory.slice((employeeCurrentPage - 1) * ENTRIES_PER_PAGE, employeeCurrentPage * ENTRIES_PER_PAGE);

                return (
                  <Collapsible key={employee.id} onOpenChange={(isOpen) => {
                    if (selectedEmployeeId === employee.id && !isOpen) {
                      setSelectedEmployeeId(null);
                    } else if (isOpen) {
                      setSelectedEmployeeId(employee.id);
                      handlePageChange(employee.id, 1);
                    }
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
                                aria-label={t('deleteEmployee')}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('deleteEmployeeConfirmation')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteEmployee(employee.id)}>{t('delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                    </div>

                    <CollapsibleContent>
                      <div className="p-4 mt-2 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-md font-semibold flex items-center gap-2">
                            <History className="h-5 w-5" />
                            {t('workHistory')}
                          </h4>
                          {hasEntries && (
                             <div className="flex items-center gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('deleteHistory')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('deleteAllEntriesConfirmation')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteTimeEntriesForEmployee(employee.id)}>{t('deleteAll')}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                        {hasEntries ? (
                          <>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('date')}</TableHead>
                                  <TableHead>{t('location')}</TableHead>
                                  <TableHead>{t('duration')}</TableHead>
                                  <TableHead>{t('paid')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedEntries.map(entry => (
                                  <TableRow key={entry.id} onClick={() => openDialogForDetails(entry)} className="cursor-pointer">
                                    <TableCell>{formatDate(entry.startTime)}</TableCell>
                                    <TableCell>{getLocationName(entry.locationId)}</TableCell>
                                    <TableCell>{calculateDuration(entry.startTime, entry.endTime)}</TableCell>
                                    <TableCell>
                                    {entry.paid ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button onClick={(e) => e.stopPropagation()} className="p-1 border rounded-md">
                                                    <DollarSign className="h-5 w-5 text-green-500" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                                                    <AlertDialogDescription>{t('unmarkAsPaidConfirmation')}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => handleMarkAsUnpaid(entry, e)}>{t('unmarkAsPaid')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                      ) : (
                                        <button onClick={(e) => handlePaymentClick(entry, e)} className="p-1 border rounded-md">
                                            <DollarSign className="h-5 w-5 text-destructive" />
                                        </button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <div className="flex flex-col items-center mt-4 gap-4">
                                {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2">
                                    <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(employee.id, employeeCurrentPage - 1)}
                                    disabled={employeeCurrentPage === 1}
                                    >
                                    {t('previous')}
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                    {t('page')} {employeeCurrentPage} {t('of')} {totalPages}
                                    </span>
                                    <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(employee.id, employeeCurrentPage + 1)}
                                    disabled={employeeCurrentPage === totalPages}
                                    >
                                    {t('next')}
                                    </Button>
                                </div>
                                )}
                                {hasEntries && (
                                <Button onClick={() => handleGenerateReport(employee)} variant="secondary">
                                  <Printer className="mr-2 h-4 w-4" />
                                  {t('printReport')}
                                </Button>
                                )}
                            </div>
                          </>
                        ) : (
                          <p className='text-sm text-muted-foreground text-center py-4'>{t('noWorkHistory')}</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground border rounded-md p-4">
                {t('noEmployees')}
              </div>
            )}
          </div>
        </CardContent>
        {/* Edit Entry Dialog */}
          <Dialog open={isEditFormDialogOpen} onOpenChange={setIsEditFormDialogOpen}>
              <DialogContent>
                  <DialogHeader>
                  <DialogTitle>{t('editEntry')}</DialogTitle>
                  <DialogDescription>
                      {t('editEntryDescription')}
                  </DialogDescription>
                  </DialogHeader>
                  <Form {...timeEntryForm}>
                  <form onSubmit={timeEntryForm.handleSubmit(onTimeEntrySubmit)} className="space-y-4">
                      <FormField
                      control={timeEntryForm.control}
                      name="employeeId"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{t('employee')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder={t('selectEmployee')} />
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
                          <FormLabel>{t('location')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder={t('selectLocation')} />
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
                          <FormLabel>{t('date')}</FormLabel>
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
                              <FormLabel>{t('startTime')}</FormLabel>
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
                              <FormLabel>{t('endTime')}</FormLabel>
                              <FormControl>
                                  <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                      </div>
                       <FormField
                          control={timeEntryForm.control}
                          name="amount"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>{t('amount')} ({t('currency')}) <span className="text-muted-foreground">({t('optional')})</span></FormLabel>
                              <FormControl>
                                  <Input type="number" placeholder="e.g. 50000" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                      <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="secondary">{t('cancel')}</Button>
                      </DialogClose>
                      <Button type="submit" disabled={timeEntryForm.formState.isSubmitting}>
                          {timeEntryForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('save')}
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
                    <DialogTitle>{t('entryDetails')}</DialogTitle>
                    <DialogDescription>
                        {t('entryDetailsDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('location')}</p>
                        <p className="font-medium">{getLocationName(selectedEntry.locationId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('date')}</p>
                        <p className="font-medium">{formatDate(selectedEntry.startTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('time')}</p>
                        <p className="font-medium">{formatTime(selectedEntry.startTime)} - {formatTime(selectedEntry.endTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Info className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('duration')}</p>
                        <p className="font-medium">{calculateDuration(selectedEntry.startTime, selectedEntry.endTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox
                          id="paid"
                          checked={selectedEntry.paid}
                          onCheckedChange={(checked) => {
                              if (!checked) {
                                const newEntry = { ...selectedEntry, paid: false, amount: undefined };
                                updateTimeEntry(newEntry);
                                setSelectedEntry(newEntry);
                              } else if (selectedEntry.amount === undefined) {
                                  setIsPaymentDialogOpen(true)
                              }
                               else {
                                  const newEntry = { ...selectedEntry, paid: true };
                                  updateTimeEntry(newEntry);
                                  setSelectedEntry(newEntry);
                              }
                          }}
                      />
                      <label
                          htmlFor="paid"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                          {t('markAsPaid')}
                      </label>
                  </div>
                  {selectedEntry.paid && selectedEntry.amount && (
                      <div className="flex items-center gap-4">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <div>
                          <p className="text-sm text-muted-foreground">{t('amountPaid')}</p>
                          <p className="font-medium">{selectedEntry.amount.toLocaleString()} {t('currency')}</p>
                          </div>
                      </div>
                  )}
                  </div>
                  <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                              <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('deleteEntryConfirmation')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                              deleteTimeEntry(selectedEntry.id);
                              setIsDetailDialogOpen(false);
                            }}>{t('delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button type="button" variant="secondary" onClick={() => setIsDetailDialogOpen(false)} className="w-full">{t('close')}</Button>
                      <Button type="button" onClick={() => openDialogForEdit(selectedEntry)} className="w-full">
                          <Edit className="mr-2 h-4 w-4" /> {t('edit')}
                      </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Payment Dialog */}
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{t('enterPaymentAmount')}</DialogTitle>
                  </DialogHeader>
                  <Form {...paymentForm}>
                      <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                          <FormField
                          control={paymentForm.control}
                          name="amount"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>{t('amount')} ({t('currency')})</FormLabel>
                              <FormControl>
                                  <Input type="number" placeholder="e.g. 50000" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <DialogFooter>
                          <DialogClose asChild>
                              <Button type="button" variant="secondary">{t('cancel')}</Button>
                          </DialogClose>
                          <Button type="submit">{t('saveAndMarkPaid')}</Button>
                          </DialogFooter>
                      </form>
                  </Form>
              </DialogContent>
          </Dialog>
      </Card>
    </>
  );
}
