'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { quotationStore, quotationPersistor } from '@/store';

export function QuotationStoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={quotationStore}>
      <PersistGate loading={null} persistor={quotationPersistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
