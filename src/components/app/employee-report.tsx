'use client';

import React from 'react';
import type { Employee, TimeEntry, Location } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { calculateDuration, calculateDurationInHours, formatDate, formatTime } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface EmployeeReportProps {
  employee: Employee;
  timeEntries: TimeEntry[];
  locations: Location[];
}

export const EmployeeReport = ({ employee, timeEntries, locations }: EmployeeReportProps) => {
  const { t } = useTranslation();

  const getLocationName = (locationId: string) => {
    return locations.find((l) => l.id === locationId)?.name || t('unknown');
  };

  const totalHours = timeEntries.reduce((acc, entry) => {
    return acc + calculateDurationInHours(entry.startTime, entry.endTime);
  }, 0).toFixed(2);

  const totalPaidAmount = timeEntries
    .filter(entry => entry.paid && entry.amount)
    .reduce((acc, entry) => acc + (entry.amount || 0), 0);

  return (
    <div id="employee-report" className="bg-white p-8 font-sans text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <Clock className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-700">{t('appTitle')}</h1>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold">{t('workReport')}</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">{t('employeeDetails')}</h3>
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
          <div>
            <p className="text-sm text-gray-500">{t('employeeName')}</p>
            <p className="font-medium">{employee.name}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">{t('summary')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-500">{t('totalHours')}</p>
            <p className="text-2xl font-bold">{totalHours}h</p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg text-center">
            <p className="text-sm text-green-700">{t('totalPaid')}</p>
            <p className="text-2xl font-bold text-green-800">{totalPaidAmount.toLocaleString()} {t('currency')}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-4">{t('timeEntries')}</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2 border-b-2">{t('date')}</th>
              <th className="p-2 border-b-2">{t('location')}</th>
              <th className="p-2 border-b-2">{t('time')}</th>
              <th className="p-2 border-b-2">{t('duration')}</th>
              <th className="p-2 border-b-2">{t('status')}</th>
              <th className="p-2 border-b-2 text-right">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.length > 0 ? timeEntries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="p-2 border-b">{formatDate(entry.startTime)}</td>
                <td className="p-2 border-b">{getLocationName(entry.locationId)}</td>
                <td className="p-2 border-b">{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</td>
                <td className="p-2 border-b">{calculateDuration(entry.startTime, entry.endTime)}</td>
                <td className="p-2 border-b">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${entry.paid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {entry.paid ? t('paid') : t('unpaid')}
                  </span>
                </td>
                <td className="p-2 border-b text-right font-mono">{entry.amount ? `${entry.amount.toLocaleString()} ${t('currency')}` : '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">{t('noWorkHistory')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="mt-12 pt-4 text-center text-xs text-gray-400 border-t">
        <p>{t('reportGeneratedBy')} {t('appTitle')}</p>
      </footer>
    </div>
  );
};
