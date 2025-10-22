import React, { useState, useEffect } from 'react';
import { 
  Mountain, 
  Palette, 
  Utensils, 
  History, 
  Music, 
  Camera, 
  ShoppingBag, 
  Building2, 
  Coffee, 
  Heart, 
  Hotel, 
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  Loader2,
  TrendingUp
} from 'lucide-react';

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: 1,
    interests: [],
    accommodation: 'mid-range',
    travelStyle: 'balanced'
  });

  const [floatingIcons, setFloatingIcons] = useState([]);

  useEffect(() => {
    const icons = [
      { id: 1, icon: '✈️', x: 10, y: 20 },
      { id: 2, icon: '🏨', x: 85, y: 15 },
      { id: 3, icon: '🗺️', x: 25, y: 70 },
      { id: 4, icon: '🌴', x: 70, y: 65 },
      { id: 5, icon: '🏛️', x: 15, y: 45 },
      { id: 6, icon: '🍕', x: 80, y: 35 },
      { id: 7, icon: '🚗', x: 40, y: 15 },
      { id: 8, icon: '📸', x: 60, y: 80 },
      { id: 9, icon: '🎒', x: 90, y: 55 },
      { id: 10, icon: '🌅', x: 30, y: 85 }
    ];
    setFloatingIcons(icons);
  }, []);

  const interestsList = [
    { id: 'adventure', name: 'Adventure', icon: <Mountain className="w-5 h-5" />, color: 'from-orange-500 to-red-500' },
    { id: 'culture', name: 'Culture', icon: <Palette className="w-5 h-5" />, color: 'from-purple-500 to-indigo-500' },
    { id: 'food', name: 'Food & Dining', icon: <Utensils className="w-5 h-5" />, color: 'from-amber-500 to-orange-500' },
    { id: 'history', name: 'Historical Sites', icon: <History className="w-5 h-5" />, color: 'from-stone-500 to-gray-500' },
    { id: 'nightlife', name: 'Nightlife', icon: <Music className="w-5 h-5" />, color: 'from-pink-500 to-rose-500' },
    { id: 'photography', name: 'Photography', icon: <Camera className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
    { id: 'shopping', name: 'Shopping', icon: <ShoppingBag className="w-5 h-5" />, color: 'from-emerald-500 to-green-500' },
    { id: 'nature', name: 'Nature', icon: <Mountain className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
    { id: 'relaxation', name: 'Relaxation', icon: <Coffee className="w-5 h-5" />, color: 'from-amber-500 to-yellow-500' },
    { id: 'urban', name: 'City Life', icon: <Building2 className="w-5 h-5" />, color: 'from-gray-500 to-slate-500' },
    { id: 'romance', name: 'Romance', icon: <Heart className="w-5 h-5" />, color: 'from-rose-500 to-pink-500' }
  ];

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const getBudgetCategory = () => {
    if (!formData.budget || calculateDays() === 0) return '';
    const perDay = parseFloat(formData.budget) / calculateDays();
    
    if (perDay < 50) return 'Budget Traveler';
    if (perDay < 100) return 'Moderate Traveler';
    if (perDay < 200) return 'Comfort Traveler';
    return 'Luxury Traveler';
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleInterest = (id) => {
    const current = formData.interests;
    if (current.includes(id)) {
      handleInputChange('interests', current.filter(i => i !== id));
    } else {
      handleInputChange('interests', [...current, id]);
    }
  };

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("http://localhost:8000/api/ai/generate-trip", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget),
        travelers: parseInt(formData.travelers),
        interests: formData.interests,
        accommodation: formData.accommodation,
        travelStyle: formData.travelStyle
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Backend response:", data);

    // Use the actual backend data directly
    const totalDays = data.totalDays || calculateDays();
    const perDay = data.perDay || (parseFloat(formData.budget) / totalDays);
    
    setSuggestions({
      breakdown: {
        accommodation: perDay * 0.4 * totalDays,
        food: perDay * 0.3 * totalDays,
        activities: perDay * 0.2 * totalDays,
        transport: perDay * 0.1 * totalDays,
      },
      perDay: perDay,
      recommendations: [
        { 
          type: "Trip Overview", 
          suggestion: data.suggestion || `Explore ${formData.destination} with your selected interests.`,
          icon: <Sparkles className="w-5 h-5 text-white" />
        },
        { 
          type: "Travel Duration", 
          suggestion: `Your ${totalDays}-day trip to ${data.destination || formData.destination} from ${formData.startDate} to ${formData.endDate}`,
          icon: <Calendar className="w-5 h-5 text-white" />
        },
        { 
          type: "Budget Planning", 
          suggestion: `$${formData.budget} total / ${totalDays} days / ${formData.travelers} traveler(s) = $${perDay.toFixed(2)} per day per person`,
          icon: <DollarSign className="w-5 h-5 text-white" />
        }
      ],
      // Use the actual itinerary from backend
      itinerary: data.itinerary ? data.itinerary.map(day => ({
        day: day.day,
        budget: perDay,
        activities: day.activities
      })) : []
    });

    setStep(3);
  } catch (error) {
    console.error("❌ Error calling backend:", error);
    alert(`Backend connection failed: ${error.message}. Please make sure your Flask server is running on port 5001.`);
    setLoading(false);
  }
};
  // Rest of your JSX remains exactly the same...
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDuration: '15s' }}></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDuration: '20s', animationDelay: '5s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDuration: '18s', animationDelay: '10s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Floating Travel Icons */}
        {floatingIcons.map((item) => (
          <div
            key={item.id}
            className="absolute text-2xl opacity-20 animate-float"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              animationDuration: `${15 + item.id * 2}s`,
              animationDelay: `${item.id * 0.5}s`
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* Animated Dots */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>

        {/* Subtle Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-100/30 to-transparent"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">TripAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 hidden md:block font-medium">Welcome back, Traveler!</span>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
              A
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {step < 3 && (
            <div className="mb-12">
              <div className="flex items-center justify-center space-x-4 mb-6">
                {[1, 2].map((num) => (
                  <div key={num} className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-lg ${
                      step >= num 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-500/50' 
                        : 'bg-white/80 backdrop-blur-md text-gray-400 border border-gray-200'
                    }`}>
                      {step > num ? <Check className="w-6 h-6" /> : num}
                    </div>
                    {num < 2 && (
                      <div className={`w-24 h-1 mx-2 rounded transition-all duration-300 ${
                        step > num ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-gray-600 font-medium">
                  {step === 1 && 'Basic Information'}
                  {step === 2 && 'Preferences & Interests'}
                </p>
              </div>
            </div>
          )}

          <div className="backdrop-blur-md bg-white/80 rounded-3xl p-8 md:p-12 border border-white/50 shadow-2xl">
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                    Plan Your Dream Trip
                  </h2>
                  <p className="text-gray-600 font-medium">Let's start with the basics</p>
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Where do you want to go?
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    placeholder="e.g., Paris, Tokyo, New York"
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 shadow-sm"
                    />
                  </div>
                </div>

                {calculateDays() > 0 && (
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur-md rounded-xl border border-emerald-500/20 text-center shadow-sm">
                    <p className="text-emerald-700 font-semibold">
                      <span className="font-bold text-2xl">{calculateDays()}</span> days trip
                    </p>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    Total Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="e.g., 2000"
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                  {formData.budget && calculateDays() > 0 && (
                    <div className="mt-3 flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <span className="text-sm text-gray-700 font-medium">Per day budget:</span>
                      <span className="font-bold text-amber-700">
                        ${(parseFloat(formData.budget) / calculateDays()).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {getBudgetCategory() && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-md rounded-lg border border-purple-500/20 shadow-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span className="text-purple-700 font-semibold">{getBudgetCategory()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                    <Users className="w-5 h-5 text-rose-600" />
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.travelers}
                    onChange={(e) => handleInputChange('travelers', parseInt(e.target.value) || 1)}
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-2xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 outline-none transition-all text-gray-900 shadow-sm"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={nextStep}
                    disabled={!formData.destination || !formData.startDate || !formData.endDate || !formData.budget}
                    className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent">
                    Tell Us Your Interests
                  </h2>
                  <p className="text-gray-600 font-medium">Select what you love to do (choose at least 3)</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {interestsList.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`relative p-6 rounded-2xl backdrop-blur-md border-2 transition-all duration-300 transform hover:scale-105 shadow-sm ${
                        formData.interests.includes(interest.id)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white/80 hover:border-gray-300'
                      }`}
                    >
                      {formData.interests.includes(interest.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${interest.color} mb-3 shadow-md`}>
                        {interest.icon}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{interest.name}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                    <Hotel className="w-5 h-5 text-cyan-600" />
                    Accommodation Preference
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['budget', 'mid-range', 'luxury'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleInputChange('accommodation', type)}
                        className={`p-4 rounded-xl backdrop-blur-md border-2 transition-all duration-300 capitalize font-medium shadow-sm ${
                          formData.accommodation === type
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-md'
                            : 'border-gray-200 bg-white/80 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {type.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Travel Style
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['relaxed', 'balanced', 'packed'].map((style) => (
                      <button
                        key={style}
                        onClick={() => handleInputChange('travelStyle', style)}
                        className={`p-4 rounded-xl backdrop-blur-md border-2 transition-all duration-300 capitalize font-medium shadow-sm ${
                          formData.travelStyle === style
                            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                            : 'border-gray-200 bg-white/80 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={prevStep}
                    className="px-8 py-4 bg-white/80 backdrop-blur-md rounded-full font-semibold text-gray-700 hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={formData.interests.length < 3}
                    className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                  >
                    Generate My Trip
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6" />
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Creating Your Perfect Itinerary</h3>
                <p className="text-gray-600">AI is analyzing your preferences and budget...</p>
              </div>
            )}

            {step === 3 && suggestions && !loading && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full border border-emerald-500/20 mb-4 shadow-sm">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Trip Plan Generated!</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                    Your {formData.destination} Adventure
                  </h2>
                  <p className="text-gray-600 font-medium">{calculateDays()} days • ${formData.budget} budget • {formData.travelers} traveler(s)</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-md border border-blue-200 shadow-lg">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <DollarSign className="w-6 h-6 text-amber-600" />
                      Budget Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Hotel className="w-5 h-5 text-cyan-600" />
                          <span className="text-gray-700">Accommodation</span>
                        </div>
                        <span className="font-bold text-gray-900">${suggestions.breakdown.accommodation.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-orange-600" />
                          <span className="text-gray-700">Food & Dining</span>
                        </div>
                        <span className="font-bold text-gray-900">${suggestions.breakdown.food.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Camera className="w-5 h-5 text-rose-600" />
                          <span className="text-gray-700">Activities</span>
                        </div>
                        <span className="font-bold text-gray-900">${suggestions.breakdown.activities.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Plane className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700">Transport</span>
                        </div>
                        <span className="font-bold text-gray-900">${suggestions.breakdown.transport.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-semibold text-gray-700">Per Day Budget:</span>
                        <span className="font-bold text-amber-700">${suggestions.perDay.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-md border border-purple-200 shadow-lg">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      AI Recommendations
                    </h3>
                    <div className="space-y-4">
                      {suggestions.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-4 bg-white/80 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-md">
                              {rec.icon}
                            </div>
                            <span className="font-semibold text-gray-800">{rec.type}</span>
                          </div>
                          <p className="text-sm text-gray-600">{rec.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-md border border-emerald-200 shadow-lg">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                    Suggested Itinerary
                  </h3>
                  <div className="space-y-4">
                    {suggestions.itinerary.map((day, idx) => (
                      <div key={idx} className="p-4 bg-white/80 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg text-gray-800">Day {day.day}</span>
                          <span className="text-sm text-gray-600 font-medium">Budget: ${day.budget.toFixed(0)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {day.activities.map((activity, aidx) => (
                            <span key={aidx} className="px-3 py-1 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full text-sm border border-emerald-500/20 text-emerald-700 font-medium">
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 shadow-lg">
                    Download PDF
                  </button>
                  <button className="px-8 py-4 bg-white/80 backdrop-blur-md rounded-full font-semibold text-gray-700 hover:bg-gray-100 transition-all border border-gray-200 shadow-sm">
                    View on Map
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}