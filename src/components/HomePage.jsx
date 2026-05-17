import React, { useMemo, useState } from 'react';
import theme from '../theme.config';
import { formatPHP } from '../utils/formatters';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=85';

function getLocalTodayString() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
}

function toDateInputString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function parseLocalDate(value) {
  if (!value) return null;

  if (value?.toDate) {
    const date = value.toDate();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string' && value.includes('-')) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const fallback = new Date(value);
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

function formatDisplayDate(dateString) {
  const date = parseLocalDate(dateString);

  if (!date) return 'Select date';

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateNights(checkIn, checkOut) {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);

  if (!start || !end) return 0;

  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return diff > 0 ? diff : 0;
}

function getRateBreakdown(guestCount) {
  const guests = parseInt(guestCount, 10) || 2;

  if (guests <= 3) {
    return {
      packageName: 'Tres Package',
      packagePrice: 9000,
      packageNote: 'Best for 1–3 guests',
      extraGuests: 0,
      extraRate: 0,
    };
  }

  if (guests <= 6) {
    return {
      packageName: 'Seis Package',
      packagePrice: 13500,
      packageNote: 'Best for 4–6 guests',
      extraGuests: 0,
      extraRate: 0,
    };
  }

  const extraGuests = Math.max(0, guests - 12);

  return {
    packageName: 'Doce Package',
    packagePrice: 20500,
    packageNote: extraGuests > 0 ? `Includes 12 guests + ${extraGuests} extra` : 'Best for 7–12 guests',
    extraGuests,
    extraRate: extraGuests * 1500,
  };
}

function isReservationActive(reservation) {
  return reservation?.status !== 'cancelled';
}

function reservationOverlapsDate(reservation, date) {
  const start = parseLocalDate(reservation.checkIn);
  const end = parseLocalDate(reservation.checkOut);

  if (!start || !end || !date) return false;

  return date >= start && date < end;
}

function rangeHasBookingConflict(checkIn, checkOut, liveReservations = []) {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);

  if (!start || !end || end <= start) return false;

  return liveReservations.filter(isReservationActive).some((reservation) => {
    const reservationStart = parseLocalDate(reservation.checkIn);
    const reservationEnd = parseLocalDate(reservation.checkOut);

    if (!reservationStart || !reservationEnd) return false;

    return start < reservationEnd && end > reservationStart;
  });
}

export default function HomePage({
  villaCart,
  setVillaCart,
  onProceed,
  liveReservations = [],
}) {
  const heroImg = theme.heroImages?.[0] || FALLBACK_HERO;
  const headline = theme.heroHeadline?.join(' ') || 'Your perfect getaway retreat.';
  const [calMonth, setCalMonth] = useState(new Date());

  const currentYear = calMonth.getFullYear();
  const currentMonthIdx = calMonth.getMonth();
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonthIdx, 1).getDay();

  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const nights = calculateNights(villaCart?.checkIn, villaCart?.checkOut);
  const breakdown = getRateBreakdown(villaCart?.guests || 2);
  const estimatedBaseTotal = nights > 0 ? (breakdown.packagePrice + breakdown.extraRate) * nights : 0;
  const hasConflict = rangeHasBookingConflict(villaCart?.checkIn, villaCart?.checkOut, liveReservations);

  const canProceed =
    Boolean(villaCart?.checkIn) &&
    Boolean(villaCart?.checkOut) &&
    nights > 0 &&
    !hasConflict;

  const galleryImages = useMemo(() => {
    const images = [
      ...(theme.galleryImages || []),
      ...(theme.heroImages || []),
      ...(theme.hourlyAmenities || []).map((item) => item.image),
    ].filter(Boolean);

    const uniqueImages = [...new Set(images)];

    if (uniqueImages.length >= 6) return uniqueImages.slice(0, 6);

    return [
      ...uniqueImages,
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=85',
    ].slice(0, 6);
  }, []);

  const handleCartUpdate = (field, value) => {
    setVillaCart((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGuestsChange = (value) => {
    const guestCount = parseInt(value, 10) || 2;
    const nextBreakdown = getRateBreakdown(guestCount);

    setVillaCart((prev) => ({
      ...prev,
      guests: guestCount,
      package: nextBreakdown.packageName,
    }));
  };

  const handleCheckInChange = (value) => {
    const nextCheckIn = parseLocalDate(value);
    const currentCheckOut = parseLocalDate(villaCart?.checkOut);

    setVillaCart((prev) => ({
      ...prev,
      checkIn: value,
      checkOut: currentCheckOut && nextCheckIn && currentCheckOut > nextCheckIn ? prev.checkOut : '',
    }));
  };

  const handleCheckOutChange = (value) => {
    handleCartUpdate('checkOut', value);
  };

  const prevMonth = () => {
    setCalMonth(new Date(currentYear, currentMonthIdx - 1, 1));
  };

  const nextMonth = () => {
    setCalMonth(new Date(currentYear, currentMonthIdx + 1, 1));
  };

  const isPastDate = (day) => {
    const today = parseLocalDate(getLocalTodayString());
    const date = new Date(currentYear, currentMonthIdx, day);

    return date < today;
  };

  const isDateBooked = (day) => {
    const date = new Date(currentYear, currentMonthIdx, day);

    return liveReservations.filter(isReservationActive).some((reservation) => {
      return reservationOverlapsDate(reservation, date);
    });
  };

  const handleDateClick = (day) => {
    if (isDateBooked(day) || isPastDate(day)) return;

    const selectedDate = new Date(currentYear, currentMonthIdx, day);
    const dateStr = toDateInputString(selectedDate);

    if (!villaCart.checkIn || (villaCart.checkIn && villaCart.checkOut)) {
      setVillaCart((prev) => ({
        ...prev,
        checkIn: dateStr,
        checkOut: '',
      }));

      document.getElementById('booking')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      return;
    }

    const checkInDate = parseLocalDate(villaCart.checkIn);

    if (checkInDate && selectedDate > checkInDate) {
      setVillaCart((prev) => ({
        ...prev,
        checkOut: dateStr,
      }));

      document.getElementById('booking')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      return;
    }

    setVillaCart((prev) => ({
      ...prev,
      checkIn: dateStr,
      checkOut: '',
    }));
  };

  const handleProceed = () => {
    if (!canProceed) return;
    onProceed();
  };

  return (
    <main className="min-h-screen bg-[#F9F8F6] text-[#2A1A12] selection:bg-[#C15A3E] selection:text-white">
      <section
        id="booking"
        className="relative overflow-hidden bg-[#2A1A12] pt-[96px] text-white md:pt-[112px]"
      >
        <img
          src={heroImg}
          alt={theme.villaName}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(193,90,62,0.26),transparent_28%),linear-gradient(120deg,rgba(42,26,18,0.96)_0%,rgba(42,26,18,0.72)_48%,rgba(42,26,18,0.42)_100%)]" />

        <div className="relative z-10 mx-auto grid min-h-[760px] max-w-7xl grid-cols-1 gap-8 px-5 pb-10 pt-10 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-20 lg:pt-14">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C15A3E]" />
              {theme.location}
            </div>

            <h1 className="mb-6 max-w-4xl font-['Playfair_Display'] text-5xl italic leading-[0.95] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
              {headline}
            </h1>

            <p className="mb-8 max-w-xl text-base font-light leading-8 text-white/76 md:text-lg">
              {theme.heroDescription}
            </p>

            <div className="grid max-w-xl grid-cols-3 gap-3 border-y border-white/10 py-5">
              {(theme.specs || []).slice(0, 3).map((spec) => (
                <div key={spec.label}>
                  <div className="font-['Playfair_Display'] text-3xl italic text-[#C15A3E]">
                    {spec.value}
                  </div>

                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                    {spec.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-[#F9F8F6] p-4 text-[#2A1A12] shadow-[0_30px_80px_rgba(0,0,0,0.38)] md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#2A1A12]/10 pb-5">
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                  Direct Reservation
                </div>

                <h2 className="font-['Playfair_Display'] text-3xl italic leading-tight">
                  Plan your private stay.
                </h2>
              </div>

              <div className="hidden rounded-full bg-[#2A1A12] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#C15A3E] sm:block">
                22h stay
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-[#2A1A12]/10 bg-white p-4 transition focus-within:border-[#C15A3E]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/45">
                  Check In
                </span>

                <input
                  type="date"
                  min={getLocalTodayString()}
                  value={villaCart?.checkIn || ''}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#2A1A12] outline-none"
                />
              </label>

              <label className="rounded-2xl border border-[#2A1A12]/10 bg-white p-4 transition focus-within:border-[#C15A3E]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/45">
                  Check Out
                </span>

                <input
                  type="date"
                  min={villaCart?.checkIn || getLocalTodayString()}
                  value={villaCart?.checkOut || ''}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#2A1A12] outline-none"
                />
              </label>

              <label className="rounded-2xl border border-[#2A1A12]/10 bg-white p-4 transition focus-within:border-[#C15A3E]">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/45">
                  Guests
                </span>

                <select
                  value={villaCart?.guests || 2}
                  onChange={(e) => handleGuestsChange(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#2A1A12] outline-none"
                >
                  {Array.from({ length: theme.maxGuests || 21 }, (_, index) => index + 1).map(
                    (guestCount) => (
                      <option key={guestCount} value={guestCount}>
                        {guestCount} Guest{guestCount > 1 ? 's' : ''}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="rounded-2xl border border-[#C15A3E]/20 bg-[#C15A3E]/10 p-4">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#C15A3E]">
                  Matched Package
                </span>

                <div className="text-sm font-bold text-[#2A1A12]">{breakdown.packageName}</div>
                <div className="mt-1 text-xs leading-relaxed text-[#2A1A12]/55">
                  {breakdown.packageNote}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#2A1A12]/10 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/45">
                    Estimated Base Stay
                  </div>

                  <div className="mt-1 text-xs text-[#2A1A12]/55">
                    {villaCart?.checkIn && villaCart?.checkOut
                      ? `${formatDisplayDate(villaCart.checkIn)} — ${formatDisplayDate(
                          villaCart.checkOut
                        )}`
                      : 'Choose dates to calculate'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-['Playfair_Display'] text-3xl italic text-[#2A1A12]">
                    {estimatedBaseTotal > 0 ? formatPHP(estimatedBaseTotal) : '—'}
                  </div>

                  <div className="text-[10px] uppercase tracking-wider text-[#2A1A12]/40">
                    {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : 'Pending'}
                  </div>
                </div>
              </div>

              {breakdown.extraGuests > 0 && (
                <div className="mt-3 rounded-xl bg-[#F9F8F6] px-3 py-2 text-xs text-[#2A1A12]/60">
                  Includes extra guest charge: {formatPHP(breakdown.extraRate)} per night.
                </div>
              )}

              {hasConflict && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  These dates overlap with an existing booking. Please select another range.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleProceed}
              disabled={!canProceed}
              className={`mt-4 w-full rounded-2xl py-4 text-[11px] font-bold uppercase tracking-[0.22em] shadow-xl transition-all ${
                canProceed
                  ? 'bg-[#C15A3E] text-white hover:-translate-y-0.5 hover:bg-[#A34930]'
                  : 'cursor-not-allowed bg-[#2A1A12]/10 text-[#2A1A12]/35'
              }`}
            >
              Continue to Add-ons
            </button>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-[#2A1A12]/45">
              Payment is manually verified by the owner after you submit your payment reference.
            </p>
          </div>
        </div>
      </section>

      <section id="availability" className="mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-24">
        <div className="mb-10 text-center">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
            Live Calendar
          </div>

          <h2 className="mb-3 font-['Playfair_Display'] text-4xl italic text-[#2A1A12] md:text-5xl">
            Check available dates.
          </h2>

          <p className="mx-auto max-w-xl text-sm font-light leading-7 text-[#2A1A12]/55">
            Tap a date once for check-in, then tap a later date for checkout.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-[#2A1A12]/10 bg-white shadow-[0_20px_60px_rgba(42,26,18,0.08)]">
          <div className="flex items-center justify-between border-b border-[#2A1A12]/10 bg-[#FAFAFA] p-4 md:p-6">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-xl border border-[#2A1A12]/10 bg-white p-2 text-[#2A1A12]/60 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
              aria-label="Previous month"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h3 className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[#2A1A12] md:text-xl">
              {calMonth.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>

            <button
              type="button"
              onClick={nextMonth}
              className="rounded-xl border border-[#2A1A12]/10 bg-white p-2 text-[#2A1A12]/60 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
              aria-label="Next month"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-[#2A1A12]/10 bg-white">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-[#2A1A12]/35 md:py-4 md:text-[10px]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-[#2A1A12]/10">
            {blanks.map((_, index) => (
              <div key={`blank-${index}`} className="min-h-[58px] bg-white p-1 md:min-h-[96px]" />
            ))}

            {days.map((day) => {
              const booked = isDateBooked(day);
              const past = isPastDate(day);
              const unavailable = booked || past;
              const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`;

              const selectedStart = villaCart.checkIn === dateStr;
              const selectedEnd = villaCart.checkOut === dateStr;
              const currentDate = parseLocalDate(dateStr);
              const checkInDate = parseLocalDate(villaCart.checkIn);
              const checkOutDate = parseLocalDate(villaCart.checkOut);
              const inRange =
                checkInDate &&
                checkOutDate &&
                currentDate > checkInDate &&
                currentDate < checkOutDate;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={unavailable}
                  className={`relative flex min-h-[58px] flex-col items-center justify-center bg-white p-1 text-center transition md:min-h-[96px] md:p-3 ${
                    unavailable
                      ? 'cursor-not-allowed opacity-40'
                      : 'group cursor-pointer hover:bg-[#C15A3E]/5'
                  } ${inRange ? 'bg-[#C15A3E]/5' : ''}`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition md:h-11 md:w-11 md:text-lg ${
                      selectedStart || selectedEnd
                        ? 'bg-[#C15A3E] text-white shadow-md'
                        : inRange
                          ? 'text-[#C15A3E]'
                          : unavailable
                            ? 'text-[#2A1A12]/35'
                            : 'text-[#2A1A12] group-hover:bg-[#C15A3E]/10 group-hover:text-[#C15A3E]'
                    }`}
                  >
                    {day}
                  </span>

                  {booked && (
                    <span className="mt-1 hidden text-[8px] font-bold uppercase tracking-widest text-red-400 md:block">
                      Booked
                    </span>
                  )}

                  {(selectedStart || selectedEnd) && (
                    <span className="mt-1 hidden text-[8px] font-bold uppercase tracking-widest text-[#C15A3E] md:block">
                      {selectedStart ? 'Check-in' : 'Checkout'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-5">
          <div className="flex items-center gap-2 text-xs text-[#2A1A12]/55">
            <div className="h-3 w-3 rounded-full border border-[#2A1A12]/20 bg-white" />
            Available
          </div>

          <div className="flex items-center gap-2 text-xs text-[#2A1A12]/55">
            <div className="h-3 w-3 rounded-full bg-[#2A1A12]/15" />
            Booked or past
          </div>

          <div className="flex items-center gap-2 text-xs text-[#2A1A12]/55">
            <div className="h-3 w-3 rounded-full bg-[#C15A3E]" />
            Selected
          </div>
        </div>
      </section>

      <section id="gallery" className="bg-[#2A1A12] px-5 py-20 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                Gallery
              </div>

              <h2 className="max-w-2xl font-['Playfair_Display'] text-4xl italic leading-tight md:text-5xl">
                A warm, private Tagaytay escape.
              </h2>
            </div>

            <p className="max-w-md text-sm font-light leading-7 text-white/55">
              Give guests a quick visual feel of the stay before they book. Replace these with your best real property photos when ready.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className={`overflow-hidden rounded-3xl border border-white/10 bg-white/5 ${
                  index === 0 ? 'col-span-2 row-span-2 min-h-[320px]' : 'min-h-[150px] md:min-h-[210px]'
                }`}
              >
                <img
                  src={image}
                  alt={`${theme.villaName} gallery ${index + 1}`}
                  className="h-full w-full object-cover opacity-90 transition duration-700 hover:scale-105 hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rates" className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
            The Property
          </div>

          <h2 className="mb-6 max-w-xl font-['Playfair_Display'] text-4xl italic leading-tight text-[#2A1A12] md:text-5xl">
            Designed for quiet gatherings and absolute privacy.
          </h2>

          <p className="mb-8 max-w-2xl text-sm font-light leading-8 text-[#2A1A12]/60 md:text-base">
            {theme.aboutBody}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(theme.amenities || []).map((amenity) => (
              <div
                key={amenity}
                className="flex items-center gap-3 rounded-2xl border border-[#2A1A12]/8 bg-white px-4 py-3 text-sm font-medium text-[#2A1A12]/75 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C15A3E]/10 text-[#C15A3E]">
                  ✦
                </div>
                {amenity}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#2A1A12]/10 bg-white p-6 shadow-[0_20px_60px_rgba(42,26,18,0.08)] md:p-8">
          <div className="mb-6 border-b border-[#2A1A12]/10 pb-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/40">
              Standard Rates
            </div>

            <p className="text-xs leading-6 text-[#2A1A12]/50">
              Rates shown are base prices. Add-ons and the refundable security deposit are calculated during booking.
            </p>
          </div>

          <div className="space-y-5">
            {(theme.rates || []).slice(0, 4).map((rate) => (
              <div
                key={rate.name}
                className="flex items-start justify-between gap-4 border-b border-[#2A1A12]/8 pb-5 last:border-b-0 last:pb-0"
              >
                <div>
                  <div className="font-semibold text-[#2A1A12]">{rate.name}</div>
                  <div className="mt-1 text-xs leading-relaxed text-[#2A1A12]/45">{rate.note}</div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-['Playfair_Display'] text-2xl italic text-[#2A1A12]">
                    {formatPHP(rate.price)}
                  </div>

                  <div className="text-[10px] uppercase tracking-wider text-[#2A1A12]/35">
                    / {rate.per}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#2A1A12] px-5 py-16 text-white md:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 text-center md:grid-cols-4">
          {(theme.specs || []).slice(0, 4).map((spec) => (
            <div key={spec.label}>
              <div className="mb-3 font-['Playfair_Display'] text-4xl italic text-[#C15A3E] md:text-5xl">
                {spec.value}
              </div>

              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                {spec.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="policies" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="mb-10 text-center">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
            Stay Policies
          </div>

          <h2 className="font-['Playfair_Display'] text-4xl italic text-[#2A1A12] md:text-5xl">
            Clear expectations before booking.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-[#2A1A12]/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#C15A3E]/10 text-[#C15A3E]">
              ₱
            </div>

            <h3 className="mb-2 font-['Playfair_Display'] text-2xl italic text-[#2A1A12]">
              Refundable Security Deposit
            </h3>

            <p className="text-sm font-light leading-7 text-[#2A1A12]/55">
              A ₱5,000 security deposit is included in the total and is returned after checkout inspection if there are no damages or unpaid charges.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#2A1A12]/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#C15A3E]/10 text-[#C15A3E]">
              22h
            </div>

            <h3 className="mb-2 font-['Playfair_Display'] text-2xl italic text-[#2A1A12]">
              Standard Stay Window
            </h3>

            <p className="text-sm font-light leading-7 text-[#2A1A12]/55">
              Overnight stays follow the property’s standard accommodation window. Early check-in and late checkout can be added if available.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#2A1A12]/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#C15A3E]/10 text-[#C15A3E]">
              ✓
            </div>

            <h3 className="mb-2 font-['Playfair_Display'] text-2xl italic text-[#2A1A12]">
              Manual Verification
            </h3>

            <p className="text-sm font-light leading-7 text-[#2A1A12]/55">
              Bookings are submitted with payment details and manually verified by the owner before being marked as confirmed.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-[#2A1A12]/10 bg-white px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
              Inquiries
            </div>

            <h2 className="font-['Playfair_Display'] text-4xl italic text-[#2A1A12] md:text-5xl">
              Contact Balai de Correa.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm font-light leading-7 text-[#2A1A12]/55">
              For ocular visits, special requests, or booking questions, reach out through the official contact details below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a
              href={theme.contact?.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl border border-[#2A1A12]/10 bg-[#F9F8F6] p-6 text-center transition hover:-translate-y-1 hover:border-[#C15A3E]/40"
            >
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/40">
                Facebook
              </div>

              <div className="font-medium text-[#2A1A12]">{theme.contact?.facebook}</div>
            </a>

            <a
              href={`mailto:${theme.contact?.email}`}
              className="rounded-3xl border border-[#2A1A12]/10 bg-[#F9F8F6] p-6 text-center transition hover:-translate-y-1 hover:border-[#C15A3E]/40"
            >
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/40">
                Email
              </div>

              <div className="break-words font-medium text-[#2A1A12]">{theme.contact?.email}</div>
            </a>

            <div className="rounded-3xl border border-[#2A1A12]/10 bg-[#F9F8F6] p-6 text-center">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/40">
                Contact No.
              </div>

              <div className="font-medium text-[#2A1A12]">{theme.contact?.phone}</div>
            </div>

            <a
              href={theme.contact?.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl border border-[#2A1A12]/10 bg-[#F9F8F6] p-6 text-center transition hover:-translate-y-1 hover:border-[#C15A3E]/40"
            >
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/40">
                Address
              </div>

              <div className="font-medium leading-relaxed text-[#2A1A12]">{theme.contact?.address}</div>
            </a>
          </div>

          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={() => {
                document.getElementById('booking')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
              className="rounded-full bg-[#2A1A12] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C15A3E] shadow-xl transition hover:-translate-y-0.5 hover:bg-black"
            >
              Start a Reservation
            </button>

            <div className="mt-5 font-['Playfair_Display'] text-sm italic text-[#2A1A12]/45">
              {theme.contact?.ocularNote}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}