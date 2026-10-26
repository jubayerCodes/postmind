import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number | string;
  currency: string;
  category: string;
  stock: number;
  image?: string | null;
  tagline?: string | null;
  features: string[];
  discount?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  currency?: string;
  category?: string;
  stock?: number;
  image?: string | null;
  tagline?: string | null;
  features?: string[];
  discount?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  currency?: string;
  category?: string;
  stock?: number;
  image?: string | null;
  tagline?: string | null;
  features?: string[];
  discount?: string | null;
  isArchived?: boolean;
}

export interface BulkDraftProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  image?: string | null;
  tagline?: string | null;
  features: string[];
  discount?: string | null;
  suggestedImagePrompt?: string;
  selected: boolean;
  isGeneratingImage?: boolean;
}

interface ProductsState {
  // Catalog State
  activeTab: 'catalog' | 'bulk-import';
  products: Product[];
  total: number;
  selectedProduct: Product | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit';
  editingProduct: Product | null;

  // Bulk Ingestion State
  bulkDrafts: BulkDraftProduct[];
  isParsingDocument: boolean;
  isImportingBulk: boolean;
  parsedSummary: string | null;

  // Catalog Actions
  setActiveTab: (tab: 'catalog' | 'bulk-import') => void;
  fetchProducts: (
    storeId: string,
    query?: { search?: string; category?: string },
  ) => Promise<void>;
  createProduct: (storeId: string, input: CreateProductInput) => Promise<Product>;
  updateProduct: (
    storeId: string,
    id: string,
    input: UpdateProductInput,
  ) => Promise<Product>;
  deleteProduct: (storeId: string, id: string) => Promise<void>;
  seedDemoProducts: (storeId: string) => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
  openCreateModal: () => void;
  openEditModal: (product: Product) => void;
  closeModal: () => void;
  clearError: () => void;
  resetForWorkspaceSwitch: () => void;

  // Bulk Ingestion Actions
  parseDocumentFile: (storeId: string, file: File) => Promise<void>;
  updateBulkDraft: (id: string, updates: Partial<BulkDraftProduct>) => void;
  removeBulkDraft: (id: string) => void;
  addEmptyBulkDraft: (currency?: string) => void;
  toggleSelectDraft: (id: string) => void;
  toggleSelectAllDrafts: (selected: boolean) => void;
  generateDraftImage: (storeId: string, id: string) => Promise<void>;
  generateAllMissingImages: (storeId: string) => Promise<void>;
  approveAndImportBulk: (storeId: string) => Promise<{ count: number }>;
  clearBulkDrafts: () => void;

  // Image Utilities
  uploadImageFile: (file: File) => Promise<string>;
  generateAiImage: (
    storeId: string,
    prompt: string,
    context?: {
      productName?: string;
      category?: string;
      features?: string[];
    },
  ) => Promise<{ imageUrl: string; engine: string }>;
}

const DEMO_SEED_PRODUCTS: CreateProductInput[] = [
  {
    name: 'Royal Oxford Embroidered Panjabi',
    price: 3850,
    category: 'Apparel',
    stock: 35,
    tagline: 'Pure Egyptian cotton with minimalist collar zari embroidery',
    discount: '15% OFF',
    features: ['100% Egyptian Giza Cotton', 'Pre-shrunk Luxury Weave', 'Handmade Metallic Buttons'],
    image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Apex AirStride Performance Runner',
    price: 4950,
    category: 'Footwear',
    stock: 22,
    tagline: 'Ultralight responsive nitrogen-cushioned running sneaker',
    discount: 'Eid Special 20% OFF',
    features: ['Nitrogen-Infused Midsole', 'Breathable Engineered Mesh', 'Anti-Abrasion Rubber Outsole'],
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Vintage Selvedge Raw Denim Jacket',
    price: 4200,
    category: 'Apparel',
    stock: 18,
    tagline: 'Authentic 14oz ring-spun Japanese selvedge denim',
    discount: null,
    features: ['14oz Raw Selvedge Denim', 'Custom Brass Rivets', 'Relaxed Tailored Fit'],
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Horween Chronograph Leather Watch',
    price: 6500,
    category: 'Accessories',
    stock: 12,
    tagline: 'Sapphire crystal dial with handcrafted Horween leather strap',
    discount: 'Limited Stock',
    features: ['Scratch-Resistant Sapphire Glass', 'Japanese Quartz Chronograph', 'Water Resistant 50M'],
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
  },
];

export const useProductsStore = create<ProductsState>((set, get) => ({
  activeTab: 'catalog',
  products: [],
  total: 0,
  selectedProduct: null,
  isLoading: false,
  isMutating: false,
  error: null,
  isModalOpen: false,
  modalMode: 'create',
  editingProduct: null,

  bulkDrafts: [],
  isParsingDocument: false,
  isImportingBulk: false,
  parsedSummary: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  clearError: () => set({ error: null }),

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  openCreateModal: () =>
    set({ isModalOpen: true, modalMode: 'create', editingProduct: null }),

  openEditModal: (product) =>
    set({ isModalOpen: true, modalMode: 'edit', editingProduct: product }),

  closeModal: () =>
    set({ isModalOpen: false, editingProduct: null }),

  resetForWorkspaceSwitch: () =>
    set({
      products: [],
      total: 0,
      selectedProduct: null,
      isLoading: true,
      error: null,
    }),

  fetchProducts: async (storeId, query = {}) => {
    if (!storeId) return;
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (query.search?.trim()) params.search = query.search.trim();
      if (query.category?.trim() && query.category !== 'All') {
        params.category = query.category.trim();
      }

      const response = await apiClient<{ products: Product[]; total: number }>(
        `/stores/${storeId}/products`,
        { params },
      );

      const items = response.products || [];
      const currentSelected = get().selectedProduct;
      const nextSelected =
        items.find((p) => p.id === currentSelected?.id) || items[0] || null;

      set({
        products: items,
        total: response.total || items.length,
        selectedProduct: nextSelected,
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('Failed to fetch store products:', err);
      set({
        error: err.message || 'Failed to load products',
        isLoading: false,
      });
    }
  },

  createProduct: async (storeId, input) => {
    set({ isMutating: true, error: null });
    try {
      const newProduct = await apiClient<Product>(`/stores/${storeId}/products`, {
        method: 'POST',
        body: JSON.stringify(input),
      });

      set((state) => ({
        products: [newProduct, ...state.products],
        total: state.total + 1,
        selectedProduct: newProduct,
        isMutating: false,
        isModalOpen: false,
      }));

      return newProduct;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to create product',
        isMutating: false,
      });
      throw err;
    }
  },

  updateProduct: async (storeId, id, input) => {
    set({ isMutating: true, error: null });
    try {
      const updated = await apiClient<Product>(
        `/stores/${storeId}/products/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        },
      );

      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
        selectedProduct:
          state.selectedProduct?.id === id ? updated : state.selectedProduct,
        editingProduct: null,
        isMutating: false,
        isModalOpen: false,
      }));

      return updated;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to update product',
        isMutating: false,
      });
      throw err;
    }
  },

  deleteProduct: async (storeId, id) => {
    set({ isMutating: true, error: null });
    try {
      await apiClient(`/stores/${storeId}/products/${id}`, {
        method: 'DELETE',
      });

      set((state) => {
        const remaining = state.products.filter((p) => p.id !== id);
        return {
          products: remaining,
          total: Math.max(0, state.total - 1),
          selectedProduct:
            state.selectedProduct?.id === id ? remaining[0] || null : state.selectedProduct,
          isMutating: false,
        };
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to delete product',
        isMutating: false,
      });
      throw err;
    }
  },

  seedDemoProducts: async (storeId) => {
    if (!storeId) return;
    set({ isMutating: true, error: null });
    try {
      for (const item of DEMO_SEED_PRODUCTS) {
        await apiClient<Product>(`/stores/${storeId}/products`, {
          method: 'POST',
          body: JSON.stringify(item),
        });
      }
      await get().fetchProducts(storeId);
      set({ isMutating: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to seed demo products',
        isMutating: false,
      });
      throw err;
    }
  },

  // -------------------------------------------------------------
  // Bulk Ingestion Implementation
  // -------------------------------------------------------------

  parseDocumentFile: async (storeId, file) => {
    set({ isParsingDocument: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await apiClient<{
        products: any[];
        sourceSummary?: string;
      }>(`/stores/${storeId}/ai/parse-document`, {
        method: 'POST',
        body: formData,
      });

      const items = (result.products || []).map((p, idx) => ({
        id: `draft-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name: p.name || 'Untitled Product',
        price: Number(p.price) || 0,
        currency: p.currency || 'BDT',
        category: p.category || 'General',
        stock: Number(p.stock) || 10,
        image: p.image || null,
        tagline: p.tagline || '',
        features: Array.isArray(p.features) ? p.features : [],
        discount: p.discount || null,
        suggestedImagePrompt: p.suggestedImagePrompt || `Studio product photography of ${p.name}`,
        selected: true,
      }));

      set({
        bulkDrafts: items,
        parsedSummary: result.sourceSummary || `Extracted ${items.length} products`,
        isParsingDocument: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to parse document',
        isParsingDocument: false,
      });
      throw err;
    }
  },

  updateBulkDraft: (id, updates) => {
    set((state) => ({
      bulkDrafts: state.bulkDrafts.map((d) =>
        d.id === id ? { ...d, ...updates } : d,
      ),
    }));
  },

  removeBulkDraft: (id) => {
    set((state) => ({
      bulkDrafts: state.bulkDrafts.filter((d) => d.id !== id),
    }));
  },

  addEmptyBulkDraft: (currency = 'BDT') => {
    const newDraft: BulkDraftProduct = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      price: 0,
      currency,
      category: 'General',
      stock: 10,
      features: ['100% Quality'],
      selected: true,
    };
    set((state) => ({
      bulkDrafts: [newDraft, ...state.bulkDrafts],
    }));
  },

  toggleSelectDraft: (id) => {
    set((state) => ({
      bulkDrafts: state.bulkDrafts.map((d) =>
        d.id === id ? { ...d, selected: !d.selected } : d,
      ),
    }));
  },

  toggleSelectAllDrafts: (selected) => {
    set((state) => ({
      bulkDrafts: state.bulkDrafts.map((d) => ({ ...d, selected })),
    }));
  },

  generateDraftImage: async (storeId, id) => {
    const draft = get().bulkDrafts.find((d) => d.id === id);
    if (!draft) return;

    set((state) => ({
      bulkDrafts: state.bulkDrafts.map((d) =>
        d.id === id ? { ...d, isGeneratingImage: true } : d,
      ),
    }));

    try {
      const prompt =
        draft.suggestedImagePrompt ||
        `Commercial e-commerce studio product photograph of ${draft.name}, ${draft.category}. Clean backdrop.`;

      const res = await get().generateAiImage(storeId, prompt, {
        productName: draft.name,
        category: draft.category,
        features: draft.features,
      });

      set((state) => ({
        bulkDrafts: state.bulkDrafts.map((d) =>
          d.id === id
            ? { ...d, image: res.imageUrl, isGeneratingImage: false }
            : d,
        ),
      }));
    } catch (err: any) {
      set((state) => ({
        bulkDrafts: state.bulkDrafts.map((d) =>
          d.id === id ? { ...d, isGeneratingImage: false } : d,
        ),
        error: err.message || 'Failed to generate image',
      }));
    }
  },

  generateAllMissingImages: async (storeId) => {
    const drafts = get().bulkDrafts.filter((d) => !d.image && d.selected);
    for (const draft of drafts) {
      await get().generateDraftImage(storeId, draft.id);
    }
  },

  approveAndImportBulk: async (storeId) => {
    const selected = get().bulkDrafts.filter((d) => d.selected);
    if (selected.length === 0) {
      throw new Error('Please select at least one product to import');
    }

    // Validate that all selected products have names and valid prices
    for (const item of selected) {
      if (!item.name.trim()) {
        throw new Error('All selected products must have a product name');
      }
      if (isNaN(item.price) || item.price < 0) {
        throw new Error(`Product "${item.name}" has an invalid price`);
      }
    }

    set({ isImportingBulk: true, error: null });
    try {
      const payload = selected.map((item) => ({
        name: item.name.trim(),
        price: Number(item.price),
        currency: item.currency || 'BDT',
        category: item.category || 'General',
        stock: Number(item.stock) || 10,
        image: item.image || undefined,
        tagline: item.tagline?.trim() || undefined,
        features: item.features || [],
        discount: item.discount?.trim() || undefined,
      }));

      const response = await apiClient<{ count: number; products: Product[] }>(
        `/stores/${storeId}/products/bulk`,
        {
          method: 'POST',
          body: JSON.stringify({ products: payload }),
        },
      );

      // Refresh catalog list
      await get().fetchProducts(storeId);

      // Clear imported drafts and return to catalog tab
      set({
        bulkDrafts: [],
        parsedSummary: null,
        isImportingBulk: false,
        activeTab: 'catalog',
      });

      return { count: response.count };
    } catch (err: any) {
      set({
        error: err.message || 'Failed to import products',
        isImportingBulk: false,
      });
      throw err;
    }
  },

  clearBulkDrafts: () =>
    set({ bulkDrafts: [], parsedSummary: null }),

  uploadImageFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient<{ url: string }>('/storage/upload-image', {
      method: 'POST',
      body: formData,
    });

    return res.url;
  },

  generateAiImage: async (storeId, prompt, context = {}) => {
    const res = await apiClient<{
      imageUrl: string;
      engine: string;
      promptUsed: string;
    }>(`/stores/${storeId}/ai/generate-product-image`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        productName: context.productName,
        category: context.category,
        features: context.features,
      }),
    });

    return { imageUrl: res.imageUrl, engine: res.engine };
  },
}));
