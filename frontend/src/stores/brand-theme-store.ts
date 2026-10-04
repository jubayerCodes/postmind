import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BrandTheme = 'facebook' | 'instagram' | 'whatsapp';

export interface BrandThemeConfig {
  id: BrandTheme;
  name: string;
  shortName: string;
  tagline: string;
  primaryColor: string;
  accentBadge: string;
}

export const BRAND_CONFIGS: Record<BrandTheme, BrandThemeConfig> = {
  facebook: {
    id: 'facebook',
    name: 'Meta Classic Blue',
    shortName: 'Classic Blue',
    tagline: 'Blue #1877F2',
    primaryColor: '#1877F2',
    accentBadge: 'bg-[#1877F2]',
  },
  instagram: {
    id: 'instagram',
    name: 'Sunset Coral',
    shortName: 'Sunset Coral',
    tagline: 'Orange #FA582C',
    primaryColor: '#FA582C',
    accentBadge: 'bg-[#FA582C]',
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'Emerald Mint',
    shortName: 'Emerald Mint',
    tagline: 'Green #00A884',
    primaryColor: '#00A884',
    accentBadge: 'bg-[#00A884]',
  },
};

interface BrandThemeState {
  brand: BrandTheme;
  config: BrandThemeConfig;
  setBrand: (brand: BrandTheme) => void;
}

export const useBrandThemeStore = create<BrandThemeState>()(
  persist(
    (set) => ({
      brand: 'facebook',
      config: BRAND_CONFIGS['facebook'],
      setBrand: (brand: BrandTheme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-brand', brand);
        }
        set({ brand, config: BRAND_CONFIGS[brand] });
      },
    }),
    {
      name: 'postmind_brand_theme',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-brand', state.brand);
        }
      },
    },
  ),
);
