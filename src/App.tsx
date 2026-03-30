import { Route, Routes, ScrollRestoration } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import PackageListingPage from '@/pages/PackageListingPage';
import PackageDetailPage from '@/pages/PackageDetailPage';
import AdventureListingPage from '@/pages/AdventureListingPage';
import AdventureDetailPage from '@/pages/AdventureDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <>
      <ScrollRestoration />
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
