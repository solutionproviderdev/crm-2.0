import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

const createNoopStorage = () => ({
  getItem(_key: string) { return Promise.resolve(null); },
  setItem(_key: string, value: string) { return Promise.resolve(value); },
  removeItem(_key: string) { return Promise.resolve(); },
});

// Dynamically import storage only on client side to avoid SSR issues
const storage =
  typeof window !== 'undefined'
    ? require('redux-persist/lib/storage').default
    : createNoopStorage();

import quotationReducer from './slices/quotation';
import productsReducer from './slices/products';

const rootReducer = combineReducers({
  quotation: quotationReducer,
  products: productsReducer,
});

const persistedReducer = persistReducer(
  {
    key: 'crm-quotation',
    storage,
    whitelist: ['quotation', 'products'],
    stateReconciler: autoMergeLevel2,
  },
  rootReducer as any,
);

export const quotationStore = configureStore({
  reducer: persistedReducer as any,
  middleware: getDefault => getDefault({ serializableCheck: false }),
});

export const quotationPersistor = persistStore(quotationStore);

export type QuotationRootState = ReturnType<typeof quotationStore.getState>;
export type QuotationAppDispatch = typeof quotationStore.dispatch;
