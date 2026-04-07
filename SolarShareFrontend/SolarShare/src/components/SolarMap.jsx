import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { Sun, Zap, MapPin, Building2 } from 'lucide-react';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const sampleSolarProjects = [
    { id: 1, name: "SunPower Rooftop", address: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777, capacity: "500 kW", area: "5,000 sq.ft", status: "Active" },
    { id: 2, name: "GreenGrid Solar", address: "Thane, Maharashtra", lat: 19.1863, lng: 72.9755, capacity: "350 kW", area: "3,500 sq.ft", status: "Active" },
    { id: 3, name: "EcoEnergy Hub", address: "Navi Mumbai, Maharashtra", lat: 19.0330, lng: 73.0297, capacity: "750 kW", area: "7,500 sq.ft", status: "Planned" },
    { id: 4, name: "SolarVista Tower", address: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567, capacity: "1,200 kW", area: "12,000 sq.ft", status: "Active" },
    { id: 5, name: "BrightSun Industries", address: "Nagpur, Maharashtra", lat: 21.1458, lng: 79.0882, capacity: "400 kW", area: "4,000 sq.ft", status: "Active" },
    { id: 6, name: "SolarMax Facility", address: "Nashik, Maharashtra", lat: 19.9975, lng: 73.7898, capacity: "600 kW", area: "6,000 sq.ft", status: "Planned" },
];

const SolarMap = () => {
    const { isDarkMode } = useTheme();

    return (
        <div className="theme-page-bg min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Solar Map
                    </h1>
                    <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Explore solar energy projects across India
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className={`rounded-2xl overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="h-[500px]">
                                <MapContainer 
                                    center={[19.0760, 72.8777]} 
                                    zoom={7} 
                                    scrollWheelZoom={true} 
                                    className="h-full w-full"
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    
                                    {sampleSolarProjects.map((project) => (
                                        project.lat && project.lng && (
                                            <Marker key={project.id} position={[project.lat, project.lng]}>
                                                <Popup>
                                                    <div className="p-2 min-w-[200px]">
                                                        <h3 className="font-bold text-emerald-600">{project.name}</h3>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            <MapPin size={12} /> {project.address}
                                                        </p>
                                                        <div className="mt-2 space-y-1">
                                                            <p className="text-xs text-gray-500">
                                                                <span className="font-medium">Capacity:</span> {project.capacity}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                <span className="font-medium">Area:</span> {project.area}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                <span className="font-medium">Status:</span> {project.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )
                                    ))}
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={`p-4 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                                    <Sun className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Projects</h3>
                                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>156</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                                    <Zap className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Capacity</h3>
                                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>45 MW</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                                    <Building2 className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>RoofTops Leased</h3>
                                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>89</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Project Locations</h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {sampleSolarProjects.map((project) => (
                                    <div key={project.id} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <h4 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {project.name}
                                            </h4>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                project.status === 'Active' 
                                                    ? isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
                                                    : isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {project.address}
                                        </p>
                                        <div className="flex gap-3 mt-2">
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {project.capacity}
                                            </span>
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {project.area}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolarMap;
