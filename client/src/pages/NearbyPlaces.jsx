import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Navigation, Compass, Star, DollarSign, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NearbyPlanner() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'All Places', icon: <Compass className="w-4 h-4" />, gradient: 'from-purple-500 to-indigo-600' },
    { id: 'restaurant', name: 'Restaurants', icon: <DollarSign className="w-4 h-4" />, gradient: 'from-orange-500 to-red-500' },
    { id: 'medical', name: 'Medical', icon: <Star className="w-4 h-4" />, gradient: 'from-red-500 to-pink-600' },
    { id: 'atm', name: 'ATM/Banks', icon: <DollarSign className="w-4 h-4" />, gradient: 'from-green-500 to-emerald-600' },
    { id: 'fuel', name: 'Fuel Stations', icon: <Navigation className="w-4 h-4" />, gradient: 'from-yellow-500 to-amber-600' }
  ];

  // Enhanced mock data
  const mockPlaces = [
    { 
      id: 1, 
      name: 'Central Park Restaurant', 
      category: 'restaurant', 
      address: '123 Park Ave, New York',
      lat: 40.7829,
      lon: -73.9654,
      distance: '0.5 km'
    },
    { 
      id: 2, 
      name: 'Grand Hotel', 
      category: 'hotel', 
      address: '456 Broadway, New York',
      lat: 40.7589,
      lon: -73.9851,
      distance: '1.2 km'
    },
    { 
      id: 3, 
      name: 'City Medical Center', 
      category: 'medical', 
      address: '789 Health St, New York',
      lat: 40.7414,
      lon: -73.9903,
      distance: '0.8 km'
    },
    { 
      id: 4, 
      name: 'Main Street Bank', 
      category: 'atm', 
      address: '321 Main St, New York',
      lat: 40.7505,
      lon: -73.9934,
      distance: '1.5 km'
    },
    { 
      id: 5, 
      name: 'Downtown Fuel Station', 
      category: 'fuel', 
      address: '654 Fuel Ave, New York',
      lat: 40.7639,
      lon: -73.9724,
      distance: '2.1 km'
    }
  ];

  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    checkServerStatus();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation && serverStatus === 'online') {
      fetchNearbyPlaces();
    }
  }, [selectedCategory, radius, userLocation, serverStatus]);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        setServerStatus('online');
        setError('');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      setServerStatus('offline');
      setError('Cannot connect to server. Please make sure Flask is running on port 8000.');
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          const defaultLocation = { lat: 40.7128, lng: -74.0060 };
          setUserLocation(defaultLocation);
          setError('Using default location (New York). Enable location for accurate results.');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      const defaultLocation = { lat: 40.7128, lng: -74.0060 };
      setUserLocation(defaultLocation);
      setError('Geolocation not supported. Using default location.');
      setLoading(false);
    }
  };

  const fetchNearbyPlaces = async (useMock = false) => {
    if (!userLocation) return;
    
    setLoading(true);
    setError('');
    setUsingMockData(false);
    
    if (useMock) {
      setTimeout(() => {
        setNearbyPlaces(mockPlaces);
        setUsingMockData(true);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      console.log('📡 Fetching nearby places from API...');
      
      const response = await fetch(`${API_BASE}/api/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: userLocation.lat,
          lon: userLocation.lng,
          radius: radius * 1000,
          category: selectedCategory === 'all' ? null : selectedCategory
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.status === 'success' && data.places) {
        // Add distance display
        const placesWithDisplay = data.places.map(place => ({
          ...place,
          distance: `${place.distance_km?.toFixed(1) || '0.0'} km`
        }));
        
        setNearbyPlaces(placesWithDisplay);
        setUsingMockData(false);
        setError('');
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('API Error:', err);
      // Fallback to mock data
      setNearbyPlaces(mockPlaces);
      setUsingMockData(true);
      setError(`API Connection Issue: ${err.message}. Using sample data.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
  };

  const handleRetry = () => {
    checkServerStatus();
    if (userLocation) {
      fetchNearbyPlaces();
    }
  };

  const handleUseMockData = () => {
    if (userLocation) {
      fetchNearbyPlaces(true);
    }
  };

  const filteredPlaces = nearbyPlaces.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      restaurant: 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border-orange-200 shadow-orange-100',
      hotel: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200 shadow-blue-100',
      medical: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200 shadow-red-100',
      atm: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200 shadow-green-100',
      fuel: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200 shadow-yellow-100',
      other: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200 shadow-gray-100'
    };
    return colors[category] || colors.other;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      restaurant: '🍽️',
      hotel: '🏨',
      medical: '🏥',
      atm: '🏦',
      fuel: '⛽',
      other: '📍'
    };
    return icons[category] || icons.other;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-3 rounded-2xl hover:bg-gray-100/80 transition-all duration-300 shadow-sm border border-gray-200/50 hover:shadow-md"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${
                  serverStatus === 'online' ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-200/50' : 
                  serverStatus === 'offline' ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200/50' : 
                  'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-200/50'
                }`}>
                  <Compass className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Nearby Explorer
                  </h1>
                  <p className="text-gray-600 flex items-center space-x-2 mt-1">
                    <span>Discover places around you</span>
                    <span className={`w-2 h-2 rounded-full ${
                      serverStatus === 'online' ? 'bg-green-500 animate-pulse' : 
                      serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userLocation && (
                <div className="flex items-center space-x-3 text-sm bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 px-4 py-2.5 rounded-xl border border-green-200 shadow-sm">
                  <Navigation className="w-4 h-4 text-green-600" />
                  <span className="font-medium">
                    {userLocation.lat === 40.7128 ? 'New York, NY' : 'Your Location'}
                  </span>
                </div>
              )}
              <button
                onClick={handleRetry}
                disabled={loading}
                className="flex items-center space-x-3 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Server Status Alert */}
      {serverStatus === 'offline' && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <WifiOff className="w-5 h-5 text-red-600" />
                <div>
                  <span className="text-red-800 font-semibold">Server is offline</span>
                  <span className="text-red-600 text-sm ml-3">Make sure Flask is running on port 8000</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.open('http://localhost:8000/api/health', '_blank')}
                  className="text-sm text-red-700 underline hover:text-red-800 font-medium"
                >
                  Test Connection
                </button>
                <button
                  onClick={handleUseMockData}
                  className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
                >
                  Use Sample Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="bg-white/70 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for restaurants, medical facilities, ATMs, fuel stations..."
                className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl bg-white shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={serverStatus !== 'online' && !usingMockData}
              />
            </div>

            {/* Radius Filter */}
            <div className="flex items-center space-x-3 bg-white px-5 py-3.5 rounded-2xl border border-gray-300 shadow-lg">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Within</span>
              <select
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="border-none bg-transparent focus:outline-none focus:ring-0 text-sm font-medium text-gray-900"
                disabled={loading || (serverStatus !== 'online' && !usingMockData)}
              >
                <option value={1}>1 km</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={25}>25 km</option>
              </select>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex space-x-3 overflow-x-auto mt-6 pb-2 px-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                disabled={loading || (serverStatus !== 'online' && !usingMockData)}
                className={`flex items-center space-x-3 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-xl scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md hover:shadow-lg'
                } ${(loading || serverStatus !== 'online') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {loading ? 'Discovering Places...' : `Found ${filteredPlaces.length} Places`}
            </h2>
            <p className="text-gray-600 mt-1">
              {loading ? 'Searching for nearby places...' : `Within ${radius} km radius`}
              {usingMockData && !loading && ' • Using sample data'}
            </p>
          </div>
          {loading && (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-gray-600 font-medium">Loading...</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching Nearby</h3>
            <p className="text-gray-600">Finding the best places around you...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlaces.map((place, index) => (
              <div
                key={place.id || index}
                className="bg-white rounded-3xl shadow-lg border border-gray-200/60 p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{getCategoryIcon(place.category)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{place.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{place.address}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getCategoryColor(place.category)} shadow-sm`}>
                    {place.category}
                  </span>
                </div>
                
                {place.distance && (
                  <div className="mb-4">
                    <span className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200 shadow-sm">
                      <Navigation className="w-3 h-3" />
                      <span>{place.distance}</span>
                    </span>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/dir/${userLocation?.lat},${userLocation?.lng}/${place.lat},${place.lon}`, '_blank')}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-300/50"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Get Directions</span>
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredPlaces.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Compass className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Places Found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8 text-lg">
              {searchQuery 
                ? `No results found for "${searchQuery}". Try adjusting your search.`
                : 'No places found in this area. Try increasing the search radius or check your location settings.'
              }
            </p>
            <button
              onClick={handleRetry}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg shadow-blue-200/50 font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}