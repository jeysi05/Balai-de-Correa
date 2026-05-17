import React, { useEffect, useMemo, useState } from 'react';

const STANDARD_CHECK_IN = 14;
const STANDARD_CHECK_OUT = 11;
const SECURITY_DEPOSIT_ID = 'security_dep';

function formatPHP(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH')}`;
}

function formatTime(time) {
  const hour = Math.floor(time);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return {
    label: `${displayHour}:00 ${ampm}`,
    val: time,
  };
}

export default function AmenityCard({
  amenity,
  villaCart,
  amenitiesCart = [],
  setAmenitiesCart,
  liveAmenities,
}) {
  const isTowel = amenity.id === 'towel_rental';
  const isDeposit = amenity.id === SECURITY_DEPOSIT_ID;
  const isEarlyCheckIn = amenity.id === 'early_checkin';
  const isLateCheckout = amenity.id === 'late_checkout';
  const isLockedDate = isEarlyCheckIn || isLateCheckout;

  const lockedDate = isLateCheckout ? villaCart.checkOut : villaCart.checkIn;

  const [selectedDate, setSelectedDate] = useState(lockedDate || villaCart.checkIn || '');
  const [qty, setQty] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (isLockedDate) {
      setSelectedDate(lockedDate || '');
    } else if (!selectedDate && villaCart.checkIn) {
      setSelectedDate(villaCart.checkIn);
    }
  }, [isLockedDate, lockedDate, selectedDate, villaCart.checkIn]);

  useEffect(() => {
    setImageFailed(false);
  }, [amenity.image]);

  useEffect(() => {
    if (!isDeposit || !villaCart.checkIn) return;

    setAmenitiesCart((prev = []) => {
      const existingDeposit = prev.find((item) => item.amenityId === SECURITY_DEPOSIT_ID);
      const nonDepositItems = prev.filter((item) => item.amenityId !== SECURITY_DEPOSIT_ID);

      const normalizedDeposit = {
        amenityId: SECURITY_DEPOSIT_ID,
        name: amenity.name || 'Refundable Security Deposit',
        date: villaCart.checkIn,
        timeLabel: 'Entire Stay',
        price: Number(amenity.price || 5000),
        qty: 1,
        isMandatory: true,
      };

      if (
        existingDeposit &&
        prev.filter((item) => item.amenityId === SECURITY_DEPOSIT_ID).length === 1 &&
        existingDeposit.price === normalizedDeposit.price &&
        existingDeposit.date === normalizedDeposit.date &&
        existingDeposit.qty === 1
      ) {
        return prev;
      }

      return [...nonDepositItems, normalizedDeposit];
    });
  }, [
    amenity.name,
    amenity.price,
    isDeposit,
    setAmenitiesCart,
    villaCart.checkIn,
  ]);

  const timeSlots = useMemo(() => {
    const slots = [];

    if (isEarlyCheckIn) {
      for (let i = 6; i < STANDARD_CHECK_IN; i += 1) {
        slots.push(i);
      }

      return slots;
    }

    if (isLateCheckout) {
      for (let i = STANDARD_CHECK_OUT + 1; i <= 22; i += 1) {
        slots.push(i);
      }

      return slots;
    }

    for (let i = 8; i <= 21; i += 1) {
      slots.push(i);
    }

    return slots;
  }, [isEarlyCheckIn, isLateCheckout]);

  const existingTowel = amenitiesCart.find((item) => item.amenityId === amenity.id);
  const currentDateForSelection = isLockedDate ? lockedDate : selectedDate;

  const toggleSlot = (timeVal, timeLabel, customQty = 1) => {
    if (isDeposit) return;

    if (!currentDateForSelection) {
      alert('Please select a date first.');
      return;
    }

    const existingItem = amenitiesCart.find((item) => {
      if (isTowel) return item.amenityId === amenity.id;

      return item.amenityId === amenity.id && item.timeVal === timeVal;
    });

    if (existingItem) {
      if (isTowel) {
        setAmenitiesCart((prev = []) =>
          prev.map((item) =>
            item.amenityId === amenity.id
              ? {
                  ...item,
                  qty: customQty,
                  price: Number(amenity.price || 0),
                  date: currentDateForSelection,
                  timeLabel: 'Rental',
                }
              : item
          )
        );

        return;
      }

      setAmenitiesCart((prev = []) => prev.filter((item) => item !== existingItem));
      return;
    }

    setAmenitiesCart((prev = []) => {
      const filtered =
        isEarlyCheckIn || isLateCheckout || isTowel
          ? prev.filter((item) => item.amenityId !== amenity.id)
          : prev;

      return [
        ...filtered,
        {
          amenityId: amenity.id,
          name: amenity.name,
          date: currentDateForSelection,
          timeVal,
          timeLabel,
          price: Number(amenity.price || 0),
          qty: customQty,
        },
      ];
    });
  };

  const renderHeaderVisual = () => {
    if (isDeposit || !amenity.image || imageFailed) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2A1A12] via-[#3a2418] to-[#C15A3E]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl text-white shadow-2xl backdrop-blur-sm">
            {isDeposit ? '₱' : '✦'}
          </div>
        </div>
      );
    }

    return (
      <img
        src={amenity.image}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        alt={amenity.name}
        onError={() => setImageFailed(true)}
      />
    );
  };

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
        isDeposit
          ? 'border-[#C15A3E]/40 bg-[#C15A3E]/[0.02]'
          : 'border-gray-100 hover:-translate-y-1 hover:shadow-xl'
      }`}
    >
      <div className="relative h-40 overflow-hidden">
        {renderHeaderVisual()}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {isDeposit && (
          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            Required
          </div>
        )}

        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
          <h3 className="font-['Playfair_Display'] text-xl italic leading-tight text-white">
            {amenity.name}
          </h3>

          <span className="shrink-0 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#C15A3E]">
            {formatPHP(amenity.price)}
            {!isDeposit && `/${amenity.unit || 'hr'}`}
          </span>
        </div>
      </div>

      <div className="flex flex-grow flex-col gap-5 p-5">
        {isDeposit && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#C15A3E]/20 bg-[#C15A3E]/10 px-4 py-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#C15A3E]">
                Mandatory Refundable Deposit
              </span>

              <span className="mt-1 block text-xs leading-relaxed text-[#2A1A12]/60">
                Automatically included once only. Refunded after checkout inspection if there are no damages or unpaid charges.
              </span>
            </div>

            <div className="rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-[#2A1A12]">
              Status: Added to reservation
            </div>
          </div>
        )}

        {isTowel && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-gray-400">
                How many pieces?
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-1.5">
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg font-semibold text-gray-600 shadow-sm transition-colors hover:border-[#C15A3E] hover:text-[#C15A3E]"
                >
                  -
                </button>

                <span className="flex-1 text-center font-bold text-[#2A1A12]">
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() => setQty((current) => current + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg font-semibold text-gray-600 shadow-sm transition-colors hover:border-[#C15A3E] hover:text-[#C15A3E]"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleSlot(0, 'Rental', qty)}
              className={`w-full rounded-xl py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                existingTowel
                  ? 'bg-[#C15A3E] text-white shadow-lg shadow-[#C15A3E]/20'
                  : 'bg-[#2A1A12] text-[#C15A3E] hover:bg-[#1a100b]'
              }`}
            >
              {existingTowel ? `Update Towels to ${qty}` : 'Add to Reservation'}
            </button>
          </div>
        )}

        {!isDeposit && !isTowel && (
          <>
            <div>
              <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {isLockedDate
                  ? isLateCheckout
                    ? 'Locked to checkout day'
                    : 'Locked to check-in day'
                  : 'Select Day'}
              </label>

              <input
                type="date"
                value={currentDateForSelection || ''}
                disabled={isLockedDate}
                min={villaCart.checkIn || undefined}
                max={villaCart.checkOut || undefined}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition-colors ${
                  isLockedDate
                    ? 'border-gray-100 bg-gray-100 text-gray-400'
                    : 'border-gray-100 bg-gray-50 text-gray-700 focus:border-[#C15A3E]'
                }`}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Select time
                </span>

                <span className="text-[9px] font-semibold text-gray-400">
                  Tap again to remove
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const { label, val } = formatTime(time);

                  const isInCart = amenitiesCart.some(
                    (item) => item.amenityId === amenity.id && item.timeVal === val
                  );

                  return (
                    <button
                      type="button"
                      key={val}
                      onClick={() => toggleSlot(val, label)}
                      className={`relative rounded-lg border py-2.5 text-[10px] font-bold transition-all ${
                        isInCart
                          ? 'border-[#C15A3E] bg-[#C15A3E] text-white shadow-md shadow-[#C15A3E]/25 ring-2 ring-[#C15A3E]/20'
                          : 'border-gray-100 bg-white text-gray-500 hover:border-[#C15A3E] hover:text-[#C15A3E]'
                      }`}
                    >
                      {isInCart && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2A1A12] text-[9px] text-white">
                          ✓
                        </span>
                      )}

                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}