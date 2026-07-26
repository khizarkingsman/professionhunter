'use client';

import { Briefcase, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({
  message = 'Connecting to skilled professionals...',
  fullScreen = true,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-300',
        fullScreen ? 'min-h-[70vh] w-full flex-1' : 'w-full py-16',
        className
      )}
    >
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-24 w-24 rounded-full bg-primary/10 animate-ping" />
        
        {/* Secondary spinning ring */}
        <div className="absolute h-20 w-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        
        {/* Center brand badge */}
        <div className="relative h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md flex items-center justify-center shadow-lg shadow-primary/10">
          <Briefcase className="h-7 w-7 text-primary animate-bounce" />
          <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
      </div>

      {/* Brand Title */}
      <h2 className="text-xl font-bold font-headline bg-gradient-to-r from-primary via-primary/90 to-amber-500 bg-clip-text text-transparent mb-2 tracking-wide">
        Profession Hunter
      </h2>

      {/* Dynamic Subtitle */}
      <p className="text-sm text-muted-foreground max-w-xs animate-pulse">
        {message}
      </p>

      {/* Animated shimmer progress line */}
      <div className="mt-6 h-1 w-44 bg-muted/60 overflow-hidden rounded-full relative">
        <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-primary to-transparent w-full animate-shimmer" />
      </div>
    </div>
  );
}
