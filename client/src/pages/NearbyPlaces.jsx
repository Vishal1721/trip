import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Navigation, Compass, Star, Clock, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
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
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'All Places', icon: <Compass className="w-4 h-4" /> },
    { id: 'restaurant', name: 'Restaurants', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'hotel', name: 'Hotels', icon: <MapPin className="w-4 h-4" /> },
    { id: 'medical', name: 'Medical', icon: <Star className="w-4 h-4" /> },
    { id: 'atm', name: 'ATM/Banks', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'fuel', name: 'Fuel Stations', icon: <Navigation className="w-4 h-4" /> }
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
    },
    { 
      id: 6, 
      name: 'Pizza Palace', 
      category: 'restaurant', 
      address: '987 Pizza St, New York',
      lat: 40.7282,
      lon: -73.9942,
      distance: '0.3 km'
    }
  ];

  // Try different API URLs in order
  const API_URLS = [
    'http://localhost:8000/api/nearby',
    'http://127.0.0.1:8000/api/nearby', 
    'http://10.10.68.207:8000/api/nearby'
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlaces(userLocation.lat, userLocation.lng);
    }
  }, [selectedCategory, radius]);

  const getUserLocation = () => {
    setLoading(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          await fetchNearbyPlaces(location.lat, location.lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York
          setUserLocation(defaultLocation);
          setError('Using default location (New York). Enable location for accurate results.');
          fetchNearbyPlaces(defaultLocation.lat, defaultLocation.lng, true);
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
      fetchNearbyPlaces(defaultLocation.lat, defaultLocation.lng, true);
    }
  };

  const testApiConnection = async () => {
    const testUrls = [
      'http://localhost:8000/api/health',
      'http://127.0.0.1:8000/api/health',
      'http://10.10.68.207:8000/api/health'
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ API is accessible at: ${url}`);
          return url.replace('/health', '/nearby');
        }
      } catch (err) {
        console.log(`❌ Cannot reach: ${url}`);
      }
    }
    return null;
  };

  const fetchNearbyPlaces = async (lat, lng, useMock = false) => {
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
      console.log('Testing API connection...');
      const workingApiUrl = await testApiConnection();
      
      if (!workingApiUrl) {
        throw new Error('Cannot connect to any API server');
      }

      console.log('Fetching nearby places from:', workingApiUrl);
      const response = await fetch(workingApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: lat,
          lon: lng,
          radius: radius * 1000,
          category: selectedCategory === 'all' ? null : selectedCategory
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'success' && data.places) {
        setNearbyPlaces(data.places);
        setUsingMockData(false);
        setError('');
      } else {
        throw new Error(data.error || 'Invalid response format');
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
    if (userLocation) {
      fetchNearbyPlaces(userLocation.lat, userLocation.lng);
    }
  };

  const filteredPlaces = nearbyPlaces.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
      hotel: 'bg-blue-100 text-blue-800 border-blue-200',
      medical: 'bg-red-100 text-red-800 border-red-200',
      atm: 'bg-green-100 text-green-800 border-green-200',
      fuel: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Nearby Planner</h1>
                  <p className="text-gray-600">Discover places around you</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userLocation && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-full">
                  <Navigation className="w-4 h-4 text-green-600" />
                  <span>
                    {userLocation.lat === 40.7128 ? 'New York, NY' : 'Your Location'}
                  </span>
                </div>
              )}
              <button
                onClick={handleRetry}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white/60 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-4 flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-700 text-sm">{error}</span>
              </div>
              <button
                onClick={() => window.open('http://localhost:8000/api/health', '_blank')}
                className="text-sm text-yellow-700 underline hover:text-yellow-800"
              >
                Check Server
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for restaurants, hotels, medical facilities..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Radius Filter */}
            <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl border border-gray-300">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Radius:</span>
              <select
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="border-none bg-transparent focus:outline-none focus:ring-0 text-sm"
                disabled={loading}
              >
                <option value={1}>1 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
              </select>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex space-x-2 overflow-x-auto mt-4 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {loading ? 'Loading places...' : `Found ${filteredPlaces.length} places within ${radius} km`}
            {usingMockData && !loading && ' (Sample Data)'}
          </h2>
          {loading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for nearby places...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlaces.map((place, index) => (
              <div
                key={place.id || index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(place.category)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{place.name}</h3>
                      <p className="text-sm text-gray-500">{place.address}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(place.category)}`}>
                    {place.category}
                  </span>
                </div>
                
                {place.distance && (
                  <div className="mb-3">
                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {place.distance}
                    </span>
                  </div>
                )}
                
                <div className="flex space-x-2 mt-4">
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/dir/${userLocation?.lat},${userLocation?.lng}/${place.lat},${place.lon}`, '_blank')}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Directions</span>
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredPlaces.length === 0 && (
          <div className="text-center py-16">
            <Compass className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No places found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery 
                ? `No results for "${searchQuery}". Try adjusting your search.`
                : 'No places found in this area. Try increasing the search radius or check your location settings.'
              }
            </p>
            <button
              onClick={handleRetry}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}