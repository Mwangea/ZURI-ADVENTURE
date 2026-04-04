import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  Bus,
  ChevronLeft,
  CreditCard,
  FileBarChart2,
  FileText,
  Menu,
  MessageCircle,
  MoreVertical,
  Package,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { AdminConfirmDialogProvider } from '@/components/admin/AdminConfirmDialogContext';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialogContext';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  end?: boolean;
  badge?: string;
};

const primaryItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/packages', label: 'Packages', icon: Package },
  { to: '/admin/adventures', label: 'Adventures', icon: Bus },
  { to: '/admin/enquiries', label: 'Enquiries', icon: MessageCircle },
  { to: '/admin/content', label: 'Content', icon: FileText },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart2 },
];

const secondaryItems: NavItem[] = [
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/vehicles', label: 'Vehicles', icon: LifeBuoy, badge: '2' },
];

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const base =
    'flex items-center rounded-[9px] px-3 py-[9px] text-[13.5px] transition-colors';
  const active = 'bg-kaleo-terracotta text-white';
  const inactive = 'text-kaleo-cream/70 hover:bg-white/10 hover:text-kaleo-cream/95';

  return (
    <>
      <nav className="flex flex-col gap-[2px]">
        {primaryItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `${base} ${isActive ? active : inactive} ${collapsed ? 'justify-center' : 'gap-[11px]'}`}
          >
            <Icon size={15} />
            {!collapsed ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="my-[10px] h-px bg-white/10" />

      <nav className="flex flex-col gap-[2px]">
        {secondaryItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => `${base} ${isActive ? active : inactive} ${collapsed ? 'justify-center' : 'gap-[11px]'}`}
          >
            <Icon size={15} />
            {!collapsed ? <span>{label}</span> : null}
            {!collapsed && badge ? (
              <span className="ml-auto rounded-full bg-kaleo-terracotta px-2 py-[2px] text-[10px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  onLogout,
  adminEmail,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  onLogout: () => void;
  adminEmail: string;
}) {
  const initials = (adminEmail?.trim()?.[0] ?? 'A').toUpperCase();

  return (
    <aside
      className={`flex h-full flex-col bg-kaleo-earth px-[14px] py-[22px] text-kaleo-cream ${
        collapsed ? 'w-[90px]' : 'w-[270px]'
      }`}
    >
      <div className="flex items-center gap-[10px] px-[10px] pb-[18px]">
        <img
          src="/zuri-logo.png"
          alt="Zuri Adventures logo"
          className={collapsed ? 'h-8 w-8 object-contain' : 'h-8 w-8 object-contain'}
        />
        {!collapsed ? (
          <span className="truncate font-display text-[17px] font-bold leading-none">Zuri Adventures</span>
        ) : null}
        <button
          type="button"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          onClick={onToggle}
          className="ml-auto rounded-md p-1 text-kaleo-cream/60 hover:text-kaleo-cream"
        >
          <ChevronLeft size={14} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />

      <button
        type="button"
        onClick={onLogout}
        className={`mt-auto flex items-center rounded-[9px] px-3 py-[10px] text-left hover:bg-white/10 ${
          collapsed ? 'justify-center' : 'gap-2'
        }`}
      >
        <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-kaleo-terracotta text-xs font-bold text-white">
          {initials}
        </div>
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-kaleo-cream/90">Zuri Admin</p>
              <p className="truncate text-[11px] text-kaleo-cream/55">{adminEmail}</p>
            </div>
            <MoreVertical size={14} className="text-kaleo-cream/55" />
          </>
        ) : null}
      </button>
    </aside>
  );
}

function AdminLayoutInner() {
  const { logout, admin, authFetch } = useAdminAuth();
  const { confirm } = useAdminConfirm();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [newEnquiriesCount, setNewEnquiriesCount] = useState(0);
  const [latestEnquiries, setLatestEnquiries] = useState<
    Array<{ id: number; fullName: string; createdAt: string; status: string }>
  >([]);
  const location = useLocation();

  const page = location.pathname.split('/').filter(Boolean).pop() ?? 'dashboard';
  const pageTitle = page.charAt(0).toUpperCase() + page.slice(1);
  const adminEmailRaw = admin?.email?.trim() ?? '';
  const adminEmail = adminEmailRaw.includes('@') ? adminEmailRaw : 'admin@zuri.local';

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmLabel: 'Logout',
      cancelLabel: 'Stay',
    });
    if (!ok) return;
    await logout();
  };

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      try {
        const [newData, latestData] = await Promise.all([
          authFetch<{ page?: { total: number } }>('/api/v1/admin/enquiries?status=NEW&limit=1&offset=0'),
          authFetch<{
          enquiries: Array<{ id: number; fullName: string; createdAt: string; status: string }>;
          }>('/api/v1/admin/enquiries?limit=20&offset=0'),
        ]);
        if (!mounted) return;
        const enquiries = latestData.enquiries ?? [];
        if (mounted) {
          setNewEnquiriesCount(Number(newData.page?.total ?? 0));
          setLatestEnquiries(enquiries.slice(0, 5));
        }
      } catch {
        if (!mounted) return;
        setNewEnquiriesCount(0);
        setLatestEnquiries([]);
      }
    };
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 20000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [authFetch]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onClickOutside = () => setNotificationsOpen(false);
    window.addEventListener('click', onClickOutside);
    return () => {
      window.removeEventListener('click', onClickOutside);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, [notificationsOpen]);

  return (
    <div className="h-screen w-full overflow-hidden bg-kaleo-earth">
      <div className="flex h-full w-full overflow-hidden bg-kaleo-earth">
          <div className="hidden border-r border-kaleo-cream/10 md:block">
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
              onLogout={() => void handleLogout()}
              adminEmail={adminEmail}
            />
          </div>

          {mobileOpen ? (
            <div className="fixed inset-0 z-[95] bg-black/55 md:hidden" onClick={() => setMobileOpen(false)}>
              <div
                className="h-full w-[300px] bg-kaleo-earth"
                onClick={(e) => e.stopPropagation()}
              >
                <Sidebar
                  collapsed={false}
                  onToggle={() => setMobileOpen(false)}
                  onNavigate={() => setMobileOpen(false)}
                  onLogout={() => void handleLogout()}
                  adminEmail={adminEmail}
                />
              </div>
            </div>
          ) : null}

          <div className="m-0 flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-none bg-[#f4f5f7] md:m-2 md:rounded-[14px]">
            <header className="border-b border-kaleo-earth/10 bg-kaleo-cream px-4 py-3 sm:px-7 sm:pt-[18px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    title="Open menu"
                    aria-label="Open menu"
                    onClick={() => setMobileOpen(true)}
                    className="rounded-lg border border-kaleo-earth/20 bg-white p-2 md:hidden"
                  >
                    <Menu size={16} />
                  </button>
                  <p className="text-[12.5px] text-kaleo-earth/45">
                    Home <span className="mx-1 opacity-40">/</span>{' '}
                    <span className="font-semibold text-kaleo-earth">{pageTitle}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      title="Notifications"
                      aria-label="Notifications"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationsOpen((v) => !v);
                      }}
                      className="relative rounded-xl border border-kaleo-earth/20 bg-white p-2 text-kaleo-earth/70"
                    >
                      <Bell size={15} />
                      {newEnquiriesCount > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                          {newEnquiriesCount > 9 ? '9+' : newEnquiriesCount}
                        </span>
                      ) : null}
                    </button>
                    {notificationsOpen ? (
                      <div
                        className="absolute right-0 z-30 mt-2 w-[300px] rounded-xl border border-kaleo-earth/10 bg-white p-3 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-body text-xs uppercase tracking-wider text-kaleo-earth/60">Enquiries</p>
                          <NavLink
                            to="/admin/enquiries"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-xs font-semibold text-kaleo-terracotta"
                          >
                            View all
                          </NavLink>
                        </div>
                        <div className="space-y-2">
                          {latestEnquiries.length ? (
                            latestEnquiries.map((item) => (
                              <NavLink
                                key={item.id}
                                to="/admin/enquiries"
                                onClick={() => setNotificationsOpen(false)}
                                className="block rounded-lg border border-kaleo-earth/10 px-2 py-2 hover:bg-kaleo-earth/5"
                              >
                                <p className="text-sm font-medium text-kaleo-earth">{item.fullName}</p>
                                <p className="text-xs text-kaleo-earth/50">{new Date(item.createdAt).toLocaleString()}</p>
                              </NavLink>
                            ))
                          ) : (
                            <p className="text-sm text-kaleo-earth/60">No recent enquiries.</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    title="User profile"
                    aria-label="User profile"
                    className="rounded-xl border border-kaleo-earth/20 bg-white p-2 text-kaleo-earth/70"
                  >
                    <UserRound size={15} />
                  </button>
                  <button
                    type="button"
                    title="Close overlay"
                    aria-label="Close overlay"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-kaleo-earth/20 bg-white p-2 text-kaleo-earth/70 md:hidden"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-[18px]">
              <Outlet />
            </main>
          </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminConfirmDialogProvider>
      <AdminLayoutInner />
    </AdminConfirmDialogProvider>
  );
}

