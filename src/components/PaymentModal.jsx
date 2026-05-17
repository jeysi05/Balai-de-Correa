import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { commitMasterBooking } from '../firebase';
import theme from '../theme.config';
import BookingSuccessModal from './BookingSuccessModal';

const CHANNELS = ['GCash', 'PayMaya', 'Bank Transfer'];
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

function getPaymentDetails(channel) {
  if (channel === 'PayMaya') {
    return {
      qrImage: theme.mayaQR,
      label: 'PayMaya Account',
      name: theme.mayaName || theme.gcashName || theme.villaName,
      display: theme.mayaDisplay || theme.gcashDisplay || 'Copy account details',
      copyValue: theme.mayaNumber || theme.gcashNumber || '',
      instruction:
        'Send the exact amount through PayMaya, then enter the last 6 digits of your transaction reference below.',
    };
  }

  if (channel === 'Bank Transfer') {
    return {
      qrImage: theme.instaPayQR,
      label: 'Bank Transfer Details',
      name: theme.bankName || theme.gcashName || theme.villaName,
      display: theme.bankDisplay || theme.gcashDisplay || 'Copy account details',
      copyValue: theme.bankNumber || theme.gcashNumber || '',
      instruction:
        'Send the exact amount through bank transfer, then enter the last 6 digits of your transfer reference below.',
    };
  }

  return {
    qrImage: theme.gcashQR,
    label: 'GCash Account',
    name: theme.gcashName || theme.villaName,
    display: theme.gcashDisplay || theme.gcashNumber || 'Copy GCash number',
    copyValue: theme.gcashNumber || '',
    instruction:
      'Send the exact amount through GCash, then enter the last 6 digits of your GCash reference number below.',
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const cleanedAmenitiesCart = useMemo(
    () => sanitizeAmenitiesCart(amenitiesCart),
    [amenitiesCart]
  );

  const nights = calculateNights(villaCart.checkIn, villaCart.checkOut);
  const breakdown = getRateBreakdown(villaCart.guests);
  const basePrice = (breakdown.packagePrice + breakdown.extraRate) * nights;

  const amenityTotal = cleanedAmenitiesCart.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);

    return sum + price * qty;
  }, 0);

  const securityDeposit = cleanedAmenitiesCart
    .filter((item) => item.amenityId === SECURITY_DEPOSIT_ID)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  const masterTotal = basePrice + amenityTotal;
  const amountToSend = masterTotal;
  const paymentDetails = getPaymentDetails(channel);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setError('');

    const name = guestDetails.name.trim();
    const contact = guestDetails.contact.trim();
    const refNo = guestDetails.refNo.trim();

    if (!name || !contact || refNo.length !== 6) {
      setError(
        'Please enter your full name, mobile number, and the last 6 digits of your payment reference.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const parentReservation = {
        ...villaCart,
        guestName: name,
        guestContact: contact,
        paymentChannel: channel,
        referenceNo: refNo,
        basePrice,
        amenityTotal,
        securityDeposit,
        totalPrice: masterTotal,
        amountPaid: amountToSend,
        status: 'pending_payment',
        paymentStatus: 'pending_verification',
        createdAt: new Date().toISOString(),
      };

      await commitMasterBooking(parentReservation, cleanedAmenitiesCart);

      if (theme.semaphoreApiKey) {
        const sms = `Hi ${name}! We received your booking request for ${theme.villaName} with payment reference #${refNo}. Your reservation is now pending manual verification.`;

        await fetch('https://api.semaphore.co/api/v4/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            apikey: theme.semaphoreApiKey,
            number: contact,
            message: sms,
          }),
        }).catch(console.error);
      }

      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setError(
        'We could not submit your booking for verification. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <BookingSuccessModal
        isOpen={true}
        referenceNo={guestDetails.refNo}
        onClose={handleSuccessClose}
      />
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#2A1A12]/80 backdrop-blur-sm transition-opacity"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="flex h-full w-full flex-col overflow-hidden border-l border-white/10 bg-[#F9F8F6] text-[#2A1A12] shadow-2xl md:w-[500px]">
        <div className="custom-scrollbar flex-grow overflow-y-auto p-6 md:p-10">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h2 className="mb-2 font-display text-3xl italic leading-none text-[#C15A3E]">
                Payment Instructions
              </h2>

              <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Step 3 of 3 · Manual Verification
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-2xl text-gray-300 transition-colors hover:text-black"
              aria-label="Close payment modal"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-xs leading-relaxed text-red-600">
              {error}
            </div>
          )}

          <div className="relative mb-8 overflow-hidden rounded-3xl bg-[#2A1A12] p-8 text-white shadow-xl">
            <div className="relative z-10">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C15A3E]">
                Total Amount to Send
              </div>

              <div className="mb-3 font-display text-5xl italic">
                {formatPHP(amountToSend)}
              </div>

              <div className="mt-1 flex items-start gap-2 border-t border-white/10 pt-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#C15A3E] text-[10px] font-bold text-white">
                  !
                </div>

                <p className="text-[11px] italic leading-relaxed text-white/70">
                  Includes{' '}
                  <strong className="font-semibold text-white">
                    {formatPHP(securityDeposit || 5000)} refundable security deposit
                  </strong>
                  , returned after checkout inspection if there are no damages or unpaid charges.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 select-none font-serif text-9xl italic text-white/5">
              ₱
            </div>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-2">
            {CHANNELS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => {
                  setChannel(item);
                  setCopied(false);
                }}
                className={`rounded-xl border-2 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  channel === item
                    ? 'border-[#C15A3E] bg-white text-[#C15A3E] shadow-md'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-5 flex h-48 w-48 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-3">
                {paymentDetails.qrImage ? (
                  <img
                    src={paymentDetails.qrImage}
                    alt={`${channel} QR code`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="px-4 text-center text-xs leading-relaxed text-gray-400">
                    QR image not configured yet. Please use the account details below.
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {paymentDetails.label}
                </div>

                <div className="mb-4 text-lg font-bold text-[#2A1A12]">
                  {paymentDetails.name}
                </div>

                {paymentDetails.copyValue && (
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="rounded-full bg-gray-100 px-6 py-2 text-xs font-bold text-gray-600 transition-all hover:bg-[#C15A3E]/10 hover:text-[#C15A3E]"
                  >
                    {copied ? '✓ Copied' : paymentDetails.display}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C15A3E]/15 bg-[#C15A3E]/5 p-4 text-xs leading-relaxed text-[#2A1A12]/70">
              {paymentDetails.instruction}
            </div>
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Full Guest Name
              </label>

              <input
                type="text"
                required
                value={guestDetails.name}
                onChange={(e) => updateGuestField('name', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm outline-none transition-colors focus:border-[#C15A3E]"
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Mobile Number for Confirmation
              </label>

              <input
                type="tel"
                required
                value={guestDetails.contact}
                onChange={(e) => updateGuestField('contact', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm outline-none transition-colors focus:border-[#C15A3E]"
                placeholder="0917 123 4567"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Last 6 Digits of Payment Reference
              </label>

              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={guestDetails.refNo}
                onChange={(e) =>
                  updateGuestField('refNo', e.target.value.replace(/\D/g, ''))
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-4 font-mono text-sm outline-none transition-colors focus:border-[#C15A3E]"
                placeholder="000000"
              />

              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Your booking will be marked as pending until the owner verifies this payment manually.
              </p>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-100 bg-white p-6 md:p-8">
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className={`w-full rounded-2xl bg-[#2A1A12] py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C15A3E] shadow-xl transition-all ${
              submitting
                ? 'cursor-wait opacity-50'
                : 'hover:-translate-y-0.5 hover:bg-black'
            }`}
          >
            {submitting
              ? 'Submitting for Verification...'
              : `Submit Payment for Verification · ${formatPHP(amountToSend)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}