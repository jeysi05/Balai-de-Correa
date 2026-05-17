import React, { useEffect, useMemo, useState } from 'react';
import theme from '../theme.config';
import AmenityCard from './AmenityCard';

const SECURITY_DEPOSIT_ID = 'security_dep';

function formatPHP(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH')}`;
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return diff > 0 ? diff : 1;
}

function formatDisplayDate(dateString) {
  if (!dateString) return 'TBD';

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRateBreakdown(guestCount) {
  const guests = parseInt(guestCount, 10) || 2;

  if (guests <= 3) {
    return {
      packageName: 'Tres Package',
      packagePrice: 9000,
      extraGuests: 0,
      extraRate: 0,
    };
  }

  if (guests <= 6) {
    return {
      packageName: 'Seis Package',
      packagePrice: 13500,
      extraGuests: 0,
      extraRate: 0,
    };
  }

  const extraGuests = Math.max(0, guests - 12);

  return {
    packageName: 'Doce Package',
    packagePrice: 20500,
    extraGuests,
    extraRate: extraGuests * 1500,
  };
}

function sanitizeAmenitiesCart(items = []) {
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

    const isTowel = item.amenityId === 'towel_rental';
    const key = isTowel
      ? item.amenityId
      : `${item.amenityId}-${item.date || ''}-${item.timeVal ?? item.timeLabel ?? ''}`;

    if (seenKeys.has(key)) return;

    seenKeys.add(key);
    cleaned.push(item);
  });

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

  const cleanedAmenitiesCart = useMemo(
    () => sanitizeAmenitiesCart(amenitiesCart),
    [amenitiesCart]
  );

  useEffect(() => {
    if (cleanedAmenitiesCart.length !== amenitiesCart.length) {
      setAmenitiesCart(cleanedAmenitiesCart);
    }
  }, [amenitiesCart, cleanedAmenitiesCart, setAmenitiesCart]);

  const nights = calculateNights(villaCart.checkIn, villaCart.checkOut);
  const breakdown = getRateBreakdown(villaCart.guests);

  const basePrice = (breakdown.packagePrice + breakdown.extraRate) * nights;

  const amenityTotal = cleanedAmenitiesCart.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);
    return sum + price * qty;
  }, 0);

  const masterTotal = basePrice + amenityTotal;

  const displayCheckIn = formatDisplayDate(villaCart.checkIn);
  const displayCheckOut = formatDisplayDate(villaCart.checkOut);

  const CartContent = () => (
    <>
      <h3 className="mb-8 border-b-2 border-dashed border-gray-200 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C15A3E]">
        Reservation Summary
      </h3>

      <div className="mb-8">
        <h4 className="mb-2 font-['Playfair_Display'] text-2xl italic text-gray-900">
          {theme.villaName}
        </h4>

        <div className="mb-1 text-sm text-gray-500">
          {displayCheckIn} — {displayCheckOut}
        </div>

        <div className="mb-4 text-sm text-gray-500">
          {villaCart.guests || 2} Guests
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
            <span className="font-medium text-gray-700">
              {breakdown.packageName}{' '}
              <span className="text-xs font-normal opacity-60">
                ({nights} night{nights > 1 ? 's' : ''})
              </span>
            </span>

            <span>{formatPHP(breakdown.packagePrice * nights)}</span>
          </div>

          {breakdown.extraGuests > 0 && (
            <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-sm font-semibold text-[#C15A3E]">
              <span className="font-medium">
                Extra Heads x{breakdown.extraGuests}
              </span>

              <span>{formatPHP(breakdown.extraRate * nights)}</span>
            </div>
          )}
        </div>
      </div>

      {cleanedAmenitiesCart.length > 0 && (
        <div className="border-t-2 border-dashed border-gray-200 pt-6">
          <h4 className="mb-4 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">
            Add-ons & Required Deposit
          </h4>

          <div className="custom-scrollbar max-h-[30vh] space-y-4 overflow-y-auto pr-2">
            {cleanedAmenitiesCart.map((item) => {
              const isDeposit = item.amenityId === SECURITY_DEPOSIT_ID;
              const qty = Number(item.qty || 1);
              const lineTotal = Number(item.price || 0) * qty;

              return (
                <div
                  key={`${item.amenityId}-${item.date || 'stay'}-${item.timeVal || item.timeLabel || 'item'}`}
                  className="group flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {item.name} {!isDeposit && qty > 1 ? `(x${qty})` : ''}
                    </div>

                    <div className="mt-0.5 text-xs text-gray-400">
                      {isDeposit
                        ? 'Refundable after checkout inspection'
                        : `${item.date || 'Selected date'} @ ${item.timeLabel || 'Selected time'}`}
                    </div>
                  </div>

                  <div className="whitespace-nowrap text-sm font-semibold text-[#C15A3E]">
                    {formatPHP(lineTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#F9F8F6] pt-[88px] pb-32 lg:flex-row lg:pb-0">
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-full bg-gradient-to-b from-[#2A1A12]/5 to-transparent" />

      <div className="relative z-10 w-full p-6 md:p-12 lg:w-2/3 lg:pr-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px w-8 bg-[#C15A3E]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C15A3E]">
              Step 2 of 3
            </span>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#2A1A12]/50 transition-colors hover:text-[#C15A3E]"
            >
              ← Back to dates
            </button>
          )}

          <h2 className="mb-4 font-['Playfair_Display'] text-4xl italic leading-tight text-[#2A1A12] md:text-5xl">
            Curate your experience.
          </h2>

          <p className="mb-10 text-sm font-light leading-relaxed text-gray-600 md:text-base">
            Your private stay is reserved from{' '}
            <strong className="font-semibold text-[#2A1A12]">
              {displayCheckIn}
            </strong>{' '}
            to{' '}
            <strong className="font-semibold text-[#2A1A12]">
              {displayCheckOut}
            </strong>
            . Add extra services below, then continue to payment instructions.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
        </div>
      </div>

      <div className="relative hidden w-full border-l border-gray-100 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.02)] lg:block lg:w-1/3">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-[#C15A3E]" />

        <div className="sticky top-[88px] z-10 flex h-[calc(100vh-88px)] flex-col p-8 md:p-12">
          <div className="flex-grow">
            <CartContent />
          </div>

          <div className="mt-auto border-t-2 border-dashed border-gray-200 bg-white pt-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Total to Send
              </span>

              <span className="font-['Playfair_Display'] text-4xl italic text-[#2A1A12]">
                {formatPHP(masterTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              className="w-full rounded-xl bg-[#2A1A12] py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[#C15A3E] shadow-[0_10px_20px_-10px_rgba(42,26,18,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a100b]"
            >
              Continue to Payment Instructions
            </button>
          </div>
        </div>
      </div>

      {showMobileCart && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Close reservation summary"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileCart(false)}
          />

          <div className="animate-slide-up relative z-50 w-full rounded-t-3xl bg-white p-6 pb-32">
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200" />

            <div className="max-h-[60vh] overflow-y-auto">
              <CartContent />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-gray-200 bg-white p-4 px-5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] lg:hidden">
        <button
          type="button"
          onClick={() => setShowMobileCart(!showMobileCart)}
          className="group flex min-w-0 flex-col text-left"
        >
          <div className="flex items-center gap-1.5">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition-colors group-hover:text-[#C15A3E]">
              Total to Send
            </div>

            <svg
              className={`h-3 w-3 text-gray-400 transition-transform ${showMobileCart ? 'rotate-180' : ''}`}
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

          <div className="truncate font-['Playfair_Display'] text-2xl italic leading-none text-[#2A1A12]">
            {formatPHP(masterTotal)}
          </div>
        </button>

        <button
          type="button"
          onClick={onCheckout}
          className="shrink-0 rounded-xl bg-[#2A1A12] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#C15A3E] shadow-md transition-colors hover:bg-[#0D1A12]"
        >
          Payment Instructions
        </button>
      </div>
    </div>
  );
}