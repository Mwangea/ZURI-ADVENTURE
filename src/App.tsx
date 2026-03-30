import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import PackageListingPage from '@/pages/PackageListingPage';
import PackageDetailPage from '@/pages/PackageDetailPage';
import AdventureListingPage from '@/pages/AdventureListingPage';
import AdventureDetailPage from '@/pages/AdventureDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';

/** BrowserRouter does not support ScrollRestoration (data router only); reset scroll on route changes. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/packages" element={<PackageListingPage />} />
        <Route path="/packages/:slug" element={<PackageDetailPage />} />
        <Route path="/adventures" element={<AdventureListingPage />} />
        <Route path="/adventures/:slug" element={<AdventureDetailPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
