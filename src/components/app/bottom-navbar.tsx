'use client';

import { Clock, Users, MapPin } from 'lucide-react';
import type { View } from '@/app/page';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';


interface BottomNavbarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

export function BottomNavbar({ activeView, setActiveView }: BottomNavbarProps) {
  const { t } = useTranslation();
  const navItems = [
    { id: 'time', label: t('timeTracking'), icon: Clock },
    { id: 'employees', label: t('employees'), icon: Users },
    { id: 'locations', label: t('locations'), icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-lg md:hidden z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as View)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors",
              activeView === item.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
