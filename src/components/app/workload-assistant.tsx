'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Loader2 } from 'lucide-react';

import { employeeWorkloadRecommendation } from '@/ai/flows/employee-workload-recommendation';
import type { TimeEntry } from '@/types';
import { calculateDurationInHours } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  employeeName: z.string().min(1, 'Mitarbeiter ist erforderlich.'),
  averageWorkloadLimit: z.coerce.number().min(1, 'Durchschnittslimit ist erforderlich.'),
  maxWorkloadLimit: z.coerce.number().min(1, 'Maximales Limit ist erforderlich.'),
});

interface WorkloadAssistantProps {
  entries: TimeEntry[];
}

export function WorkloadAssistant({ entries }: WorkloadAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeName: '',
      averageWorkloadLimit: 40,
      maxWorkloadLimit: 60,
    },
  });

  const employeeNames = [...new Set(entries.map((entry) => entry.employeeName))];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendation(null);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const employeeEntries = entries.filter((e) => e.employeeName === values.employeeName && new Date(e.startTime) > sevenDaysAgo);
    
    const totalHoursWorked = employeeEntries.reduce(
      (acc, entry) => acc + calculateDurationInHours(entry.startTime, entry.endTime),
      0
    );

    try {
      const result = await employeeWorkloadRecommendation({
        ...values,
        totalHoursWorked: Math.round(totalHoursWorked),
      });
      setRecommendation(result.recommendation);
    } catch (error) {
      console.error('Error getting recommendation:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Empfehlung konnte nicht abgerufen werden.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className='h-6 w-6' />
          Arbeitslast-Assistent
        </CardTitle>
        <CardDescription>
          Erhalten Sie KI-basierte Empfehlungen zur Anpassung der Arbeitslast Ihrer Mitarbeiter für die letzte Woche.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="employeeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mitarbeiter auswählen</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={employeeNames.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Mitarbeiter auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employeeNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="averageWorkloadLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ø Arbeitslast (h)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxWorkloadLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max. Arbeitslast (h)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Empfehlung erhalten
            </Button>
          </CardFooter>
        </form>
      </Form>
      {recommendation && (
        <div className="p-6 pt-0">
          <Alert>
            <AlertTitle className="font-bold">Empfehlung</AlertTitle>
            <AlertDescription>{recommendation}</AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
