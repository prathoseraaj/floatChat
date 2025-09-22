import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Main entrance animation timeline
    const tl = gsap.timeline();
    
    // Initial setup
    gsap.set([titleRef.current, subtitleRef.current, buttonRef.current, featuresRef.current], {
      opacity: 0,
      y: 50
    });

    // Entrance sequence
    tl.from(containerRef.current, { 
      opacity: 0, 
      duration: 1.5,
      ease: "power2.out"
    })
    .to(titleRef.current, { 
      opacity: 1, 
      y: 0, 
      duration: 1.5, 
      ease: "back.out(1.7)",
      delay: 0.2
    })
    .to(subtitleRef.current, { 
      opacity: 1, 
      y: 0, 
      duration: 1.2, 
      ease: "power3.out"
    }, "-=1")
    .to(buttonRef.current, { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      duration: 1, 
      ease: "elastic.out(1, 0.8)"
    }, "-=0.8")
    .to(featuresRef.current, { 
      opacity: 1, 
      y: 0, 
      duration: 1, 
      ease: "power2.out"
    }, "-=0.6");

    // Continuous floating animations
    gsap.to(".floating-circle", {
      y: "random(-40, 40)",
      x: "random(-30, 30)",
      rotation: "random(-360, 360)",
      duration: "random(4, 8)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: {
        amount: 2,
        from: "random"
      }
    });

    // Enhanced wave animation
    gsap.to(".wave", {
      x: 100,
      duration: 12,
      repeat: -1,
      ease: "none"
    });

    gsap.to(".wave-2", {
      x: -80,
      duration: 15,
      repeat: -1,
      ease: "none"
    });

    // Particle system
    gsap.to(".particle", {
      y: "random(-60, 60)",
      x: "random(-60, 60)",
      opacity: "random(0.2, 0.8)",
      scale: "random(0.3, 1.8)",
      duration: "random(3, 6)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: {
        amount: 3,
        from: "random"
      }
    });

    // Title shimmer effect
    gsap.to(titleRef.current, {
      backgroundPosition: "200% center",
      duration: 3,
      repeat: -1,
      ease: "none"
    });

    // Button pulse animation
    gsap.to(buttonRef.current, {
      boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, []);

  const handleEnter = () => {
    console.log("Navigate button clicked, going to /main");
    
    // Enhanced exit animation
    const exitTl = gsap.timeline();
    
    exitTl.to(buttonRef.current, {
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out"
    })
    .to([featuresRef.current, subtitleRef.current], {
      opacity: 0,
      y: -30,
      duration: 0.5,
      ease: "power2.in",
      stagger: 0.1
    })
    .to(titleRef.current, {
      scale: 1.2,
      opacity: 0,
      duration: 0.6,
      ease: "power2.in"
    }, "-=0.3")
    .to(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        console.log("Animation complete, navigating now");
        navigate("/main");
      }
    }, "-=0.4");
  };

  const handleDirectNavigate = () => {
    console.log("Direct navigate to /main");
    navigate("/main");
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Enhanced Layered Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/30 via-transparent to-purple-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-800/20 to-transparent"></div>
        {/* Radial overlay for spotlight effect */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20"></div>
      </div>

      {/* Enhanced Multi-layer Wave Background */}
      <svg className="absolute bottom-0 left-0 w-full h-80 opacity-40 wave" viewBox="0 0 1440 320">
        <path fill="url(#gradient1)" fillOpacity="0.6" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      
      <svg className="absolute bottom-0 left-0 w-full h-64 opacity-30 wave-2" viewBox="0 0 1440 320">
        <path fill="url(#gradient2)" fillOpacity="0.4" d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,133.3C672,128,768,160,864,170.7C960,181,1056,171,1152,165.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Enhanced Floating Geometric Elements */}
      <div ref={floatingElementsRef} className="absolute inset-0 pointer-events-none">
        <div className="floating-circle absolute top-20 left-20 w-20 h-20 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-sm"></div>
        <div className="floating-circle absolute top-40 right-32 w-32 h-32 bg-gradient-to-br from-purple-400/25 to-pink-500/25 rounded-full blur-md"></div>
        <div className="floating-circle absolute bottom-40 left-40 w-24 h-24 bg-gradient-to-br from-blue-400/35 to-cyan-500/35 rounded-full blur-sm"></div>
        <div className="floating-circle absolute bottom-20 right-20 w-16 h-16 bg-gradient-to-br from-pink-400/30 to-purple-500/30 rounded-full blur-sm"></div>
        <div className="floating-circle absolute top-1/2 left-10 w-12 h-12 bg-gradient-to-br from-indigo-400/40 to-blue-600/40 rounded-full blur-sm"></div>
        <div className="floating-circle absolute top-3/4 right-10 w-28 h-28 bg-gradient-to-br from-cyan-300/20 to-teal-400/20 rounded-full blur-lg"></div>
      </div>

      {/* Enhanced Particle System */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
              boxShadow: `0 0 ${Math.random() * 4 + 2}px rgba(255,255,255,0.8)`
            }}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div ref={heroRef} className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        <h1 
          ref={titleRef} 
          className="text-8xl md:text-9xl font-black mb-8 bg-gradient-to-r from-cyan-200 via-blue-300 to-purple-300 bg-clip-text text-transparent"
          style={{
            backgroundSize: "200% 100%",
            backgroundImage: "linear-gradient(90deg, #a7f3d0, #7dd3fc, #c084fc, #7dd3fc, #a7f3d0)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 20px rgba(125, 211, 252, 0.3))"
          }}
        >
          FloatChat
        </h1>
        
        <p ref={subtitleRef} className="text-2xl md:text-3xl mb-16 max-w-3xl mx-auto leading-relaxed text-slate-100">
          Dive into seamless <span className="text-cyan-300 font-bold">oceanographic data exploration</span>
          <br />
          <span className="text-purple-300 font-semibold">Chat with your data in real time</span>
        </p>
        
        {/* Enhanced Button */}
        <button 
          ref={buttonRef} 
          onClick={handleEnter} 
          className="group relative px-10 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-bold rounded-full shadow-2xl transition-all duration-500 text-lg transform hover:scale-110 border-2 border-cyan-300/50 backdrop-blur-sm"
          style={{
            background: "linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6)",
            backgroundSize: "200% 200%",
            animation: "gradientShift 3s ease infinite"
          }}
        >
          <span className="relative z-10 flex items-center gap-3">
            Enter FloatChat
            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
        </button>

        {/* Enhanced Feature Pills */}
        <div ref={featuresRef} className="mt-12 flex flex-wrap justify-center gap-3 px-4">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full text-sm text-white border border-white/30 shadow-lg hover:bg-white/20 transition-all duration-300">
            🌊 Oceanographic Data
          </div>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full text-sm text-white border border-white/30 shadow-lg hover:bg-white/20 transition-all duration-300">
            🤖 AI-Powered Chat
          </div>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full text-sm text-white border border-white/30 shadow-lg hover:bg-white/20 transition-all duration-300">
            📊 Real-time Visualization
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="absolute bottom-8 text-center w-full text-white/70 text-base z-10">
        <div className="flex items-center justify-center gap-2">
          <span>&copy; {new Date().getFullYear()} FloatChat</span>
          <span className="text-cyan-300">•</span>
          <span>Explore the depths of data</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
