'use client'

import { Clock, Globe, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Header() {
  const { t, language, setLanguage, languages } = useTranslation();

  return (
    <header className="flex items-center justify-between p-4 bg-card shadow-md rounded-lg">
      <div className="flex items-center gap-3">
        <Clock className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-primary">{t('appTitle')}</h1>
      </div>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Globe className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(languages).map(([lang, label]) => (
            <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
              <Check className={`mr-2 h-4 w-4 ${language === lang ? "opacity-100" : "opacity-0"}`} />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
