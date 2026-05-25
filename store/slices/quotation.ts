import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  QuotationItem,
  ClientInfo,
  QuotationDetails,
  SavedQuotation,
  calculateQuotationItemTotal,
  normalizeQuotationItemQuantity,
} from '@/components/quotation/types';
import { GlobalSeries, Product } from '@/store/slices/products';

export interface ApplyGlobalSeriesSkippedItem {
  id: string;
  label: string;
  reason: 'manual-unmatched' | 'missing-product' | 'target-series-unavailable';
}

export interface ApplyGlobalSeriesResult {
  items: QuotationItem[];
  updatedCount: number;
  skippedItems: ApplyGlobalSeriesSkippedItem[];
}

interface ResolvedCatalogItem {
  product: Product;
  currentSeries: Product['series'][number];
}

type SetLeadPayload =
  | string
  | null
  | { leadId: string | null; products?: Product[]; clientName?: string; clientPhone?: string; clientAddress?: string; };

type LoadSavedQuotationPayload =
  | string
  | { id: string; products?: Product[]; };

interface CreateQuotationVariantsPayload {
  sourceQuotationId?: string;
  globalSeriesIds: string[];
  products: Product[];
  globalSeries: GlobalSeries[];
}

const normalizeName = (value?: string) => value?.trim().toLowerCase() ?? '';
const findUnique = <T>(items: T[]) => (items.length === 1 ? items[0] : null);

export const resolveCatalogItem = (item: QuotationItem, products: Product[]): ResolvedCatalogItem | null => {
  const product =
    (item.productId ? products.find(p => p.id === item.productId) ?? null : null) ??
    findUnique(
      products.filter(p => {
        const productName = normalizeName(p.name);
        const itemNames = [normalizeName(item.productName), normalizeName(item.applicationName)].filter(Boolean);
        return itemNames.includes(productName);
      }),
    );
  if (!product) return null;

  const currentSeries = findUnique(
    product.series.filter(series => {
      if (item.globalSeriesId && series.globalSeriesId === item.globalSeriesId) return true;
      if (item.seriesId && series.id === item.seriesId) return true;
      return normalizeName(series.name) === normalizeName(item.seriesName);
    }),
  );
  if (!currentSeries) return null;
  return { product, currentSeries };
};

export const normalizeQuotationItemsWithCatalog = (items: QuotationItem[], products: Product[]) =>
  items.map(item => {
    const resolved = resolveCatalogItem(item, products);
    if (!resolved) return normalizeQuotationItemQuantity(item);
    const { product, currentSeries } = resolved;
    return {
      ...item,
      isManual: false,
      productId: product.id,
      productName: product.name,
      applicationName: item.applicationName || product.name,
      seriesId: currentSeries.id,
      globalSeriesId: currentSeries.globalSeriesId,
      seriesName: currentSeries.name,
      pricePerSqft: currentSeries.pricePerSqft,
      unitPrice: currentSeries.pricePerSqft,
      description: currentSeries.description,
      note: currentSeries.note ?? '',
      totalPrice: calculateQuotationItemTotal({ ...item, pricePerSqft: currentSeries.pricePerSqft, unitPrice: currentSeries.pricePerSqft }),
    };
  });

export const applyGlobalSeriesToQuotationItems = (
  items: QuotationItem[],
  products: Product[],
  globalSeriesId: string,
): ApplyGlobalSeriesResult => {
  const skippedItems: ApplyGlobalSeriesSkippedItem[] = [];
  let updatedCount = 0;

  const updatedItems = items.map(item => {
    const label = item.applicationName || item.productName || item.description || `Item ${item.id}`;
    const resolved = resolveCatalogItem(item, products);
    if (!resolved) { skippedItems.push({ id: item.id, label, reason: 'manual-unmatched' }); return item; }
    const { product } = resolved;
    if (!product) { skippedItems.push({ id: item.id, label, reason: 'missing-product' }); return item; }
    const targetSeries = product.series.find(s => s.globalSeriesId === globalSeriesId);
    if (!targetSeries) { skippedItems.push({ id: item.id, label, reason: 'target-series-unavailable' }); return item; }
    updatedCount += 1;
    return {
      ...item, isManual: false, productId: product.id, productName: product.name,
      applicationName: item.applicationName || product.name,
      seriesId: targetSeries.id, globalSeriesId: targetSeries.globalSeriesId,
      seriesName: targetSeries.name, pricePerSqft: targetSeries.pricePerSqft,
      unitPrice: targetSeries.pricePerSqft, description: targetSeries.description,
      note: targetSeries.note ?? '',
      totalPrice: calculateQuotationItemTotal({ ...item, pricePerSqft: targetSeries.pricePerSqft, unitPrice: targetSeries.pricePerSqft }),
    };
  });
  return { items: updatedItems, updatedCount, skippedItems };
};

const cloneQuotationItems = (items: QuotationItem[]) => items.map(item => ({ ...item }));

const buildCurrentSavedQuotation = (state: QuotationState, id = state.quotationDetails.quotationNumber): SavedQuotation | null => {
  if (!state.leadId) return null;
  const now = new Date().toISOString();
  const existing = state.savedQuotations.find(q => q.id === id);
  return {
    id,
    leadId: state.leadId,
    clientInfo: { ...state.clientInfo },
    quotationDetails: { ...state.quotationDetails },
    quotationItems: cloneQuotationItems(state.quotationItems),
    transportationLocation: state.transportationLocation,
    transportationCost: state.transportationCost,
    hasDiscount: state.hasDiscount,
    discountAmount: state.discountAmount,
    globalSeriesId: state.globalSeriesId,
    globalSeriesName: state.globalSeriesName,
    variantGroupId: existing?.variantGroupId,
    variantName: existing?.variantName,
    variantType: existing?.variantType,
    createdFromQuotationId: existing?.createdFromQuotationId,
    variantApplyResult: existing?.variantApplyResult,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
};

export const createSeriesQuotationVariant = (
  baseQuotation: SavedQuotation,
  products: Product[],
  globalSeries: GlobalSeries,
  variantGroupId = baseQuotation.variantGroupId ?? `${baseQuotation.id}-variants`,
  existingVariant?: SavedQuotation,
): SavedQuotation => {
  const now = new Date().toISOString();
  const result = applyGlobalSeriesToQuotationItems(cloneQuotationItems(baseQuotation.quotationItems), products, globalSeries.id);
  const id = existingVariant?.id ?? `${baseQuotation.id}-${globalSeries.id}`;
  return {
    ...baseQuotation, id, variantGroupId, variantName: globalSeries.name, variantType: 'series',
    globalSeriesId: globalSeries.id, globalSeriesName: globalSeries.name,
    createdFromQuotationId: baseQuotation.id,
    quotationDetails: { ...baseQuotation.quotationDetails, quotationNumber: id },
    quotationItems: result.items.map(normalizeQuotationItemQuantity),
    variantApplyResult: { updatedCount: result.updatedCount, skippedItems: result.skippedItems },
    createdAt: existingVariant?.createdAt ?? now,
    updatedAt: now,
  };
};

interface QuotationState {
  clientInfo: ClientInfo;
  quotationDetails: QuotationDetails;
  quotationItems: QuotationItem[];
  transportationLocation: 'inside' | 'outside';
  transportationCost: number | null;
  hasDiscount: boolean;
  discountAmount: number;
  globalSeriesId?: string;
  globalSeriesName?: string;
  leadId: string | null;           // ← renamed from projectId
  savedQuotations: SavedQuotation[];
}

const initialState: QuotationState = {
  clientInfo: { name: '', phone: '', email: '', address: '', projectLocation: 'Inside Dhaka' },
  quotationDetails: {
    quotationNumber: `QT-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: 'Payment terms: 50% advance, 50% on completion. Prices are subject to change without notice.',
  },
  quotationItems: [],
  transportationLocation: 'inside',
  transportationCost: null,
  hasDiscount: false,
  discountAmount: 0,
  globalSeriesId: undefined,
  globalSeriesName: undefined,
  leadId: null,
  savedQuotations: [],
};

function syncStateToSaved(state: QuotationState, explicitId?: string) {
  if (!state.leadId) return;
  const id = explicitId || state.quotationDetails.quotationNumber;
  const now = new Date().toISOString();

  const newQuotation: SavedQuotation = {
    id,
    leadId: state.leadId,
    clientInfo: state.clientInfo,
    quotationDetails: state.quotationDetails,
    quotationItems: state.quotationItems,
    transportationLocation: state.transportationLocation,
    transportationCost: state.transportationCost,
    hasDiscount: state.hasDiscount,
    discountAmount: state.discountAmount,
    globalSeriesId: state.globalSeriesId,
    globalSeriesName: state.globalSeriesName,
    variantGroupId: undefined, variantName: undefined, variantType: undefined,
    createdFromQuotationId: undefined, variantApplyResult: undefined,
    createdAt: now, updatedAt: now,
  };

  const index = state.savedQuotations.findIndex(q => q.id === id);
  if (index !== -1) {
    const existing = state.savedQuotations[index];
    newQuotation.createdAt = existing.createdAt;
    newQuotation.variantGroupId = existing.variantGroupId;
    newQuotation.variantName = existing.variantName;
    newQuotation.variantType = existing.variantType;
    newQuotation.createdFromQuotationId = existing.createdFromQuotationId;
    newQuotation.variantApplyResult = existing.variantApplyResult;
    state.savedQuotations[index] = newQuotation;
  } else {
    state.savedQuotations.push(newQuotation);
  }
}

const quotationSlice = createSlice({
  name: 'quotation',
  initialState,
  reducers: {
    setClientInfo: (state, action: PayloadAction<Partial<ClientInfo>>) => {
      state.clientInfo = { ...state.clientInfo, ...action.payload };
      syncStateToSaved(state);
    },
    setQuotationDetails: (state, action: PayloadAction<Partial<QuotationDetails>>) => {
      state.quotationDetails = { ...state.quotationDetails, ...action.payload };
      syncStateToSaved(state);
    },
    setQuotationItems: (state, action: PayloadAction<QuotationItem[]>) => {
      state.quotationItems = action.payload.map(normalizeQuotationItemQuantity);
      syncStateToSaved(state);
    },
    addQuotationItem: (state, action: PayloadAction<QuotationItem>) => {
      state.quotationItems.push(normalizeQuotationItemQuantity(action.payload));
      syncStateToSaved(state);
    },
    updateQuotationItem: (state, action: PayloadAction<{ id: string; changes: Partial<QuotationItem> }>) => {
      const index = state.quotationItems.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.quotationItems[index] = { ...state.quotationItems[index], ...action.payload.changes };
        state.quotationItems[index] = normalizeQuotationItemQuantity(state.quotationItems[index]);
        syncStateToSaved(state);
      }
    },
    removeQuotationItem: (state, action: PayloadAction<string>) => {
      state.quotationItems = state.quotationItems.filter(item => item.id !== action.payload);
      syncStateToSaved(state);
    },
    setTransportationLocation: (state, action: PayloadAction<'inside' | 'outside'>) => {
      state.transportationLocation = action.payload;
      state.clientInfo.projectLocation = action.payload === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka';
      syncStateToSaved(state);
    },
    setHasDiscount: (state, action: PayloadAction<boolean>) => {
      state.hasDiscount = action.payload;
      syncStateToSaved(state);
    },
    setDiscountAmount: (state, action: PayloadAction<number>) => {
      state.discountAmount = action.payload;
      syncStateToSaved(state);
    },
    setTransportationCost: (state, action: PayloadAction<number | null>) => {
      state.transportationCost = action.payload;
      syncStateToSaved(state);
    },
    setGlobalSeries: (state, action: PayloadAction<Pick<GlobalSeries, 'id' | 'name'> | null>) => {
      state.globalSeriesId = action.payload?.id;
      state.globalSeriesName = action.payload?.name;
      syncStateToSaved(state);
    },
    setLeadId: (state, action: PayloadAction<SetLeadPayload>) => {
      const leadId = typeof action.payload === 'object' && action.payload !== null
        ? (action.payload as any).leadId
        : action.payload;
      const products = typeof action.payload === 'object' && action.payload !== null
        ? (action.payload as any).products
        : undefined;
      const clientName = typeof action.payload === 'object' && action.payload !== null
        ? (action.payload as any).clientName
        : undefined;
      const clientPhone = typeof action.payload === 'object' && action.payload !== null
        ? (action.payload as any).clientPhone
        : undefined;
      const clientAddress = typeof action.payload === 'object' && action.payload !== null
        ? (action.payload as any).clientAddress
        : undefined;

      state.leadId = leadId;

      if (leadId) {
        // Pre-fill client info from lead if provided
        if (clientName) state.clientInfo.name = clientName;
        if (clientPhone) state.clientInfo.phone = clientPhone;
        if (clientAddress) state.clientInfo.address = clientAddress;

        const leadQuotations = state.savedQuotations
          .filter(q => q.leadId === leadId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        if (leadQuotations.length > 0) {
          const recent = leadQuotations[0];
          state.clientInfo = recent.clientInfo;
          state.quotationDetails = recent.quotationDetails;
          state.quotationItems = products
            ? normalizeQuotationItemsWithCatalog(recent.quotationItems, products)
            : recent.quotationItems;
          state.transportationLocation = recent.transportationLocation;
          state.transportationCost = recent.transportationCost;
          state.hasDiscount = recent.hasDiscount;
          state.discountAmount = recent.discountAmount;
          state.globalSeriesId = recent.globalSeriesId;
          state.globalSeriesName = recent.globalSeriesName;
        } else {
          const { savedQuotations } = state;
          state.clientInfo = { name: clientName || '', phone: clientPhone || '', email: '', address: clientAddress || '', projectLocation: 'Inside Dhaka' };
          state.quotationDetails = { ...initialState.quotationDetails, quotationNumber: `QT-${Date.now()}` };
          state.quotationItems = [];
          state.transportationLocation = 'inside';
          state.transportationCost = null;
          state.hasDiscount = false;
          state.discountAmount = 0;
          state.globalSeriesId = undefined;
          state.globalSeriesName = undefined;
          state.savedQuotations = savedQuotations;
          syncStateToSaved(state);
        }
      }
    },
    saveCurrentQuotation: (state, action: PayloadAction<{ id: string }>) => {
      syncStateToSaved(state, action.payload.id);
    },
    createQuotationVariants: (state, action: PayloadAction<CreateQuotationVariantsPayload>) => {
      const { sourceQuotationId, globalSeriesIds, products, globalSeries } = action.payload;
      if (!state.leadId || globalSeriesIds.length === 0) return;

      const currentQuotation = buildCurrentSavedQuotation(state);
      if (!currentQuotation) return;

      let baseQuotation = sourceQuotationId
        ? state.savedQuotations.find(q => q.id === sourceQuotationId)
        : state.savedQuotations.find(q => q.id === currentQuotation.id);

      if (!baseQuotation) {
        state.savedQuotations.push(currentQuotation);
        baseQuotation = currentQuotation;
      }

      if (baseQuotation.variantType === 'series' && baseQuotation.variantGroupId) {
        baseQuotation = state.savedQuotations.find(
          q => q.variantGroupId === baseQuotation?.variantGroupId && q.variantType === 'base',
        ) ?? baseQuotation;
      }

      const variantGroupId = baseQuotation.variantGroupId ?? `${baseQuotation.id}-variants`;
      const baseIndex = state.savedQuotations.findIndex(q => q.id === baseQuotation!.id);
      const markedBase: SavedQuotation = {
        ...baseQuotation, variantGroupId, variantType: 'base',
        variantName: baseQuotation.variantName ?? 'Base',
        updatedAt: new Date().toISOString(),
      };

      if (baseIndex !== -1) state.savedQuotations[baseIndex] = markedBase;
      else state.savedQuotations.push(markedBase);

      globalSeriesIds.forEach(globalSeriesId => {
        const targetGlobalSeries = globalSeries.find(s => s.id === globalSeriesId && s.isActive);
        if (!targetGlobalSeries) return;
        const existingIndex = state.savedQuotations.findIndex(
          q => q.variantGroupId === variantGroupId && q.variantType === 'series' && q.globalSeriesId === globalSeriesId,
        );
        const existingVariant = existingIndex !== -1 ? state.savedQuotations[existingIndex] : undefined;
        const variant = createSeriesQuotationVariant(markedBase, products, targetGlobalSeries, variantGroupId, existingVariant);
        if (existingIndex !== -1) state.savedQuotations[existingIndex] = variant;
        else state.savedQuotations.push(variant);
      });
    },
    addSavedQuotation: (state, action: PayloadAction<SavedQuotation>) => {
      state.savedQuotations.push(action.payload);
    },
    reorderQuotationItem: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= state.quotationItems.length || toIndex >= state.quotationItems.length || fromIndex === toIndex) return;
      const [moved] = state.quotationItems.splice(fromIndex, 1);
      state.quotationItems.splice(toIndex, 0, moved);
    },
    deleteSavedQuotation: (state, action: PayloadAction<string>) => {
      state.savedQuotations = state.savedQuotations.filter(q => q.id !== action.payload);
    },
    loadSavedQuotation: (state, action: PayloadAction<LoadSavedQuotationPayload>) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      const products = typeof action.payload === 'object' ? action.payload.products : undefined;
      const quotation = state.savedQuotations.find(q => q.id === id);
      if (quotation) {
        state.clientInfo = quotation.clientInfo;
        state.quotationDetails = quotation.quotationDetails;
        state.quotationItems = products
          ? normalizeQuotationItemsWithCatalog(quotation.quotationItems, products)
          : quotation.quotationItems;
        state.transportationLocation = quotation.transportationLocation;
        state.transportationCost = quotation.transportationCost;
        state.hasDiscount = quotation.hasDiscount;
        state.discountAmount = quotation.discountAmount;
        state.globalSeriesId = quotation.globalSeriesId;
        state.globalSeriesName = quotation.globalSeriesName;
        state.leadId = quotation.leadId;
      }
    },
    resetQuotation: state => {
      const { savedQuotations } = state;
      return {
        ...initialState,
        savedQuotations,
        quotationDetails: { ...initialState.quotationDetails, quotationNumber: `QT-${Date.now()}` },
      };
    },
  },
});

export const {
  setClientInfo, setQuotationDetails, setQuotationItems, addQuotationItem,
  updateQuotationItem, removeQuotationItem, setTransportationLocation,
  setHasDiscount, setDiscountAmount, setTransportationCost, setGlobalSeries,
  setLeadId, saveCurrentQuotation, createQuotationVariants, addSavedQuotation,
  reorderQuotationItem, deleteSavedQuotation, loadSavedQuotation, resetQuotation,
} = quotationSlice.actions;

export default quotationSlice.reducer;
