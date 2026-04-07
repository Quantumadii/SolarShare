import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
    LayoutDashboard, Grid3X3, Map, BellRing,
    PlusCircle, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import logo from "../assets/logo.jpeg";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const Sidebar = ({ onCollapse, isCollapsed }) => {
    const auth = useAuth();
    const theme = useTheme();
    const notifications = useNotifications();
    
    const isAuthenticated = auth?.isAuthenticated || false;
    const user = auth?.user || null;
    const isDarkMode = theme?.isDarkMode || false;
    const unreadCount = notifications?.unreadCount || 0;
    
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const homeownerLinks = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "blue" },
        { path: "/clusters", icon: Grid3X3, label: "Clusters", color: "purple" },
        { path: "/create-listing", icon: PlusCircle, label: "Create Listing", color: "green" },
        { path: "/map", icon: Map, label: "Solar Map", color: "orange" },
    ];

    const companyLinks = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "blue" },
        { path: "/clusters", icon: Grid3X3, label: "Marketplace", color: "purple" },
        { path: "/map", icon: Map, label: "Solar Map", color: "orange" },
    ];

    const generalLinks = [
        { path: "/notifications", icon: BellRing, label: "Notifications", color: "red" },
    ];

    const links = user?.type === "HOMEOWNER" ? homeownerLinks : companyLinks;

    const NavItem = ({ path, icon: Icon, label, color }) => {
        const activeBg = isDarkMode ? "bg-blue-900/30" : "bg-blue-100";
        const activeBorder = "border-blue-500";
        const defaultBg = isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100";
        const activeText = isDarkMode ? "text-blue-400" : "text-blue-600";

        return (
            <Link
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(path) 
                        ? `${activeBg} border-l-4 ${activeBorder} ${activeText}` 
                        : defaultBg
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive(path) ? 'scale-110' : ''}`} />
                {label && !isCollapsed && (
                    <span className={`font-medium text-sm ${isActive(path) ? 'font-semibold' : ''}`}>
                        {label}
                    </span>
                )}
                {unreadCount > 0 && path === "/notifications" && (
                    <span className="ml-auto w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center bg-red-500 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Link>
        );
    };

    const handleLogout = () => {
        auth.logout();
        navigate("/login");
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <aside className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out ${
            isDarkMode ? 'bg-gray-900 border-r border-gray-700' : 'bg-white border-r border-gray-200'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex flex-col h-full overflow-hidden">
                <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="SolarShare" className="h-10 w-10 rounded-full flex-shrink-0" />
                        {isCollapsed ? null : (
                            <div>
                                <span className={`text-lg font-bold block whitespace-nowrap ${
                                    isDarkMode ? 'text-white' : 'text-gray-800'
                                }`}>
                                    SolarShare
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
                                    {user?.type === "HOMEOWNER" ? "Homeowner" : "Solar Company"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {isCollapsed ? null : (
                        <div className={`text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                            Main Menu
                        </div>
                    )}
                    <nav className="space-y-1">
                        {links.map((link) => (
                            <NavItem key={link.path} {...link} />
                        ))}
                    </nav>

                    {isCollapsed ? null : (
                        <div className={`text-xs font-semibold uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                            Account
                        </div>
                    )}
                    <nav className="space-y-1">
                        {generalLinks.map((link) => (
                            <NavItem key={link.path} {...link} />
                        ))}
                    </nav>
                </div>

                <div className={`p-4 border-t flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-2 ${
                            isDarkMode 
                                ? 'bg-red-900/50 text-red-400 hover:bg-red-900' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                    </button>

                    <button
                        onClick={onCollapse}
                        className={`hidden lg:flex w-full items-center justify-center p-2.5 rounded-lg transition-colors ${
                            isDarkMode 
                                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
