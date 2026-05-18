import React, { useEffect, useMemo, useState } from 'react';
import theme from '../theme.config';
import AmenityCard from './AmenityCard';

const SECURITY_DEPOSIT_ID = 'security_dep';

function formatPHP(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH')}`;
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

function calculateNights(checkIn, checkOut) {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);

  if (!start || !end) return 1;

  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return diff > 0 ? diff : 1;
}

function formatDisplayDate(dateString) {
  const date = parseLocalDate(dateString);

  if (!date) return 'TBD';

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRoomTypes() {
  if (Array.isArray(theme.roomTypes) && theme.roomTypes.length > 0) {
    return theme.roomTypes;
  }

  return [
    {
      id: 'family_cabin',
      name: 'Family Cabin',
      shortName: 'Family',
      note: 'Family-friendly room for relaxed group stays.',
      capacity: 'Capacity to confirm',
      price: 0,
      per: 'request',
      highlights: ['Family-friendly setup', 'Comfortable stay', 'Good for groups'],
    },
  ];
}

function getSuggestedRoomType(guestCount) {
  const guests = parseInt(guestCount, 10) || 2;
  const rooms = getRoomTypes();

  if (guests <= 4) {
    return rooms.find((room) => room.id === 'deluxe_cabin') || rooms[0];
  }

  if (guests <= 8) {
    return rooms.find((room) => room.id === 'family_cabin') || rooms[0];
  }

  return rooms.find((room) => room.id === 'bohemian_suite') || rooms[0];
}

function getRoomById(roomTypeId, guestCount) {
  const rooms = getRoomTypes();

  if (roomTypeId) {
    const room = rooms.find((item) => item.id === roomTypeId);

    if (room) return room;
  }

  return getSuggestedRoomType(guestCount);
}

function getSecurityDepositAmenity() {
  return (theme.hourlyAmenities || []).find((item) => item.id === SECURITY_DEPOSIT_ID);
}

function sanitizeAmenitiesCart(items = [], villaCart = {}) {
  const cleaned = [];
  const seenKeys = new Set();
  let depositSeen = false;

  items.forEach((item) => {
    if (!item || !item.amenityId) return;

    if (item.amenityId === SECURITY_DEPOSIT_ID) {
      if (depositSeen) return;

      depositSeen = true;

      cleaned.push({
        ...item,
        qty: 1,
        isMandatory: true,
        timeLabel: 'Entire Stay',
      });

      return;
    }

    const key = `${item.amenityId}-${item.date || 'stay'}-${item.timeVal ?? item.timeLabel ?? 'item'}`;

    if (seenKeys.has(key)) return;

    seenKeys.add(key);
    cleaned.push(item);
  });

  const securityDeposit = getSecurityDepositAmenity();

  if (securityDeposit && !depositSeen && villaCart.checkIn) {
    cleaned.push({
      amenityId: SECURITY_DEPOSIT_ID,
      name: securityDeposit.name || 'Security Deposit',
      date: villaCart.checkIn,
      timeLabel: 'Entire Stay',
      price: Number(securityDeposit.price || 0),
      qty: 1,
      isMandatory: true,
    });
  }

  return cleaned;
}

export default function BookingPage({
  villaCart,
  amenitiesCart = [],
  setAmenitiesCart,
  liveAmenities,
  onCheckout,
  onBack,
}) {
  const [showMobileCart, setShowMobileCart] = useState(false);

  const selectedRoom = getRoomById(villaCart.roomTypeId, villaCart.guests || 2);
  const nights = calculateNights(villaCart.checkIn, villaCart.checkOut);
  const roomRate = Number(selectedRoom?.price || villaCart.roomRate || 0);
  const basePrice = roomRate > 0 ? roomRate * nights : 0;
  const rateIsKnown = basePrice > 0;

  const cleanedAmenitiesCart = useMemo(
    () => sanitizeAmenitiesCart(amenitiesCart, villaCart),
    [amenitiesCart, villaCart]
  );

  useEffect(() => {
    const previous = JSON.stringify(amenitiesCart);
    const next = JSON.stringify(cleanedAmenitiesCart);

    if (previous !== next) {
      setAmenitiesCart(cleanedAmenitiesCart);
    }
  }, [amenitiesCart, cleanedAmenitiesCart, setAmenitiesCart]);

  const amenityTotal = cleanedAmenitiesCart.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);

    return sum + price * qty;
  }, 0);

  const securityDeposit = cleanedAmenitiesCart
    .filter((item) => item.amenityId === SECURITY_DEPOSIT_ID)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  const selectedOptionalAddOns = cleanedAmenitiesCart.filter(
    (item) => item.amenityId !== SECURITY_DEPOSIT_ID
  );

  const masterTotal = basePrice + amenityTotal;
  const displayCheckIn = formatDisplayDate(villaCart.checkIn);
  const displayCheckOut = formatDisplayDate(villaCart.checkOut);

  const CartContent = () => (
    <div>
      <div className="mb-6 border-b border-[#2A1A12]/10 pb-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#C15A3E]">
          Reservation Summary
        </p>

        <h3 className="font-display text-3xl font-semibold italic leading-none text-[#2A1A12]">
          {theme.villaName}
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
              Check In
            </div>

            <div className="mt-1 font-semibold text-[#2A1A12]">{displayCheckIn}</div>
          </div>

          <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
              Check Out
            </div>

            <div className="mt-1 font-semibold text-[#2A1A12]">{displayCheckOut}</div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[#C15A3E]/20 bg-[#C15A3E]/[0.06] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C15A3E]">
                Selected Room
              </div>

              <div className="mt-1 text-sm font-bold text-[#2A1A12]">
                {selectedRoom?.name || 'Room to confirm'}
              </div>

              <div className="mt-1 text-xs text-[#2A1A12]/50">
                {selectedRoom?.capacity || 'Capacity to confirm'} · {villaCart.guests || 2} guest
                {Number(villaCart.guests || 2) > 1 ? 's' : ''}
              </div>
            </div>

            <div className="text-right">
              <div className="font-display text-2xl italic leading-none text-[#2A1A12]">
                {rateIsKnown ? formatPHP(basePrice) : 'To confirm'}
              </div>

              <div className="mt-1 text-[9px] uppercase tracking-[0.15em] text-[#2A1A12]/35">
                {nights} night{nights > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-[#2A1A12]/55">
            Room rate
          </span>

          <span className="font-semibold text-[#2A1A12]">
            {rateIsKnown ? formatPHP(basePrice) : 'To be confirmed'}
          </span>
        </div>

        {selectedOptionalAddOns.length > 0 && (
          <div className="border-t border-[#2A1A12]/10 pt-3">
            <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
              Selected Add-ons
            </div>

            <div className="custom-scrollbar max-h-[28vh] space-y-3 overflow-y-auto pr-1">
              {selectedOptionalAddOns.map((item) => {
                const qty = Number(item.qty || 1);
                const lineTotal = Number(item.price || 0) * qty;

                return (
                  <div
                    key={`${item.amenityId}-${item.date || 'stay'}-${item.timeVal || item.timeLabel || 'item'}`}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#2A1A12]">
                        {item.name} {qty > 1 ? `(x${qty})` : ''}
                      </div>

                      <div className="mt-1 text-xs leading-5 text-[#2A1A12]/45">
                        {item.timeLabel || 'Selected add-on'}
                      </div>
                    </div>

                    <div className="whitespace-nowrap text-sm font-bold text-[#C15A3E]">
                      {formatPHP(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#C15A3E]/20 bg-[#C15A3E]/[0.06] p-4 text-sm">
          <div>
            <div className="font-semibold text-[#2A1A12]">
              Refundable security deposit
            </div>

            <div className="mt-1 text-xs leading-5 text-[#2A1A12]/45">
              Amount can be adjusted once the owner confirms official policy.
            </div>
          </div>

          <span className="whitespace-nowrap font-bold text-[#C15A3E]">
            {securityDeposit > 0 ? formatPHP(securityDeposit) : 'To confirm'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6EFE6] pb-32 pt-[78px] text-[#2A1A12] lg:pb-0 lg:pt-[86px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_18%_18%,rgba(193,90,62,0.12),transparent_34%),linear-gradient(180deg,#FFF9F2,rgba(246,239,230,0))]" />

      <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 gap-7 px-4 py-6 md:px-8 lg:grid-cols-[1fr_410px] lg:py-8">
        <section>
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 hidden items-center gap-3 sm:flex">
                <div className="h-px w-10 bg-[#C15A3E]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#C15A3E]">
                  Step 2 of 3
                </span>
              </div>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mb-4 rounded-full border border-[#2A1A12]/10 bg-[#FFF9F2] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/55 transition hover:border-[#C15A3E]/35 hover:text-[#C15A3E]"
                >
                  ← Back to dates
                </button>
              )}

              <h1 className="font-display max-w-3xl text-[2.65rem] font-semibold italic leading-[0.95] tracking-[-0.035em] text-[#2A1A12] md:text-6xl">
                Personalize your stay request.
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-[#2A1A12]/58 md:text-base md:leading-8">
                You are requesting{' '}
                <strong className="font-semibold text-[#2A1A12]">
                  {selectedRoom?.name || 'a room'}
                </strong>{' '}
                from{' '}
                <strong className="font-semibold text-[#2A1A12]">
                  {displayCheckIn}
                </strong>{' '}
                to{' '}
                <strong className="font-semibold text-[#2A1A12]">
                  {displayCheckOut}
                </strong>
                . Add optional requests below, then continue to payment or reservation details.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5 md:min-w-[260px]">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/35">
                Current Amount
              </div>

              <div className="font-display mt-2 text-4xl italic leading-none text-[#2A1A12]">
                {masterTotal > 0 ? formatPHP(masterTotal) : 'To confirm'}
              </div>

              <div className="mt-2 text-xs leading-5 text-[#2A1A12]/45">
                Room rate can be finalized manually by the owner.
              </div>
            </div>
          </div>

          <div className="mb-6 hidden grid-cols-1 gap-3 md:grid md:grid-cols-3">
            <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/35">
                Stay Window
              </div>

              <div className="mt-2 text-sm font-semibold text-[#2A1A12]">
                {displayCheckIn} → {displayCheckOut}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/35">
                Guests
              </div>

              <div className="mt-2 text-sm font-semibold text-[#2A1A12]">
                {villaCart.guests || 2} guest{Number(villaCart.guests || 2) > 1 ? 's' : ''}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#C15A3E]/20 bg-[#C15A3E]/[0.06] p-5">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C15A3E]">
                Room Type
              </div>

              <div className="mt-2 text-sm font-semibold text-[#2A1A12]">
                {selectedRoom?.name || 'To confirm'}
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 md:hidden">
            <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-3">
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#2A1A12]/35">
                Dates
              </div>

              <div className="mt-1 text-[11px] font-semibold leading-4 text-[#2A1A12]">
                {nights} night{nights > 1 ? 's' : ''}
              </div>
            </div>

            <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-3">
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#2A1A12]/35">
                Guests
              </div>

              <div className="mt-1 text-[11px] font-semibold leading-4 text-[#2A1A12]">
                {villaCart.guests || 2}
              </div>
            </div>

            <div className="col-span-2 rounded-2xl border border-[#C15A3E]/20 bg-[#C15A3E]/[0.06] p-3">
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#C15A3E]">
                Room
              </div>

              <div className="mt-1 truncate text-[11px] font-semibold leading-4 text-[#2A1A12]">
                {selectedRoom?.name || 'Room to confirm'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {(theme.hourlyAmenities || []).map((amenity) => (
              <AmenityCard
                key={amenity.id}
                amenity={amenity}
                villaCart={villaCart}
                amenitiesCart={cleanedAmenitiesCart}
                setAmenitiesCart={setAmenitiesCart}
                liveAmenities={liveAmenities}
              />
            ))}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-[104px] rounded-[32px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-6 shadow-[0_24px_70px_rgba(42,26,18,0.08)]">
            <CartContent />

            <div className="mt-6 border-t border-[#2A1A12]/10 pt-6">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/35">
                    {masterTotal > 0 ? 'Amount to Send' : 'Rate Status'}
                  </div>

                  <div className="mt-1 text-xs leading-5 text-[#2A1A12]/45">
                    Pending owner review
                  </div>
                </div>

                <div className="font-display text-4xl italic leading-none text-[#2A1A12]">
                  {masterTotal > 0 ? formatPHP(masterTotal) : 'To confirm'}
                </div>
              </div>

              <button
                type="button"
                onClick={onCheckout}
                className="w-full rounded-2xl bg-[#2A1A12] px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFF9F2] shadow-[0_16px_35px_rgba(42,26,18,0.22)] transition hover:-translate-y-0.5 hover:bg-[#C15A3E]"
              >
                Continue Request
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showMobileCart && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Close reservation summary"
            className="absolute inset-0 bg-[#2A1A12]/70 backdrop-blur-sm"
            onClick={() => setShowMobileCart(false)}
          />

          <div className="animate-slide-up relative z-50 max-h-[82vh] w-full overflow-hidden rounded-t-[32px] bg-[#FFF9F2] p-5 pb-32 shadow-[0_-24px_70px_rgba(42,26,18,0.24)]">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#2A1A12]/15" />

            <div className="custom-scrollbar max-h-[64vh] overflow-y-auto pr-1">
              <CartContent />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2A1A12]/10 bg-[#FFF9F2]/95 p-4 shadow-[0_-18px_45px_rgba(42,26,18,0.14)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="group min-w-0 text-left"
          >
            <div className="flex items-center gap-1.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#2A1A12]/38 transition-colors group-hover:text-[#C15A3E]">
                {masterTotal > 0 ? 'Amount to Send' : 'Rate Status'}
              </div>

              <svg
                className={`h-3 w-3 text-[#2A1A12]/35 transition-transform ${
                  showMobileCart ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>

            <div className="truncate font-display text-3xl italic leading-none text-[#2A1A12]">
              {masterTotal > 0 ? formatPHP(masterTotal) : 'To confirm'}
            </div>
          </button>

          <button
            type="button"
            onClick={onCheckout}
            className="shrink-0 rounded-2xl bg-[#2A1A12] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FFF9F2] shadow-[0_14px_30px_rgba(42,26,18,0.22)] transition hover:bg-[#C15A3E]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}