import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
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
  TrendingUp,
  Download
} from 'lucide-react';

export default function TripPlanner() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Backend response:", data);

      if (data.status === "success") {
        setSuggestions({
          destination: data.destination,
          totalDays: data.totalDays,
          perDay: data.perDay,
          suggestion: data.suggestion,
          itinerary: data.itinerary,
          totalPlacesFound: data.totalPlacesFound
        });
        setStep(3);
      } else {
        throw new Error(data.message || "Failed to generate trip plan");
      }
    } catch (error) {
      console.error("❌ Error calling backend:", error);
      alert(`Error: ${error.message}. Please make sure your Flask server is running on port 8000.`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMap = () => {
    navigate('/trip-map', { 
      state: { 
        itinerary: suggestions.itinerary,
        destination: suggestions.destination,
        formData: formData
      }
    });
  };

  // Simple and reliable PDF Download Function
  const downloadPDF = () => {
    setPdfLoading(true);
    
    try {
      // Create PDF instance
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      let currentPage = 1;

      // Helper function to add new page
      const addNewPage = () => {
        pdf.addPage();
        currentPage++;
        yPosition = 20;
        // Add footer to the new page
        addFooter();
      };

      // Helper function to add footer
      const addFooter = () => {
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${currentPage} - Generated by TripAI`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(new Date().toLocaleDateString(), pageWidth - 20, pageHeight - 10, { align: 'right' });
      };

      // Header
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('TRIP ITINERARY', pageWidth / 2, 12, { align: 'center' });

      // Reset text color for content
      pdf.setTextColor(0, 0, 0);

      // Trip Information Section
      pdf.setFontSize(12);
      yPosition += 15;
      
      pdf.text(`Destination: ${suggestions.destination}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Duration: ${suggestions.totalDays} days`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Dates: ${formData.startDate} to ${formData.endDate}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Budget: $${formData.budget}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Travelers: ${formData.travelers}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Style: ${formData.travelStyle}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Accommodation: ${formData.accommodation}`, 20, yPosition);
      yPosition += 15;

      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        addNewPage();
      }

      // Interests Section
      pdf.setFontSize(11);
      pdf.text('Selected Interests:', 20, yPosition);
      yPosition += 8;
      
      const selectedInterests = interestsList
        .filter(interest => formData.interests.includes(interest.id))
        .map(interest => interest.name);
      
      if (selectedInterests.length > 0) {
        selectedInterests.forEach((interest, index) => {
          if (yPosition > pageHeight - 20) {
            addNewPage();
          }
          pdf.text(`• ${interest}`, 25, yPosition);
          yPosition += 6;
        });
      } else {
        pdf.text('No specific interests selected', 25, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;

      // Trip Overview Section
      if (yPosition > pageHeight - 50) {
        addNewPage();
      }

      pdf.setFontSize(12);
      pdf.text('Trip Overview:', 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      const overviewText = suggestions.suggestion || 'Your personalized trip itinerary generated by TripAI.';
      const overviewLines = pdf.splitTextToSize(overviewText, pageWidth - 40);
      
      overviewLines.forEach(line => {
        if (yPosition > pageHeight - 20) {
          addNewPage();
        }
        pdf.text(line, 20, yPosition);
        yPosition += 5;
      });
      
      yPosition += 15;

      // Daily Itinerary Section
      if (yPosition > pageHeight - 50) {
        addNewPage();
      }

      pdf.setFontSize(14);
      pdf.text('DAILY ITINERARY', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Generate itinerary for each day
      suggestions.itinerary.forEach((day, dayIndex) => {
        // Check if we need a new page before adding a new day
        if (yPosition > pageHeight - 80) {
          addNewPage();
        }

        // Day Header
        pdf.setFontSize(12);
        pdf.setTextColor(59, 130, 246);
        pdf.text(`Day ${day.day}`, 20, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 8;

        if (day.schedule && day.schedule.length > 0) {
          day.schedule.forEach((activity, activityIndex) => {
            // Check if we need a new page for activities
            if (yPosition > pageHeight - 40) {
              addNewPage();
            }

            // Activity Name
            pdf.setFontSize(10);
            pdf.text(`• ${activity.activity}`, 25, yPosition);
            yPosition += 5;

            // Activity Description
            if (activity.description) {
              const descLines = pdf.splitTextToSize(activity.description, pageWidth - 45);
              descLines.forEach(line => {
                if (yPosition > pageHeight - 20) {
                  addNewPage();
                }
                pdf.text(line, 30, yPosition);
                yPosition += 4;
              });
            }

            // Activity Details
            if (activity.address) {
              if (yPosition > pageHeight - 15) {
                addNewPage();
              }
              pdf.setTextColor(100, 100, 100);
              pdf.text(`  Address: ${activity.address}`, 30, yPosition);
              yPosition += 4;
            }

            if (activity.time_slot) {
              if (yPosition > pageHeight - 15) {
                addNewPage();
              }
              pdf.text(`  Time: ${activity.time_slot.start_time} - ${activity.time_slot.end_time}`, 30, yPosition);
              yPosition += 4;
            }

            pdf.setTextColor(0, 0, 0);
            yPosition += 6; // Space between activities
          });
        } else {
          pdf.text('  No specific activities planned for this day', 25, yPosition);
          yPosition += 8;
        }

        yPosition += 10; // Space between days
      });

      // Add footer to the first page
      addFooter();

      // Download the PDF
      const fileName = `Trip-Itinerary-${suggestions.destination.replace(/\s+/g, '-')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again. Error: ' + error.message);
    } finally {
      setPdfLoading(false);
    }
  };

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
                    Your {suggestions.destination} Adventure
                  </h2>
                  <p className="text-gray-600 font-medium">{suggestions.totalDays} days • ${formData.budget} budget • {formData.travelers} traveler(s)</p>
                  <p className="text-blue-600 font-medium mt-2">Found {suggestions.totalPlacesFound} amazing places!</p>
                </div>

                {/* Budget Breakdown */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-md border border-blue-200 shadow-lg">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <DollarSign className="w-6 h-6 text-amber-600" />
                      Budget Overview
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-gray-200">
                        <span className="text-gray-700">Total Budget</span>
                        <span className="font-bold text-gray-900">${formData.budget}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-gray-200">
                        <span className="text-gray-700">Trip Duration</span>
                        <span className="font-bold text-gray-900">{suggestions.totalDays} days</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-gray-200">
                        <span className="text-gray-700">Daily Budget</span>
                        <span className="font-bold text-amber-700">${suggestions.perDay?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-md border border-purple-200 shadow-lg">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      Trip Overview
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/80 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600">{suggestions.suggestion}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                        <p className="text-sm text-green-700 font-medium">
                          ✅ Perfectly planned {suggestions.totalDays}-day itinerary with {suggestions.totalPlacesFound} handpicked places
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Itinerary Display */}
                <div id="itinerary-content" className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-md border border-emerald-200 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                    Your Daily Itinerary
                  </h3>
                  <div className="space-y-6">
                    {suggestions.itinerary.map((day, idx) => (
                      <div key={idx} className="p-6 bg-white/80 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-xl text-gray-800">Day {day.day}</span>
                          <span className="text-sm text-gray-600 font-medium">
                            {day.schedule ? `${day.schedule.length} activities` : 'Full day planned'}
                          </span>
                        </div>
                        
                        {day.schedule && day.schedule.length > 0 ? (
                          <div className="space-y-4">
                            {day.schedule.map((activity, aidx) => (
                              <div key={aidx} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-gray-800">{activity.activity}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                  <span>📍 {activity.address}</span>
                                  {activity.time_slot && (
                                    <span>🕐 {activity.time_slot.start_time} - {activity.time_slot.end_time}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            Daily activities will be displayed here
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={downloadPDF}
                    disabled={pdfLoading}
                    className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                  >
                    {pdfLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={handleViewMap}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-emerald-500/50 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
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