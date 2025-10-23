import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, DollarSign, Users, Cloud, FileText, Map, Sparkles, TrendingUp, Clock, Navigation, Sun, Moon, X, Eye, EyeOff } from 'lucide-react';
import * as THREE from 'three';
import { useNavigate, Link } from "react-router-dom";

export default function TripPlannerLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [darkMode, setDarkMode] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const mountRef = useRef(null);

  // Three.js Background Setup - Enhanced Visibility
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const particleCount = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    const color = new THREE.Color(darkMode ? 0x60a5fa : 0x3b82f6);

    // Create flowing ribbon-like structure
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 10;
      const radius = 3 + Math.sin(t * Math.PI * 3) * 1.5;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.8;
      const y = (t - 0.5) * 8 + Math.sin(angle * 2) * 1.5 + (Math.random() - 0.5) * 0.5;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.8;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Particle dispersion velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      // Color gradient - brighter in center
      const distFromCenter = Math.abs(t - 0.5) * 2;
      const brightness = 1 - distFromCenter * 0.5;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;

      // Variable particle sizes
      sizes[i] = Math.random() * 0.05 + 0.02;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: darkMode ? 0.9 : 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Add scattered background particles
    const bgParticleCount = 500;
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgParticleCount * 3);
    
    for (let i = 0; i < bgParticleCount; i++) {
      bgPositions[i * 3] = (Math.random() - 0.5) * 40;
      bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    
    bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
    
    const bgMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: darkMode ? 0x60a5fa : 0x3b82f6,
      transparent: true,
      opacity: darkMode ? 0.4 : 0.3,
      blending: THREE.AdditiveBlending,
    });
    
    const bgPoints = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgPoints);

    camera.position.z = 10;
    camera.position.y = 0;
    const clock = new THREE.Clock();

    let animationId;
    function animate() {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const positions = geometry.attributes.position.array;

      // Gentle flowing motion
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Add subtle dispersion
        positions[i3] += velocities[i3] * 0.5;
        positions[i3 + 1] += velocities[i3 + 1] * 0.5;
        positions[i3 + 2] += velocities[i3 + 2] * 0.5;
        
        // Wave motion
        const wave = Math.sin(time * 2 + i * 0.01) * 0.02;
        positions[i3] += wave;
      }

      geometry.attributes.position.needsUpdate = true;
      
      // Smooth continuous rotation
      points.rotation.y = time * 0.15;
      points.rotation.x = Math.sin(time * 0.3) * 0.1;
      points.rotation.z = Math.cos(time * 0.2) * 0.05;
      
      // Background rotation
      bgPoints.rotation.y = time * 0.05;
      bgPoints.rotation.x = time * 0.03;

      renderer.render(scene, camera);
    }

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      bgGeometry.dispose();
      bgMaterial.dispose();
      renderer.dispose();
    };
  }, [darkMode]);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  const toggleSignIn = () => {
    setShowSignIn(!showSignIn);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5001/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      console.log("Login successful:", data.user);
      setShowSignIn(false);
      alert("Login successful! Redirecting to dashboard...");
      navigate("/user");

    } catch (err) {
      console.error("Error connecting to server:", err);
      alert("Could not connect to server. Please try again.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSignIn && !e.target.closest('.modal-content')) {
        setShowSignIn(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSignIn]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI-Powered Itineraries",
      description: "Simplify trip planning by providing automatic, personalized itineraries using AI, reducing manual effort and saving time.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Real-Time Weather Data",
      description: "Integrate real-time data for locations, distances, and weather to enhance planning accuracy and user confidence.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Smart Budget Tools",
      description: "Provide clear budgeting tools: show money allocation for different categories (accommodation, food, travel) to aid decision-making.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Exportable PDFs",
      description: "Enable exportable PDFs for itineraries and weather details for easy sharing and access offline.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Map className="w-8 h-8" />,
      title: "Interactive Maps",
      description: "Use interactive maps to visually mark places, distances, and routes planned by AI.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Fully Customizable",
      description: "Allow users to input specific requirements (budget, interests, group size) for fully tailored trips.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const problems = [
    {
      icon: <Clock className="w-6 h-6" />,
      text: "Manual trip planning is time-consuming, confusing, and prone to missing important details like travel times, distances, weather, and budget allocation."
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      text: "Existing travel planners often lack personalized day-wise itineraries that adapt to user preferences such as budget, number of travelers, interests, and trip duration."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      text: "There is a need for integrating real-time data, including weather updates and travel times, to make trip planning more accurate and reliable."
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      text: "Budget management is often overlooked in travel planning tools; travelers need clear visualization of expenses across categories."
    }
  ];

  const solutions = [
    "Intelligent use of AI (LLM) can dramatically simplify trip planning by generating optimized itineraries, maps, and suggestions tailored to individual user needs and constraints.",
    "Enhancing user experience through a single platform that combines itinerary generation, interactive maps, weather info, and budget details addresses a significant gap in current travel solutions."
  ];

  const popularFeatures = [
    "AI-Powered Itineraries",
    "Real-Time Weather Updates",
    "Budget Management Tools",
    "Interactive Maps",
    "Day-Wise Trip Planner",
    "Exportable PDFs",
    "Customizable Travel Preferences",
    "Group Trip Planning",
    "AI Travel Recommendations",
    "Offline Access",
    "Travel Alerts & Notifications",
    "Local Event Suggestions",
    "Restaurant & Hotel Recommendations",
    "Trip Analytics & Reports",
    "Multi-Destination Planner"
  ];

  const freeTools = [
    "AI Trip Budget Planner",
    "Travel Email Scheduler",
    "AI Packing List Generator",
    "AI Travel Content Writer",
    "Interactive Route Map Generator",
    "AI Travel Chatbot",
    "Trip Landing Page Creator",
    "Travel Blog Ideas Generator",
    "Invoice & Booking Generator",
    "Trip Signature & Branding Tools",
  ];

  const companyInfo = [
    "About Us",
    "Careers",
    "Management Team",
    "Board of Directors",
    "Investor Relations",
    "Blog",
    "Contact Us"
  ];

  const footerSections = [
    {
      title: "Popular Features",
      links: popularFeatures
    },
    {
      title: "Free Tools",
      links: freeTools
    },
    {
      title: "Company",
      links: companyInfo
    },
    {
      title: "Customers",
      links: [
        "Customer Support",
        "Join a Local User Group",
        "Help Center",
        "Community Forum",
        "Travel Guides"
      ]
    },
    {
      title: "Partners",
      links: [
        "All Partner Programs",
        "Solutions Partner Program",
        "API Documentation",
        "Developer Resources",
        "Integration Partners"
      ]
    },
    {
      title: "Resources",
      links: [
        "Travel Blog",
        "Documentation",
        "Tutorials",
        "Case Studies",
        "Webinars",
        "Travel Templates"
      ]
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-black text-white' 
        : 'bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-slate-100/80 text-gray-900'
    } overflow-hidden relative`}>
      
      {/* Three.js 3D Background - Enhanced Visibility */}
      <div 
        ref={mountRef} 
        className="fixed inset-0 z-0"
        style={{ 
          pointerEvents: 'none',
          opacity: darkMode ? 0.8 : 0.5 // Increased opacity for better visibility
        }}
      />

      {/* Additional Gradient Overlay - Dimmed */}
      <div className={`fixed inset-0 z-0 opacity-20 transition-opacity duration-300 ${
        darkMode ? '' : 'opacity-15'
      }`}>
        <div className={`absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-pulse ${
          darkMode ? 'bg-blue-600' : 'bg-blue-300'
        }`} style={{ animationDuration: '4s' }}></div>
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-pulse ${
          darkMode ? 'bg-purple-600' : 'bg-purple-300'
        }`} style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className={`absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-pulse ${
          darkMode ? 'bg-pink-600' : 'bg-pink-300'
        }`} style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>
      
      {/* Sign In Modal Overlay */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="modal-content relative w-full max-w-md">
            <div className={`rounded-2xl p-8 shadow-2xl ${
              darkMode 
                ? 'bg-slate-800/95 border border-slate-700' 
                : 'bg-white/95 border border-gray-200'
            } backdrop-blur-md`}>
              <button
                onClick={toggleSignIn}
                className={`absolute top-4 right-4 p-2 rounded-full ${
                  darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                } transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">TripAI</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sign in to your account to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl border ${
                      darkMode 
                        ? 'bg-slate-700/80 border-slate-600 text-white placeholder-gray-400' 
                        : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm`}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                        darkMode 
                          ? 'bg-slate-700/80 border-slate-600 text-white placeholder-gray-400' 
                          : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                        darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      } transition-colors`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className={`ml-2 text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className={`text-sm font-medium ${
                      darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                    } transition-colors`}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:scale-105 backdrop-blur-sm"
                >
                  Sign In
                </button>
              </form>

              <div className="my-6 flex items-center">
                <div className={`flex-grow border-t ${
                  darkMode ? 'border-slate-600' : 'border-gray-300'
                }`}></div>
                <span className={`mx-4 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>or</span>
                <div className={`flex-grow border-t ${
                  darkMode ? 'border-slate-600' : 'border-gray-300'
                }`}></div>
              </div>

              <div className="space-y-3">
                <button
                  className={`w-full py-3 px-4 rounded-xl border font-medium transition-all backdrop-blur-sm ${
                    darkMode 
                      ? 'border-slate-600 bg-slate-700/80 text-white hover:bg-slate-600' 
                      : 'border-gray-300 bg-white/80 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Continue with Google
                </button>
                <button
                  className={`w-full py-3 px-4 rounded-xl border font-medium transition-all backdrop-blur-sm ${
                    darkMode 
                      ? 'border-slate-600 bg-slate-700/80 text-white hover:bg-slate-600' 
                      : 'border-gray-300 bg-white/80 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Continue with Facebook
                </button>
              </div>

              <div className={`text-center mt-6 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Don't have an account?{' '}
                <button
                  type="button"
                  className={`font-medium ${
                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  } transition-colors`}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - Fixed with Link component */}
      <nav className={`relative z-40 flex items-center justify-between px-8 py-6 backdrop-blur-md border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-900/30 border-white/10' 
          : 'bg-white/50 border-gray-200/50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">TripAI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#home" className={`hover:text-blue-400 transition ${
            darkMode ? '' : 'hover:text-blue-600'
          }`}>Home</a>
          <a href="#features" className={`hover:text-blue-400 transition ${
            darkMode ? '' : 'hover:text-blue-600'
          }`}>Features</a>
          <a href="#problem" className={`hover:text-blue-400 transition ${
            darkMode ? '' : 'hover:text-blue-600'
          }`}>Why Us</a>
          <a href="#solution" className={`hover:text-blue-400 transition ${
            darkMode ? '' : 'hover:text-blue-600'
          }`}>Solutions</a>
          {/* Fixed Nearby navigation to use Link */}
          <Link 
            to="/nearby" 
            className={`hover:text-blue-400 transition ${
              darkMode ? '' : 'hover:text-blue-600'
            }`}
          >
            Nearby
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition ${
              darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={toggleSignIn}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 backdrop-blur-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10 min-h-screen flex items-center justify-center px-8 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <div 
            className="transform transition-all duration-1000"
            style={{ 
              transform: `translateY(${scrollY * 0.5}px)`,
              opacity: Math.max(0, 1 - scrollY / 500)
            }}
          >
            <div className={`inline-block mb-6 px-6 py-2 rounded-full border backdrop-blur-sm ${
              darkMode 
                ? 'bg-gradient-to-r from-blue-500/30 to-purple-600/30 border-blue-500/40' 
                : 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30'
            }`}>
              <span className={`flex items-center gap-2 ${
                darkMode ? 'text-blue-300' : 'text-blue-600'
              }`}>
                <Sparkles className="w-4 h-4" />
                AI-Powered Travel Intelligence
              </span>
            </div>
            
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight ${
              darkMode ? '' : 'from-blue-600 via-purple-600 to-pink-600'
            }`}>
              Full Stack Trip Planner with<br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Intelligent Suggestions
              </span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Develop an intelligent, full-stack web-based trip planner application that leverages artificial intelligence to generate personalized, day-wise itineraries based on your budget, group size, duration, destination, and interests.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
                darkMode ? 'bg-white/10 border-white/20' : 'bg-white/60 border-gray-200'
              }`}>
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Interactive Maps</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
                darkMode ? 'bg-white/10 border-white/20' : 'bg-white/60 border-gray-200'
              }`}>
                <Cloud className="w-5 h-5 text-cyan-400" />
                <span>Real-time Weather</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
                darkMode ? 'bg-white/10 border-white/20' : 'bg-white/60 border-gray-200'
              }`}>
                <DollarSign className="w-5 h-5 text-green-400" />
                <span>Budget Tracking</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
                darkMode ? 'bg-white/10 border-white/20' : 'bg-white/60 border-gray-200'
              }`}>
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>Day-wise Planning</span>
              </div>
            </div>

            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                Start Planning Your Journey
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 blur opacity-0 group-hover:opacity-100 transition -z-10"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`relative z-10 px-8 py-32 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-transparent via-blue-900/10 to-transparent' 
          : 'bg-gradient-to-b from-transparent via-blue-50/30 to-transparent'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-on-scroll" id="features-title">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Everything you need to plan the perfect trip, powered by cutting-edge AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                id={`feature-${index}`}
                className={`animate-on-scroll p-8 rounded-2xl backdrop-blur-md border transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/60 border-gray-200/50 hover:bg-white/80'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 text-white`}>
                  {feature.icon}
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="relative z-10 px-8 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-on-scroll" id="problem-title">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent py-2 leading-tight">
              The Travel Planning Problem
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Traditional trip planning is fragmented and time-consuming. Here's what we're solving:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {problems.map((problem, index) => (
              <div
                key={index}
                id={`problem-${index}`}
                className={`animate-on-scroll p-6 rounded-xl backdrop-blur-md border transition-all duration-500 hover:scale-102 ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/60 border-gray-200/50 hover:bg-white/80'
                }`}
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                <div className={`flex items-start space-x-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 mt-1`}>
                    {problem.icon}
                  </div>
                  <p className={`text-lg leading-relaxed ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {problem.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className={`relative z-10 px-8 py-32 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-transparent via-purple-900/10 to-transparent' 
          : 'bg-gradient-to-b from-transparent via-purple-50/30 to-transparent'
      }`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-on-scroll" id="solution-title">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-green-400 break-words whitespace-normal">
              Our Intelligent Solution
            </h2>
            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <p
                  key={index}
                  id={`solution-${index}`}
                  className={`text-xl leading-relaxed animate-on-scroll ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                  style={{
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  {solution}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 px-8 py-16 border-t transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-900/30 border-white/10' 
          : 'bg-white/50 border-gray-200/50'
      } backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            {footerSections.map((section, index) => (
              <div key={index} className="animate-on-scroll">
                <h4 className={`font-semibold mb-4 text-lg ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href="#"
                        className={`transition-colors hover:text-blue-400 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className={`pt-8 border-t text-center ${
            darkMode ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">TripAI</span>
            </div>
            <p className="text-sm">
              © 2024 TripAI. All rights reserved. | Intelligent Travel Planning Powered by AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}