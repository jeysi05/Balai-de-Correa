import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { commitMasterBooking } from '../firebase';
import emailjs from '@emailjs/browser';
import theme from '../theme.config';
import BookingSuccessModal from './BookingSuccessModal'; 

const EMAILJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const CHANNELS = ['GCash', 'PayMaya', 'Bank Transfer'];

export default function PaymentModal({ villaCart, amenitiesCart, onClose }) {
  const [channel, setChannel] = useState('GCash');
  const [guestDetails, setGuestDetails] = useState({ name: '', contact: '', refNo: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // --- 1. FULL PAYMENT MATH ENGINE ---
  const calculateNights = () => {
    if (!villaCart.checkIn || !villaCart.checkOut) return 1;
    const start = new Date(villaCart.checkIn);
    const end = new Date(villaCart.checkOut);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const getNightlyRate = () => {
    const guests = parseInt(villaCart.guests) || 2;
    if (guests <= 3) return 9000;
    if (guests <= 6) return 13500;
    if (guests <= 12) return 20500;
    return 20500 + (guests - 12) * 1500;
  };

  const nights = calculateNights();
  const nightlyRate = getNightlyRate();
  const basePrice = nightlyRate * nights;
  
  const amenityTotal = amenitiesCart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  
  // The Master Total includes the 5k Security Deposit automatically
  const masterTotal = basePrice + amenityTotal;
  const amountToPayNow = masterTotal; // 100% Payment

  const qrImage = channel === 'PayMaya' ? theme.mayaQR
    : channel === 'Bank Transfer' ? theme.instaPayQR
    : theme.gcashQR;

  const copyNumber = () => {
    navigator.clipboard.writeText(theme.gcashNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!guestDetails.name.trim() || !guestDetails.contact.trim() || guestDetails.refNo.length !== 6) {
      setError('Please fill in all details and enter the last 6 digits of your reference number.');
      return;
    }

    setSubmitting(true);
    try {
      const parentReservation = {
        ...villaCart,
        guestName: guestDetails.name,
        guestContact: guestDetails.contact,
        paymentChannel: channel,
        referenceNo: guestDetails.refNo,
        basePrice,
        totalPrice: masterTotal,
        amountPaid: amountToPayNow,
        status: 'pending_payment',
        createdAt: new Date().toISOString()
      };

      await commitMasterBooking(parentReservation, amenitiesCart);

      // SMS Logic (Safety Switched)
      if (theme.semaphoreApiKey) {
        const sms = `Hi ${guestDetails.name}! We've received your full payment of ₱${masterTotal.toLocaleString()} for your stay at ${theme.villaName}. We will verify your GCash Ref #${guestDetails.refNo} shortly.`;
        await fetch('https://api.semaphore.co/api/v4/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ apikey: theme.semaphoreApiKey, number: guestDetails.contact, message: sms }),
        }).catch(console.error);
      }

      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Transaction failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return <BookingSuccessModal referenceNo={guestDetails.refNo} onClose={onClose} />;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2A1A12]/80 backdrop-blur-sm transition-opacity" onClick={e => e.target === e.currentTarget && onClose()}>
      
      <div className="w-full md:w-[500px] h-full shadow-2xl flex flex-col overflow-hidden border-l border-white/10 bg-[#F9F8F6] text-[#2A1A12]">
        
        <div className="p-6 md:p-10 flex-grow overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="font-['Playfair_Display'] text-3xl italic leading-none mb-2 text-[#C15A3E]">Finalize Booking</h2>
              <p className="font-sans text-[11px] text-gray-400 uppercase tracking-widest font-bold">Step 3 of 3</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-black transition-colors text-2xl">✕</button>
          </div>

          {error && <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">{error}</div>}

          {/* Amount to Pay Card */}
          <div className="bg-[#2A1A12] text-white p-8 rounded-3xl mb-8 relative overflow-hidden shadow-xl">
             <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C15A3E] mb-2">Total Amount to Pay</div>
                <div className="text-5xl font-['Playfair_Display'] italic mb-3">₱{amountToPayNow.toLocaleString()}</div>
                
                {/* REFUNDABLE SUBTEXT */}
                <div className="flex items-start gap-2 pt-3 border-t border-white/10 mt-1">
                   <div className="w-4 h-4 rounded-full bg-[#C15A3E] text-[10px] flex items-center justify-center font-bold text-white shrink-0 mt-0.5">!</div>
                   <p className="text-[11px] text-white/70 leading-relaxed italic">
                     Includes **₱5,000 Refundable Security Deposit** to be returned via GCash after your checkout inspection.
                   </p>
                </div>
             </div>
             <div className="absolute -right-4 -bottom-4 text-white/5 text-9xl font-serif italic select-none">₱</div>
          </div>

          {/* Channels */}
          <div className="flex gap-2 mb-8">
            {CHANNELS.map(c => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`flex-1 py-3 border-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${channel === c ? 'border-[#C15A3E] bg-white text-[#C15A3E] shadow-md' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Payment Detail Card */}
          <div className="flex flex-col items-center p-8 bg-white border border-gray-100 rounded-3xl mb-8 shadow-sm">
            <div className="w-48 h-48 bg-gray-50 p-3 rounded-2xl mb-6 border border-gray-100">
               <img src={qrImage} alt="QR" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">GCash Account Name</div>
              <div className="font-bold text-[#2A1A12] text-lg mb-4">{theme.gcashName}</div>
              <button onClick={copyNumber} type="button" className="px-6 py-2 bg-gray-100 hover:bg-[#C15A3E]/10 hover:text-[#C15A3E] text-gray-600 font-bold text-xs rounded-full transition-all">
                {copied ? '✓ Number Copied' : theme.gcashDisplay}
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Full Guest Name</label>
              <input type="text" required value={guestDetails.name} onChange={e => setGuestDetails({...guestDetails, name: e.target.value})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-[#C15A3E]" placeholder="Juan Dela Cruz" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Mobile Number (For Confirmation)</label>
              <input type="tel" required value={guestDetails.contact} onChange={e => setGuestDetails({...guestDetails, contact: e.target.value})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-[#C15A3E]" placeholder="0917 123 4567" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Last 6 Digits of Ref No.</label>
              <input type="text" required maxLength={6} value={guestDetails.refNo} onChange={e => setGuestDetails({...guestDetails, refNo: e.target.value.replace(/\D/g, '')})} className="w-full bg-white border border-gray-200 p-4 rounded-xl font-mono text-sm outline-none focus:border-[#C15A3E]" placeholder="000000" />
            </div>
          </form>
        </div>

        {/* Action Button */}
        <div className="p-6 md:p-8 bg-white border-t border-gray-100">
          <button 
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className={`w-full py-5 bg-[#2A1A12] text-[#C15A3E] text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl shadow-xl transition-all ${submitting ? 'opacity-50 cursor-wait' : 'hover:bg-black hover:-translate-y-0.5'}`}
          >
            {submitting ? 'Verifying...' : `Confirm & Pay ₱${amountToPayNow.toLocaleString()}`}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}