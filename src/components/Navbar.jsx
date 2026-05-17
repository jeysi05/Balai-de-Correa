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
      setIsScrolled(window.scrollY > 24);

      if (window.scrollY > 90) {
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

    const offset = 86;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  const handleReserveClick = () => {
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
          ? 'border-[#F7EFE6]/10 bg-[#2A1A12]/96 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-md'
          : 'border-transparent bg-transparent py-4 md:py-6'
      }`}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6">
        <button
          type="button"
          onClick={handleLogoClick}
          className="group z-50 flex items-center gap-3 text-left"
        >
          {showBack ? (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C15A3E] transition-colors hover:text-[#F7EFE6] md:text-[11px]">
              <span className="mb-1 text-lg leading-none">←</span>
              <span className="hidden sm:block">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </div>
          ) : (
            <>
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center border border-[#C15A3E]/45 bg-[#2A1A12]/35 text-[#C15A3E] transition-colors group-hover:border-[#C15A3E] sm:flex">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.45"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>

              <div>
                <div className="font-display whitespace-nowrap text-xl italic leading-none text-[#F7EFE6] md:text-2xl">
                  {theme.villaName}
                </div>

                <div className="mt-1 text-[6px] font-bold uppercase tracking-[0.22em] text-[#C15A3E] md:text-[7px]">
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
              onClick={() => scrollToSection('photos')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/58 transition-colors hover:text-[#F7EFE6]"
            >
              Photos
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('rates')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/58 transition-colors hover:text-[#F7EFE6]"
            >
              Rates
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('policies')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/58 transition-colors hover:text-[#F7EFE6]"
            >
              Policies
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/58 transition-colors hover:text-[#F7EFE6]"
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
                className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/35 transition-colors hover:text-[#C15A3E] md:block"
              >
                Owner Portal
              </button>

              <button
                type="button"
                onClick={handleReserveClick}
                className="border border-[#C15A3E] bg-[#C15A3E] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-transparent hover:text-[#C15A3E] md:px-6 md:py-3 md:text-[10px]"
              >
                Reserve
              </button>
            </>
          )}
        </div>
      </div>

      {!showBack && isMenuOpen && (
        <div className="absolute left-0 top-full flex w-full origin-top flex-col gap-6 border-b border-[#F7EFE6]/10 bg-[#2A1A12]/98 px-6 py-6 shadow-xl backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => scrollToSection('photos')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/80 transition-colors hover:text-white"
          >
            Photos
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('rates')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/80 transition-colors hover:text-white"
          >
            Rates
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('policies')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/80 transition-colors hover:text-white"
          >
            Policies
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="text-left text-[12px] font-bold uppercase tracking-[0.18em] text-[#F7EFE6]/80 transition-colors hover:text-white"
          >
            Contact
          </button>

          <div className="my-1 h-px w-full bg-[#F7EFE6]/10" />

          <button
            type="button"
            onClick={handleReserveClick}
            className="bg-[#C15A3E] px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#A34930]"
          >
            Start Reservation
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onAdminClick?.();
            }}
            className="text-left text-[12px] font-bold uppercase tracking-[0.18em] text-[#C15A3E] transition-colors hover:text-[#A34930]"
          >
            Owner Portal
          </button>
        </div>
      )}
    </nav>
  );
}