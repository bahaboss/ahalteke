import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { OfflineIndicator } from './components/common';
import { router } from './router';
import { AppStoreProvider } from './store';

export default function App() {
  return (
    <AppStoreProvider>
      <RouterProvider router={router} />
      <OfflineIndicator />
    </AppStoreProvider>
  );
}
