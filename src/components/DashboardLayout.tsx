"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBox,
  faShoppingCart,
  faWarehouse,
  faUsers,
  faCalendarAlt,
  faChartLine,
  faComments,
  faCog,
  faSignOutAlt,
  faUserCircle,
  faBars,
  faChevronLeft,
  faChevronRight,
  faBell,
  faGlobe,
  faEye,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

import BackToTop from "@/components/BackToTop";
import { getUserRoleFromToken, getAuthHeaders } from "@/lib/auth-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  primaryLight: "#fbbf24",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgWhite: "#ffffff",
  bgGray: "#f9fafb",
  bgLightGray: "#f3f4f6",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
  sidebarBg: "#1a1a2e",
  sidebarText: "#a8a8b8",
  sidebarActive: "#f59e0b",
};

const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  SERVICE_PROVIDER: 'service_provider',
} as const;

type RoleId = typeof ROLES[keyof typeof ROLES];

interface Notification {
  id: number;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
  created_at: string;
  link?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<RoleId | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const sidebarWidth = sidebarOpen ? 260 : isMobile ? 0 : 70;

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [router.pathname, isMobile]);

  // Get user role
  useEffect(() => {
    const role = getUserRoleFromToken();
    const normalizedRole = role ? role.toLowerCase() as RoleId : null;
    setUserRole(normalizedRole);
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) setLangMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    } catch (err) {
      console.error(err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/");
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case ROLES.SUPERADMIN:
        return t('roleSuperAdmin') || "Super Admin";
      case ROLES.ADMIN:
        return t('roleAdmin') || "Admin";
      case ROLES.SUPERVISOR:
        return t('roleSupervisor') || "Supervisor";
      case ROLES.SERVICE_PROVIDER:
        return t('roleServiceProvider') || "Service Provider";
      default:
        return t('user') || "User";
    }
  };

  const navItems = [
    { href: "/dashboard", label: t('dashboardOverview') || "Overview", icon: faHome, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER] },
    { href: "/dashboard/products", label: t('products') || "Products", icon: faBox, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { href: "/dashboard/orders", label: t('orders') || "Orders", icon: faShoppingCart, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { href: "/dashboard/inventory", label: t('inventory') || "Inventory", icon: faWarehouse, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { href: "/dashboard/workers", label: t('workers') || "Workers", icon: faUsers, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR] },
    { href: "/dashboard/attendance/weekly", label: t('attendance') || "Attendance", icon: faCalendarAlt, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR] },
    { href: "/dashboard/analytics", label: t('analytics') || "Analytics", icon: faChartLine, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { href: "/dashboard/support", label: t('support') || "Support", icon: faComments, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER] },
    { href: "/dashboard/settings", label: t('settings') || "Settings", icon: faCog, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER] },
    { href: "/dashboard/admin/users", label: t('user_management') || "User Management", icon: faUserShield, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
  ];

  const visibleNavItems = navItems.filter(item =>
    userRole !== null && item.roles.includes(userRole)
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: COLORS.bgGray }}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarOpen ? 260 : isMobile ? 0 : 70,
          backgroundColor: COLORS.sidebarBg,
          color: COLORS.sidebarText,
          overflowY: "auto",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo / Welcome */}
        {sidebarOpen && (
          <div
            style={{
              padding: "1.5rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              marginBottom: "0.5rem",
            }}
          >
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.5 }}>
              {t('welcome') || "Welcome"},
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "white", marginTop: "0.25rem" }}>
              {getRoleDisplay()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0.5rem 0.75rem" }}>
          {visibleNavItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  color: isActive ? "white" : COLORS.sidebarText,
                  backgroundColor: isActive ? "rgba(245, 158, 11, 0.15)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  marginBottom: "0.15rem",
                  fontSize: "0.9rem",
                  borderLeft: isActive ? `3px solid ${COLORS.primary}` : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = COLORS.sidebarText;
                  }
                }}
              >
                <FontAwesomeIcon icon={item.icon} style={{ width: "18px", fontSize: "1rem" }} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              margin: "0.75rem",
              padding: "0.5rem",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "none",
              borderRadius: "6px",
              color: COLORS.sidebarText,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = COLORS.sidebarText;
            }}
          >
            <FontAwesomeIcon icon={sidebarOpen ? faChevronLeft : faChevronRight} />
          </button>
        )}
      </aside>

      {/* ===== MAIN CONTENT - THIS IS THE SCROLLABLE CONTAINER ===== */}
      <div
        id="main-content"
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : sidebarWidth,
          padding: "1.5rem",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100vh",
          maxWidth: `calc(100vw - ${isMobile ? 0 : sidebarWidth}px)`,
          overflowX: "hidden",
          overflowY: "auto",
          position: "relative",
          backgroundColor: COLORS.bgGray,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ===== HEADER - STICKY ===== */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            backgroundColor: "#ffffff",
            padding: "0.75rem 1.5rem",
            borderRadius: "12px",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #f3f4f6",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  padding: "0.5rem",
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: COLORS.textPrimary,
                }}
              >
                <FontAwesomeIcon icon={faBars} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Language Menu */}
            <div ref={langMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "transparent",
                  color: COLORS.textSecondary,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgLightGray;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FontAwesomeIcon icon={faGlobe} />
              </button>
              {langMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: COLORS.shadowHover,
                    minWidth: "160px",
                    padding: "0.5rem",
                    zIndex: 100,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <button
                    onClick={() => { setLocale("en"); setLangMenuOpen(false); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      color: COLORS.textPrimary,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.bgGray;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLocale("rw"); setLangMenuOpen(false); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      color: COLORS.textPrimary,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.bgGray;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Kinyarwanda
                  </button>
                  <button
                    onClick={() => { setLocale("zh"); setLangMenuOpen(false); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      color: COLORS.textPrimary,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.bgGray;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    中文
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "transparent",
                  color: COLORS.textSecondary,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgLightGray;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: COLORS.danger,
                      color: "white",
                      fontSize: "0.6rem",
                      fontWeight: "700",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: COLORS.shadowHover,
                    width: "380px",
                    maxHeight: "420px",
                    zIndex: 100,
                    border: `1px solid ${COLORS.border}`,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      padding: "1rem",
                      borderBottom: `1px solid ${COLORS.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "600", fontSize: "0.95rem", color: COLORS.textPrimary }}>
                      {t('notifications') || "Notifications"}
                    </span>
                    <button
                      onClick={markAllAsRead}
                      style={{
                        fontSize: "0.75rem",
                        color: COLORS.primary,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {t('markAllRead') || "Mark all read"}
                    </button>
                  </div>
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "2rem", textAlign: "center", color: COLORS.textMuted, fontSize: "0.85rem" }}>
                        {t('noNotifications') || "No new notifications"}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          style={{
                            padding: "0.75rem 1rem",
                            borderBottom: `1px solid ${COLORS.border}`,
                            backgroundColor: !notif.is_read ? `${COLORS.primary}08` : "transparent",
                            borderLeft: !notif.is_read ? `3px solid ${COLORS.primary}` : "3px solid transparent",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.bgGray;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = !notif.is_read ? `${COLORS.primary}08` : "transparent";
                          }}
                        >
                          <div style={{ fontWeight: "500", fontSize: "0.85rem", color: COLORS.textPrimary }}>
                            {notif.title}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: COLORS.textSecondary, marginTop: "0.15rem" }}>
                            {notif.message}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.3rem" }}>
                            <span style={{ fontSize: "0.65rem", color: COLORS.textMuted }}>
                              {new Date(notif.created_at).toLocaleString()}
                            </span>
                            {!notif.is_read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                style={{
                                  fontSize: "0.65rem",
                                  color: COLORS.primary,
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <FontAwesomeIcon icon={faEye} /> {t('markRead') || "Mark read"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div ref={userMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: `2px solid ${COLORS.primary}`,
                  backgroundColor: "transparent",
                  color: COLORS.primary,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.primary}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FontAwesomeIcon icon={faUserCircle} />
              </button>
              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: COLORS.shadowHover,
                    minWidth: "200px",
                    padding: "0.5rem",
                    zIndex: 100,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Link
                    href="/dashboard/settings?tab=account"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      color: COLORS.textPrimary,
                      fontSize: "0.85rem",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.bgGray;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <FontAwesomeIcon icon={faUserCircle} style={{ width: "16px" }} />
                    {t('myProfile') || "My Profile"}
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      color: COLORS.textPrimary,
                      fontSize: "0.85rem",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.bgGray;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <FontAwesomeIcon icon={faCog} style={{ width: "16px" }} />
                    {t('settings') || "Settings"}
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: COLORS.danger,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      width: "100%",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${COLORS.danger}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} style={{ width: "16px" }} />
                    {t('logout') || "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== PAGE CONTENT - NOW TALLER THAN VIEWPORT ===== */}
        <div
          style={{
            flex: 1,
            minHeight: "200vh", // ← THIS ENABLES SCROLLING
          }}
        >
          {children}
        </div>

        {/* ===== BACK TO TOP - INSIDE THE SCROLLABLE CONTAINER ===== */}
        <BackToTop />
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: COLORS.shadowHover,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: COLORS.textPrimary, marginBottom: "0.5rem" }}>
              {t('confirmLogout') || "Confirm Logout"}
            </h3>
            <p style={{ fontSize: "0.9rem", color: COLORS.textSecondary, marginBottom: "1.5rem" }}>
              {t('logoutConfirmMessage') || "Are you sure you want to logout?"}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgGray;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {t('cancel') || "Cancel"}
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  background: COLORS.danger,
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.danger;
                }}
              >
                {t('logout') || "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}