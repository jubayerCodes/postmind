'use client';

import * as React from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { useBrandTheme, BrandTheme } from './theme-brand-provider';
import { cn } from '@/lib/utils';

export function ThemeBrandToggle() {
  const { brand, setBrand, config } = useBrandTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: {
    id: BrandTheme;
    name: string;
    tagline: string;
    color: string;
  }[] = [
    {
      id: 'facebook',
      name: 'Meta Classic Blue',
      tagline: '#1877F2 • Clean & Professional',
      color: '#1877F2',
    },
    {
      id: 'instagram',
      name: 'Sunset Coral',
      tagline: '#FA582C • High Energy Commerce',
      color: '#FA582C',
    },
    {
      id: 'whatsapp',
      name: 'Emerald Mint',
      tagline: '#00A884 • Fresh Modern Retail',
      color: '#00A884',
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: Palette Icon + Active Color Swatch Dot + Chevron */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-8 px-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2 cursor-pointer shadow-2xs group select-none',
          isOpen && 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] bg-[var(--bg-hover)]'
        )}
        aria-label="Select accent theme color"
        aria-expanded={isOpen}
      >
        <Palette className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />

        {/* Current Active Color Swatch Dot */}
        <span
          className="w-2.5 h-2.5 rounded-full shadow-2xs transition-transform group-hover:scale-110"
          style={{ backgroundColor: config.primaryColor }}
        />

        <ChevronDown
          className={cn(
            'w-3 h-3 text-[var(--text-secondary)] transition-transform duration-200',
            isOpen && 'rotate-180 text-[var(--text-primary)]'
          )}
        />
      </button>

      {/* Modern Palette Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl shadow-black/10 dark:shadow-black/60 p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100 select-none backdrop-blur-md">
          {/* Header Label */}
          <div className="px-2.5 py-1.5 border-b border-[var(--border-subtle)] mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Accent Color Palette
            </span>
          </div>

          {/* Options List */}
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = brand === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setBrand(opt.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer group',
                    isSelected
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-medium dark:bg-[var(--brand-primary)]/15 dark:text-[var(--brand-primary)]'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Pill with ring */}
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full shrink-0 flex items-center justify-center transition-transform',
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-card)] ring-[var(--brand-primary)] scale-105'
                          : 'group-hover:scale-110'
                      )}
                      style={{
                        backgroundColor: opt.color,
                        boxShadow: `0 0 8px ${opt.color}33`,
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {opt.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] truncate leading-tight mt-0.5">
                        {opt.tagline}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
