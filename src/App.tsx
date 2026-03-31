import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import PackageListingPage from '@/pages/PackageListingPage';
import PackageDetailPage from '@/pages/PackageDetailPage';
import AdventureListingPage from '@/pages/AdventureListingPage';
import AdventureDetailPage from '@/pages/AdventureDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RequireAdminAuth from '@/components/admin/RequireAdminAuth';
import AdminLayout from '@/layouts/AdminLayout';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminPackagesPage from '@/pages/admin/AdminPackagesPage';
import AdminAdventuresPage from '@/pages/admin/AdminAdventuresPage';
import AdminEnquiriesPage from '@/pages/admin/AdminEnquiriesPage';
import AdminPlaceholderPage from '@/pages/admin/AdminPlaceholderPage';

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
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="tours" element={<AdminPackagesPage />} />
          <Route path="packages" element={<AdminPackagesPage />} />
          <Route path="bookings" element={<AdminEnquiriesPage />} />
          <Route path="adventures" element={<AdminAdventuresPage />} />
          <Route path="enquiries" element={<AdminEnquiriesPage />} />
          <Route path="customers" element={<AdminPlaceholderPage title="Customers" />} />
          <Route path="vehicles" element={<AdminPlaceholderPage title="Vehicles" />} />
          <Route path="payments" element={<AdminPlaceholderPage title="Payments" />} />
          <Route path="reports" element={<AdminPlaceholderPage title="Reports" />} />
          <Route path="settings" element={<AdminPlaceholderPage title="Settings" />} />
        </Route>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
