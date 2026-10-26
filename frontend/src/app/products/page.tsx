'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/navigation/app-shell';
import { ProductsView } from '@/components/products/products-view';
import { useProductsStore, Product } from '@/stores/products-store';
import { Loader2 } from 'lucide-react';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setActiveTab = useProductsStore((s) => s.setActiveTab);
  const setSelectedProduct = useProductsStore((s) => s.setSelectedProduct);

  React.useEffect(() => {
    if (searchParams.get('view') === 'bulk') {
      setActiveTab('bulk-import');
    }
  }, [searchParams, setActiveTab]);

  const handleSelectForStudio = (product: Product) => {
    setSelectedProduct(product);
    router.push('/');
  };

  return <ProductsView onSelectForStudio={handleSelectForStudio} />;
}

export default function ProductsPage() {
  return (
    <AppShell activeTab="products">
      <React.Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
          </div>
        }
      >
        <ProductsContent />
      </React.Suspense>
    </AppShell>
  );
}
