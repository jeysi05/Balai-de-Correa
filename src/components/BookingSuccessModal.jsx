import React from 'react';
import theme from '../theme.config';

export default function BookingSuccessModal({
  isOpen = true,
  onClose,
  referenceNo,
}) {
  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2A1A12]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="bg-[#2A1A12] px-6 py-7 text-center text-[#FFF9F2] md:px-10 md:py-9">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#C15A3E]/35 bg-[#C15A3E]/10 text-[#C15A3E]">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.7"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
            Request Submitted
          </p>

          <h2 className="font-display text-4xl font-semibold italic leading-none md:text-5xl">
            Booking request received.
          </h2>

          <p className="mx-auto mt-5 max-w-sm text-sm font-light leading-7 text-white/65">
            Thank you for choosing {theme.villaName}. Your booking is now waiting for manual payment verification.
          </p>
        </div>

        <div className="px-6 py-7 md:px-10 md:py-8">
          <div className="mb-6 rounded-2xl border border-[#2A1A12]/10 bg-white p-5 text-center">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/38">
              Payment Reference
            </div>

            <div className="font-mono text-2xl font-bold tracking-[0.12em] text-[#C15A3E]">
              {referenceNo || 'PENDING'}
            </div>

            <p className="mx-auto mt-3 max-w-xs text-xs leading-6 text-[#2A1A12]/45">
              Keep this reference number. The owner will use it to match and verify your payment.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm">
                1
              </div>

              <div>
                <div className="text-sm font-bold text-[#2A1A12]">
                  Payment is pending verification
                </div>

                <p className="mt-1 text-xs leading-6 text-[#2A1A12]/55">
                  Your reservation is not yet confirmed until the owner checks the submitted payment reference.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-[#2A1A12]/10 bg-white p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6EFE6] text-sm">
                2
              </div>

              <div>
                <div className="text-sm font-bold text-[#2A1A12]">
                  Wait for the owner confirmation
                </div>

                <p className="mt-1 text-xs leading-6 text-[#2A1A12]/55">
                  Once payment is verified, the owner may confirm your booking through SMS or direct message.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-[#2A1A12]/10 bg-white p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6EFE6] text-sm">
                3
              </div>

              <div>
                <div className="text-sm font-bold text-[#2A1A12]">
                  Save your booking details
                </div>

                <p className="mt-1 text-xs leading-6 text-[#2A1A12]/55">
                  Take a screenshot of this page so you have your reference number ready if the owner asks for it.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-7 w-full rounded-2xl bg-[#2A1A12] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFF9F2] transition hover:bg-[#C15A3E]"
          >
            Return to Website
          </button>
        </div>
      </div>
    </div>
  );
}