import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { PreferencesProvider } from './lib/preferences';
import { NotFoundPage } from './pages/NotFoundPage';
import { ResultsPage } from './pages/ResultsPage';
import { SearchPage } from './pages/SearchPage';
import '@fontsource-variable/manrope';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SearchPage />} />
          <Route path="hotels" element={<ResultsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </PreferencesProvider>
  </StrictMode>,
);
