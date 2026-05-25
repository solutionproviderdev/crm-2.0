'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Plus, User, Phone, MapPin, Layers, Wand2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { QuotationRootState } from '@/store';
import { GlobalSeries, Product, ProductSeries } from '@/store/slices/products';
import {
  setClientInfo, setQuotationDetails, addQuotationItem, updateQuotationItem,
  removeQuotationItem, setTransportationLocation, setHasDiscount, setDiscountAmount,
  setTransportationCost, setLeadId, setGlobalSeries, setQuotationItems,
  applyGlobalSeriesToQuotationItems, reorderQuotationItem,
} from '@/store/slices/quotation';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectWithIcon } from '@/components/ui/select-with-icon';
import {
  QuotationItem, ClientInfo, QuotationDetails, QuotationQuantityType,
  calculateQuotationItemTotal,
} from './types';
import QuotationItemCard from './QuotationItemCard';
import { LeadSearchSelect } from './LeadSearchSelect';
import { toast } from 'sonner';
import { FolderOpen } from 'lucide-react';

interface QuotationFormProps {
  onDataChange: (data: {
    clientInfo: ClientInfo;
    quotationDetails: QuotationDetails;
    quotationItems: QuotationItem[];
    totals: { subtotal: number; transportation: number; discount: number; total: number; };
  }) => void;
}

const QuotationForm: React.FC<QuotationFormProps> = ({ onDataChange }) => {
  const dispatch = useDispatch();
  const [hasPendingGlobalSeriesApply, setHasPendingGlobalSeriesApply] = useState(false);
  const [selectedLeadName, setSelectedLeadName] = useState('');

  const {
    clientInfo, quotationDetails, quotationItems, transportationLocation,
    transportationCost, hasDiscount, discountAmount, leadId, globalSeriesId,
  } = useSelector((state: QuotationRootState) => state.quotation);

  const products = useSelector((state: QuotationRootState) => state.products.products);
  const globalSeries = useSelector((state: QuotationRootState) =>
    (state.products.globalSeries as GlobalSeries[])
      .filter((s: GlobalSeries) => s.isActive)
      .sort((a: GlobalSeries, b: GlobalSeries) => a.sortOrder - b.sortOrder),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = quotationItems.findIndex((i: QuotationItem) => i.id === active.id);
    const toIndex = quotationItems.findIndex((i: QuotationItem) => i.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) dispatch(reorderQuotationItem({ fromIndex, toIndex }));
  };

  const handleAddCustomItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(), isManual: true, productId: '', productName: '',
      specificationId: '', seriesId: '', globalSeriesId: '', seriesName: '',
      applicationArea: '', applicationName: '', quantityType: 'SQFT',
      quantity: 1, unitPrice: 0, sqft: 0, pricePerSqft: 0, totalPrice: 0,
      description: '', note: '',
    };
    dispatch(addQuotationItem(newItem));
  };

  const handleRemoveQuotationItem = (id: string) => {
    if (quotationItems.length > 1) dispatch(removeQuotationItem(id));
  };

  const calculateSubtotal = useCallback(() =>
    quotationItems.reduce((sum: number, item: QuotationItem) => sum + item.totalPrice, 0),
    [quotationItems],
  );

  const calculateTransportationCost = useCallback(() =>
    transportationLocation === 'inside' ? 5500 : 15500,
    [transportationLocation],
  );

  const totals = useMemo(() => {
    const subtotal = calculateSubtotal();
    const transportation = transportationCost !== null ? transportationCost : calculateTransportationCost();
    const discount = hasDiscount ? discountAmount : 0;
    return { subtotal, transportation, discount, total: subtotal + transportation - discount };
  }, [calculateSubtotal, calculateTransportationCost, transportationCost, hasDiscount, discountAmount]);

  useEffect(() => {
    onDataChange({ clientInfo, quotationDetails, quotationItems, totals });
  }, [clientInfo, quotationDetails, quotationItems, totals, onDataChange]);

  const handleQuantityFieldChange = (index: number, changes: Partial<QuotationItem>) => {
    const item = quotationItems[index];
    if (!item) return;
    const nextItem = { ...item, ...changes };
    dispatch(updateQuotationItem({ id: item.id, changes: { ...changes, totalPrice: calculateQuotationItemTotal(nextItem) } }));
  };

  const handleQuantityTypeChange = (index: number, quantityType: QuotationQuantityType) => {
    const item = quotationItems[index];
    if (!item) return;
    handleQuantityFieldChange(index, { quantityType, quantity: quantityType === 'JOB' ? 1 : item.quantity ?? 1, unitPrice: item.unitPrice ?? item.pricePerSqft });
  };

  const handleManualFieldChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const item = quotationItems[index];
    if (!item) return;
    dispatch(updateQuotationItem({ id: item.id, changes: { [field]: value } }));
  };

  const handleProductSelect = (index: number, product: Product, series: ProductSeries) => {
    const item = quotationItems[index];
    if (!item) return;
    const quantityType = item.quantityType ?? 'SQFT';
    const rateChanges = quantityType === 'SQFT'
      ? { pricePerSqft: series.pricePerSqft, unitPrice: series.pricePerSqft }
      : { unitPrice: series.pricePerSqft, pricePerSqft: series.pricePerSqft };
    const nextItem = { ...item, ...rateChanges };
    dispatch(updateQuotationItem({
      id: item.id,
      changes: {
        isManual: false, productId: product.id, productName: product.name,
        seriesId: series.id, globalSeriesId: series.globalSeriesId, seriesName: series.name,
        ...rateChanges, totalPrice: calculateQuotationItemTotal(nextItem),
        description: series.description, note: series.note ?? '',
        applicationName: product.name,
      },
    }));
  };

  const handleGlobalSeriesChange = (id: string) => {
    const selected = globalSeries.find((s: GlobalSeries) => s.id === id);
    dispatch(setGlobalSeries(selected ? { id: selected.id, name: selected.name } : null));
    setHasPendingGlobalSeriesApply(Boolean(selected));
  };

  const handleApplyGlobalSeries = () => {
    if (!globalSeriesId) { toast.error('Please select a global series first.'); return; }
    const selectedSeriesName = globalSeries.find((s: GlobalSeries) => s.id === globalSeriesId)?.name ?? 'Selected series';
    const result = applyGlobalSeriesToQuotationItems(quotationItems, products, globalSeriesId);
    dispatch(setQuotationItems(result.items));
    const skippedSummary = result.skippedItems.map(item => {
      const reason = item.reason === 'manual-unmatched' ? 'Manual/unmatched item'
        : item.reason === 'missing-product' ? 'Product not selected/found'
        : `${selectedSeriesName} not available`;
      return `- ${item.label}: ${reason}`;
    }).join('\n');
    const skippedCount = result.skippedItems.length;
    const message = `${result.updatedCount} item${result.updatedCount === 1 ? '' : 's'} updated. ${skippedCount} item${skippedCount === 1 ? '' : 's'} skipped.`;
    if (skippedCount > 0) toast.warning(message, { description: skippedSummary || undefined });
    else toast.success(message);
    setHasPendingGlobalSeriesApply(false);
  };

  return (
    <div className="p-3 lg:p-4">
      {/* Client Information Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Lead Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">
                Associated Lead
              </label>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <LeadSearchSelect
                    value={leadId}
                    selectedName={selectedLeadName || clientInfo.name}
                    onSelect={(lead) => {
                      setSelectedLeadName(lead.name);
                      dispatch(setLeadId({
                        leadId: lead.id,
                        products,
                        clientName: lead.name,
                        clientPhone: lead.phone,
                        clientAddress: lead.address,
                      }));
                    }}
                    onClear={() => {
                      setSelectedLeadName('');
                      dispatch(setLeadId(null));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Client Name</label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input
                  value={clientInfo.name}
                  onChange={e => dispatch(setClientInfo({ name: e.target.value }))}
                  placeholder="Enter client name"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone Number</label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input
                  value={clientInfo.phone}
                  onChange={e => dispatch(setClientInfo({ phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={clientInfo.email}
                  onChange={e => dispatch(setClientInfo({ email: e.target.value }))}
                  placeholder="Enter email address"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>

            {/* Transportation Location */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Project Location</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <select
                  value={transportationLocation}
                  onChange={e => dispatch(setTransportationLocation(e.target.value as 'inside' | 'outside'))}
                  className="flex-1 h-8 text-sm px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="inside">Inside Dhaka (৳5,500)</option>
                  <option value="outside">Outside Dhaka (৳15,500)</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Address</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Input
                  value={clientInfo.address}
                  onChange={e => dispatch(setClientInfo({ address: e.target.value }))}
                  placeholder="Enter full address"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>

            {/* Quotation Details */}
            <div className="lg:col-span-2 mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-3">Quotation Details</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Quotation Number</label>
                  <Input
                    value={quotationDetails.quotationNumber}
                    onChange={e => dispatch(setQuotationDetails({ quotationNumber: e.target.value }))}
                    placeholder="QT-001"
                    className="h-8 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Date</label>
                  <Input
                    type="date"
                    value={quotationDetails.date}
                    onChange={e => dispatch(setQuotationDetails({ date: e.target.value }))}
                    className="h-8 text-sm w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Products &amp; Services</CardTitle>
            <div className="flex items-end gap-2 flex-wrap print:hidden rounded-lg border border-border bg-muted/20 px-2.5 py-2">
              <div className="min-w-[190px]">
                <SelectWithIcon
                  id="quotation-global-series"
                  label="Global Series"
                  icon={Layers}
                  value={globalSeriesId || ''}
                  onChange={handleGlobalSeriesChange}
                  options={[
                    { value: '', label: 'Select series...' },
                    ...globalSeries.map((s: GlobalSeries) => ({ value: s.id, label: s.name })),
                  ]}
                />
              </div>
              {hasPendingGlobalSeriesApply && globalSeriesId && (
                <Button onClick={handleApplyGlobalSeries} size="sm" variant="default" className="h-8 text-xs shadow-sm">
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  Apply to all items
                </Button>
              )}
              <Button onClick={handleAddCustomItem} size="sm" variant="outline" className="print:hidden h-8 text-xs border-primary/50 text-primary hover:bg-primary/10">
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={quotationItems.map((i: QuotationItem) => i.id)} strategy={verticalListSortingStrategy}>
                {quotationItems.map((item: QuotationItem, index: number) => (
                  <QuotationItemCard
                    key={item.id} item={item} index={index} totalItemsCount={quotationItems.length}
                    products={products} onRemove={handleRemoveQuotationItem}
                    onManualFieldChange={handleManualFieldChange}
                    onQuantityFieldChange={handleQuantityFieldChange}
                    onQuantityTypeChange={handleQuantityTypeChange}
                    onProductSelect={handleProductSelect}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {quotationItems.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                No items added yet. Click &quot;Add Item&quot; to begin.
              </div>
            )}
          </div>
          <div className="mt-3 print:hidden">
            <Button onClick={handleAddCustomItem} size="sm" variant="outline" className="w-full h-8 text-xs border-violet-400 text-violet-700 hover:text-violet-800 hover:bg-violet-50">
              <Plus className="w-3 h-3 mr-1" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">Transportation Cost (৳)</label>
                {transportationCost !== null && (
                  <button type="button" onClick={() => dispatch(setTransportationCost(null))}
                    className="text-xs text-violet-600 hover:text-violet-800 underline print:hidden">
                    Reset to auto ({calculateTransportationCost().toLocaleString()})
                  </button>
                )}
              </div>
              <Input
                type="number"
                value={transportationCost !== null ? transportationCost : calculateTransportationCost()}
                onChange={e => dispatch(setTransportationCost(Number(e.target.value)))}
                className="w-full text-sm h-8 print:hidden"
                placeholder="Enter transportation cost"
                min="0"
              />
              {transportationCost !== null && (
                <p className="text-[10px] text-violet-600 mt-0.5 print:hidden">
                  Custom value — auto was ৳{calculateTransportationCost().toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox" id="discount-checkbox" checked={hasDiscount}
                onChange={e => dispatch(setHasDiscount(e.target.checked))}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="discount-checkbox" className="text-xs font-medium text-foreground">Apply Discount</label>
            </div>

            {hasDiscount && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Discount Amount (৳)</label>
                <Input
                  type="number" value={discountAmount || ''}
                  onChange={e => dispatch(setDiscountAmount(Number(e.target.value)))}
                  className="w-full text-sm h-8" placeholder="Enter discount amount" min="0"
                />
              </div>
            )}
          </div>

          <div className="space-y-1 mt-4 pt-3 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">৳{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transportation:</span>
              <span className="font-medium">৳{totals.transportation.toLocaleString()}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium text-red-600">-৳{totals.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border mt-2">
              <span className="text-foreground">Total:</span>
              <span className="text-foreground">৳{totals.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationForm;
