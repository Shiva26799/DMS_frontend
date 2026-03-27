import { Link, useLocation } from "react-router";
import { LayoutDashboard, Users, UserCheck, Package, Boxes, ShoppingCart, Shield, Wrench, BarChart3, ChevronDown, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  name: string;
  href?: string;
  icon?: any;
  allowedRoles?: string[];
  submenu?: NavItem[];
}

const navigation: NavItem[] = [
  { name: "Executive Dashboard", href: "/", icon: LayoutDashboard, allowedRoles: ["Admin", "Dealer"] },
  { name: "Lead Management", href: "/leads", icon: Users, allowedRoles: ["Admin", "Dealer"] },
  { name: "Customer Management", href: "/customers", icon: Users, allowedRoles: ["Admin", "Dealer"] },
  { name: "Dealer Management", href: "/dealers", icon: UserCheck, allowedRoles: ["Admin"] },
  {
    name: "Products & Inventory",
    icon: Package,
    allowedRoles: ["Admin", "Dealer"],
    submenu: [
      { name: "Product Catalogue", href: "/products", allowedRoles: ["Admin", "Dealer"] },
      { name: "Inventory", href: "/inventory", allowedRoles: ["Admin"] },
    ],
  },
  { name: "Order Management", href: "/orders", icon: ShoppingCart, allowedRoles: ["Admin", "Dealer"] },
  { name: "Warranty Management", href: "/warranty", icon: Shield, allowedRoles: ["Admin", "Dealer"] },
  { name: "Maintenance", href: "/maintenance", icon: Wrench, allowedRoles: ["Admin", "Dealer"] },
  { name: "Reports", href: "/reports", icon: BarChart3, allowedRoles: ["Admin"] },
  { name: "Settings", href: "/settings", icon: SettingsIcon, allowedRoles: ["Admin"] },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role;

  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    "Products & Inventory"
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const toggleMenu = (name: string) => {
    setExpandedMenu(expandedMenu === name ? null : name);
  };

  // Filter top-level items
  const filteredNavigation = navigation
    .filter((item) => !item.allowedRoles || item.allowedRoles.includes(role as string))
    .map((item) => {
      // If item has a submenu, filter that too
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(
            (sub) => !sub.allowedRoles || sub.allowedRoles.includes(role as string)
          ),
        };
      }
      return item;
    });

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-24 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-20 h-20 object-contain rounded-lg"
            onError={(e) => {
              // Fallback if logo.png doesn't exist yet
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hidden">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <div className="font-bold text-gray-900">LOVOL</div>
            <div className="text-xs text-gray-500">Distribution System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {filteredNavigation.map((item) => {
          if (item.submenu && item.submenu.length > 0) {
            const isExpanded = expandedMenu === item.name;
            const hasActiveSubmenu = item.submenu.some((sub) =>
              isActive(sub.href || "")
            );

            return (
              <div key={item.name} className="mb-1">
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${hasActiveSubmenu
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href || "#"}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isActive(subItem.href || "")
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href || "#"}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 ${isActive(item.href || "")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {item.icon && <item.icon className="w-5 h-5" />}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}