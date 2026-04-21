import React from 'react';
import theme from '../theme.config';

export default function BookingSuccessModal({ isOpen, onClose, referenceNo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2A1A12]/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full relative z-10 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-['Playfair_Display'] text-3xl italic text-[#2A1A12] mb-4">Booking Requested!</h2>
        <p className="text-gray-600 font-light leading-relaxed mb-8">
          Thank you for choosing <span className="font-semibold">{theme.villaName}</span>. Your reservation request has been sent to the owner for approval.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Reference Number</div>
          <div className="font-mono text-lg font-bold text-[#C15A3E]">{referenceNo}</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-left text-sm text-gray-500 bg-amber-50 p-4 rounded-xl border border-amber-100">
            <span className="text-xl">📱</span>
            <p>Once the owner verifies your payment, you will receive an <strong>SMS confirmation</strong> at your provided number.</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-10 w-full py-4 bg-[#2A1A12] text-[#C15A3E] text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-[#0D1A12] transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}