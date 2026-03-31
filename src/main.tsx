import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.tsx';
import { BookingModalProvider } from '@/components/BookingModalProvider';
import { routerBasename } from '@/lib/site';
import { AdminAuthProvider } from '@/auth/AdminAuthContext';

const basename = routerBasename();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename}>
        <AdminAuthProvider>
          <BookingModalProvider>
            <App />
          </BookingModalProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
