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
      setIsScrolled(window.scrollY > 18);

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

    const offset = 92;
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

    const bookingPanel = document.getElementById('booking-panel');

    if (bookingPanel) {
      scrollToSection('booking-panel');
      return;
    }

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

  const handleOwnerPortalClick = () => {
    setIsMenuOpen(false);
    onAdminClick?.();
  };

  const solidNav = isScrolled || showBack || isMenuOpen;

  return (
    <nav
      className={`fixed left-0 top-0 z-50 w-full border-b transition-all duration-300 ${
        solidNav
          ? 'border-[#2A1A12]/10 bg-[#FFF9F2]/95 py-3 shadow-[0_16px_45px_rgba(42,26,18,0.08)] backdrop-blur-xl'
          : 'border-transparent bg-[#F6EFE6]/88 py-4 backdrop-blur-sm'
      }`}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-6 xl:px-8">
        <button
          type="button"
          onClick={handleLogoClick}
          className="group z-50 flex min-w-0 max-w-[54vw] items-center gap-3 text-left sm:max-w-[46vw] xl:max-w-none"
        >
          {showBack ? (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C15A3E] transition-colors hover:text-[#2A1A12] md:text-[11px]">
              <span className="mb-1 text-lg leading-none">←</span>
              <span className="hidden sm:block">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </div>
          ) : (
            <>
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C15A3E]/35 bg-[#C15A3E]/10 text-[#C15A3E] transition group-hover:bg-[#C15A3E] group-hover:text-white sm:flex">
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

              <div className="min-w-0">
                <div className="font-display truncate text-lg font-semibold italic leading-none text-[#2A1A12] sm:text-xl xl:whitespace-nowrap xl:text-2xl">
                  {theme.villaName}
                </div>

                <div className="mt-1 max-w-[170px] truncate text-[6px] font-bold uppercase tracking-[0.2em] text-[#C15A3E] sm:max-w-[250px] md:max-w-[320px] xl:max-w-none xl:text-[7px]">
                  {theme.tagline}
                </div>
              </div>
            </>
          )}
        </button>

        {!showBack && (
          <div className="hidden items-center gap-7 xl:flex">
            <button
              type="button"
              onClick={() => scrollToSection('photos')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/52 transition-colors hover:text-[#C15A3E]"
            >
              Photos
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('rates')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/52 transition-colors hover:text-[#C15A3E]"
            >
              Rates
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('policies')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/52 transition-colors hover:text-[#C15A3E]"
            >
              Policies
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/52 transition-colors hover:text-[#C15A3E]"
            >
              Contact
            </button>
          </div>
        )}

        <div className="z-50 flex shrink-0 items-center gap-2 sm:gap-3 xl:gap-5">
          {!showBack && (
            <>
              <button
                type="button"
                onClick={handleOwnerPortalClick}
                className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35 transition-colors hover:text-[#C15A3E] xl:block"
              >
                Owner Portal
              </button>

              <button
                type="button"
                onClick={handleReserveClick}
                className="rounded-xl border border-[#C15A3E] bg-[#C15A3E] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_12px_25px_rgba(193,90,62,0.22)] transition hover:-translate-y-0.5 hover:bg-[#A34930] sm:px-5 sm:py-3 sm:text-[10px] xl:px-6"
              >
                Reserve
              </button>

              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="rounded-xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-2.5 text-[#2A1A12] shadow-sm transition hover:border-[#C15A3E]/30 hover:text-[#C15A3E] xl:hidden"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {!showBack && isMenuOpen && (
        <div className="absolute left-0 top-full w-full border-b border-[#2A1A12]/10 bg-[#FFF9F2]/98 px-4 py-4 shadow-[0_18px_45px_rgba(42,26,18,0.1)] backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <button
              type="button"
              onClick={() => scrollToSection('photos')}
              className="rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/65 transition hover:bg-[#F6EFE6] hover:text-[#C15A3E]"
            >
              Photos
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('rates')}
              className="rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/65 transition hover:bg-[#F6EFE6] hover:text-[#C15A3E]"
            >
              Rates
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('policies')}
              className="rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/65 transition hover:bg-[#F6EFE6] hover:text-[#C15A3E]"
            >
              Policies
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/65 transition hover:bg-[#F6EFE6] hover:text-[#C15A3E]"
            >
              Contact
            </button>

            <div className="my-2 h-px w-full bg-[#2A1A12]/10" />

            <button
              type="button"
              onClick={handleReserveClick}
              className="rounded-2xl bg-[#2A1A12] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-[#FFF9F2] transition hover:bg-[#C15A3E]"
            >
              Start Reservation
            </button>

            <button
              type="button"
              onClick={handleOwnerPortalClick}
              className="rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-[#C15A3E] transition hover:bg-[#F6EFE6]"
            >
              Owner Portal
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}