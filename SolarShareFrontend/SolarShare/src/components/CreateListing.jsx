import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import { Target, MapPin } from 'lucide-react'; 
import L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Navigate } from "react-router-dom";
import API_BASE_URL from '../config/api';

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

const MapRecenter = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    }
  }, [lat, lng, map]);

  return null;
};

const CreateListing = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);

  const [formData, setFormData] = useState({
    address: '',
    areaSquareFt: '',
    city: '',
    expectedRent: '',
    description: '',
    lat: 19.0760, 
    lng: 72.8777
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setFormData(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
      },
    });

    // Calculate radius from area in sqft (convert to meters)
    const calculateRadius = (areaSquareFt) => {
      if (!areaSquareFt || areaSquareFt <= 0) return null;
      const areaInMetersSquared = areaSquareFt * 0.092903; // 1 sqft = 0.092903 m²
      const radius = Math.sqrt(areaInMetersSquared / Math.PI); // r = √(A/π)
      return radius;
    };

    const radius = calculateRadius(parseFloat(formData.areaSquareFt));

    return formData.lat ? (
      <>
        <Marker position={[formData.lat, formData.lng]} />
        
        {/* Area visualization circle */}
        {radius && (
          <Circle 
            center={[formData.lat, formData.lng]} 
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

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-[90%] sm:w-auto">
          <div className="bg-white/90 backdrop-blur-md border border-emerald-200 px-4 py-2 rounded-2xl shadow-xl flex items-center justify-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Target size={16} className="text-white" />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Latitude</span>
                <span className="text-sm font-mono font-bold text-gray-700">{formData.lat.toFixed(6)}</span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Longitude</span>
                <span className="text-sm font-mono font-bold text-gray-700">{formData.lng.toFixed(6)}</span>
              </div>
              {radius && (
                <>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Coverage</span>
                    <span className="text-sm font-mono font-bold text-emerald-600">{radius.toFixed(1)}m radius</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    ) : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/listings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success("Rooftop listed successfully!");
        navigate('/dashboard');
      } else {
        toast.error("Failed to create listing");
      }
    } catch {
      toast.error("Connection error. Please check if backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchLocation = async () => {
    const query = formData.address?.trim();
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
      setFormData((prev) => ({
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
    <div className={`min-h-screen flex items-center justify-center px-0 py-4 sm:px-4 sm:py-12 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'
    }`}>
      <div className="w-full max-w-6xl px-4">
        <div className={`rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-emerald-100'
        } ${isDarkMode ? 'shadow-gray-900/50' : 'shadow-emerald-200/50'}`}>
          
          <div className="w-full h-[350px] lg:h-auto lg:flex-1 bg-gray-100 relative overflow-hidden order-1 lg:order-2">
            <div className="absolute top-3 left-3 right-3 z-[1001]">
              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={searchingLocation || !formData.address?.trim()}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md ${isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-white text-emerald-700 hover:bg-emerald-50'} ${(searchingLocation || !formData.address?.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {searchingLocation ? 'Searching...' : 'Search & Pin'}
              </button>
            </div>
            <MapContainer 
                center={[19.0760, 72.8777]} 
                zoom={11} 
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapRecenter lat={formData.lat} lng={formData.lng} />
              <LocationMarker />
            </MapContainer>
          </div>

          <div className={`w-full lg:w-[400px] p-8 sm:p-10 border-t lg:border-t-0 lg:border-r order-2 lg:order-1 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
          }`}>
            <div className="mb-8">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Property Info</h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Specify details for solar installers</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} uppercase tracking-widest mb-2 block`}>Full Address</label>
                <input required 
                  value={formData.address}
                  placeholder="123 Main Street, Andheri West"
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                  }`}
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} uppercase tracking-widest mb-2 block`}>City</label>
                  <input required 
                    value={formData.city}
                    placeholder="Mumbai"
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                    }`}
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} uppercase tracking-widest mb-2 block`}>Area (sqft)</label>
                  <input type="number" required 
                    value={formData.areaSquareFt}
                    placeholder="1500"
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                    }`}
                    onChange={(e) => {
                      const area = e.target.value;
                      const rent = area ? (area * 10).toString() : '';
                      setFormData({...formData, areaSquareFt: area, expectedRent: rent});
                    }} 
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} uppercase tracking-widest mb-2 block`}>Monthly Rent (₹)</label>
                <input type="number" required 
                  value={formData.expectedRent}
                  placeholder="15000"
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                  }`}
                  onChange={(e) => setFormData({...formData, expectedRent: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2 ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Publishing...
                  </>
                ) : (
                  'Publish Listing'
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateListing;
