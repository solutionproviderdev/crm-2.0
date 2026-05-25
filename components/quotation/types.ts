export type QuotationQuantityType = 'SQFT' | 'NOS' | 'JOB';

export interface QuotationItem {
  id: string;
  isManual?: boolean;
  productId: string;
  productName: string;
  specificationId: string;
  seriesId: string;
  globalSeriesId?: string;
  seriesName: string;
  applicationArea: string;
  applicationName: string;
  quantityType?: QuotationQuantityType;
  quantity?: number;
  unitPrice?: number;
  sqft: number;
  pricePerSqft: number;
  totalPrice: number;
  description?: string;
  note?: string;
  specification?: {
    _id: string;
    configs: {
      front?: { board: unknown; edging: unknown; surface: unknown; };
      bodyStructure?: { board: unknown; edging: unknown; surface: unknown; };
    };
    series: { _id: string; name: string; description: string; image: string; };
    surface: { _id: string; name: string; description: string; image: string; };
    hasFront: boolean;
    hasBodyStructure: boolean;
    hardware: { _id: string; name: string; };
    durability: number;
    waterResistant: number;
    scratchResistant: number;
    screwHoldingCapacity: number;
    warranty: number;
    pricePerSqFt: number;
    images: string[];
  };
}

export interface PreviewQuotationItem {
  id: string;
  isManual?: boolean;
  productName?: string;
  seriesName?: string;
  globalSeriesId?: string;
  applicationArea?: string;
  applicationName?: string;
  quantityType?: QuotationQuantityType;
  quantity?: number;
  unitPrice?: number;
  sqft?: number;
  pricePerSqft: number;
  totalPrice: number;
  description?: string;
  note?: string;
  specification?: {
    surface?: { name: string; };
    configs?: {
      front?: {
        board?: { name: string; thickness?: { value: number; unit: string; }; };
        edging?: { name: string; thickness?: { value: number; unit: string; }; };
      };
      bodyStructure?: {
        board?: { name: string; thickness?: { value: number; unit: string; }; };
        edging?: { name: string; thickness?: { value: number; unit: string; }; };
      };
    };
    hardware?: { name: string; };
    hasFront?: boolean;
    hasBodyStructure?: boolean;
  };
}

export interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  projectLocation: string;
}

export interface QuotationDetails {
  quotationNumber: string;
  date: string;
  validUntil: string;
  notes: string;
  terms: string;
}

export interface SavedQuotation {
  id: string;
  leadId: string;         // ← renamed from projectId
  clientInfo: ClientInfo;
  quotationDetails: QuotationDetails;
  quotationItems: QuotationItem[];
  transportationLocation: 'inside' | 'outside';
  transportationCost: number | null;
  hasDiscount: boolean;
  discountAmount: number;
  globalSeriesId?: string;
  globalSeriesName?: string;
  variantGroupId?: string;
  variantName?: string;
  variantType?: 'base' | 'series';
  createdFromQuotationId?: string;
  variantApplyResult?: {
    updatedCount: number;
    skippedItems: {
      id: string;
      label: string;
      reason: 'manual-unmatched' | 'missing-product' | 'target-series-unavailable';
    }[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface QuotationPreviewProps {
  clientInfo: ClientInfo;
  quotationDetails: QuotationDetails;
  quotationItems: PreviewQuotationItem[];
  subtotal: number;
  transportation: number;
  discount: number;
  total: number;
  dataPrintContent?: boolean;
  lowerInkMode?: boolean;
  showDate?: boolean;
  showPageNumber?: boolean;
}

export const getQuotationQuantityType = (
  item: Pick<QuotationItem, 'quantityType'> | Pick<PreviewQuotationItem, 'quantityType'>,
): QuotationQuantityType => item.quantityType ?? 'SQFT';

export const calculateQuotationItemTotal = (
  item: Pick<QuotationItem, 'quantityType' | 'sqft' | 'pricePerSqft' | 'quantity' | 'unitPrice' | 'totalPrice'>,
) => {
  const quantityType = getQuotationQuantityType(item);
  if (quantityType === 'NOS') {
    return (Number(item.quantity) || 0) * (Number(item.unitPrice ?? item.pricePerSqft) || 0);
  }
  if (quantityType === 'JOB') {
    return Number(item.unitPrice ?? item.pricePerSqft ?? item.totalPrice) || 0;
  }
  return (Number(item.sqft) || 0) * (Number(item.pricePerSqft) || 0);
};

export const normalizeQuotationItemQuantity = (item: QuotationItem): QuotationItem => {
  const quantityType = getQuotationQuantityType(item);
  const unitPrice =
    quantityType === 'JOB'
      ? Number(item.unitPrice ?? item.pricePerSqft ?? item.totalPrice) || 0
      : Number(item.unitPrice ?? item.pricePerSqft) || 0;
  const normalizedItem: QuotationItem = {
    ...item,
    quantityType,
    quantity: quantityType === 'JOB' ? 1 : Number(item.quantity ?? 1) || 0,
    unitPrice,
    pricePerSqft: Number(item.pricePerSqft ?? unitPrice) || 0,
    sqft: Number(item.sqft) || 0,
  };
  return { ...normalizedItem, totalPrice: calculateQuotationItemTotal(normalizedItem) };
};
