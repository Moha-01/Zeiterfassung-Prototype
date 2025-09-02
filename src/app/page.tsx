
'use client';

import { useState } from 'react';
import { Header } from '@/components/app/header';
import { TimeLogList } from '@/components/app/time-log-list';
import { EmployeeManagement } from '@/components/app/employee-management';
import { LocationManagement } from '@/components/app/location-management';
import { BottomNavbar } from '@/components/app/bottom-navbar';
import { AppProvider } from '@/context/app-context';
import { useTranslation } from '@/hooks/use-translation';


export type View = 'time' | 'employees' | 'locations';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('time');
  const { t } = useTranslation();

  const MainContent = () => {
    switch (activeView) {
      case 'employees':
        return <EmployeeManagement />;
      case 'locations':
        return <LocationManagement />;
      case 'time':
      default:
        return <TimeLogList />;
    }
  };


  return (
    <AppProvider>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 pb-24 md:pb-8">
            <Header />
            <main className="space-y-8">
                <div className="hidden md:block space-y-8">
                  <EmployeeManagement />
                  <LocationManagement />
                  <TimeLogList />
                </div>

                <div className="md:hidden">
                  <MainContent />
                </div>
            </main>
          </div>
          <BottomNavbar activeView={activeView} setActiveView={setActiveView} />
        </div>
    </AppProvider>
  );
}
