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

  if (Number.isNaN(fallback.getTime())) return null;

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
      packageNote: '1–3 guests',
      extraGuests: 0,
      extraRate: 0,
    };
  }

  if (guests <= 6) {
    return {
      packageName: 'Seis Package',
      packagePrice: 13500,
      packageNote: '4–6 guests',
      extraGuests: 0,
      extraRate: 0,
    };
  }

  const extraGuests = Math.max(0, guests - 12);

  return {
    packageName: 'Doce Package',
    packagePrice: 20500,
    packageNote: extraGuests > 0 ? `7–12 guests + ${extraGuests} extra` : '7–12 guests',
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

  const realGalleryImages = useMemo(() => {
    const images = [
      ...(theme.galleryImages || []),
      ...(theme.heroImages || []),
    ].filter(Boolean);

    const uniqueImages = [...new Set(images)];

    return uniqueImages.length > 0 ? uniqueImages : [FALLBACK_HERO];
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

      document.getElementById('booking-panel')?.scrollIntoView({
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

      document.getElementById('booking-panel')?.scrollIntoView({
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
    <main className="min-h-screen bg-[#F6EFE6] text-[#2A1A12] selection:bg-[#C15A3E] selection:text-white">
      <section id="booking" className="bg-[#F6EFE6] pt-[86px] md:pt-[98px]">
        <div className="mx-auto max-w-[1440px] px-4 pb-12 md:px-8 lg:pb-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
            <div className="order-2 lg:order-1">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#C15A3E]/25 bg-[#FFF9F2] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C15A3E]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                  {theme.location}
                </span>
              </div>

              <h1 className="font-display max-w-3xl text-[3.35rem] font-semibold italic leading-[0.92] tracking-[-0.04em] text-[#2A1A12] sm:text-[4.5rem] lg:text-[5.9rem] xl:text-[6.4rem]">
                Private villa stays, made simple.
              </h1>

              <p className="mt-6 max-w-xl text-[15px] font-light leading-8 text-[#2A1A12]/65 md:text-base">
                {theme.heroDescription}
              </p>

              <div className="mt-8 grid max-w-xl grid-cols-3 border-y border-[#2A1A12]/10 py-5">
                {(theme.specs || []).slice(0, 3).map((spec) => (
                  <div key={spec.label}>
                    <div className="font-display text-4xl italic leading-none text-[#C15A3E]">
                      {spec.value}
                    </div>

                    <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#2A1A12]/38">
                      {spec.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-4">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/38">
                    Booking
                  </div>

                  <div className="mt-2 text-sm font-semibold">Direct request</div>
                </div>

                <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-4">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/38">
                    Payment
                  </div>

                  <div className="mt-2 text-sm font-semibold">Manual verify</div>
                </div>

                <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-4">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/38">
                    Stay
                  </div>

                  <div className="mt-2 text-sm font-semibold">Private villa</div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative overflow-hidden rounded-[28px] bg-[#2A1A12] shadow-[0_24px_70px_rgba(42,26,18,0.18)] md:rounded-[34px]">
                <img
                  src={heroImg}
                  alt={theme.villaName}
                  className="h-[330px] w-full object-cover sm:h-[460px] lg:h-[590px] xl:h-[640px]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1A12]/76 via-[#2A1A12]/8 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                  <div className="max-w-md rounded-2xl border border-white/12 bg-black/30 p-4 text-white backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F0B49F]">
                      {theme.locationNote || 'Private Retreat'}
                    </p>

                    <h2 className="font-display mt-2 text-3xl italic leading-none">
                      {theme.villaName}
                    </h2>

                    <p className="mt-3 text-xs leading-6 text-white/70">
                      Warm, intimate, and designed for private gatherings in Tagaytay.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            id="booking-panel"
            className="mt-8 rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-4 shadow-[0_24px_70px_rgba(42,26,18,0.1)] md:p-6 lg:mt-10"
          >
            <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#2A1A12]/10 pb-5 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#C15A3E]">
                  Reservation
                </p>

                <h2 className="font-display text-3xl font-semibold italic leading-none text-[#2A1A12] md:text-4xl">
                  Check dates and guests.
                </h2>
              </div>

              <p className="max-w-md text-xs leading-6 text-[#2A1A12]/50">
                Choose your stay details first. Add-ons and the refundable security deposit are shown before payment.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="rounded-2xl border border-[#2A1A12]/10 bg-white px-4 py-4 transition focus-within:border-[#C15A3E]">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/40">
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

              <label className="rounded-2xl border border-[#2A1A12]/10 bg-white px-4 py-4 transition focus-within:border-[#C15A3E]">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/40">
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

              <label className="rounded-2xl border border-[#2A1A12]/10 bg-white px-4 py-4 transition focus-within:border-[#C15A3E]">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/40">
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

              <div className="rounded-2xl border border-[#C15A3E]/25 bg-[rgba(193,90,62,0.08)] px-4 py-4">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#C15A3E]">
                  Matched Rate
                </span>

                <div className="text-sm font-bold text-[#2A1A12]">{breakdown.packageName}</div>

                <div className="mt-1 text-xs leading-relaxed text-[#2A1A12]/52">
                  {breakdown.packageNote}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-[#2A1A12]/10 bg-white p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/38">
                      Estimated Base Stay
                    </div>

                    <div className="mt-1 text-xs text-[#2A1A12]/50">
                      {villaCart?.checkIn && villaCart?.checkOut
                        ? `${formatDisplayDate(villaCart.checkIn)} — ${formatDisplayDate(
                            villaCart.checkOut
                          )}`
                        : 'Select dates to calculate'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-3xl italic leading-none text-[#2A1A12]">
                      {estimatedBaseTotal > 0 ? formatPHP(estimatedBaseTotal) : '—'}
                    </div>

                    <div className="mt-1 text-[9px] uppercase tracking-[0.15em] text-[#2A1A12]/35">
                      {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : 'Pending'}
                    </div>
                  </div>
                </div>

                {breakdown.extraGuests > 0 && (
                  <div className="mt-3 rounded-xl bg-[#F6EFE6] px-3 py-2 text-xs text-[#2A1A12]/60">
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
                className={`rounded-2xl px-8 py-5 text-[11px] font-bold uppercase tracking-[0.22em] transition-all lg:min-w-[260px] ${
                  canProceed
                    ? 'bg-[#2A1A12] text-[#FFF9F2] hover:bg-[#C15A3E]'
                    : 'cursor-not-allowed bg-[#2A1A12]/10 text-[#2A1A12]/35'
                }`}
              >
                Continue to Add-ons
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-[#2A1A12]/45">
              No instant online charge. Payment is submitted for owner verification.
            </p>
          </div>
        </div>
      </section>

      <section id="availability" className="bg-[#F6EFE6] px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-[0.75fr_1fr] md:items-end">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
                Availability
              </p>

              <h2 className="font-display text-5xl font-semibold italic leading-[0.95] tracking-[-0.035em] md:text-6xl">
                Choose your stay dates.
              </h2>
            </div>

            <p className="max-w-xl text-sm font-light leading-7 text-[#2A1A12]/58 md:ml-auto">
              Tap once for check-in, then tap a later date for checkout. Booked and past dates are softened to keep the calendar easy to scan.
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] shadow-[0_24px_70px_rgba(42,26,18,0.08)]">
            <div className="flex items-center justify-between border-b border-[#2A1A12]/10 p-4 md:p-6">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-xl border border-[#2A1A12]/12 bg-white p-2 text-[#2A1A12]/60 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
                aria-label="Previous month"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h3 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-[#2A1A12] md:text-xl">
                {calMonth.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>

              <button
                type="button"
                onClick={nextMonth}
                className="rounded-xl border border-[#2A1A12]/12 bg-white p-2 text-[#2A1A12]/60 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
                aria-label="Next month"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-[#2A1A12]/10 bg-[#FFF9F2]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[#2A1A12]/35 md:py-4 md:text-[10px]"
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
                        ? 'cursor-not-allowed opacity-35'
                        : 'group cursor-pointer hover:bg-[rgba(193,90,62,0.07)]'
                    } ${inRange ? 'bg-[rgba(193,90,62,0.07)]' : ''}`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition md:h-11 md:w-11 md:text-lg ${
                        selectedStart || selectedEnd
                          ? 'bg-[#C15A3E] text-white'
                          : inRange
                            ? 'text-[#C15A3E]'
                            : unavailable
                              ? 'text-[#2A1A12]/35'
                              : 'text-[#2A1A12] group-hover:text-[#C15A3E]'
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
        </div>
      </section>

      <section id="photos" className="bg-[#2A1A12] px-4 py-20 text-[#FFF9F2] md:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
              The Villa
            </p>

            <h2 className="font-display max-w-lg text-5xl font-semibold italic leading-[0.94] tracking-[-0.035em] md:text-6xl">
              A private home, not another hotel stay.
            </h2>

            <p className="mt-7 max-w-md text-sm font-light leading-8 text-white/58">
              This section should use real villa photos only. Real exterior, pool, dining, bedrooms, and evening lighting will make the site feel far more premium than stock interiors.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="md:col-span-3">
              <img
                src={realGalleryImages[0]}
                alt={`${theme.villaName} exterior`}
                className="h-[360px] w-full rounded-[28px] object-cover md:h-[620px]"
              />
            </div>

            <div className="grid gap-4 md:col-span-2">
              {realGalleryImages.slice(1, 3).map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`${theme.villaName} view ${index + 2}`}
                  className="h-[220px] w-full rounded-[28px] object-cover md:h-[302px]"
                />
              ))}

              {realGalleryImages.length === 1 && (
                <div className="flex min-h-[260px] flex-col justify-end rounded-[28px] border border-white/12 bg-white/5 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#C15A3E]">
                    Photo Direction
                  </p>

                  <p className="font-display mt-4 text-3xl italic leading-tight">
                    Add real pool, room, dining, and night-light photos here.
                  </p>

                  <p className="mt-5 text-sm font-light leading-7 text-white/50">
                    This is one of the fastest ways to make the prototype feel client-ready.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="rates" className="bg-[#FFF9F2] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
              The Property
            </p>

            <h2 className="font-display max-w-xl text-5xl font-semibold italic leading-[0.94] tracking-[-0.035em] md:text-6xl">
              Designed for quiet gatherings and absolute privacy.
            </h2>

            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-[#2A1A12]/58 md:text-base">
              {theme.aboutBody}
            </p>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(theme.amenities || []).map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-4 rounded-2xl border border-[#2A1A12]/10 bg-[#F6EFE6] px-4 py-4 text-sm text-[#2A1A12]/70"
                >
                  <span className="text-[#C15A3E]">✦</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#F6EFE6] p-6 md:p-8">
            <div className="mb-8 border-b border-[#2A1A12]/10 pb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-[#2A1A12]/38">
                Standard Rates
              </p>

              <p className="text-xs leading-6 text-[#2A1A12]/52">
                Base rates only. Add-ons and the refundable security deposit are calculated during booking.
              </p>
            </div>

            <div>
              {(theme.rates || []).slice(0, 4).map((rate) => (
                <div
                  key={rate.name}
                  className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#2A1A12]/10 py-5 last:border-b-0"
                >
                  <div>
                    <div className="font-semibold text-[#2A1A12]">{rate.name}</div>
                    <div className="mt-1 text-xs leading-relaxed text-[#2A1A12]/45">
                      {rate.note}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-3xl italic leading-none text-[#2A1A12]">
                      {formatPHP(rate.price)}
                    </div>

                    <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#2A1A12]/35">
                      / {rate.per}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                document.getElementById('booking-panel')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }}
              className="mt-8 w-full rounded-2xl bg-[#2A1A12] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFF9F2] transition hover:bg-[#C15A3E]"
            >
              Check Availability
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#2A1A12] px-4 py-16 text-[#FFF9F2] md:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 text-center md:grid-cols-4">
          {(theme.specs || []).slice(0, 4).map((spec) => (
            <div key={spec.label}>
              <div className="font-display mb-3 text-5xl italic leading-none text-[#C15A3E]">
                {spec.value}
              </div>

              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                {spec.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="policies" className="bg-[#F6EFE6] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
              Before You Book
            </p>

            <h2 className="font-display text-5xl font-semibold italic leading-[0.94] tracking-[-0.035em] md:text-6xl">
              Clear details, no surprises.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-6">
              <div className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                Deposit
              </div>

              <h3 className="font-display mb-4 text-3xl italic">
                ₱5,000 refundable security deposit.
              </h3>

              <p className="text-sm font-light leading-7 text-[#2A1A12]/58">
                Included in the total and returned after checkout inspection if there are no damages or unpaid charges.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-6">
              <div className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                Stay Window
              </div>

              <h3 className="font-display mb-4 text-3xl italic">
                Standard 22-hour accommodation.
              </h3>

              <p className="text-sm font-light leading-7 text-[#2A1A12]/58">
                Early check-in and late checkout can be added during booking, subject to availability.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-6">
              <div className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                Verification
              </div>

              <h3 className="font-display mb-4 text-3xl italic">
                Payment is manually verified.
              </h3>

              <p className="text-sm font-light leading-7 text-[#2A1A12]/58">
                Guests submit their payment reference, then the owner confirms once payment is checked.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#FFF9F2] px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
              Inquiries
            </p>

            <h2 className="font-display text-5xl font-semibold italic leading-none tracking-[-0.035em] md:text-6xl">
              Contact Balai de Correa.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm font-light leading-7 text-[#2A1A12]/58">
              For ocular visits, special requests, or booking questions, reach out through the official details below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <a
              href={theme.contact?.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[24px] border border-[#2A1A12]/10 bg-[#F6EFE6] p-6 text-center transition hover:-translate-y-1 hover:border-[#C15A3E]/40"
            >
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/38">
                Facebook
              </div>

              <div className="font-medium text-[#2A1A12]">{theme.contact?.facebook}</div>
            </a>

            <a
              href={`mailto:${theme.contact?.email}`}
              className="rounded-[24px] border border-[#2A1A12]/10 bg-[#F6EFE6] p-6 text-center transition hover:-translate-y-1 hover:border-[#C15A3E]/40"
            >
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/38">
                Email
              </div>

              <div className="break-words font-medium text-[#2A1A12]">
                {theme.contact?.email}
              </div>
            </a>

            <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#F6EFE6] p-6 text-center">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/38">
                Contact No.
              </div>

              <div className="font-medium text-[#2A1A12]">{theme.contact?.phone}</div>
            </div>

            <a
              href={theme.contact?.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[24px] border border-[#2A1A12]/10 bg-[#F6EFE6] p-6 text-center transition hover:-translate-y-1 hover:border-[#C15A3E]/40"
            >
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2A1A12]/38">
                Address
              </div>

              <div className="font-medium leading-relaxed text-[#2A1A12]">
                {theme.contact?.address}
              </div>
            </a>
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => {
                document.getElementById('booking-panel')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }}
              className="rounded-2xl bg-[#2A1A12] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFF9F2] transition hover:bg-[#C15A3E]"
            >
              Start a Reservation
            </button>

            <div className="font-display mt-5 text-lg italic text-[#2A1A12]/45">
              {theme.contact?.ocularNote}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}