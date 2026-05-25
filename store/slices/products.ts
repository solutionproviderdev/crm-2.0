import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GlobalSeries {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductSeries {
  id: string;
  globalSeriesId: string;
  name: string;
  description: string;
  pricePerSqft: number;
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  series: ProductSeries[];
  createdAt: string;
  updatedAt: string;
}

interface ProductsState {
  products: Product[];
  globalSeries: GlobalSeries[];
}

export const defaultGlobalSeries: GlobalSeries[] = [
  { id: 'premium', name: 'Premium', sortOrder: 1, isActive: true },
  { id: 'standard', name: 'Standard', sortOrder: 2, isActive: true },
  { id: 'economy', name: 'Economy', sortOrder: 3, isActive: true },
  { id: 'super-economy', name: 'Super Economy', sortOrder: 4, isActive: true },
];

export const getActiveGlobalSeries = (series: GlobalSeries[]) =>
  series.filter(item => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

export const findGlobalSeriesByName = (
  name: string | undefined,
  globalSeries: GlobalSeries[] = defaultGlobalSeries,
) => {
  const normalizedName = name?.trim().toLowerCase();
  if (!normalizedName) return undefined;
  return globalSeries.find(item => item.name.trim().toLowerCase() === normalizedName);
};

export const findGlobalSeriesById = (
  id: string | undefined,
  globalSeries: GlobalSeries[] = defaultGlobalSeries,
) => {
  if (!id) return undefined;
  return globalSeries.find(item => item.id === id);
};

export const getAvailableGlobalSeriesForProduct = (
  productSeries: ProductSeries[],
  globalSeries: GlobalSeries[],
  currentGlobalSeriesId?: string,
) => {
  const selectedIds = new Set(
    productSeries
      .map(series => series.globalSeriesId)
      .filter(id => id && id !== currentGlobalSeriesId),
  );
  return getActiveGlobalSeries(globalSeries).filter(series => !selectedIds.has(series.id));
};

const initialState: ProductsState = {
  products: [],
  globalSeries: defaultGlobalSeries,
};

export const productsSlice = createSlice({
  name: 'quotationProducts',
  initialState,
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      const exists = state.products.some(p => p.id === action.payload.id);
      if (!exists) state.products.push(action.payload);
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) state.products[index] = action.payload;
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    addGlobalSeries: (state, action: PayloadAction<GlobalSeries>) => {
      const exists = state.globalSeries.some(s => s.id === action.payload.id);
      if (!exists) {
        const maxOrder = state.globalSeries.reduce((max, s) => Math.max(max, s.sortOrder), 0);
        state.globalSeries.push({ ...action.payload, sortOrder: maxOrder + 1 });
      }
    },
    updateGlobalSeries: (state, action: PayloadAction<GlobalSeries>) => {
      const index = state.globalSeries.findIndex(s => s.id === action.payload.id);
      if (index !== -1) state.globalSeries[index] = action.payload;
    },
    deleteGlobalSeries: (state, action: PayloadAction<string>) => {
      state.globalSeries = state.globalSeries.filter(s => s.id !== action.payload);
      state.products = state.products.map(product => ({
        ...product,
        series: product.series.filter(s => s.globalSeriesId !== action.payload),
      }));
    },
    reorderGlobalSeries: (state, action: PayloadAction<{ id: string; direction: 'up' | 'down' }>) => {
      const { id, direction } = action.payload;
      const sorted = [...state.globalSeries].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex(s => s.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const tmp = sorted[idx].sortOrder;
      sorted[idx] = { ...sorted[idx], sortOrder: sorted[swapIdx].sortOrder };
      sorted[swapIdx] = { ...sorted[swapIdx], sortOrder: tmp };
      state.globalSeries = sorted;
    },
  },
});

export const {
  addProduct, updateProduct, deleteProduct,
  addGlobalSeries, updateGlobalSeries, deleteGlobalSeries, reorderGlobalSeries,
} = productsSlice.actions;
export default productsSlice.reducer;
