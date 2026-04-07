import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Eye, EyeOff, Zap, Shield, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/logo.jpeg";
import API_BASE_URL from "../config/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.text();
      if (data !== "Fail" && data) {
        login(data);
        toast.success("Welcome back! Login successful");
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("Connection error. Please check if backend is running on " + API_BASE_URL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-8 px-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'
    }`}>
      <div className="w-full max-w-5xl">
        <div className={`rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-emerald-100'
        }`}>
          
          <div className={`w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center lg:text-left mb-1">
              <div className="inline-flex items-center justify-center w-30 h-30 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg mb-6">
                <img src={logo} alt="logo" className="w-14 h-14 rounded-xl" />
              </div>
              <p className="text-sm font-semibold text-emerald-500 uppercase tracking-widest mb-1">
                Welcome back
              </p>
              <h4 className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Solar<span className="text-emerald-500">Share</span>
              </h4>
            </div>

            <p className={`text-sm text-center lg:text-left mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Sign in to your account to continue
            </p>

            <div className="space-y-5">
              <div>
                <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider mb-2`}>
                  Email / Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500' 
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400'
                  }`}
                  style={{ colorScheme: 'light dark' }}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 outline-none pr-12 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500' 
                        : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400'
                    }`}
                    style={{ colorScheme: 'light dark' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-emerald-500 transition-colors`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-200 active:scale-[0.98] ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200'
                } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <div className={`flex items-center gap-3 my-6`}>
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>OR</span>
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Don't have an account?
                <button
                onClick={() => navigate("/signup")}
                className={`text-center font-bold px-1 py-2 transition-all duration-200 ${
                  isDarkMode 
                    ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10' 
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
              >
                Register
              </button>
              </p>
              
            </div>
          </div>

          <div className="w-full lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 relative overflow-hidden min-h-[300px] lg:min-h-full">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative h-full flex flex-col justify-center p-8 sm:p-12 text-white">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <Zap size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Clean Energy Platform</span>
                </div>
                <h4 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                  Unlock India's<br />Rooftop Potential
                </h4>
                <div className="w-16 h-1 bg-white/30 rounded-full mb-6"></div>
                <p className="text-emerald-100 text-base leading-relaxed">
                  Your Roof, Your Revenue.<br />India's Future of Clean Energy.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
                  <div className="row-span-2 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center self-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm leading-tight m-0">Secure Platform</p>
                  <p className="text-xs text-emerald-100 leading-tight m-0">Enterprise-grade security</p>
                </div>
                <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
                  <div className="row-span-2 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center self-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm leading-tight m-0">Track Performance</p>
                  <p className="text-xs text-emerald-100 leading-tight m-0">Real-time analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
