import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { commitMasterBooking } from '../firebase';
import theme from '../theme.config';
import BookingSuccessModal from './BookingSuccessModal';

const CHANNELS = ['GCash', 'PayMaya'];
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

function formatDisplayDate(dateString) {
  const date = parseLocalDate(dateString);

  if (!date) return 'TBD';

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateNights(checkIn, checkOut) {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);

  if (!start || !end) return 1;

  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return diff > 0 ? diff : 1;
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

function getPaymentDetails(channel) {
  if (channel === 'PayMaya') {
    return {
      qrImage: theme.mayaQR,
      label: 'PayMaya Account',
      name: theme.mayaName || theme.gcashName || theme.villaName,
      display: theme.mayaDisplay || theme.gcashDisplay || 'Copy account details',
      copyValue: theme.mayaNumber || theme.gcashNumber || '',
      instruction:
        'Send the amount shown, then enter the last 6 digits of your PayMaya transaction reference below.',
    };
  }

  return {
    qrImage: theme.gcashQR,
    label: 'GCash Account',
    name: theme.gcashName || theme.villaName,
    display: theme.gcashDisplay || theme.gcashNumber || 'Copy GCash number',
    copyValue: theme.gcashNumber || '',
    instruction:
      'Send the amount shown through GCash, then enter the last 6 digits of your GCash reference number below.',
  };
}

export default function PaymentModal({
  villaCart,
  amenitiesCart = [],
  onClose,
  onSuccess,
}) {
  const [channel, setChannel] = useState('GCash');
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    contact: '',
    refNo: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [backgroundSaveStatus, setBackgroundSaveStatus] = useState('idle');

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const selectedRoom = getRoomById(villaCart.roomTypeId, villaCart.guests || 2);
  const nights = calculateNights(villaCart.checkIn, villaCart.checkOut);
  const roomRate = Number(selectedRoom?.price || villaCart.roomRate || 0);
  const basePrice = roomRate > 0 ? roomRate * nights : 0;
  const rateIsKnown = basePrice > 0;

  const cleanedAmenitiesCart = useMemo(
    () => sanitizeAmenitiesCart(amenitiesCart, villaCart),
    [amenitiesCart, villaCart]
  );

  const amenityTotal = cleanedAmenitiesCart.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);

    return sum + price * qty;
  }, 0);

  const securityDeposit = cleanedAmenitiesCart
    .filter((item) => item.amenityId === SECURITY_DEPOSIT_ID)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  const optionalAddOns = cleanedAmenitiesCart.filter(
    (item) => item.amenityId !== SECURITY_DEPOSIT_ID
  );

  const masterTotal = basePrice + amenityTotal;
  const amountToSend = masterTotal;
  const paymentDetails = getPaymentDetails(channel);

  const displayCheckIn = formatDisplayDate(villaCart.checkIn);
  const displayCheckOut = formatDisplayDate(villaCart.checkOut);

  const copyNumber = async () => {
    if (!paymentDetails.copyValue) return;

    try {
      await navigator.clipboard.writeText(paymentDetails.copyValue);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Unable to copy the account number. Please copy it manually.');
    }
  };

  const updateGuestField = (field, value) => {
    setGuestDetails((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSuccessClose = () => {
    if (typeof onSuccess === 'function') {
      onSuccess();
      return;
    }

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (submitting || showSuccess) return;

    setError('');

    const name = guestDetails.name.trim();
    const contact = guestDetails.contact.trim();
    const refNo = guestDetails.refNo.trim();
    const note = guestDetails.note.trim();

    if (!name || !contact) {
      setError('Please enter your full name and mobile number.');
      return;
    }

    if (amountToSend > 0 && refNo.length !== 6) {
      setError('Please enter the last 6 digits of your payment reference.');
      return;
    }

    const parentReservation = {
      ...villaCart,
      roomTypeId: selectedRoom?.id || villaCart.roomTypeId || '',
      roomTypeName:
        selectedRoom?.name ||
        villaCart.roomTypeName ||
        villaCart.package ||
        'Room to confirm',
      package:
        selectedRoom?.name ||
        villaCart.package ||
        'Room to confirm',
      roomRate,
      isRateFinal: rateIsKnown,
      guestName: name,
      guestContact: contact,
      guestNote: note,
      paymentChannel: amountToSend > 0 ? channel : 'To be confirmed',
      referenceNo: amountToSend > 0 ? refNo : 'REQUEST',
      basePrice,
      amenityTotal,
      securityDeposit,
      totalPrice: amountToSend,
      amountPaid: amountToSend,
      status: 'pending_payment',
      paymentStatus: amountToSend > 0 ? 'pending_verification' : 'pending_owner_review',
      createdAt: new Date().toISOString(),
    };

    console.log('[Booking Submit] Showing success immediately.');
    console.log('[Booking Submit] Reservation payload:', parentReservation);
    console.log('[Booking Submit] Amenity payload:', cleanedAmenitiesCart);

    setSubmitting(true);
    setBackgroundSaveStatus('saving');

    // IMPORTANT:
    // Show success immediately so the guest is never stuck waiting on Firestore.
    setShowSuccess(true);

    commitMasterBooking(parentReservation, cleanedAmenitiesCart)
      .then((reservationId) => {
        console.log('[Booking Submit] Firebase saved successfully:', reservationId);
        setBackgroundSaveStatus('saved');
      })
      .catch((err) => {
        console.error('[Booking Submit] Firebase save failed:', err);
        setBackgroundSaveStatus('failed');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (showSuccess) {
    return (
      <BookingSuccessModal
        isOpen={true}
        referenceNo={amountToSend > 0 ? guestDetails.refNo : 'REQUEST'}
        saveStatus={backgroundSaveStatus}
        onClose={handleSuccessClose}
      />
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex bg-[#2A1A12]/78 p-0 backdrop-blur-sm md:justify-end"
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#F6EFE6] text-[#2A1A12] shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:w-[560px] md:border-l md:border-white/10">
        <div className="flex items-start justify-between border-b border-[#2A1A12]/10 bg-[#FFF9F2]/95 px-5 py-4 backdrop-blur-xl md:px-8 md:py-5">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#C15A3E]">
              Step 3 of 3
            </p>

            <h2 className="font-display text-3xl font-semibold italic leading-none text-[#2A1A12]">
              Submit reservation request.
            </h2>

            <p className="mt-3 max-w-sm text-xs leading-6 text-[#2A1A12]/50">
              Send a payment reference if an amount is shown. If rates are not final yet, submit your request so the owner can review availability and pricing.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-white text-[#2A1A12]/45 transition hover:border-[#C15A3E]/40 hover:text-[#C15A3E]"
            aria-label="Close payment modal"
          >
            ✕
          </button>
        </div>

        <div className="custom-scrollbar flex-grow overflow-y-auto px-5 pb-36 pt-5 md:px-8 md:pb-40 md:pt-6">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs leading-relaxed text-red-600">
              {error}
            </div>
          )}

          <section className="mb-4 overflow-hidden rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] shadow-[0_18px_45px_rgba(42,26,18,0.06)]">
            <div className="bg-[#2A1A12] p-6 text-[#FFF9F2]">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                {amountToSend > 0 ? 'Amount to Send' : 'Rate Status'}
              </div>

              <div className="font-display text-5xl italic leading-none">
                {amountToSend > 0 ? formatPHP(amountToSend) : 'To confirm'}
              </div>

              <p className="mt-4 text-xs leading-6 text-white/55">
                {amountToSend > 0
                  ? 'This amount is submitted for manual verification. Your reservation is not confirmed until the owner verifies the payment reference.'
                  : 'The owner can confirm the final rate and availability after reviewing your preferred dates and room type.'}
              </p>
            </div>

            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-[#C15A3E]/20 bg-[#C15A3E]/[0.07] p-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C15A3E]">
                      Selected Room
                    </div>

                    <div className="mt-1 font-semibold text-[#2A1A12]">
                      {selectedRoom?.name || 'Room to confirm'}
                    </div>

                    <div className="mt-1 text-xs leading-5 text-[#2A1A12]/45">
                      {displayCheckIn} — {displayCheckOut} · {villaCart.guests || 2} guest
                      {Number(villaCart.guests || 2) > 1 ? 's' : ''}
                    </div>
                  </div>

                  <span className="whitespace-nowrap font-bold text-[#2A1A12]">
                    {rateIsKnown ? formatPHP(basePrice) : 'To confirm'}
                  </span>
                </div>
              </div>

              {optionalAddOns.length > 0 && (
                <div className="border-t border-[#2A1A12]/10 pt-3">
                  <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                    Selected Add-ons
                  </div>

                  <div className="space-y-2">
                    {optionalAddOns.map((item) => {
                      const qty = Number(item.qty || 1);
                      const lineTotal = Number(item.price || 0) * qty;

                      return (
                        <div
                          key={`${item.amenityId}-${item.date || 'stay'}-${item.timeVal || item.timeLabel || 'item'}`}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-[#2A1A12]/10 bg-[#F6EFE6] p-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-[#2A1A12]">
                              {item.name} {qty > 1 ? `(x${qty})` : ''}
                            </div>

                            <div className="mt-1 text-xs text-[#2A1A12]/45">
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

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#C15A3E]/20 bg-[#C15A3E]/[0.07] p-4 text-sm">
                <div>
                  <div className="font-semibold text-[#2A1A12]">
                    Refundable security deposit
                  </div>

                  <div className="mt-1 text-xs leading-5 text-[#2A1A12]/45">
                    Final policy can be confirmed by the owner.
                  </div>
                </div>

                <span className="whitespace-nowrap font-bold text-[#C15A3E]">
                  {securityDeposit > 0 ? formatPHP(securityDeposit) : 'To confirm'}
                </span>
              </div>
            </div>
          </section>

          {amountToSend > 0 && (
            <section className="mb-4 rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5 shadow-[0_18px_45px_rgba(42,26,18,0.05)]">
              <div className="mb-5 grid grid-cols-2 gap-2">
                {CHANNELS.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => {
                      setChannel(item);
                      setCopied(false);
                    }}
                    className={`rounded-2xl border px-2 py-3 text-[9px] font-bold uppercase tracking-[0.14em] transition-all ${
                      channel === item
                        ? 'border-[#C15A3E] bg-[#C15A3E] text-white shadow-[0_12px_25px_rgba(193,90,62,0.22)]'
                        : 'border-[#2A1A12]/10 bg-white text-[#2A1A12]/45 hover:border-[#C15A3E]/40 hover:text-[#C15A3E]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-[180px_1fr] md:items-center">
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-[24px] border border-[#2A1A12]/10 bg-white p-3 shadow-inner md:h-44 md:w-44">
                  {paymentDetails.qrImage ? (
                    <img
                      src={paymentDetails.qrImage}
                      alt={`${channel} QR code`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="px-4 text-center text-xs leading-relaxed text-[#2A1A12]/40">
                      QR image is not configured yet. Please use the account details.
                    </div>
                  )}
                </div>

                <div className="text-center md:text-left">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/35">
                    {paymentDetails.label}
                  </div>

                  <div className="font-display text-3xl font-semibold italic leading-none text-[#2A1A12]">
                    {paymentDetails.name}
                  </div>

                  {paymentDetails.copyValue && (
                    <button
                      type="button"
                      onClick={copyNumber}
                      className="mt-4 rounded-full border border-[#2A1A12]/10 bg-[#F6EFE6] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2A1A12]/55 transition hover:border-[#C15A3E]/40 hover:text-[#C15A3E]"
                    >
                      {copied ? 'Copied' : paymentDetails.display}
                    </button>
                  )}

                  <div className="mt-4 rounded-2xl border border-[#C15A3E]/15 bg-[#C15A3E]/[0.06] p-4 text-xs leading-6 text-[#2A1A12]/62">
                    {paymentDetails.instruction}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5 shadow-[0_18px_45px_rgba(42,26,18,0.05)]">
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#C15A3E]">
                Guest Details
              </p>

              <h3 className="font-display text-3xl font-semibold italic leading-none text-[#2A1A12]">
                Submit your request.
              </h3>

              <p className="mt-3 text-xs leading-6 text-[#2A1A12]/50">
                The owner can use these details to confirm the room, dates, rate, and payment status.
              </p>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/35">
                  Full Guest Name
                </label>

                <input
                  type="text"
                  required
                  value={guestDetails.name}
                  onChange={(event) => updateGuestField('name', event.target.value)}
                  className="w-full rounded-2xl border border-[#2A1A12]/10 bg-white p-4 text-sm text-[#2A1A12] outline-none transition focus:border-[#C15A3E]"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/35">
                  Mobile Number for Confirmation
                </label>

                <input
                  type="tel"
                  required
                  value={guestDetails.contact}
                  onChange={(event) => updateGuestField('contact', event.target.value)}
                  className="w-full rounded-2xl border border-[#2A1A12]/10 bg-white p-4 text-sm text-[#2A1A12] outline-none transition focus:border-[#C15A3E]"
                  placeholder="0917 123 4567"
                />
              </div>

              {amountToSend > 0 && (
                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/35">
                    Last 6 Digits of Payment Reference
                  </label>

                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={guestDetails.refNo}
                    onChange={(event) =>
                      updateGuestField('refNo', event.target.value.replace(/\D/g, ''))
                    }
                    className="w-full rounded-2xl border border-[#2A1A12]/10 bg-white p-4 font-mono text-sm tracking-[0.18em] text-[#2A1A12] outline-none transition focus:border-[#C15A3E]"
                    placeholder="000000"
                  />

                  <p className="mt-2 text-[11px] leading-relaxed text-[#2A1A12]/45">
                    Your request stays pending until the owner verifies this reference.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/35">
                  Notes or Special Request
                </label>

                <textarea
                  rows={3}
                  value={guestDetails.note}
                  onChange={(event) => updateGuestField('note', event.target.value)}
                  className="w-full resize-none rounded-2xl border border-[#2A1A12]/10 bg-white p-4 text-sm text-[#2A1A12] outline-none transition focus:border-[#C15A3E]"
                  placeholder="Example: We are visiting Enchanted Kingdom and prefer a room good for 6 guests."
                />
              </div>
            </form>
          </section>
        </div>

        <div className="border-t border-[#2A1A12]/10 bg-[#FFF9F2]/95 p-5 shadow-[0_-18px_45px_rgba(42,26,18,0.1)] backdrop-blur-xl md:p-6">
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className={`w-full rounded-2xl bg-[#2A1A12] px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFF9F2] shadow-[0_16px_35px_rgba(42,26,18,0.22)] transition ${
              submitting
                ? 'cursor-wait opacity-50'
                : 'hover:-translate-y-0.5 hover:bg-[#C15A3E]'
            }`}
          >
            {submitting
              ? 'Submitting Request...'
              : amountToSend > 0
                ? `Submit Request · ${formatPHP(amountToSend)}`
                : 'Submit Reservation Request'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}