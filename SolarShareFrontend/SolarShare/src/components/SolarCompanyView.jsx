import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import {
  MapPin,
  IndianRupee,
  Send,
  Layers,
  Zap,
  TrendingUp,
  CheckCircle,
  Users,
  X,
  Building2,
  Eye,
  Heart
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { toast } from "react-hot-toast";
import L from "leaflet";
import SearchFilter from "./SearchFilter";
import API_BASE_URL from "../config/api";
import useSingleFlight from "../utils/useSingleFlight";

import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Navigate } from "react-router-dom";
import { getCompanyDisplayName } from "../utils/displayName";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const SolarCompanyView = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  const { token, isAuthenticated, user } = useAuth();
  const { isDarkMode } = useTheme();
  const { addNotification } = useNotifications();
  const [actionLoading, setActionLoading] = useState({});
  const { runSingleFlight } = useSingleFlight();

  const [stats, setStats] = useState({
    totalListings: 0,
    totalPools: 0,
    totalArea: 0,
    interestsSent: 0
  });

  const sortPools = (items) => {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
      if (!!a?.isFull !== !!b?.isFull) {
        return a?.isFull ? 1 : -1;
      }
      return (b?.id || 0) - (a?.id || 0);
    });
  };

  const fetchMarketplace = async () => {
    try {
      const [resListings, resPools] = await Promise.all([
        fetch(`${API_BASE_URL}/listings/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/clusters/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resListings.ok && resPools.ok) {
        const listData = await resListings.json();
        const poolData = await resPools.json();
        const nonClusterListings = listData.filter((item) => !item.clusterProject);
        setListings(nonClusterListings);
        setFilteredListings(nonClusterListings);
        setPools(sortPools(poolData));
        
        const totalArea = nonClusterListings.reduce((sum, item) => sum + (item.areaSquareFt || 0), 0);
        setStats({
          totalListings: nonClusterListings.length,
          totalPools: poolData.length,
          totalArea,
          interestsSent: Math.floor(Math.random() * 15) + 5
        });
      }
    } catch {
      toast.error("Connection to marketplace failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMarketplace();
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleClustersUpdated = () => fetchMarketplace();
    window.addEventListener('clusters-updated', handleClustersUpdated);
    window.addEventListener('focus', handleClustersUpdated);

    return () => {
      window.removeEventListener('clusters-updated', handleClustersUpdated);
      window.removeEventListener('focus', handleClustersUpdated);
    };
  }, [token, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleInterest = async (id, type) => {
    const key = `interest-${type}-${id}`;
    if (actionLoading[key]) {
      return;
    }

    if (type === "individual") {
      const targetListing = listings.find((item) => item.id === id);
      const hasAlreadyInterested = targetListing?.interestedCompanies?.some(
        (company) => company.id === user?.id
      );
      if (hasAlreadyInterested) {
        toast.error("Already interest listed");
        return;
      }
    }

    await runSingleFlight(key, async () => {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      const url =
        type === "pool"
          ? `${API_BASE_URL}/clusters/${id}/interest`
          : `${API_BASE_URL}/listings/${id}/interest`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Could not record interest");
        }

        addNotification({
          type: 'success',
          message: `Interest ${type === 'pool' ? 'in cluster' : 'in listing'} sent successfully!`
        });
        toast.success(`Interest sent!`);
        fetchMarketplace();
        setSelectedPool(null);
      } catch (error) {
        addNotification({
          type: 'error',
          message: error.message || 'Failed to send interest. Please try again.'
        });
        toast.error(error.message || "Action failed");
      } finally {
        setActionLoading((prev) => ({ ...prev, [key]: false }));
      }
    });
  };

  const handleFilter = (filtered) => {
    setFilteredListings(filtered);
  };

  const handleDownloadAgreement = async (listingId) => {
    const key = `download-${listingId}`;
    if (actionLoading[key]) {
      return;
    }
    await runSingleFlight(key, async () => {
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/listings/${listingId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Agreement not available');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
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
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
    });
  };

  const handleRejectContribution = async (poolId, listingId) => {
    const key = `reject-${poolId}-${listingId}`;
    if (actionLoading[key]) {
      return;
    }
    await runSingleFlight(key, async () => {
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/clusters/${poolId}/contributions/${listingId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const message = await response.text();
      if (!response.ok) {
        throw new Error(message || 'Could not reject contribution');
      }
      toast.success('Contribution rejected');
      await fetchMarketplace();
      setSelectedPool((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          contributions: (prev.contributions || []).filter((item) => item.id !== listingId),
        };
      });
    } catch (error) {
      toast.error(error.message || 'Reject failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
    });
  };

  if (loading) return <LoadingSpinner isDarkMode={isDarkMode} />;

  return (
    <div className="theme-page-bg min-h-screen px-4 sm:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Listings</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalListings}</p>
          </div>
          
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Clusters</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalPools}</p>
          </div>
          
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Total Area</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalArea.toLocaleString()}</p>
            <span className="text-xs opacity-80">sq ft</span>
          </div>
          
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <Heart size={20} className="opacity-80" />
              <span className="text-xs opacity-80 uppercase tracking-wide">Interests</span>
            </div>
            <p className="text-3xl font-bold">{stats.interestsSent}</p>
          </div>
        </div>

        <header className={`relative ${isDarkMode ? 'bg-emerald-700' : 'bg-emerald-600'} rounded-3xl p-10 text-white overflow-hidden shadow-xl`}>
          <div className="relative z-10">
            <h1 className="text-4xl font-black italic">
              Industrial Marketplace
            </h1>
            <p className="opacity-90 mt-2 font-medium">
              Bidding platform for high-capacity solar clusters.
            </p>
          </div>
          <Zap
            size={180}
            className="absolute -right-10 -top-10 opacity-10 rotate-12"
          />
        </header>

        <SearchFilter listings={listings} onFilter={handleFilter} />

        <section className="space-y-6">
          <SectionHeader
            icon={<Layers size={20} />}
            title="Active Capacity Pools"
            isDarkMode={isDarkMode}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onView={() => setSelectedPool(pool)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader
            icon={<TrendingUp size={20} />}
            title="Individual Residential Units"
            isDarkMode={isDarkMode}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <IndividualCard
                key={listing.id}
                listing={listing}
                onInterest={() => handleInterest(listing.id, "individual")}
                onDownloadAgreement={() => handleDownloadAgreement(listing.id)}
                isDownloadLoading={!!actionLoading[`download-${listing.id}`]}
                isInterestLoading={!!actionLoading[`interest-individual-${listing.id}`]}
                currentUserId={user?.id}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </section>
      </div>

      {selectedPool && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>
            <div className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'bg-emerald-900 border-emerald-800' : 'bg-emerald-50'}`}>
              <div>
                <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>
                  {selectedPool.projectName}
                </h2>
                <div className={`flex gap-4 mt-1 font-bold text-sm uppercase tracking-wider ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  <span>{selectedPool.city}</span>
                  <span>•</span>
                  <span>Target: {selectedPool.targetArea} sqft</span>
                    <span>•</span>
                    <span>{selectedPool.isFull ? 'FULL' : 'OPEN'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPool(null)}
                className={`p-3 ${isDarkMode ? 'bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300' : 'bg-white hover:bg-red-50 hover:text-red-500'} rounded-2xl shadow-sm transition-all`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <MapPin size={18} className="text-emerald-500" /> Site Locations
                </h3>
                <div className="h-[350px] rounded-[2rem] overflow-hidden border-4 border-emerald-50 shadow-inner z-0">
                  <MapContainer
                    key={selectedPool.id}
                    center={[
                      selectedPool.contributions?.find((c) => c.lat)?.lat ||
                        19.076,
                      selectedPool.contributions?.find((c) => c.lng)?.lng ||
                        72.8777,
                    ]}
                    zoom={12}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {selectedPool.contributions?.map(
                      (c, i) =>
                        c.lat &&
                        c.lng && (
                          <Marker key={i} position={[c.lat, c.lng]}>
                            <Popup>
                              <div className="font-sans">
                                <p className="font-bold text-gray-800">
                                  {c.address}
                                </p>
                                <p className="text-emerald-600 font-bold">
                                  {c.areaSquareFt} sqft
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        ),
                    )}
                  </MapContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Users size={18} className="text-emerald-500" /> Pool Members
                </h3>
                <div className="space-y-3">
                  {selectedPool.contributions?.map((c, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-emerald-900/30' : 'bg-gray-50 border-gray-100 hover:bg-emerald-50'}`}
                    >
                      <div className="min-w-0 pr-4">
                        <p className={`font-bold truncate text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                          {c.address || "Unnamed Site"}
                        </p>
                        <p className={`font-bold truncate text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                          ₹{c.expectedRent || "Unnamed Site"}
                        </p>
                        <p className={`text-[10px] uppercase font-bold tracking-tighter ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Contributor #{i + 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-black text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {c.areaSquareFt}
                        </span>
                        <span className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} font-bold block`}>
                          SQ.FT
                        </span>
                        {selectedPool.creator?.id === user?.id && !selectedPool.agreementGenerated && !selectedPool.isFull && (
                          <button
                            type="button"
                            onClick={() => handleRejectContribution(selectedPool.id, c.id)}
                            disabled={!!actionLoading[`reject-${selectedPool.id}-${c.id}`]}
                            className={`mt-2 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-red-700'} ${actionLoading[`reject-${selectedPool.id}-${c.id}`] ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading[`reject-${selectedPool.id}-${c.id}`] ? 'Rejecting...' : 'Reject'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-8 border-t flex flex-col items-center gap-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
              {(() => {
                const isClusterFull = selectedPool.isFull || selectedPool.currentArea >= selectedPool.targetArea;
                const isCreator = selectedPool.creator?.id === user?.id;
                const interestKey = `interest-pool-${selectedPool.id}`;
                const canShowInterest = isCreator && !isClusterFull && !selectedPool.agreementGenerated;
                return (
              <button
                onClick={() => handleInterest(selectedPool.id, "pool")}
                disabled={!canShowInterest || !!actionLoading[interestKey]}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 
                ${
                  (canShowInterest && !actionLoading[interestKey])
                    ? `${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`
                    : `${isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} opacity-60`
                }`}
              >
                <Send size={22} />
                {isClusterFull
                  ? "Cluster Full - No Operations"
                  : !isCreator
                    ? "Creator Only"
                    : actionLoading[interestKey]
                      ? "Sending..."
                      : "Show Interest For Cluster"}
              </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PoolCard = ({ pool, onView, isDarkMode }) => {
  const calculatedCurrentArea = Number(pool.currentArea || 0);
  const progress = Math.min((calculatedCurrentArea / pool.targetArea) * 100, 100);
  const isFull = pool.isFull || calculatedCurrentArea >= pool.targetArea;

  return (
    <div
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all cursor-pointer group`}
      onClick={onView}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`font-black text-xl tracking-tight group-hover:text-emerald-600 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {pool.projectName}
          </h3>
          <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {pool.city}
          </p>
        </div>
        <div className={`${
          isFull
            ? (isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700')
            : (isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
        } px-3 py-1 rounded-xl text-[10px] font-black uppercase`}>
          {isFull ? 'Cluster Full' : 'Aggregate'}
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <div className={`flex justify-between text-[11px] font-black uppercase tracking-tighter ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            <span>Capacity</span>
            <span className={isFull ? (isDarkMode ? 'text-amber-300' : 'text-amber-700') : (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')}>
              {calculatedCurrentArea.toLocaleString()} /{" "}
              {pool.targetArea.toLocaleString()} SQFT
            </span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-50'}`}>
            <div
              className={`h-full transition-all duration-1000 ${isFull ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
          <Users size={14} /> {pool.contributions?.length || 0} Sites Combined
        </div>

        <button className={`w-full py-3.5 ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'} rounded-2xl font-bold text-sm transition-colors`}>
          Analyze Cluster
        </button>
      </div>
    </div>
  );
};

const IndividualCard = ({
  listing,
  onInterest,
  onDownloadAgreement,
  isDownloadLoading,
  isInterestLoading,
  currentUserId,
  isDarkMode,
}) => {
  const acceptedCompanyId = listing?.acceptedCompany?.id;
  const isAccepted = !!acceptedCompanyId;
  const isAcceptedForCurrentCompany = isAccepted && acceptedCompanyId === currentUserId;
  const hasAlreadyInterested = listing?.interestedCompanies?.some(
    (company) => company.id === currentUserId
  );

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-4 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col font-sans`}>
      <div className="h-40 -mx-4 -mt-4 mb-4 bg-slate-100 border-b relative z-0">
        {listing.lat && listing.lng ? (
          <MapContainer
            center={[listing.lat, listing.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
            touchZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[listing.lat, listing.lng]} />
          </MapContainer>
        ) : (
          <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-[10px] uppercase tracking-wider`}>
            No Location Data
          </div>
        )}

        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur shadow-sm px-2 py-1 rounded-lg border border-emerald-50">
          <p className={`text-[8px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} uppercase leading-none mb-0.5`}>
            Rent
          </p>
          <p className={`text-xs font-bold flex items-center gap-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <IndianRupee size={10} /> {listing.expectedRent || "N/A"}
            <span className={`text-[9px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} font-normal`}>/mo</span>
          </p>
        </div>
      </div>

      <div className="mb-3">
        <h3 className={`font-semibold text-base mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {listing.address}
        </h3>
        <p className={`text-[10px] font-medium flex items-center gap-1 uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <MapPin size={10} className="text-emerald-500" /> {listing.city}
        </p>

        {isAccepted && (
          <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${isAcceptedForCurrentCompany ? 'text-emerald-500' : isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            {isAcceptedForCurrentCompany
              ? `Accepted For ${getCompanyDisplayName(listing.acceptedCompany)}`
              : `Already Accepted By ${getCompanyDisplayName(listing.acceptedCompany)}`}
          </p>
        )}
      </div>

      <div className={`flex items-center justify-between border-t pt-3 mt-auto ${isDarkMode ? 'border-gray-700' : 'border-gray-50'}`}>
        <div>
          <span className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} block uppercase font-bold tracking-tighter`}>
            Area
          </span>
          <span className={`font-bold text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {listing.areaSquareFt}{" "}
            <small className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} font-normal`}>SQFT</small>
          </span>
        </div>

        {isAcceptedForCurrentCompany ? (
          <button
            onClick={onDownloadAgreement}
            disabled={isDownloadLoading}
            className={`px-3 py-1.5 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-lg font-bold transition-all text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 ${isDownloadLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Eye size={12} /> {isDownloadLoading ? 'Preparing...' : 'Agreement PDF'}
          </button>
        ) : (
          <button
            onClick={onInterest}
            disabled={isAccepted || hasAlreadyInterested || isInterestLoading}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 ${
              (isAccepted || hasAlreadyInterested || isInterestLoading)
                ? isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Send size={12} /> {isAccepted ? 'Accepted' : hasAlreadyInterested ? 'Interested' : isInterestLoading ? 'Sending...' : 'Interest'}
          </button>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title, isDarkMode }) => (
  <div className="flex items-center gap-3">
    <div className={`p-2.5 rounded-2xl shadow-sm ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700' : 'bg-white border border-emerald-50 text-emerald-500'}`}>
      {icon}
    </div>
    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      {title}
    </h2>
    <div className={`h-px flex-1 ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-transparent' : 'bg-gradient-to-r from-emerald-100 to-transparent'}`}></div>
  </div>
);

const LoadingSpinner = ({ isDarkMode }) => (
  <div className="theme-page-bg min-h-screen flex flex-col items-center justify-center gap-4">
    <div className={`w-16 h-16 border-[6px] ${isDarkMode ? 'border-emerald-900 border-t-emerald-500' : 'border-emerald-50 border-t-emerald-600'} rounded-full animate-spin`}></div>
    <p className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} font-black tracking-widest uppercase text-xs animate-pulse`}>
      Syncing Marketplace...
    </p>
  </div>
);

export default SolarCompanyView;
