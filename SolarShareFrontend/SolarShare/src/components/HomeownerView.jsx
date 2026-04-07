import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Maximize, ClipboardList, PlusCircle, Building2, Phone, Eye, Heart, TrendingUp, DollarSign, Download, BadgeCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import toast from 'react-hot-toast';
import { getCompanyDisplayName } from '../utils/displayName';
import useSingleFlight from '../utils/useSingleFlight';


const HomeownerView = () => {
  const [myListings, setMyListings] = useState([]);
  const { token } = useAuth();
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const [actionLoading, setActionLoading] = useState({});
  const { runSingleFlight } = useSingleFlight();

  const navigate = useNavigate();
  const computeStatsFromListings = (items) => {
    const totalArea = items.reduce((sum, item) => sum + (item.areaSquareFt || 0), 0);
    const totalRent = items.reduce((sum, item) => sum + (item.expectedRent || 0), 0);
    const totalInterests = items.reduce((sum, item) => sum + (item.interestedCompanies?.length || 0), 0);
    return {
      totalArea,
      totalRent,
      totalViews: Math.floor(Math.random() * 100) + totalInterests * 15,
      totalInterests,
    };
  };
  
  const [stats, setStats] = useState({
    totalArea: 0,
    totalRent: 0,
    totalViews: 0,
    totalInterests: 0
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchMyListings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMyListings(data);
          setStats(computeStatsFromListings(data));
        }
      } catch {
        console.error("Error fetching listings");
      }
    };
    fetchMyListings();
  }, [token, isAuthenticated]);

  const setLoadingFor = (key, value) => {
    setActionLoading((prev) => ({ ...prev, [key]: value }));
  };

  const handleAcceptCompany = async (listingId, companyId) => {
    const key = `accept-${listingId}-${companyId}`;
    if (actionLoading[key]) {
      return;
    }
    await runSingleFlight(key, async () => {
    setLoadingFor(key, true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${listingId}/accept/${companyId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const message = await response.text();
      if (!response.ok) {
        throw new Error(message || 'Could not accept company');
      }

      toast.success('Company accepted and agreement generated');

      const refreshed = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        setMyListings(data);
        setStats(computeStatsFromListings(data));
      }

      window.dispatchEvent(new Event('clusters-updated'));
    } catch (error) {
      toast.error(error.message || 'Acceptance failed');
    } finally {
      setLoadingFor(key, false);
    }
    });
  };

  const handleDownloadAgreement = async (listingId) => {
    const key = `download-${listingId}`;
    if (actionLoading[key]) {
      return;
    }
    await runSingleFlight(key, async () => {
    setLoadingFor(key, true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${listingId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Agreement not available');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const fileNameMatch = contentDisposition.match(/filename="?([^\"]+)"?/i);
      const fileName = fileNameMatch?.[1] || `rent-agreement-listing-${listingId}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Agreement downloaded');
    } catch (error) {
      toast.error(error.message || 'Download failed');
    } finally {
      setLoadingFor(key, false);
    }
    });
  };

  const handleOptOutFromCluster = async (listing) => {
    if (!listing?.clusterProject?.id) {
      toast.error('This rooftop is not part of any cluster');
      return;
    }

    const key = `optout-${listing.id}`;
    if (actionLoading[key]) {
      return;
    }
    await runSingleFlight(key, async () => {
    setLoadingFor(key, true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/clusters/${listing.clusterProject.id}/contributions/${listing.id}/opt-out`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const message = await response.text();
      if (!response.ok) {
        throw new Error(message || 'Could not opt out from cluster');
      }

      toast.success('Opted out from cluster successfully');

      const refreshed = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        setMyListings(data);
        setStats(computeStatsFromListings(data));
      }
    } catch (error) {
      toast.error(error.message || 'Opt-out failed');
    } finally {
      setLoadingFor(key, false);
    }
    });
  };

  const handleRemoveListing = async (listing) => {
    if (!listing?.id) {
      return;
    }

    if (listing.acceptedCompany) {
      toast.error('Accepted listings cannot be removed');
      return;
    }
    if ((listing.interestedCompanies?.length || 0) > 0) {
      toast.error('Only idle listings with no active interests can be removed');
      return;
    }

    if (!window.confirm('Remove this listing? This action cannot be undone.')) {
      return;
    }

    const key = `remove-${listing.id}`;
    if (actionLoading[key]) {
      return;
    }

    setLoadingFor(key, true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${listing.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const message = await response.text();
      if (!response.ok) {
        throw new Error(message || 'Could not remove listing');
      }

      toast.success('Listing removed successfully');
      setMyListings((prev) => {
        const next = prev.filter((item) => item.id !== listing.id);
        setStats(computeStatsFromListings(next));
        return next;
      });
      window.dispatchEvent(new Event('clusters-updated'));
    } catch (error) {
      toast.error(error.message || 'Remove failed');
    } finally {
      setLoadingFor(key, false);
    }
  };

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className={`min-h-screen px-3 sm:px-8 py-6 sm:py-8 font-sans ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Listings</span>
            </div>
            <p className="text-3xl font-bold">{myListings.length}</p>
          </div>
          
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Total Area</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalArea.toLocaleString()}</p>
            <span className="text-xs opacity-80">sq ft</span>
          </div>
          
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <Heart size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Interests</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalInterests}</p>
          </div>
          
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Monthly</span>
            </div>
            <p className="text-3xl font-bold">₹{stats.totalRent.toLocaleString()}</p>
          </div>
        </div>

        <div className={`relative ${isDarkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'} rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white opacity-5 rounded-full"></div>
          
          <p className="text-emerald-100 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1">Homeowner Panel</p>
          <h1 className="text-xl sm:text-3xl font-bold leading-tight">My Rooftop Dashboard</h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 font-light opacity-90">Manage and track your properties</p>

          <button
            onClick={() => navigate('/create-listing')}
            className="mt-5 inline-flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
          >
            <PlusCircle size={16} />
            List New Rooftop
          </button>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className={`flex items-center gap-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-emerald-100'} shadow-sm rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2`}>
              <ClipboardList size={14} className="text-emerald-500" />
              <span className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Active Listings</span>
              <span className={`ml-1 ${isDarkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700'} text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full`}>
                {myListings.length}
              </span>
            </div>
            <div className={`h-px flex-1 ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-transparent' : 'bg-gradient-to-r from-emerald-100 to-transparent'}`}></div>
          </div>

          {myListings.length === 0 ? (
            <div className={`${isDarkMode ? 'bg-gray-800 border-dashed border-gray-700' : 'bg-white border-dashed border-emerald-200'} rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3`}>
              <ClipboardList size={24} className={`${isDarkMode ? 'text-gray-600' : 'text-emerald-300'}`} />
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>No listings yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5">
              {myListings.map((listing) => (
                <div
                  key={listing.id}
                  className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden`}
                >
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400"></div>

                  <div className="p-4 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-50'} flex items-center justify-center shrink-0`}>
                            <MapPin size={14} className="text-emerald-500" />
                          </div>
                          <h4 className={`font-bold text-base sm:text-lg truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{listing.city} Rooftop</h4>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] ${isDarkMode ? 'text-gray-400 bg-gray-700 border-gray-600' : 'text-gray-500 bg-gray-50 border-gray-100'} px-2 py-1 rounded-md border max-w-[180px] sm:max-w-none`}>
                            <MapPin size={10} /> <span className="truncate">{listing.address}</span>
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] ${isDarkMode ? 'text-gray-400 bg-gray-700 border-gray-600' : 'text-gray-500 bg-gray-50 border-gray-100'} px-2 py-1 rounded-md border`}>
                            <Maximize size={10} /> {listing.areaSquareFt} sqft
                          </span>
                        </div>
                      </div>

                      <div className={`flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 ${isDarkMode ? 'bg-emerald-900/20 sm:bg-transparent' : 'bg-emerald-50/50 sm:bg-transparent'} p-2 sm:p-0 rounded-lg`}>
                        <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} font-bold uppercase hidden sm:block`}>Expected Rent</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg sm:text-xl">₹{listing.expectedRent}</p>
                        <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} font-medium`}>/ month</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      {listing.clusterProject && (
                        <div className={`mb-3 rounded-xl border px-3 py-2.5 flex items-center justify-between gap-3 ${isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                          <div>
                            <p className={`text-xs font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              Cluster: {listing.clusterProject.projectName}
                            </p>
                            <p className={`text-[10px] ${isDarkMode ? 'text-blue-200' : 'text-blue-600'} mt-0.5`}>
                              {listing.clusterProject.isFull
                                ? 'Agreement generated - rooftop is committed to the cluster'
                                : 'Agreement will be generated only when the cluster becomes full'}
                            </p>
                          </div>
                          {!listing.clusterProject.isFull && !listing.clusterProject.agreementGenerated && (
                            <button
                              onClick={() => handleOptOutFromCluster(listing)}
                              disabled={!!actionLoading[`optout-${listing.id}`]}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-amber-600 text-white hover:bg-amber-700'} ${actionLoading[`optout-${listing.id}`] ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {actionLoading[`optout-${listing.id}`] ? 'Leaving...' : 'Opt Out'}
                            </button>
                          )}
                        </div>
                      )}

                      {listing.acceptedCompany && (
                        <div className={`mb-3 rounded-xl border px-3 py-2.5 flex items-center justify-between gap-3 ${isDarkMode ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
                          <div className="flex items-center gap-2">
                            <BadgeCheck size={14} className="text-emerald-500" />
                            <p className={`text-xs font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                              Accepted: {getCompanyDisplayName(listing.acceptedCompany)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadAgreement(listing.id)}
                            disabled={!!actionLoading[`download-${listing.id}`]}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'} ${actionLoading[`download-${listing.id}`] ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <Download size={11} />
                            {actionLoading[`download-${listing.id}`] ? 'Preparing...' : 'Agreement PDF'}
                          </button>
                        </div>
                      )}

                      {!listing.acceptedCompany && (listing.interestedCompanies?.length || 0) === 0 && (!listing.clusterProject || (!listing.clusterProject.isFull && !listing.clusterProject.agreementGenerated)) && (
                        <div className={`mb-3 rounded-xl border px-3 py-2.5 flex items-center justify-between gap-3 ${isDarkMode ? 'bg-rose-900/20 border-rose-700' : 'bg-rose-50 border-rose-200'}`}>
                          <p className={`text-xs font-semibold ${isDarkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                            Idle listing: You can remove it anytime before acceptance.
                          </p>
                          <button
                            onClick={() => handleRemoveListing(listing)}
                            disabled={!!actionLoading[`remove-${listing.id}`]}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-rose-600 text-white hover:bg-rose-700'} ${actionLoading[`remove-${listing.id}`] ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <Trash2 size={11} />
                            {actionLoading[`remove-${listing.id}`] ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      )}

                      <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest mb-3 flex items-center gap-2`}>
                        <Building2 size={12} className="text-blue-400" />
                        Interested Companies
                        <span className={`${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-600'} px-1.5 py-0.5 rounded text-[9px] font-black`}>
                          {listing.interestedCompanies?.length || 0}
                        </span>
                      </p>

                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                        {listing.interestedCompanies?.length > 0 ? (
                          listing.interestedCompanies.map((company, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between sm:justify-start gap-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'} px-3 py-2 rounded-xl hover:border-blue-200 transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm shadow-blue-100`}>
                                  {getCompanyDisplayName(company).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className={`text-xs font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{getCompanyDisplayName(company)}</p>
                                  <div className={`flex items-center gap-1 text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} mt-0.5`}>
                                    <Phone size={8} /> {company.phoneNumber}
                                  </div>
                                </div>
                              </div>

                              {!listing.acceptedCompany && (
                                <button
                                  onClick={() => handleAcceptCompany(listing.id, company.id)}
                                  disabled={!!actionLoading[`accept-${listing.id}-${company.id}`]}
                                  className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'} ${actionLoading[`accept-${listing.id}-${company.id}`] ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                  {actionLoading[`accept-${listing.id}-${company.id}`]
                                    ? 'Accepting...'
                                    : 'Accept'}
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="w-full text-center sm:text-left py-2">
                            <span className={`text-[10px] italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              No interests yet — we'll notify you soon!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeownerView;
