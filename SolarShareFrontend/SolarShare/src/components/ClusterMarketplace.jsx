import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users, MapPin, Target, Send, X, Zap, Sun, Moon, Building2, CheckCircle, Download, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Navigate } from "react-router-dom";
import API_BASE_URL from '../config/api';
import useSingleFlight from '../utils/useSingleFlight';

import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapEvents = ({ contribution, setContribution }) => {
  // Calculate radius from area in sqft (convert to meters)
  const calculateRadius = (areaSquareFt) => {
    if (!areaSquareFt || areaSquareFt <= 0) return null;
    const areaInMetersSquared = areaSquareFt * 0.092903; // 1 sqft = 0.092903 m²
    const radius = Math.sqrt(areaInMetersSquared / Math.PI); // r = √(A/π)
    return radius;
  };

  const radius = calculateRadius(parseFloat(contribution.areaSquareFt));

  useMapEvents({
    click(e) {
      setContribution(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
    },
  });

  return (
    <>
      {contribution.lat && <Marker position={[contribution.lat, contribution.lng]} />}
      
      {contribution.lat && radius && (
        <Circle 
          center={[contribution.lat, contribution.lng]} 
          radius={radius}
          pathOptions={{
            color: '#10b981',
            weight: 2,
            opacity: 0.6,
            fill: true,
            fillColor: '#10b981',
            fillOpacity: 0.1,
            dashArray: '5, 5'
          }}
        />
      )}
    </>
  );
};

const MapRecenter = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    }
  }, [lat, lng, map]);

  return null;
};

const ClusterMarketplace = () => {
  const { token, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [clusters, setClusters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const { runSingleFlight } = useSingleFlight();

  const [newCluster, setNewCluster] = useState({ projectName: '', city: '', targetArea: 5000 });
  const [contribution, setContribution] = useState({ 
    address: '', 
    areaSquareFt: '', 
    expectedRent: '', 
    lat: null, 
    lng: null 
  });
  const isProvider = user?.type === 'SOLAR_COMPANY';
  const CLUSTERS_PER_PAGE = 10;

  const sortClusters = (data) => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      if (!!a?.isFull !== !!b?.isFull) {
        return a?.isFull ? 1 : -1;
      }
      return (b?.id || 0) - (a?.id || 0);
    });
  };

  const paginatedClusters = useMemo(() => {
    const start = (currentPage - 1) * CLUSTERS_PER_PAGE;
    return clusters.slice(start, start + CLUSTERS_PER_PAGE);
  }, [clusters, currentPage]);

  const totalPages = Math.max(1, Math.ceil(clusters.length / CLUSTERS_PER_PAGE));

  const fetchClusters = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/clusters/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Could not load clusters');
      }
      const data = await res.json();
      setClusters(sortClusters(data));
      setCurrentPage(1);
    } catch {
      toast.error("Failed to load clusters");
    }
  };

  useEffect(() => { 
    if (!isAuthenticated) return;
    fetchClusters(); 
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClustersUpdated = () => fetchClusters();
    window.addEventListener('clusters-updated', handleClustersUpdated);
    window.addEventListener('focus', handleClustersUpdated);

    return () => {
      window.removeEventListener('clusters-updated', handleClustersUpdated);
      window.removeEventListener('focus', handleClustersUpdated);
    };
  }, [token, isAuthenticated]);

  const handleCreateCluster = async () => {
    if (!isProvider) {
      toast.error("Only providers can create clusters");
      return;
    }

    const key = 'create-cluster';
    if (actionLoading[key]) {
      return;
    }

    await runSingleFlight(key, async () => {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      const res = await fetch(`${API_BASE_URL}/api/clusters/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCluster)
      });
      if (res.ok) {
        toast.success("Cluster started!");
        setShowCreateModal(false);
        setNewCluster({ projectName: '', city: '', targetArea: 5000 });
        fetchClusters();
      }
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    });
  };

  const handleJoinCluster = async () => {
    if (!contribution.lat) return toast.error("Please pin your location on the map");

    const key = `join-cluster-${selectedCluster?.id}`;
    if (actionLoading[key]) {
      return;
    }

    await runSingleFlight(key, async () => {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      const res = await fetch(`${API_BASE_URL}/api/clusters/${selectedCluster.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(contribution)
      });
      if (res.ok) {
        toast.success("Joined the pool!");
        setShowJoinModal(false);
        setContribution({ address: '', areaSquareFt: '', expectedRent: '', lat: null, lng: null });
        fetchClusters();
      }
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    });
  };

  const handleSearchContributionLocation = async () => {
    const query = contribution.address?.trim();
    if (!query) {
      toast.error('Enter address to search on map');
      return;
    }

    setSearchingLocation(true);
    try {
      const provider = new OpenStreetMapProvider();
      const results = await provider.search({ query });

      if (!results || results.length === 0) {
        toast.error('No location found for this address');
        return;
      }

      const top = results[0];
      setContribution((prev) => ({
        ...prev,
        lat: Number(top.y),
        lng: Number(top.x),
        address: top.label || prev.address,
      }));
      toast.success('Location pinned on map');
    } catch {
      toast.error('Could not search location right now');
    } finally {
      setSearchingLocation(false);
    }
  };

  return (
    <div className={`min-h-screen px-4 sm:px-8 py-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className={`relative rounded-3xl px-7 py-8 shadow-xl overflow-hidden ${
          isDarkMode ? 'bg-gradient-to-r from-emerald-700 to-teal-700' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
        }`}>
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                >
                  {isDarkMode ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-white" />}
                </button>
              </div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">Marketplace</p>
              <h1 className="text-3xl font-black tracking-tight text-white">SolarPools</h1>
              <p className="text-emerald-100 text-sm mt-1 font-light">{isProvider ? 'Aggregate rooftop space to hit industrial power targets.' : 'Join existing pools to contribute your rooftop space.'}</p>
            </div>
            {isProvider && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-emerald-600 px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-emerald-50 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus size={17} /> Start New Pool
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-emerald-100'
          }`}>
            <Target size={15} className="text-emerald-500" />
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Active Pools ({clusters.length})</span>
          </div>
          <div className={`h-px flex-1 ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-transparent' : 'bg-gradient-to-r from-emerald-100 to-transparent'}`}></div>
        </div>

        {clusters.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-dashed border-emerald-200'}`}>
            <Building2 size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-emerald-300'}`} />
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>No Pools Yet</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start your first solar pool to aggregate rooftops</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedClusters.map(cluster => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                canContribute={!isProvider}
                user={user}
                onJoin={() => {
                  if (isProvider) {
                    toast.error('Only rooftop owners can contribute space');
                    return;
                  }
                  setSelectedCluster(cluster);
                  setShowJoinModal(true);
                }}
                onDissolve={() => fetchClusters()}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${currentPage === 1
                  ? (isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                  : (isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-500 text-white hover:bg-emerald-600')}`}
              >
                Prev
              </button>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${currentPage === totalPages
                  ? (isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                  : (isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-500 text-white hover:bg-emerald-600')}`}
              >
                Next
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {showCreateModal && isProvider && (
        <Modal title="Start New Pool" onClose={() => setShowCreateModal(false)} isDarkMode={isDarkMode}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Project Name</label>
              <input 
                className={`w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`} 
                placeholder="Enter project name" 
                onChange={e => setNewCluster({...newCluster, projectName: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>City/Village</label>
              <input 
                className={`w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`} 
                placeholder="Enter city name" 
                onChange={e => setNewCluster({...newCluster, city: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Target Area (sqft)</label>
              <input 
                type="number" 
                className={`w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`} 
                placeholder="e.g., 5000" 
                onChange={e => setNewCluster({...newCluster, targetArea: e.target.value})} 
              />
            </div>
            
            <button 
              onClick={handleCreateCluster} 
              disabled={!!actionLoading['create-cluster']}
              className={`w-full py-3.5 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg ${
                actionLoading['create-cluster']
                  ? (isDarkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                  : isDarkMode 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {actionLoading['create-cluster'] ? 'Creating...' : 'Launch Cluster'}
            </button>
          </div>
        </Modal>
      )}

      {showJoinModal && (
        <Modal title={`Join ${selectedCluster?.projectName}`} onClose={() => setShowJoinModal(false)} isDarkMode={isDarkMode}>
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
            
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Pin Your Rooftop Location</label>
              <div className="h-56 w-full rounded-xl overflow-hidden shadow-md relative z-0">
                <div className="absolute top-3 left-3 z-[1002]">
                  <button
                    type="button"
                    onClick={handleSearchContributionLocation}
                    disabled={searchingLocation || !contribution.address?.trim()}
                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md ${isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-white text-emerald-700 hover:bg-emerald-50'} ${(searchingLocation || !contribution.address?.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {searchingLocation ? 'Searching...' : 'Search & Pin'}
                  </button>
                </div>
                <MapContainer center={[19.0760, 72.8777]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapRecenter lat={contribution.lat} lng={contribution.lng} />
                  <MapEvents contribution={contribution} setContribution={setContribution} />
                </MapContainer>
                {!contribution.lat && (
                   <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none z-[1001]">
                      <div className={`px-4 py-2 rounded-lg text-xs font-medium shadow-lg border ${
                        isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-emerald-600 border-emerald-200'
                      }`}>
                        Click map to set location
                      </div>
                   </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Full Address</label>
              <input 
                value={contribution.address}
                className={`w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`} 
                placeholder="Enter your complete address" 
                onChange={e => setContribution({...contribution, address: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Area (Sq. Ft)</label>
                <input 
                  type="number" 
                  value={contribution.areaSquareFt}
                  className={`w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                  }`} 
                  placeholder="e.g., 1000" 
                  onChange={e => {
                    const area = e.target.value;
                    const rent = area ? (area * 10).toString() : '';
                    setContribution({...contribution, areaSquareFt: area, expectedRent: rent});
                  }} 
                />
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Expected Rent</label>
                <input 
                  type="number" 
                  value={contribution.expectedRent}
                  className={`w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                  }`} 
                  placeholder="₹ /month" 
                  onChange={e => setContribution({...contribution, expectedRent: e.target.value})} 
                />
              </div>
            </div>

            <button 
              onClick={handleJoinCluster} 
              disabled={!contribution.lat || !!actionLoading[`join-cluster-${selectedCluster?.id}`]}
              className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                contribution.lat && !actionLoading[`join-cluster-${selectedCluster?.id}`]
                  ? isDarkMode 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {contribution.lat ? (
                <>{actionLoading[`join-cluster-${selectedCluster?.id}`] ? 'Submitting...' : 'Submit Contribution'} <Send size={16} /></>
              ) : (
                'Select Location on Map'
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const ClusterCard = ({ cluster, onJoin, isDarkMode, canContribute, user, onDissolve }) => {
  const calculatedCurrentArea = Number(cluster.currentArea || 0);
  const progress = Math.min((calculatedCurrentArea / cluster.targetArea) * 100, 100);
  const interestedCount = cluster.interestedCompanies?.length || 0;
  const isFull = cluster.isFull || calculatedCurrentArea >= cluster.targetArea;
  const isAgreementReady = cluster.isFull && cluster.agreementGenerated;
  const isLocked = isFull && !cluster.agreementGenerated;
  const isCreator = user && cluster.creator && user.id === cluster.creator.id;
  const { token } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const { runSingleFlight } = useSingleFlight();

  // Fetch agreements when cluster is full and agreement is generated
  useEffect(() => {
    if (cluster.isFull && cluster.agreementGenerated) {
      fetchAgreements();
    }
  }, [cluster.id, cluster.agreementGenerated]);

  const fetchAgreements = async () => {
    try {
      setLoadingAgreements(true);
      const res = await fetch(`${API_BASE_URL}/api/clusters/${cluster.id}/agreements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgreements(data);
      } else {
        console.error('Failed to fetch agreements');
      }
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoadingAgreements(false);
    }
  };

  const handleDownloadAgreement = async (agreementId, fileName) => {
    const key = `download-agreement-${agreementId}`;
    if (actionLoading[key]) {
      return;
    }
    await runSingleFlight(key, async () => {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      try {
      const res = await fetch(`${API_BASE_URL}/api/clusters/agreements/${agreementId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        toast.success('Agreement downloaded');
      } else {
        toast.error('Failed to download agreement');
      }
    } catch (error) {
      console.error('Error downloading agreement:', error);
      toast.error('Error downloading agreement');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
    });
  };

  const handleDissolve = async () => {
    if (!window.confirm('Are you sure you want to dissolve this cluster? All contributions will be reverted.')) return;
    const key = `dissolve-${cluster.id}`;
    if (actionLoading[key]) {
      return;
    }
    
    await runSingleFlight(key, async () => {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      try {
      const res = await fetch(`${API_BASE_URL}/api/clusters/${cluster.id}/dissolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Cluster dissolved successfully');
        onDissolve();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to dissolve cluster');
      }
    } catch {
      toast.error('Error dissolving cluster');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
    });
  };

  return (
    <div className={`rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
    }`}>
      <div className={`h-1.5 w-full ${interestedCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{cluster.projectName}</h3>
            <p className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}><MapPin size={10} /> {cluster.city}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isAgreementReady ? (
              <div className={`${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'} px-2 py-1 rounded-lg text-[10px] font-black uppercase`}>Agreement Ready</div>
            ) : isLocked ? (
              <div className={`${isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700'} px-2 py-1 rounded-lg text-[10px] font-black uppercase`}>Awaiting Agreement</div>
            ) : null}
            {interestedCount > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg text-[10px] font-black animate-pulse">
                <Zap size={10} fill="currentColor" /> {interestedCount} BIDS
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className={`flex justify-between text-[10px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
            <span>{calculatedCurrentArea.toLocaleString()} / {cluster.targetArea.toLocaleString()} sqft</span>
            <span className="text-emerald-500">{progress.toFixed(0)}%</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(Math.min(interestedCount, 3))].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white -ml-2 first:ml-0">
                <Users size={12} />
              </div>
            ))}
          </div>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{cluster.contributions?.length || 0} contributors</span>
        </div>

        {isCreator ? (
          <div className="space-y-2">
            {isFull ? (
              <div className={`w-full py-2.5 rounded-xl font-bold text-sm text-center ${
                isDarkMode ? 'bg-amber-700 text-white' : 'bg-amber-600 text-white'
              }`}>
                Cluster Full
              </div>
            ) : (
              <button 
                onClick={handleDissolve}
                disabled={!!actionLoading[`dissolve-${cluster.id}`]}
                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  actionLoading[`dissolve-${cluster.id}`]
                    ? (isDarkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                    : isDarkMode
                    ? 'bg-red-600/70 text-white hover:bg-red-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                <X size={16} /> {actionLoading[`dissolve-${cluster.id}`] ? 'Dissolving...' : 'Dissolve Pool'}
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={onJoin} 
            disabled={isAgreementReady || !canContribute || isFull}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              !canContribute
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isAgreementReady
                ? isDarkMode
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'bg-blue-600 text-white cursor-default'
                : isFull
                ? isDarkMode
                  ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed'
                  : 'bg-amber-100 text-amber-700 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {!canContribute ? (
              <>Owners Only</>
            ) : isAgreementReady ? (
              <>Agreement Ready <CheckCircle size={16} /></>
            ) : isFull ? (
              <>Cluster Full</>
            ) : (
              <>Contribute Space <Plus size={16} /></>
            )}
          </button>
        )}

        {/* Agreements Section */}
        {isAgreementReady && (
          <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h4 className={`text-xs font-bold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <FileText size={12} className="inline mr-1" /> Agreements ({agreements.length})
            </h4>
            {loadingAgreements ? (
              <div className={`text-xs py-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading agreements...
              </div>
            ) : agreements.length > 0 ? (
              <div className="space-y-2">
                {agreements.map((agreement, idx) => (
                  <button
                    key={agreement.id}
                    onClick={() => handleDownloadAgreement(agreement.id, agreement.fileName)}
                    disabled={!!actionLoading[`download-agreement-${agreement.id}`]}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 justify-between ${
                      actionLoading[`download-agreement-${agreement.id}`]
                        ? (isDarkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                        :
                      isDarkMode
                        ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-600/30'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                    }`}
                  >
                    <span className="truncate">{actionLoading[`download-agreement-${agreement.id}`] ? 'Preparing...' : `Agreement ${idx + 1}`}</span>
                    <Download size={12} />
                  </button>
                ))}
              </div>
            ) : (
              <div className={`text-xs py-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No agreements yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Modal = ({ title, children, onClose, isDarkMode }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
    <div className={`rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`}>
      <div className={`h-1.5 w-full ${isDarkMode ? 'bg-emerald-600' : 'bg-emerald-500'}`}></div>
      <div className="p-7">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-all ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default ClusterMarketplace;
