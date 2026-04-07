import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, MapPin, IndianRupee, Maximize, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SearchFilter = ({ onFilter, listings = [] }) => {
    const { isDarkMode } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        city: '',
        minArea: '',
        maxArea: '',
        minRent: '',
        maxRent: '',
        sortBy: 'newest'
    });

    const cities = [...new Set(listings.map(l => l.city).filter(Boolean))];

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        applyFilters(value, filters);
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        applyFilters(searchTerm, newFilters);
    };

    const applyFilters = (search, currentFilters) => {
        let filtered = [...listings];

        if (search) {
            filtered = filtered.filter(listing => 
                listing.address?.toLowerCase().includes(search.toLowerCase()) ||
                listing.city?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (currentFilters.city) {
            filtered = filtered.filter(listing => listing.city === currentFilters.city);
        }

        if (currentFilters.minArea) {
            filtered = filtered.filter(listing => listing.areaSquareFt >= parseInt(currentFilters.minArea));
        }

        if (currentFilters.maxArea) {
            filtered = filtered.filter(listing => listing.areaSquareFt <= parseInt(currentFilters.maxArea));
        }

        if (currentFilters.minRent) {
            filtered = filtered.filter(listing => listing.expectedRent >= parseInt(currentFilters.minRent));
        }

        if (currentFilters.maxRent) {
            filtered = filtered.filter(listing => listing.expectedRent <= parseInt(currentFilters.maxRent));
        }

        if (currentFilters.sortBy === 'newest') {
            filtered.sort((a, b) => new Date(b.id) - new Date(a.id));
        } else if (currentFilters.sortBy === 'price-low') {
            filtered.sort((a, b) => a.expectedRent - b.expectedRent);
        } else if (currentFilters.sortBy === 'price-high') {
            filtered.sort((a, b) => b.expectedRent - a.expectedRent);
        } else if (currentFilters.sortBy === 'area') {
            filtered.sort((a, b) => b.areaSquareFt - a.areaSquareFt);
        }

        onFilter(filtered);
    };

    const clearFilters = () => {
        setFilters({
            city: '',
            minArea: '',
            maxArea: '',
            minRent: '',
            maxRent: '',
            sortBy: 'newest'
        });
        setSearchTerm('');
        onFilter(listings);
    };

    const activeFiltersCount = Object.values(filters).filter(v => v && v !== '' && v !== 'newest').length;

    return (
        <div className={`rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-4 mb-6`}>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <input 
                        type="text"
                        placeholder="Search by location, city..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'} border focus:ring-2 focus:ring-emerald-500 outline-none transition-all`}
                    />
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                        showFilters 
                            ? 'bg-emerald-500 text-white' 
                            : isDarkMode 
                                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <SlidersHorizontal size={20} />
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${showFilters ? 'bg-white text-emerald-500' : 'bg-emerald-500 text-white'}`}>
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {showFilters && (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <MapPin size={12} className="inline mr-1" />
                                City
                            </label>
                            <select 
                                value={filters.city}
                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-200'} border text-sm`}
                            >
                                <option value="">All Cities</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Maximize size={12} className="inline mr-1" />
                                Min Area (sqft)
                            </label>
                            <input 
                                type="number"
                                placeholder="Min"
                                value={filters.minArea}
                                onChange={(e) => handleFilterChange('minArea', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'} border text-sm`}
                            />
                        </div>

                        <div>
                            <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <IndianRupee size={12} className="inline mr-1" />
                                Max Rent (₹)
                            </label>
                            <input 
                                type="number"
                                placeholder="Max"
                                value={filters.maxRent}
                                onChange={(e) => handleFilterChange('maxRent', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'} border text-sm`}
                            />
                        </div>

                        <div>
                            <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Sort By
                            </label>
                            <select 
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-200'} border text-sm`}
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="area">Area: Largest First</option>
                            </select>
                        </div>
                    </div>

                    {activeFiltersCount > 0 && (
                        <button 
                            onClick={clearFilters}
                            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                            <X size={16} />
                            Clear all filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchFilter;
