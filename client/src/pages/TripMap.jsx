import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { 
  MapPin, Navigation, Compass, Users, CloudRain, Shield, Download,
  Share2, ArrowLeft, Clock, Calendar, Wifi, 
  Loader2, Utensils, Building2, Mountain, ShoppingBag
} from 'lucide-react';

// Leaflet CSS (important!)
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
  const location = useLocation();
  const navigate = useNavigate();
  const { itinerary, destination, formData, allPlaces } = location.state || {};
  
  const [selectedDay, setSelectedDay] = useState(1);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyAmenities, setNearbyAmenities] = useState([]);
  const [weather, setWeather] = useState(null);
  const [activeFeature, setActiveFeature] = useState('itinerary');
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default: Bengaluru

  // Get current day's activities from real itinerary data
  const getCurrentDayActivities = () => {
    if (!itinerary) return [];
    const currentDay = itinerary.find(day => day.day === selectedDay);
    return currentDay?.schedule || [];
  };

  // Get ALL places from backend (both scheduled and unscheduled)
  const getAllPlacesForMap = () => {
    if (!allPlaces || allPlaces.length === 0) {
      // Fallback: extract from itinerary
      const allActivities = [];
      if (itinerary) {
        itinerary.forEach(day => {
          if (day.schedule) {
            day.schedule.forEach(activity => {
              if (activity.lat && activity.lon) {
                allActivities.push({
                  ...activity,
                  lat: activity.lat,
                  lng: activity.lon
                });
              }
            });
          }
        });
      }
      return allActivities;
    }
    return allPlaces;
  };

  // Get coordinates for current day's activities
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

  // **FREE: Get real nearby amenities using Overpass API**
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

  // **FREE: Get weather from Open-Meteo**
  const getWeatherInfo = async () => {
    try {
      const [lat, lng] = mapCenter;
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max&timezone=auto`
      );
      const data = await response.json();
      
      const weatherIcons = {
        0: '☀️',  // Clear sky
        1: '🌤️',  // Mainly clear
        2: '⛅',  // Partly cloudy
        3: '☁️',  // Overcast
        45: '🌫️', // Fog
        61: '🌦️', // Rain
        80: '🌧️', // Rain showers
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

  // **FREE: Get user's current location**
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

  // **FREE: Calculate route using OSRM**
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

  // Get category icon for UI
  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'Temple': <Building2 className="w-4 h-4" />,
      'Restaurant': <Utensils className="w-4 h-4" />,
      'Museum': <Building2 className="w-4 h-4" />,
      'Park': <Mountain className="w-4 h-4" />,
      'Shopping': <ShoppingBag className="w-4 h-4" />,
      'Palace': <Building2 className="w-4 h-4" />,
      'Beach': <Mountain className="w-4 h-4" />,
      'Viewpoint': <Mountain className="w-4 h-4" />,
      'Cafe': <Utensils className="w-4 h-4" />,
      'Market': <ShoppingBag className="w-4 h-4" />,
      'Place Of Worship': <Building2 className="w-4 h-4" />,
      'Monument': <Building2 className="w-4 h-4" />,
      'Gallery': <Building2 className="w-4 h-4" />,
      'Zoo': <Mountain className="w-4 h-4" />,
      'Castle': <Building2 className="w-4 h-4" />
    };
    return categoryIcons[category] || <MapPin className="w-4 h-4" />;
  };

  // Get custom icon for map marker
  const getMapIcon = (category) => {
    return categoryIcons[category] || createCustomIcon('blue');
  };

  // Set map center based on places
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

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Trip Data</h2>
          <p className="text-gray-600 mb-4">Please create a trip plan first</p>
          <button 
            onClick={() => navigate('/trip-planner')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Create Trip Plan
          </button>
        </div>
      </div>
    );
  }

  const currentActivities = getCurrentDayActivities();
  const currentCoordinates = getCurrentDayCoordinates();
  const allMapPlaces = getAllPlacesForMap();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/trip-planner')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Planner
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              {destination} Travel Map
            </h1>
            <p className="text-gray-600 text-sm">
              {allMapPlaces.length} places • Day {selectedDay} • {currentCoordinates.length} activities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Navigation Tabs */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'itinerary', label: 'Itinerary', icon: <Calendar className="w-4 h-4" /> },
                  { id: 'navigation', label: 'Navigate', icon: <Navigation className="w-4 h-4" /> },
                  { id: 'amenities', label: 'Nearby', icon: <MapPin className="w-4 h-4" /> },
                  { id: 'safety', label: 'Safety', icon: <Shield className="w-4 h-4" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeature(tab.id)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      activeFeature === tab.id 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {tab.icon}
                      <span className="text-xs font-medium">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Selector */}
            {activeFeature === 'itinerary' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Trip Days
                </h3>
                <div className="space-y-2">
                  {itinerary.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDay(day.day)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedDay === day.day 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">Day {day.day}</div>
                      <div className="text-sm opacity-75">
                        {day.schedule ? `${day.schedule.length} activities` : 'Full day'}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700">
                    📍 Showing {allMapPlaces.length} total places in {destination}
                  </p>
                </div>
              </div>
            )}

            {/* Route Information */}
            {activeFeature === 'navigation' && routeData && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-blue-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Route Details
                </h3>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Distance:</span>
                      <span className="font-semibold">{routeData.totalDistance}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Time:</span>
                      <span className="font-semibold">{routeData.totalDuration}</span>
                    </div>
                    <div className="space-y-2 mt-3">
                      <h4 className="font-medium text-sm text-gray-700">Route Steps:</h4>
                      {routeData.steps.map((step, index) => (
                        <div key={index} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="font-medium">{step.instruction}</div>
                          <div className="text-gray-600">{step.distance} • {step.duration}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weather Info */}
            {weather && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-cyan-600" />
                  Weather in {destination}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{weather.icon}</div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{weather.temperature}°C</div>
                    <div className="text-sm text-gray-600">{weather.description}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="text-center p-2 bg-cyan-50 rounded border border-cyan-200">
                    <div className="text-gray-600">Humidity</div>
                    <div className="font-semibold">{weather.humidity}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Nearby Amenities */}
            {activeFeature === 'amenities' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-600" />
                  Nearby Places
                </h3>
                <div className="space-y-2">
                  {[
                    { type: 'restaurant', label: '🍽️ Restaurants' },
                    { type: 'atm', label: '🏧 ATMs' },
                    { type: 'hospital', label: '🏥 Hospitals' },
                    { type: 'pharmacy', label: '💊 Pharmacy' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => findNearbyAmenities(item.type)}
                      disabled={loading}
                      className="w-full p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all text-gray-700 text-left disabled:opacity-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                
                {nearbyAmenities.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Found Places:</h4>
                    {nearbyAmenities.map((amenity) => (
                      <div key={amenity.id} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-medium text-sm">{amenity.name}</div>
                        <div className="text-xs text-gray-600">{amenity.distance}</div>
                        <div className="text-xs text-gray-500">{amenity.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Safety Features */}
            {activeFeature === 'safety' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-rose-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-600" />
                  Safety & Emergency
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => findNearbyAmenities('hospital')}
                    className="w-full p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Find Hospitals
                  </button>
                  <button className="w-full p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Share Location
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3">
            {/* Real Leaflet Map Container */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-1 border border-gray-200 shadow-lg h-[500px] mb-6">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading map...</span>
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                >
                  {/* OpenStreetMap tiles (FREE) */}
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* ALL PLACES markers (from backend) */}
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
                          <div className="space-y-1 text-xs">
                            {place.address && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <span className="font-medium">Location:</span>
                                <p className="text-gray-600">{place.address}</p>
                              </div>
                            )}
                          </div>
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
                      color="blue"
                      weight={4}
                      opacity={0.7}
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

            {/* Current Day Activities */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Day {selectedDay} Schedule - {currentActivities.length} Activities
              </h3>
              <div className="space-y-4">
                {currentActivities.map((activity, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(activity.category)}
                      <h4 className="font-semibold text-gray-800">{activity.activity}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {activity.time_slot && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time_slot.start_time} - {activity.time_slot.end_time}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {activity.address}
                      </span>
                    </div>
                  </div>
                ))}
                
                {currentActivities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activities scheduled for Day {selectedDay}</p>
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