import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../config/api';

const Signup = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    companyName: '',
    phoneNumber: '',
    city: '',
    userType: 'HOMEOWNER'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'username') {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
    }
  };

  const handleSendOtp = async () => {
    if (!formData.username) {
      toast.error('Enter email first');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.username }),
      });

      const message = await response.text();
      if (!response.ok) {
        throw new Error(message || 'Could not send OTP');
      }

      setOtpSent(true);
      setOtpVerified(false);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.message || 'Could not send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.username, otp: otpCode }),
      });

      const message = await response.text();
      if (!response.ok) {
        throw new Error(message || 'Invalid OTP');
      }

      setOtpVerified(true);
      toast.success('Email verified successfully');
    } catch (error) {
      setOtpVerified(false);
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.fullName || !formData.phoneNumber || !formData.city) {
      toast.error("Please fill in all fields");
      return;
    }
    if (formData.userType === 'SOLAR_COMPANY' && !formData.companyName) {
      toast.error('Please enter company name');
      return;
    }
    if (!otpVerified) {
      toast.error('Please verify OTP before creating account');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const message = await response.text();

      if (response.ok) {
        toast.success("Registration Successful! Welcome to SolarShare.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(message || "Registration Failed. Please try again.");
      }
    } catch (error) {
      toast.error("Connection Error - Please check if backend is running");
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
      <div className="w-full max-w-lg">
        <div className={`rounded-3xl overflow-hidden shadow-2xl ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-emerald-100'
        }`}>

          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300"></div>

          <div className="px-7 sm:px-10 py-9 relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
              </div>
              <h2 className={`text-3xl font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Solar<span className="text-emerald-500">Share</span>
              </h2>
              <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Monetize your rooftop</p>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-5">
              <div className={`flex p-1.5 rounded-2xl mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    formData.userType === 'HOMEOWNER'
                      ? `${isDarkMode ? 'bg-emerald-600 text-white' : 'bg-white shadow-md shadow-emerald-100 text-emerald-600'}`
                      : `${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`
                  }`}
                  onClick={() => setFormData({ ...formData, userType: 'HOMEOWNER' })}
                >
                  🏠 Roof Provider
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    formData.userType === 'SOLAR_COMPANY'
                      ? `${isDarkMode ? 'bg-emerald-600 text-white' : 'bg-white shadow-md shadow-emerald-100 text-emerald-600'}`
                      : `${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`
                  }`}
                  onClick={() => setFormData({ ...formData, userType: 'SOLAR_COMPANY' })}
                >
                  ⚡ Company
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1.5`}>
                    {formData.userType === 'SOLAR_COMPANY' ? 'Admin Full Name' : 'Full Name'}
                  </label>
                  <input
                    name="fullName"
                    placeholder={formData.userType === 'SOLAR_COMPANY' ? 'Enter Admin Name' : 'Enter Your Name'}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1.5`}>
                    City
                  </label>
                  <input
                    name="city"
                    placeholder="e.g- Mumbai"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                    }`}
                    required
                  />
                </div>
              </div>

              {formData.userType === 'SOLAR_COMPANY' && (
                <div>
                  <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1.5`}>
                    Company Name
                  </label>
                  <input
                    name="companyName"
                    placeholder="Enter Company Name"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                    }`}
                    required
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1.5`}>
                  Email Address
                </label>
                <input
                  name="username"
                  type="email"
                  placeholder="name@gmail.com"
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1.5`}>
                  Phone Number
                </label>
                <input
                  name="phoneNumber"
                  placeholder="+91 9011 xxxxxx"
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1.5`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm font-medium transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} hover:text-emerald-500 transition-colors`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className={`block text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1.5`}>
                    Enter OTP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none tracking-[0.3em] ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500'
                          : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading}
                      className={`shrink-0 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                        otpVerified
                          ? 'bg-green-600 text-white'
                          : isDarkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                      } ${otpLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {otpVerified ? 'Verified' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading || !formData.username}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  isDarkMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                } ${(otpLoading || !formData.username) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {otpLoading ? 'Sending OTP...' : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>

              <button
                type="submit"
                disabled={loading || !otpVerified}
                className={`w-full mt-2 py-3.5 rounded-2xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${
                  loading || !otpVerified ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  otpVerified ? 'Create Account →' : 'Verify OTP To Continue'
                )}
              </button>
            </form>

            <div className={`mt-8 pt-6 border-t text-center space-y-3 ${
              isDarkMode ? 'border-gray-700' : 'border-dashed border-gray-100'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 font-bold hover:underline underline-offset-2">
                  Sign In
                </Link>
              </p>
              <div className="flex items-center justify-center gap-2">
                {['Secure', 'Sustainable', 'Scalable'].map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-400 bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <CheckCircle size={10} className="text-emerald-500" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className={`text-center text-xs mt-5 tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-300'}`}>
          By signing up, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Signup;
