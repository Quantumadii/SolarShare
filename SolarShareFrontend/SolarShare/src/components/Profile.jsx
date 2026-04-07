import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
    User, Mail, Phone, Building2, Calendar, 
    Edit2, Save, Shield, Moon, Sun, LogOut,
    Eye, Heart, Clock, TrendingUp
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';
import { getUserDisplayName, getUserInitial } from '../utils/displayName';

const Profile = () => {
    const { user, token, logout, isAuthenticated } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        fullName: user?.fullName || '',
        companyName: user?.companyName || '',
        phoneNumber: user?.phoneNumber || '',
        email: user?.email || ''
    });
    const [stats, setStats] = useState({
        totalListings: 0,
        totalViews: 0,
        totalInterests: 0,
        totalClusters: 0
    });
    const [activity, setActivity] = useState([]);

    const fetchUserStats = async () => {
        if (user?.type !== 'HOMEOWNER') return;
        try {
            const response = await fetch(`${API_BASE_URL}/listings/my-listings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats({
                    totalListings: data.length,
                    totalViews: Math.floor(Math.random() * 50) + data.length * 10,
                    totalInterests: data.reduce((acc, item) => acc + (item.interestedCompanies?.length || 0), 0),
                    totalClusters: data.filter(item => item.clusterProject).length
                });
                setActivity([
                    { id: 1, type: 'listing', message: 'Listed rooftop in Mumbai', time: '2 hours ago', icon: <Building2 size={14} /> },
                    { id: 2, type: 'interest', message: 'New interest from SolarCorp India', time: '1 day ago', icon: <Heart size={14} /> },
                    { id: 3, type: 'view', message: 'Your listing was viewed 12 times', time: '3 days ago', icon: <Eye size={14} /> },
                ]);
            }
        } catch {
            console.error("Error fetching stats");
        }
    };

    useEffect(() => {
        if (user) {
            setProfile({
                fullName: user.fullName || '',
                companyName: user.companyName || '',
                phoneNumber: user.phoneNumber || '',
                email: user.email || ''
            });
            fetchUserStats();
        }
    }, [user]);

    const handleSave = () => {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const inputBg = isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
    const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const labelColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    const getActivityIcon = (type) => {
        const bgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
        const iconColor = 'text-blue-500';
        switch(type) {
            case 'listing': return <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}><Building2 size={14} className={iconColor} /></div>;
            case 'interest': return <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}><Heart size={14} className={iconColor} /></div>;
            case 'view': return <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}><Eye size={14} className={iconColor} /></div>;
            default: return <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}><Clock size={14} className={iconColor} /></div>;
        }
    };

    return (
        <div className="theme-page-bg min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className={`${cardBg} rounded-2xl shadow-lg overflow-hidden`}>
                            <div className={`h-24 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}></div>
                            <div className="px-6 pb-6">
                                <div className="-mt-16 mb-4">
                                    <div className={`w-24 h-24 rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 ${isDarkMode ? 'border-gray-800' : 'border-white'} mx-auto`}>
                                        {getUserInitial(user)}
                                    </div>
                                </div>
                                <div className="text-center mb-6">
                                    <h2 className={`text-xl font-bold ${textColor}`}>{getUserDisplayName(user)}</h2>
                                    {user?.type === 'SOLAR_COMPANY' && (
                                        <p className={`text-xs mt-1 ${subTextColor}`}>Admin: {user?.fullName || 'N/A'}</p>
                                    )}
                                    <span className={`inline-block mt-2 px-3 py-1 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} rounded-full text-sm font-medium`}>
                                        {user?.type}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${subTextColor}`}>
                                        <Mail size={18} className="text-blue-500" />
                                        <span className="text-sm">{user?.email}</span>
                                    </div>
                                    <div className={`flex items-center gap-3 ${subTextColor}`}>
                                        <Phone size={18} className="text-blue-500" />
                                        <span className="text-sm">{user?.phoneNumber || 'Not provided'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
                            <h3 className={`text-lg font-bold ${textColor} mb-4`}>Quick Settings</h3>
                            <div className="space-y-4">
                                <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        {isDarkMode ? <Moon size={20} className={subTextColor} /> : <Sun size={20} className="text-yellow-500" />}
                                        <span className={`text-sm font-medium ${textColor}`}>Dark Mode</span>
                                    </div>
                                    <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                                <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-2 p-3 ${isDarkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-red-50 text-red-600 hover:bg-red-100'} rounded-xl font-medium transition-colors`}>
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-lg font-bold ${textColor}`}>Profile Information</h3>
                                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-xl font-medium transition-colors`}>
                                    {isEditing ? <><Save size={18} /> Save</> : <><Edit2 size={18} /> Edit</>}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user?.type === 'SOLAR_COMPANY' && (
                                    <div>
                                        <label className={`block text-sm font-medium ${labelColor} mb-2`}>Company Name</label>
                                        <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <Building2 size={18} className="text-blue-500" />
                                            <span className={textColor}>{profile.companyName || 'Not provided'}</span>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                                        {user?.type === 'SOLAR_COMPANY' ? 'Admin Full Name' : 'Full Name'}
                                    </label>
                                    {isEditing ? (
                                        <input type="text" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}`} />
                                    ) : (
                                        <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <User size={18} className="text-blue-500" />
                                            <span className={textColor}>{profile.fullName}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${labelColor} mb-2`}>Email</label>
                                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <Mail size={18} className="text-blue-500" />
                                        <span className={textColor}>{profile.email}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${labelColor} mb-2`}>Phone Number</label>
                                    {isEditing ? (
                                        <input type="text" value={profile.phoneNumber} onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}`} />
                                    ) : (
                                        <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <Phone size={18} className="text-blue-500" />
                                            <span className={textColor}>{profile.phoneNumber || 'Not provided'}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${labelColor} mb-2`}>Account Type</label>
                                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-xl`}>
                                        <Shield size={18} className="text-blue-500" />
                                        <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{user?.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
                            <h3 className={`text-lg font-bold ${textColor} mb-6`}>Overview Statistics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={`${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} rounded-xl p-4 text-white`}>
                                    <Building2 size={24} className="opacity-80 mb-2" />
                                    <p className="text-2xl font-bold">{stats.totalListings}</p>
                                    <p className="text-xs opacity-80">Total Listings</p>
                                </div>
                                <div className={`${isDarkMode ? 'bg-purple-600' : 'bg-purple-500'} rounded-xl p-4 text-white`}>
                                    <Eye size={24} className="opacity-80 mb-2" />
                                    <p className="text-2xl font-bold">{stats.totalViews}</p>
                                    <p className="text-xs opacity-80">Total Views</p>
                                </div>
                                <div className={`${isDarkMode ? 'bg-pink-600' : 'bg-pink-500'} rounded-xl p-4 text-white`}>
                                    <Heart size={24} className="opacity-80 mb-2" />
                                    <p className="text-2xl font-bold">{stats.totalInterests}</p>
                                    <p className="text-xs opacity-80">Interests</p>
                                </div>
                                <div className={`${isDarkMode ? 'bg-orange-600' : 'bg-orange-500'} rounded-xl p-4 text-white`}>
                                    <TrendingUp size={24} className="opacity-80 mb-2" />
                                    <p className="text-2xl font-bold">{stats.totalClusters}</p>
                                    <p className="text-xs opacity-80">Clusters</p>
                                </div>
                            </div>
                        </div>

                        <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-lg font-bold ${textColor}`}>Recent Activity</h3>
                                <button onClick={() => setActivity([])} className={`text-sm ${subTextColor} hover:${textColor}`}>
                                    Clear All
                                </button>
                            </div>
                            <div className="space-y-4">
                                {activity.length > 0 ? activity.map((item) => (
                                    <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        {getActivityIcon(item.type)}
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${textColor}`}>{item.message}</p>
                                            <p className={`text-xs ${subTextColor}`}>{item.time}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className={`text-center py-8 ${subTextColor}`}>
                                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
