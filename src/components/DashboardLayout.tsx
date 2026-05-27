"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faHome,
  faBox,
  faShoppingCart,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./DashboardLayout.module.css";

import { ROLES } from "@/lib/roles";
import { getUserRoleFromToken } from "@/lib/auth-client";

// safe role type derived from ROLES values
type RoleId = (typeof ROLES)[keyof typeof ROLES];

interface NavItem {
  href: string;
  label: string;
  icon: any;
  roles: RoleId[];
}

interface NavSection {
  items: NavItem[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<RoleId | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const sidebarWidth = sidebarOpen ? 260 : isMobile ? 0 : 70;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/");
  }, [router]);

  const getRoleDisplay = () => {
    switch (userRole) {
      case ROLES.SUPERADMIN:
        return "Super Admin";
      case ROLES.ADMIN:
        return "Admin";
      case ROLES.SUPERVISOR:
        return "Supervisor";
      case ROLES.SERVICE_PROVIDER:
        return "Service Provider";
      default:
        return "User";
    }
  };

  const navSections: NavSection[] = [
    {
      items: [
        {
          href: "/dashboard",
          label: "Overview",
          icon: faHome,
          roles: [
            ROLES.SUPERADMIN,
            ROLES.ADMIN,
            ROLES.SUPERVISOR,
            ROLES.SERVICE_PROVIDER,
          ],
        },
      ],
    },
    {
      items: [
        {
          href: "/dashboard/products",
          label: "Products",
          icon: faBox,
          roles: [
            ROLES.SUPERADMIN,
            ROLES.ADMIN,
            ROLES.SERVICE_PROVIDER,
          ],
        },
        {
          href: "/dashboard/orders",
          label: "Orders",
          icon: faShoppingCart,
          roles: [
            ROLES.SUPERADMIN,
            ROLES.ADMIN,
            ROLES.SERVICE_PROVIDER,
          ],
        },
        {
          href: "/dashboard/inventory",
          label: "Inventory",
          icon: faWarehouse,
          roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        },
      ],
    },
  ];

  const filteredSections = navSections
    .map((section) => ({
      items: section.items.filter((item) =>
        userRole !== null ? item.roles.includes(userRole) : false
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div>{getRoleDisplay()}</div>

        <nav>
          {filteredSections.map((section, index) => (
            <div key={index}>
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className={styles.main} style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>
    </div>
  );
}