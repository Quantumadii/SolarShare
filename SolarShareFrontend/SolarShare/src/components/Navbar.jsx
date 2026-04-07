import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, Settings, Bell } from "lucide-react";
import logo from "../assets/logo.jpeg";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { getUserDisplayName, getUserInitial } from "../utils/displayName";

const Navbar = ({ sidebarCollapsed }) => {
    const auth = useAuth();
    const theme = useTheme();
    const notifications = useNotifications();
    
    const isAuthenticated = auth?.isAuthenticated || false;
    const logout = auth?.logout || (() => {});
    const user = auth?.user || null;
    const isDarkMode = theme?.isDarkMode || false;
    const toggleTheme = theme?.toggleTheme || (() => {});
    const unreadCount = notifications?.unreadCount || 0;
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navbarMargin = sidebarCollapsed !== undefined ? (sidebarCollapsed ? 'ml-20' : 'ml-64') : '';
    const publicLinks = [
        { to: '/about', label: 'About' },
        { to: '/help', label: 'Help' },
        { to: '/contact', label: 'Contact' }
    ];

    return (
        <nav className={`sticky top-0 z-40 backdrop-blur-xl shadow-sm transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'
        } ${navbarMargin}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    <div className="flex items-center gap-3 lg:gap-6">
                        <Link to="/" className="flex items-center gap-3">
                            <img src={logo} alt="SolarShare" className="h-10 w-10 rounded-full" />
                            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                                SolarShare
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {publicLinks.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`px-3 py-2 rounded-lg text-base font-semibold transition-colors ${
                                        isDarkMode
                                            ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                                        isDarkMode 
                                            ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>

                                <Link
                                    to="/profile"
                                    className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                                        isDarkMode 
                                            ? 'bg-gray-800 hover:bg-gray-700 text-emerald-400' 
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                                    title="Profile"
                                >
                                    <Settings size={20} />
                                </Link>

                                
                                    <Link
                                        to="/notifications"
                                        className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                                            isDarkMode 
                                                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                        }`}
                                        title="Notifications"
                                    >
                                        <Bell size={20} />
                                    </Link>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                

                                <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

                                <Link
                                    to="/dashboard"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 ${
                                        isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                    title="Go to Dashboard"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                                        {getUserInitial(user)}
                                    </div>
                                    <span className={`text-sm font-medium hidden sm:block ${
                                        isDarkMode ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        {getUserDisplayName(user)}
                                    </span>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                                        isDarkMode 
                                            ? 'bg-red-900/50 hover:bg-red-900 text-red-400' 
                                            : 'bg-red-50 hover:bg-red-100 text-red-600'
                                    }`}
                                >
                                    <LogOut size={18} />
                                    <span className="font-medium text-sm hidden sm:block">Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                                        isDarkMode 
                                            ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                                <Link
                                    to="/login"
                                    className="btn-secondary"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="btn-primary"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
