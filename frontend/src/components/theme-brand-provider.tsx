'use client';

import * as React from 'react';
import {
  useBrandThemeStore,
  BrandTheme,
  BrandThemeConfig,
  BRAND_CONFIGS,
} from '@/stores/brand-theme-store';

export { BRAND_CONFIGS };
export type { BrandTheme, BrandThemeConfig };

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const brand = useBrandThemeStore((state) => state.brand);

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-brand', brand);
    }
  }, [brand]);

  return <>{children}</>;
}

export function useBrandTheme() {
  const brand = useBrandThemeStore((state) => state.brand);
  const setBrand = useBrandThemeStore((state) => state.setBrand);
  const config = useBrandThemeStore((state) => state.config);

  return { brand, setBrand, config };
}
