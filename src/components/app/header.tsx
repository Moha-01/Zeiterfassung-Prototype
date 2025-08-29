import { Clock } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-card shadow-md rounded-lg">
      <div className="flex items-center gap-3">
        <Clock className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-primary">Zeit Meister</h1>
      </div>
    </header>
  );
}
