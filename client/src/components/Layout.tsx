import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  Car,
  FileText,
  Building2,
  UserCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/loads", label: "Loads", icon: Package },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/customers", label: "Customers", icon: Truck },
  { to: "/invoices", label: "Invoices", icon: FileText },
];

const adminNav = [
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/users", label: "Staff", icon: UserCheck },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <span className="text-white font-bold text-lg leading-tight">
            Trucking
            <br />
            <span className="text-blue-400 text-sm font-medium">Delivery Mgt</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {(user?.role === "owner" || user?.role === "admin") && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-xs text-gray-600 uppercase tracking-wider">Admin</p>
              </div>
              {adminNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        {/* User info + logout */}
        <div className="px-4 py-3 border-t border-gray-700">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-gray-400 text-xs capitalize mb-2">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-xs transition-colors w-full"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  );
}
