import { QuotationStoreProvider } from '@/components/quotation/QuotationStoreProvider';

export default function QuotationsLayout({ children }: { children: React.ReactNode }) {
  return <QuotationStoreProvider>{children}</QuotationStoreProvider>;
}
