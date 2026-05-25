'use client';

import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Group as PanelGroup, Panel as ResizablePanel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import {
  Printer, Eye, EyeOff, Droplets, Calendar, Hash, RotateCcw,
  GitCompare, GitBranchPlus, Layers, Check,
} from 'lucide-react';
import { QuotationRootState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { resetQuotation, createQuotationVariants, loadSavedQuotation } from '@/store/slices/quotation';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import QuotationPreview from '@/components/quotation/QuotationPreview';
import QuotationForm from '@/components/quotation/QuotationForm';
import QuotationVariantComparison from '@/components/quotation/QuotationVariantComparison';
import { QuotationItem, PreviewQuotationItem, SavedQuotation } from '@/components/quotation/types';
import { GlobalSeries } from '@/store/slices/products';
import { toast } from 'sonner';

const convertToPreviewItem = (item: QuotationItem): PreviewQuotationItem => ({
  id: item.id, isManual: item.isManual, description: item.description, note: item.note,
  productName: item.productName, seriesName: item.seriesName, globalSeriesId: item.globalSeriesId,
  applicationArea: item.applicationArea, applicationName: item.applicationName,
  quantityType: item.quantityType, quantity: item.quantity, unitPrice: item.unitPrice,
  sqft: item.sqft, pricePerSqft: item.pricePerSqft, totalPrice: item.totalPrice,
});

const getSavedQuotationTotal = (quotation: SavedQuotation) => {
  const subtotal = quotation.quotationItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const transportation = quotation.transportationCost !== null
    ? quotation.transportationCost
    : quotation.transportationLocation === 'inside' ? 5500 : 15500;
  const discount = quotation.hasDiscount ? quotation.discountAmount : 0;
  return subtotal + transportation - discount;
};

const formatCurrency = (value: number) => `৳${Math.round(value || 0).toLocaleString()}`;

const getVariantDisplayName = (quotation?: SavedQuotation) => {
  if (!quotation) return 'Base';
  if (quotation.variantType === 'base') return quotation.variantName || 'Base';
  return quotation.variantName || quotation.globalSeriesName || quotation.quotationDetails.quotationNumber;
};

const getCurrentVariantGroup = (savedQuotations: SavedQuotation[], currentQuotationId: string, currentVariantGroupId?: string) => {
  if (currentVariantGroupId) return currentVariantGroupId;
  const currentSaved = savedQuotations.find(q => q.id === currentQuotationId);
  if (currentSaved?.variantGroupId) return currentSaved.variantGroupId;
  const generatedVariant = savedQuotations.find(
    q => q.createdFromQuotationId === currentQuotationId && q.variantGroupId,
  );
  return generatedVariant?.variantGroupId;
};

const getVariantsForCurrentQuotation = (savedQuotations: SavedQuotation[], currentQuotationId: string, currentVariantGroupId?: string) => {
  const variantGroupId = getCurrentVariantGroup(savedQuotations, currentQuotationId, currentVariantGroupId);
  if (!variantGroupId) return [];
  return savedQuotations
    .filter(q => q.variantGroupId === variantGroupId)
    .sort((a, b) => {
      if (a.variantType === 'base') return -1;
      if (b.variantType === 'base') return 1;
      return getVariantDisplayName(a).localeCompare(getVariantDisplayName(b));
    });
};

const CreateQuotation: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const [showPreview, setShowPreview] = useState(true);
  const [lowerInkMode, setLowerInkMode] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showPageNumber, setShowPageNumber] = useState(true);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedVariantSeriesIds, setSelectedVariantSeriesIds] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<'preview' | 'compare'>('preview');

  const quotationData = useSelector((state: QuotationRootState) => state.quotation);
  const products = useSelector((state: QuotationRootState) => state.products.products);
  const activeGlobalSeries = useSelector((state: QuotationRootState) =>
    (state.products.globalSeries as GlobalSeries[])
      .filter(s => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );

  const savedQuotations = quotationData.savedQuotations as SavedQuotation[];
  const currentQuotationId = quotationData.quotationDetails.quotationNumber;
  const currentSavedQuotation = savedQuotations.find(q => q.id === currentQuotationId);
  const currentVariantGroupId = getCurrentVariantGroup(savedQuotations, currentQuotationId, currentSavedQuotation?.variantGroupId);
  const availableVariants = getVariantsForCurrentQuotation(savedQuotations, currentQuotationId, currentVariantGroupId);
  const baseVariantQuotation = currentVariantGroupId
    ? savedQuotations.find(q => q.variantGroupId === currentVariantGroupId && q.variantType === 'base')
    : undefined;
  const comparisonVariants = currentVariantGroupId
    ? savedQuotations.filter(q => q.variantGroupId === currentVariantGroupId && q.variantType === 'series')
    : [];
  const canCompare = Boolean(baseVariantQuotation && comparisonVariants.length > 0);
  const canChangeVariant = availableVariants.length > 1;
  const currentVariantLabel = getVariantDisplayName(currentSavedQuotation);

  const subtotal = quotationData.quotationItems.reduce((sum: number, item: QuotationItem) => sum + item.totalPrice, 0);
  const transportation = quotationData.transportationCost !== null
    ? quotationData.transportationCost
    : quotationData.transportationLocation === 'inside' ? 5500 : 15500;
  const discount = quotationData.hasDiscount ? quotationData.discountAmount : 0;
  const total = subtotal + transportation - discount;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Quotation-${quotationData.quotationDetails.quotationNumber}`,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      html, body { height: initial !important; overflow: initial !important; -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact; }
      .quotation-print-root { display: block !important; }
      .print-page { display: block !important; position: relative; }
      .print-page + .print-page { page-break-before: always; break-before: page; }
      .page { min-height: unset !important; box-shadow: none !important; margin-bottom: 0 !important; padding: 0 !important; }
    `,
  });

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the quotation? All unsaved changes will be lost.')) {
      dispatch(resetQuotation());
      setPreviewMode('preview');
    }
  };

  const getDefaultVariantSeriesIds = () => {
    const preferredNames = new Set(['premium', 'standard', 'economy']);
    const preferred = activeGlobalSeries.filter(s => preferredNames.has(s.name.trim().toLowerCase())).map(s => s.id);
    return preferred.length > 0 ? preferred : activeGlobalSeries.slice(0, 3).map(s => s.id);
  };

  const handleOpenVariantDialog = () => {
    setSelectedVariantSeriesIds(getDefaultVariantSeriesIds());
    setVariantDialogOpen(true);
  };

  const toggleVariantSeries = (seriesId: string) => {
    setSelectedVariantSeriesIds(current =>
      current.includes(seriesId) ? current.filter(id => id !== seriesId) : [...current, seriesId],
    );
  };

  const handleGenerateVariants = () => {
    if (!quotationData.leadId) { toast.error('Please select a lead before creating variants.'); return; }
    if (quotationData.quotationItems.length === 0) { toast.error('Add quotation items before creating variants.'); return; }
    if (selectedVariantSeriesIds.length === 0) { toast.error('Select at least one series.'); return; }
    dispatch(createQuotationVariants({ globalSeriesIds: selectedVariantSeriesIds, products, globalSeries: activeGlobalSeries }));
    setVariantDialogOpen(false);
    setPreviewMode('compare');
    toast.success(`${selectedVariantSeriesIds.length} variant${selectedVariantSeriesIds.length === 1 ? '' : 's'} created.`);
  };

  const handleOpenSavedQuotation = (id: string, loadedName?: string) => {
    dispatch(loadSavedQuotation({ id, products }));
    setPreviewMode('preview');
    if (loadedName) toast.success(`${loadedName} variant loaded`);
  };

  const toggleButtonClass = (active: boolean) =>
    `h-8 w-8 p-0 text-xs border-slate-200 ${active ? 'bg-slate-100 text-slate-900 hover:bg-slate-100 border-slate-300' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`;

  const ActionToolbar = () => (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-200 print:hidden shrink-0 flex-wrap">
      <div className="flex items-center gap-2 min-w-fit">
        <Button onClick={handleReset} variant="outline" size="sm" className="h-8 w-8 rounded-md p-0 text-slate-700 border-slate-200 bg-white hover:bg-slate-50" title="New quotation">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <div className="flex h-8 items-center rounded-md border border-emerald-100 bg-emerald-50 px-2.5 text-[11px] font-medium text-emerald-700">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Auto-saved
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-1.5 min-w-[240px]">
        <Button onClick={() => setShowDate(!showDate)} variant="outline" size="sm" className={toggleButtonClass(showDate)} title="Toggle date"><Calendar className="w-3.5 h-3.5" /></Button>
        <Button onClick={() => setShowPageNumber(!showPageNumber)} variant="outline" size="sm" className={toggleButtonClass(showPageNumber)} title="Toggle page number"><Hash className="w-3.5 h-3.5" /></Button>
        <Button onClick={() => setLowerInkMode(!lowerInkMode)} variant="outline" size="sm" className={toggleButtonClass(lowerInkMode)} title="Toggle lower ink mode"><Droplets className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="flex items-center justify-end gap-2 min-w-fit">
        <div className="flex h-8 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          <Button type="button" onClick={() => setPreviewMode('preview')} variant="ghost" size="sm"
            className={`h-8 w-8 rounded-none border-0 p-0 text-xs ${previewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`} title="Preview">
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" onClick={() => canCompare && setPreviewMode('compare')} variant="ghost" size="sm"
            className={`h-8 w-8 rounded-none border-0 p-0 text-xs ${previewMode === 'compare' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            disabled={!canCompare} title="Compare variants">
            <GitCompare className="w-3.5 h-3.5" />
          </Button>
        </div>
        {canChangeVariant && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 rounded-md p-0 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50" title={`Change variant: ${currentVariantLabel}`}>
                <Layers className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-xs text-slate-500">Change Variant</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableVariants.map(variant => {
                const isCurrent = variant.id === currentQuotationId;
                const variantName = getVariantDisplayName(variant);
                const skippedCount = variant.variantApplyResult?.skippedItems.length ?? 0;
                return (
                  <DropdownMenuItem key={variant.id} disabled={isCurrent} onSelect={() => handleOpenSavedQuotation(variant.id, variantName)} className="items-start gap-2 py-2">
                    <div className="mt-0.5 h-4 w-4 shrink-0">{isCurrent && <Check className="h-4 w-4 text-slate-900" />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">{variantName}</span>
                        <span className="text-xs font-semibold text-slate-700">{formatCurrency(getSavedQuotationTotal(variant))}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className={`rounded-full border px-1.5 py-0.5 font-medium ${variant.variantType === 'base' ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                          {variant.variantType === 'base' ? 'Base' : 'Variant'}
                        </span>
                        {variant.globalSeriesName && <span className="truncate">{variant.globalSeriesName}</span>}
                        {skippedCount > 0 && <span className="text-amber-700">{skippedCount} skipped</span>}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm" className="h-8 w-8 rounded-md border-slate-200 bg-white p-0 text-slate-600 hover:bg-slate-50 hover:text-slate-900" title={showPreview ? 'Hide preview' : 'Show preview'}>
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
        <Button type="button" onClick={handleOpenVariantDialog} variant="outline" size="sm" className="h-8 w-8 rounded-md p-0 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:bg-slate-50"
          disabled={!quotationData.leadId || quotationData.quotationItems.length === 0} title="Create variant">
          <GitBranchPlus className="w-3.5 h-3.5" />
        </Button>
        <Button onClick={handlePrint} variant="default" size="sm" className="h-8 w-8 rounded-md p-0 text-xs bg-slate-900 text-white hover:bg-slate-800" title="Print">
          <Printer className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-85px)] bg-gray-50 print:p-0 print:bg-white overflow-hidden font-segoe">
      <PanelGroup orientation="horizontal" id="quotation-split" className="h-full">
        <ResizablePanel minSize={30} defaultSize={showPreview ? 50 : 100} className="h-full bg-white print:w-full flex flex-col">
          <div className="flex-1 overflow-auto scroll-smooth print:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <QuotationForm onDataChange={() => {}} />
          </div>
        </ResizablePanel>

        {showPreview && (
          <>
            <PanelResizeHandle className="w-1.5 mx-0.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded cursor-col-resize transition-colors print:hidden" />
            <ResizablePanel minSize={30} defaultSize={50} className="print:hidden flex flex-col">
              <ActionToolbar />
              <div className="flex-1 bg-gray-100 p-3 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-white rounded-lg shadow-sm overflow-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {previewMode === 'compare' && baseVariantQuotation ? (
                      <QuotationVariantComparison baseQuotation={baseVariantQuotation} variants={comparisonVariants} onOpenVariant={handleOpenSavedQuotation} />
                    ) : (
                      <QuotationPreview
                        clientInfo={quotationData.clientInfo} quotationDetails={quotationData.quotationDetails}
                        quotationItems={quotationData.quotationItems.map(convertToPreviewItem)}
                        subtotal={subtotal} transportation={transportation} discount={discount} total={total}
                        dataPrintContent={true} lowerInkMode={lowerInkMode} showDate={showDate} showPageNumber={showPageNumber}
                      />
                    )}
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}

        {!showPreview && (
          <div className="absolute top-0 right-0 z-20 print:hidden">
            <ActionToolbar />
          </div>
        )}
      </PanelGroup>

      {/* Hidden printable version */}
      <div className="absolute -left-[9999px] top-0 w-[210mm] pointer-events-none" aria-hidden="true">
        <QuotationPreview
          ref={printRef}
          clientInfo={quotationData.clientInfo} quotationDetails={quotationData.quotationDetails}
          quotationItems={quotationData.quotationItems.map(convertToPreviewItem)}
          subtotal={subtotal} transportation={transportation} discount={discount} total={total}
          dataPrintContent={true} lowerInkMode={lowerInkMode} showDate={showDate} showPageNumber={showPageNumber}
        />
      </div>

      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quotation Variants</DialogTitle>
            <DialogDescription>Generate comparison quotations from the current quotation without changing it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {activeGlobalSeries.map(series => (
              <button key={series.id} type="button" onClick={() => toggleVariantSeries(series.id)}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${selectedVariantSeriesIds.includes(series.id) ? 'border-primary bg-primary/5 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${selectedVariantSeriesIds.includes(series.id) ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white'}`}>
                  {selectedVariantSeriesIds.includes(series.id) ? <Check className="h-3 w-3" /> : null}
                </span>
                <Layers className="h-4 w-4 text-slate-500" />
                <span className="font-medium">{series.name}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleGenerateVariants}>Generate Variants</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateQuotation;
