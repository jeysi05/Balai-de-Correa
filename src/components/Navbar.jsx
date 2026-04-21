import React, { useState, useEffect } from 'react';
import theme from '../theme.config';

export default function Navbar({ onLogoClick, onBookClick, onAdminClick, showBack, onBackClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (window.scrollY > 50) setIsMenuOpen(false); 
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setIsMenuOpen(false); 
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
        isScrolled || showBack || isMenuOpen
          ? 'bg-[#2A1A12]/95 backdrop-blur-md border-white/10 py-3 md:py-3 shadow-lg' 
          : 'bg-transparent border-transparent py-4 md:py-6' 
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center relative">
        
        <div 
          onClick={showBack ? onBackClick : onLogoClick}
          className="flex items-center gap-2 md:gap-3 cursor-pointer group z-50"
        >
          {showBack ? (
            <div className="text-[#C15A3E] font-['Syne'] text-[10px] md:text-[11px] font-bold tracking-widest uppercase hover:text-white transition-colors flex items-center gap-1 md:gap-2">
              <span className="text-lg leading-none mb-1">←</span> <span className="hidden sm:block">Back to Home</span><span className="sm:hidden">Back</span>
            </div>
          ) : (
            <>
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 border border-[#C15A3E]/50 flex items-center justify-center rounded-sm group-hover:border-[#C15A3E] transition-colors bg-[#2A1A12]/50">
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="#C15A3E" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div>
                <div className="font-['Playfair_Display'] text-lg md:text-xl italic text-white leading-none whitespace-nowrap">{theme.villaName}</div>
                <div className="font-['Syne'] text-[6px] md:text-[7px] font-bold tracking-[0.2em] uppercase text-[#C15A3E] mt-1 md:mt-1.5">{theme.tagline}</div>
              </div>
            </>
          )}
        </div>

        {!showBack && (
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('gallery')} className="font-['Syne'] text-[10px] font-bold tracking-[0.15em] uppercase text-white/60 hover:text-white transition-colors">Gallery</button>
            <button onClick={() => scrollToSection('rates')} className="font-['Syne'] text-[10px] font-bold tracking-[0.15em] uppercase text-white/60 hover:text-white transition-colors">Rates</button>
            {/* FIXED ID HERE: 'contact' instead of 'rates' */}
            <button onClick={() => scrollToSection('contact')} className="font-['Syne'] text-[10px] font-bold tracking-[0.15em] uppercase text-white/60 hover:text-white transition-colors">Contact</button>
          </div>
        )}

        <div className="flex items-center gap-3 md:gap-5 z-50">
          {!showBack && (
            <>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-[#C15A3E] p-1 focus:outline-none">
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>

              <button onClick={onAdminClick} className="hidden md:block font-['Syne'] text-[9px] font-bold tracking-[0.15em] uppercase text-white/40 hover:text-[#C15A3E] transition-colors">
                Owner Login
              </button>

              <button 
                onClick={() => { setIsMenuOpen(false); onBookClick(); }} 
                className="whitespace-nowrap px-4 py-2.5 md:px-6 md:py-3 bg-[#C15A3E] text-white font-['Syne'] text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-[#A34930] transition-colors rounded-sm shadow-md"
              >
                Book Now
              </button>
            </>
          )}
        </div>
      </div>

      {!showBack && isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#2A1A12]/95 backdrop-blur-md border-b border-white/10 shadow-xl flex flex-col px-6 py-6 gap-6 md:hidden animate-fade-in origin-top">
          <button onClick={() => scrollToSection('gallery')} className="text-left font-['Syne'] text-[12px] font-bold tracking-[0.15em] uppercase text-white/80 hover:text-white transition-colors">Gallery</button>
          <button onClick={() => scrollToSection('rates')} className="text-left font-['Syne'] text-[12px] font-bold tracking-[0.15em] uppercase text-white/80 hover:text-white transition-colors">Rates</button>
          {/* FIXED ID HERE: 'contact' instead of 'rates' */}
          <button onClick={() => scrollToSection('contact')} className="text-left font-['Syne'] text-[12px] font-bold tracking-[0.15em] uppercase text-white/80 hover:text-white transition-colors">Contact</button>
          
          <div className="w-full h-px bg-white/10 my-1"></div>
          
          <button onClick={() => { setIsMenuOpen(false); onAdminClick(); }} className="text-left font-['Syne'] text-[12px] font-bold tracking-[0.15em] uppercase text-[#C15A3E] hover:text-[#A34930] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Owner Login
          </button>
        </div>
      )}
    </nav>
  );
}