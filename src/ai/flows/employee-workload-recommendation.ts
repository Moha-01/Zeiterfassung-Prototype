// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Suggests employees for workload adjustment based on historical time tracking data.
 *
 * - employeeWorkloadRecommendation - A function that recommends employees for workload adjustment.
 * - EmployeeWorkloadRecommendationInput - The input type for the employeeWorkloadRecommendation function.
 * - EmployeeWorkloadRecommendationOutput - The return type for the employeeWorkloadRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmployeeWorkloadRecommendationInputSchema = z.object({
  employeeName: z.string().describe('The name of the employee.'),
  totalHoursWorked: z.number().describe('Total hours worked by the employee.'),
  averageWorkloadLimit: z.number().describe('The average workload limit for employees.'),
  maxWorkloadLimit: z.number().describe('The maximum workload limit for employees.'),
});
export type EmployeeWorkloadRecommendationInput = z.infer<
  typeof EmployeeWorkloadRecommendationInputSchema
>;

const EmployeeWorkloadRecommendationOutputSchema = z.object({
  recommendation: z
    .string()
    .describe(
      'Recommendation for the employee to reduce or increase workload based on total hours worked compared to average and max limits.'
    ),
});
export type EmployeeWorkloadRecommendationOutput = z.infer<
  typeof EmployeeWorkloadRecommendationOutputSchema
>;

export async function employeeWorkloadRecommendation(
  input: EmployeeWorkloadRecommendationInput
): Promise<EmployeeWorkloadRecommendationOutput> {
  return employeeWorkloadRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'employeeWorkloadRecommendationPrompt',
  input: {schema: EmployeeWorkloadRecommendationInputSchema},
  output: {schema: EmployeeWorkloadRecommendationOutputSchema},
  prompt: `You are an AI assistant designed to provide workload recommendations for employees.

  Based on the employee's total hours worked, the average workload limit, and the maximum workload limit, determine whether the employee should reduce or increase their workload.

  Employee Name: {{{employeeName}}}
  Total Hours Worked: {{{totalHoursWorked}}}
  Average Workload Limit: {{{averageWorkloadLimit}}}
  Maximum Workload Limit: {{{maxWorkloadLimit}}}

  Recommendation:`,
});

const employeeWorkloadRecommendationFlow = ai.defineFlow(
  {
    name: 'employeeWorkloadRecommendationFlow',
    inputSchema: EmployeeWorkloadRecommendationInputSchema,
    outputSchema: EmployeeWorkloadRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
