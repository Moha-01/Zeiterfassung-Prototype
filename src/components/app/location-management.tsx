
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { useAppContext } from '@/context/app-context';


const locationSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('locationNameRequired')),
});

export function LocationManagement() {
  const { t } = useTranslation();
  const { locations, addLocation, deleteLocation, timeEntries } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<z.infer<ReturnType<typeof locationSchema>>>({
    resolver: zodResolver(locationSchema(t)),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: z.infer<ReturnType<typeof locationSchema>>) {
    setIsSubmitting(true);
    addLocation({ name: values.name });
    form.reset();
    setIsSubmitting(false);
    setIsDialogOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            {t('manageLocations')}
            </CardTitle>
            <CardDescription>{t('manageLocationsDescription')}</CardDescription>
        </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> {t('location')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addNewLocation')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('locationName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('locationNamePlaceholder')} {...field} />
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
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="text-right">{t('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.length > 0 ? (
                locations.map((location) => {
                  const hasEntries = timeEntries.some(entry => entry.locationId === location.id);
                  return (
                    <TableRow key={location.id}>
                      <TableCell>{location.name}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button 
                              variant="ghost" 
                              size="icon"
                              disabled={hasEntries}
                              aria-label={hasEntries ? t('locationHasEntriesTooltip') : t('deleteLocation')}
                            >
                              <Trash2 className={`h-4 w-4 ${hasEntries ? 'text-muted-foreground' : 'text-destructive'}`} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('deleteLocationConfirmation')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteLocation(location.id)}>{t('delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    {t('noLocations')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
