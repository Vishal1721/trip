import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { 
  MapPin, Navigation, Compass, Users, CloudRain, Shield, Download,
  Share2, ArrowLeft, Clock, Calendar, Wifi, Phone,
  Loader2, Utensils, Building2, Mountain, ShoppingBag, Zap
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different activity types
const createCustomIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const categoryIcons = {
  'Temple': createCustomIcon('red'),
  'Restaurant': createCustomIcon('orange'),
  'Museum': createCustomIcon('blue'),
  'Park': createCustomIcon('green'),
  'Shopping': createCustomIcon('purple'),
  'Palace': createCustomIcon('yellow'),
  'Beach': createCustomIcon('cyan'),
  'Viewpoint': createCustomIcon('pink'),
  'Cafe': createCustomIcon('orange'),
  'Market': createCustomIcon('purple'),
  'Place Of Worship': createCustomIcon('red'),
  'Monument': createCustomIcon('violet'),
  'Gallery': createCustomIcon('blue'),
  'Zoo': createCustomIcon('green'),
  'Castle': createCustomIcon('yellow')
};

const TripMap = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyAmenities, setNearbyAmenities] = useState([]);
  const [weather, setWeather] = useState(null);
  const [activeFeature, setActiveFeature] = useState('itinerary');
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]);
  const [isVisible, setIsVisible] = useState(false);

  // Mock data for demonstration
  const destination = "Bangalore";
  const itinerary = [
    {
      day: 1,
      schedule: [
        {
          activity: "Visit Lalbagh Botanical Garden",
          description: "Explore the famous botanical garden with diverse flora",
          category: "Park",
          lat: 12.9507,
          lon: 77.5848,
          address: "Mavalli, Bangalore",
          time_slot: { start_time: "09:00", end_time: "11:00" }
        },
        {
          activity: "Bangalore Palace Tour",
          description: "Historic palace with Tudor-style architecture",
          category: "Palace",
          lat: 12.9985,
          lon: 77.5926,
          address: "Vasanth Nagar, Bangalore",
          time_slot: { start_time: "12:00", end_time: "14:00" }
        }
      ]
    },
    {
      day: 2,
      schedule: [
        {
          activity: "Visit Vidhana Soudha",
          description: "Iconic government building and architectural marvel",
          category: "Monument",
          lat: 12.9796,
          lon: 77.5907,
          address: "Ambedkar Veedhi, Bangalore",
          time_slot: { start_time: "10:00", end_time: "12:00" }
        }
      ]
    },
    {
      day: 3,
      schedule: [
        {
          activity: "Shopping at Commercial Street",
          description: "Popular shopping destination",
          category: "Shopping",
          lat: 12.9789,
          lon: 77.6092,
          address: "Commercial Street, Bangalore",
          time_slot: { start_time: "11:00", end_time: "14:00" }
        }
      ]
    }
  ];

  const allPlaces = itinerary.flatMap(day => day.schedule);

  // Fade in animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getCurrentDayActivities = () => {
    const currentDay = itinerary.find(day => day.day === selectedDay);
    return currentDay?.schedule || [];
  };

  const getAllPlacesForMap = () => {
    return allPlaces;
  };

  const getCurrentDayCoordinates = () => {
    const activities = getCurrentDayActivities();
    return activities
      .filter(activity => activity.lat && activity.lon)
      .map((activity, index) => ({
        id: index,
        activity: activity,
        category: activity.category,
        lat: activity.lat,
        lng: activity.lon
      }));
  };

  const findNearbyAmenities = async (type) => {
    setLoading(true);
    try {
      let query = '';
      const [lat, lng] = mapCenter;

      switch(type) {
        case 'restaurant':
          query = `[out:json];node["amenity"~"restaurant|cafe|fast_food"](around:5000,${lat},${lng});out;`;
          break;
        case 'atm':
          query = `[out:json];node["amenity"="atm"](around:5000,${lat},${lng});out;`;
          break;
        case 'hospital':
          query = `[out:json];node["amenity"~"hospital|clinic"](around:5000,${lat},${lng});out;`;
          break;
        case 'pharmacy':
          query = `[out:json];node["amenity"="pharmacy"](around:5000,${lat},${lng});out;`;
          break;
        default:
          return;
      }

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      const amenities = data.elements.map(element => ({
        id: element.id,
        name: element.tags?.name || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type: type,
        distance: 'Nearby',
        address: element.tags?.['addr:street'] || 'Address available',
        category: element.tags?.amenity || type,
        position: [element.lat, element.lon]
      }));
      
      setNearbyAmenities(amenities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching amenities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherInfo = async () => {
    try {
      const [lat, lng] = mapCenter;
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max&timezone=auto`
      );
      const data = await response.json();
      
      const weatherIcons = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 61: '🌦️', 80: '🌧️',
      };

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        description: "Current conditions",
        humidity: data.current.relative_humidity_2m,
        icon: weatherIcons[data.current.weather_code] || '🌤️'
      });
    } catch (error) {
      console.error('Weather API error:', error);
      setWeather({
        temperature: 28,
        description: "Sunny",
        humidity: 65,
        icon: "☀️"
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const calculateRoute = async () => {
    const currentCoords = getCurrentDayCoordinates();
    if (currentCoords.length < 2) return;
    
    setLoading(true);
    try {
      const coordsString = currentCoords.map(coord => `${coord.lng},${coord.lat}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false&steps=true`
      );
      
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData({
          totalDistance: `${(route.distance / 1000).toFixed(1)} km`,
          totalDuration: `${Math.round(route.duration / 60)} min`,
          steps: currentCoords.map((coord, index) => ({
            instruction: coord.activity.activity,
            distance: index < route.legs?.length ? `${(route.legs[index].distance / 1000).toFixed(1)} km` : 'N/A',
            duration: index < route.legs?.length ? `${Math.round(route.legs[index].duration / 60)} min` : 'N/A'
          }))
        });
      }
    } catch (error) {
      console.error('Route calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Temple': <Building2 className="w-4 h-4" />,
      'Restaurant': <Utensils className="w-4 h-4" />,
      'Museum': <Building2 className="w-4 h-4" />,
      'Park': <Mountain className="w-4 h-4" />,
      'Shopping': <ShoppingBag className="w-4 h-4" />,
      'Palace': <Building2 className="w-4 h-4" />,
      'Monument': <Building2 className="w-4 h-4" />,
    };
    return icons[category] || <MapPin className="w-4 h-4" />;
  };

  const getMapIcon = (category) => {
    return categoryIcons[category] || createCustomIcon('blue');
  };

  useEffect(() => {
    const allPlaces = getAllPlacesForMap();
    if (allPlaces.length > 0) {
      const avgLat = allPlaces.reduce((sum, place) => sum + place.lat, 0) / allPlaces.length;
      const avgLng = allPlaces.reduce((sum, place) => sum + place.lon, 0) / allPlaces.length;
      setMapCenter([avgLat, avgLng]);
    }
    getCurrentLocation();
    getWeatherInfo();
  }, []);

  useEffect(() => {
    calculateRoute();
  }, [selectedDay]);

  const currentActivities = getCurrentDayActivities();
  const currentCoordinates = getCurrentDayCoordinates();
  const allMapPlaces = getAllPlacesForMap();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>

      {/* Header with Glassmorphism */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4 sticky top-0 z-50 shadow-2xl">
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
          <button
            className="group flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-pulse">
              {destination} Travel Map
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-500/20 backdrop-blur-md rounded-full text-blue-200 text-xs font-medium border border-blue-400/30 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {allMapPlaces.length} places
              </span>
              <span className="px-3 py-1 bg-purple-500/20 backdrop-blur-md rounded-full text-purple-200 text-xs font-medium border border-purple-400/30 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Day {selectedDay}
              </span>
              <span className="px-3 py-1 bg-pink-500/20 backdrop-blur-md rounded-full text-pink-200 text-xs font-medium border border-pink-400/30 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {currentCoordinates.length} activities
              </span>
            </div>
          </div>

          <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-12 border border-white/20 shadow-lg">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Navigation Tabs with Gradient */}
            <div className={`bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl ${isVisible ? 'animate-slideIn' : 'opacity-0'}`}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'itinerary', label: 'Itinerary', icon: <Calendar className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500' },
                  { id: 'navigation', label: 'Navigate', icon: <Navigation className="w-5 h-5" />, gradient: 'from-purple-500 to-pink-500' },
                  { id: 'amenities', label: 'Nearby', icon: <MapPin className="w-5 h-5" />, gradient: 'from-orange-500 to-red-500' },
                  { id: 'safety', label: 'Safety', icon: <Shield className="w-5 h-5" />, gradient: 'from-green-500 to-emerald-500' }
                ].map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeature(tab.id)}
                    style={{animationDelay: `${index * 0.1}s`}}
                    className={`p-4 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 ${
                      activeFeature === tab.id 
                        ? `bg-gradient-to-br ${tab.gradient} text-white shadow-2xl scale-105` 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={activeFeature === tab.id ? 'animate-bounce' : ''}>
                        {tab.icon}
                      </div>
                      <span className="text-xs font-bold">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Selector */}
            {activeFeature === 'itinerary' && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl animate-scaleIn">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                  <Calendar className="w-6 h-6 text-blue-400" />
                  Trip Days
                </h3>
                <div className="space-y-3">
                  {itinerary.map((day, index) => (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDay(day.day)}
                      style={{animationDelay: `${index * 0.1}s`}}
                      className={`w-full p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 animate-slideIn ${
                        selectedDay === day.day 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl scale-105' 
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                    >
                      <div className="font-bold text-lg">Day {day.day}</div>
                      <div className="text-sm opacity-90 flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3" />
                        {day.schedule ? `${day.schedule.length} activities` : 'Full day'}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-400/30 backdrop-blur-md">
                  <p className="text-xs text-blue-200 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Showing {allMapPlaces.length} total places in {destination}
                  </p>
                </div>
              </div>
            )}

            {/* Route Information */}
            {activeFeature === 'navigation' && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl animate-scaleIn">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                  <Navigation className="w-6 h-6 text-purple-400" />
                  Route Details
                </h3>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  </div>
                ) : routeData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30">
                        <div className="text-xs text-blue-200 mb-1">Distance</div>
                        <div className="font-bold text-white text-lg">{routeData.totalDistance}</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                        <div className="text-xs text-purple-200 mb-1">Duration</div>
                        <div className="font-bold text-white text-lg">{routeData.totalDuration}</div>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <h4 className="font-semibold text-sm text-white/80 flex items-center gap-2">
                        <Compass className="w-4 h-4" />
                        Route Steps:
                      </h4>
                      {routeData.steps.map((step, index) => (
                        <div 
                          key={index} 
                          style={{animationDelay: `${index * 0.05}s`}}
                          className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all animate-slideIn"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">{step.instruction}</div>
                              <div className="text-xs text-gray-300 mt-1">{step.distance} • {step.duration}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Navigation className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
                    <p className="text-white/60 text-sm">Select multiple activities to see route</p>
                  </div>
                )}
              </div>
            )}

            {/* Weather Info with Gradient */}
            {weather && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl animate-scaleIn">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                  <CloudRain className="w-6 h-6 text-cyan-400" />
                  Weather in {destination}
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-6xl animate-bounce">{weather.icon}</div>
                  <div className="text-right">
                    <div className="text-5xl font-extrabold bg-gradient-to-br from-orange-400 to-pink-600 bg-clip-text text-transparent">
                      {weather.temperature}°C
                    </div>
                    <div className="text-sm text-white/70 mt-1">{weather.description}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
                    <div className="text-xs text-cyan-200 mb-1">Humidity</div>
                    <div className="font-bold text-white text-lg">{weather.humidity}%</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30">
                    <div className="text-xs text-blue-200 mb-1">Status</div>
                    <div className="font-bold text-white text-sm">Perfect</div>
                  </div>
                </div>
              </div>
            )}

            {/* Nearby Amenities */}
            {activeFeature === 'amenities' && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl animate-scaleIn">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                  <MapPin className="w-6 h-6 text-orange-400" />
                  Nearby Places
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { type: 'restaurant', label: 'Restaurants', emoji: '🍽️', color: 'from-orange-500 to-red-500' },
                    { type: 'atm', label: 'ATMs', emoji: '🏧', color: 'from-green-500 to-emerald-500' },
                    { type: 'hospital', label: 'Hospitals', emoji: '🏥', color: 'from-red-500 to-pink-500' },
                    { type: 'pharmacy', label: 'Pharmacy', emoji: '💊', color: 'from-blue-500 to-cyan-500' }
                  ].map((item, index) => (
                    <button
                      key={item.type}
                      onClick={() => findNearbyAmenities(item.type)}
                      disabled={loading}
                      style={{animationDelay: `${index * 0.1}s`}}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-2xl animate-scaleIn`}
                    >
                      <div className="text-2xl mb-1">{item.emoji}</div>
                      <div className="text-xs font-bold">{item.label}</div>
                    </button>
                  ))}
                </div>
                
                {nearbyAmenities.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <h4 className="font-semibold text-sm text-white/80 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Found Places:
                    </h4>
                    {nearbyAmenities.map((amenity, index) => (
                      <div 
                        key={amenity.id}
                        style={{animationDelay: `${index * 0.05}s`}}
                        className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all animate-slideIn"
                      >
                        <div className="font-medium text-white text-sm">{amenity.name}</div>
                        <div className="text-xs text-gray-300 mt-1">{amenity.distance}</div>
                        <div className="text-xs text-gray-400">{amenity.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Safety Features */}
            {activeFeature === 'safety' && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl animate-scaleIn">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                  <Shield className="w-6 h-6 text-green-400" />
                  Safety & Emergency
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => findNearbyAmenities('hospital')}
                    className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-bold"
                  >
                    <Shield className="w-5 h-5" />
                    Find Hospitals
                  </button>
                  <button className="w-full p-4 bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-bold">
                    <Users className="w-5 h-5" />
                    Share Location
                  </button>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-sm text-white/80 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Emergency Contacts:
                    </h4>
                    <div className="p-3 bg-red-500/20 backdrop-blur-md rounded-xl border border-red-400/30">
                      <div className="text-xs text-red-200 mb-1">Police</div>
                      <div className="font-bold text-white">100</div>
                    </div>
                    <div className="p-3 bg-orange-500/20 backdrop-blur-md rounded-xl border border-orange-400/30">
                      <div className="text-xs text-orange-200 mb-1">Ambulance</div>
                      <div className="font-bold text-white">108</div>
                    </div>
                    <div className="p-3 bg-yellow-500/20 backdrop-blur-md rounded-xl border border-yellow-400/30">
                      <div className="text-xs text-yellow-200 mb-1">Fire Department</div>
                      <div className="font-bold text-white">101</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Map Container with Overlay Info */}
            <div className={`bg-white/10 backdrop-blur-xl rounded-3xl p-2 border border-white/20 shadow-2xl relative ${isVisible ? 'animate-scaleIn' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
              {/* Floating Info Badges */}
              <div className="absolute top-4 left-4 z-[1000] space-y-2">
                {userLocation && (
                  <div className="px-4 py-2 bg-green-500/90 backdrop-blur-md rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    Live Location Active
                  </div>
                )}
                {currentCoordinates.length > 1 && (
                  <div className="px-4 py-2 bg-blue-500/90 backdrop-blur-md rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                    <Navigation className="w-3 h-3" />
                    Route Displayed
                  </div>
                )}
              </div>

              <div className="h-[600px] rounded-2xl overflow-hidden">
                {loading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/50 to-purple-900/50">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
                    <span className="text-white font-semibold">Loading map...</span>
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* ALL PLACES markers */}
                    {allMapPlaces.map((place, index) => (
                      <Marker
                        key={`all-${index}`}
                        position={[place.lat, place.lon]}
                        icon={getMapIcon(place.category)}
                      >
                        <Popup>
                          <div className="p-2 min-w-48">
                            <h3 className="font-bold text-lg mb-1">
                              {place.name || place.activity?.replace('Visit ', '')}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{place.category}</p>
                            {place.address && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <span className="font-medium">Location:</span>
                                <p className="text-gray-600">{place.address}</p>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* User location marker */}
                    {userLocation && (
                      <Marker position={userLocation} icon={createCustomIcon('green')}>
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold">Your Location</h3>
                            <p className="text-sm text-gray-600">You are here</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Route polyline for current day */}
                    {currentCoordinates.length > 1 && (
                      <Polyline
                        positions={currentCoordinates.map(coord => [coord.lat, coord.lng])}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.8}
                      />
                    )}

                    {/* Nearby amenities markers */}
                    {activeFeature === 'amenities' && nearbyAmenities.map((amenity, index) => (
                      <Marker
                        key={`amenity-${index}`}
                        position={amenity.position}
                        icon={createCustomIcon('gray')}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold">{amenity.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{amenity.type}</p>
                            <p className="text-xs text-gray-500">{amenity.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>

            {/* Current Day Activities with Rich Cards */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl animate-fadeIn" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-extrabold text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  Day {selectedDay} Schedule
                </h3>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-full text-white text-sm font-bold border border-blue-400/30 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {currentActivities.length} Activities
                </div>
              </div>
              
              <div className="space-y-4">
                {currentActivities.map((activity, index) => (
                  <div 
                    key={index}
                    style={{animationDelay: `${index * 0.1}s`}}
                    className="group p-5 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl animate-slideIn"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          {getCategoryIcon(activity.category)}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">
                            {activity.activity}
                          </h4>
                          <span className="px-3 py-1 bg-purple-500/30 backdrop-blur-md rounded-full text-purple-200 text-xs font-medium border border-purple-400/30">
                            {activity.category}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                          {activity.time_slot && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 backdrop-blur-md rounded-lg border border-blue-400/30">
                              <Clock className="w-4 h-4 text-blue-300" />
                              <span className="text-xs text-blue-200 font-medium">
                                {activity.time_slot.start_time} - {activity.time_slot.end_time}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 backdrop-blur-md rounded-lg border border-green-400/30">
                            <MapPin className="w-4 h-4 text-green-300" />
                            <span className="text-xs text-green-200 font-medium">
                              {activity.address}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {currentActivities.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-white/50" />
                    </div>
                    <p className="text-white/60 text-lg font-medium">No activities scheduled for Day {selectedDay}</p>
                    <p className="text-white/40 text-sm mt-2">Select a different day to view activities</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMap;