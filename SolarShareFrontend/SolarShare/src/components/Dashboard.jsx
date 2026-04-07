import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomeownerView from "./HomeownerView";
import SolarCompanyView from "./SolarCompanyView";
import { useTheme } from "../context/ThemeContext";
import { getUserDisplayName, getUserInitial } from "../utils/displayName";

const Dashboard = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const { isDarkMode } = useTheme();

    if (loading) {
        return (
            <div className={`flex flex-col justify-center items-center h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'} gap-4`}>
                <div className={`w-10 h-10 rounded-full border-4 ${isDarkMode ? 'border-emerald-900 border-t-emerald-500' : 'border-emerald-200 border-t-emerald-500'} animate-spin`}></div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} tracking-widest uppercase`}>
                    Loading Profile...
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
            <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-b shadow-sm sticky top-0 z-10`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} font-medium uppercase tracking-widest hidden sm:block`}>
                                Dashboard   
                            </p>
                            <h1 className={`text-lg sm:text-xl font-bold break-words leading-tight ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                Welcome, <br className="sm:hidden" />
                                <span className="text-emerald-500">{getUserDisplayName(user)}</span>
                            </h1>
                        </div>
                    </div>

                    <span className="shrink-0 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm">
                        {user?.type}
                    </span>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-transparent' : 'bg-gradient-to-r from-emerald-200 to-transparent'}`}></div>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest`}>
                        {user?.type === "HOMEOWNER"
                            ? "Your Properties"
                            : "Company Overview"}
                    </p>
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-gradient-to-l from-gray-700 to-transparent' : 'bg-gradient-to-l from-emerald-200 to-transparent'}`}></div>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-emerald-100'} rounded-3xl shadow-xl overflow-hidden`}>
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300"></div>

                    <div className="p-6 sm:p-10">
                        {user?.type === "HOMEOWNER" ? (
                            <HomeownerView />
                        ) : (
                            <SolarCompanyView />
                        )}
                    </div>
                </div>

                <p className={`text-center text-xs mt-8 tracking-wide ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                    SolarShare &nbsp;·&nbsp; All rights reserved
                </p>
            </main>
        </div>
    );
};

export default Dashboard;
