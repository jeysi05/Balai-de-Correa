import React, { useEffect, useState } from 'react';
import theme from '../theme.config';

export default function Navbar({
  onLogoClick,
  onBookClick,
  onAdminClick,
  showBack,
  onBackClick,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      if (window.scrollY > 80) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setIsMenuOpen(false);

    const element = document.getElementById(id);

    if (!element) return;

    const offset = 84;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  const handleBookClick = () => {
    setIsMenuOpen(false);

    const bookingSection = document.getElementById('booking');

    if (bookingSection) {
      scrollToSection('booking');
      return;
    }

    onBookClick?.();
  };

  const handleLogoClick = () => {
    setIsMenuOpen(false);

    if (showBack) {
      onBackClick?.();
      return;
    }

    onLogoClick?.();

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 0);
  };

  const solidNav = isScrolled || showBack || isMenuOpen;

  return (
    <nav
      className={`fixed left-0 top-0 z-50 w-full border-b transition-all duration-300 ${
        solidNav
          ? 'border-white/10 bg-[#2A1A12]/95 py-3 shadow-lg backdrop-blur-md'
          : 'border-transparent bg-transparent py-4 md:py-6'
      }`}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6">
        <button
          type="button"
          onClick={handleLogoClick}
          className="group z-50 flex items-center gap-2 text-left md:gap-3"
        >
          {showBack ? (
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#C15A3E] transition-colors hover:text-white md:gap-2 md:text-[11px]">
              <span className="mb-1 text-lg leading-none">←</span>
              <span className="hidden sm:block">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </div>
          ) : (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[#C15A3E]/50 bg-[#2A1A12]/50 transition-colors group-hover:border-[#C15A3E] md:h-10 md:w-10">
                <svg
                  className="h-4 w-4 md:h-5 md:w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C15A3E"
                  strokeWidth="1.5"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>

              <div>
                <div className="whitespace-nowrap font-['Playfair_Display'] text-lg italic leading-none text-white md:text-xl">
                  {theme.villaName}
                </div>

                <div className="mt-1 text-[6px] font-bold uppercase tracking-[0.2em] text-[#C15A3E] md:mt-1.5 md:text-[7px]">
                  {theme.tagline}
                </div>
              </div>
            </>
          )}
        </button>

        {!showBack && (
          <div className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() => scrollToSection('gallery')}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white"
            >
              Gallery
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('rates')}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white"
            >
              Rates
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('policies')}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white"
            >
              Policies
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white"
            >
              Contact
            </button>
          </div>
        )}

        <div className="z-50 flex items-center gap-3 md:gap-5">
          {!showBack && (
            <>
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="p-1 text-[#C15A3E] focus:outline-none md:hidden"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={onAdminClick}
                className="hidden text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-[#C15A3E] md:block"
              >
                Owner Login
              </button>

              <button
                type="button"
                onClick={handleBookClick}
                className="whitespace-nowrap rounded-sm bg-[#C15A3E] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition-colors hover:bg-[#A34930] md:px-6 md:py-3 md:text-[10px]"
              >
                Book Now
              </button>
            </>
          )}
        </div>
      </div>

      {!showBack && isMenuOpen && (
        <div className="absolute left-0 top-full flex w-full origin-top flex-col gap-6 border-b border-white/10 bg-[#2A1A12]/95 px-6 py-6 shadow-xl backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => scrollToSection('gallery')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.15em] text-white/80 transition-colors hover:text-white"
          >
            Gallery
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('rates')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.15em] text-white/80 transition-colors hover:text-white"
          >
            Rates
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('policies')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.15em] text-white/80 transition-colors hover:text-white"
          >
            Policies
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.15em] text-white/80 transition-colors hover:text-white"
          >
            Contact
          </button>

          <div className="my-1 h-px w-full bg-white/10" />

          <button
            type="button"
            onClick={handleBookClick}
            className="rounded-xl bg-[#C15A3E] px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#A34930]"
          >
            Start Reservation
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onAdminClick?.();
            }}
            className="flex items-center gap-2 text-left text-[12px] font-bold uppercase tracking-[0.15em] text-[#C15A3E] transition-colors hover:text-[#A34930]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Owner Login
          </button>
        </div>
      )}
    </nav>
  );
}