import React from 'react';
import theme from '../theme.config';
import AmenityCard from './AmenityCard';

export default function BookingPage({
  villaCart,
  amenitiesCart,
  setAmenitiesCart,
  liveAmenities,
  onCheckout,
  onBack
}) {
  
  // --- 1. THE DYNAMIC MATH ENGINE (Corrected for 19 Guests) ---
  const calculateNights = () => {
    if (!villaCart.checkIn || !villaCart.checkOut) return 1;
    const start = new Date(villaCart.checkIn);
    const end = new Date(villaCart.checkOut);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const getNightlyRate = () => {
    const guests = parseInt(villaCart.guests) || 2;
    // TRES PACKAGE (1-3 Pax)
    if (guests <= 3) return 9000;
    // SEIS PACKAGE (4-6 Pax)
    if (guests <= 6) return 13500;
    // DOCE PACKAGE (7-12 Pax)
    if (guests <= 12) return 20500;
    
    // EXTRA HEADS (13-21 Pax): Base 20,500 + 1,500 per head over 12
    const extraHeads = guests - 12;
    return 20500 + (extraHeads * 1500);
  };

  const nights = calculateNights();
  const nightlyRate = getNightlyRate(); 
  const basePrice = nightlyRate * nights; 
  
  const amenityTotal = amenitiesCart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  const masterTotal = basePrice + amenityTotal;

  const displayCheckIn = villaCart.checkIn ? new Date(villaCart.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
  const displayCheckOut = villaCart.checkOut ? new Date(villaCart.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F9F8F6] pt-[88px] pb-32 lg:pb-0 relative overflow-hidden">
      
      {/* --- SUBTLE BACKGROUND GLOW FX --- */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#2A1A12]/5 to-transparent pointer-events-none"></div>
      
      {/* ─── LEFT: Amenity Selection Grid ─── */}
      <div className="w-full lg:w-2/3 p-6 md:p-12 lg:pr-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-8 bg-[#C15A3E]"></div>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#C15A3E]">Step 2 of 3</span>
          </div>

          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl italic text-[#2A1A12] leading-tight mb-4">
            Curate your experience.
          </h2>
          <p className="text-gray-600 font-light leading-relaxed mb-10 text-sm md:text-base">
            Your private stay is locked from <strong className="font-semibold text-[#2A1A12]">{displayCheckIn}</strong> to <strong className="font-semibold text-[#2A1A12]">{displayCheckOut}</strong>. 
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {theme.hourlyAmenities.map((amenity) => (
              <AmenityCard 
                key={amenity.id}
                amenity={amenity}
                villaCart={villaCart}
                amenitiesCart={amenitiesCart}
                setAmenitiesCart={setAmenitiesCart}
                liveAmenities={liveAmenities}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Sticky Master Cart (Desktop Only) ─── */}
      <div className="hidden lg:block w-full lg:w-1/3 bg-white border-l border-gray-100 relative shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C15A3E]"></div>
        
        <div className="sticky top-[88px] p-8 md:p-12 flex flex-col h-[calc(100vh-88px)] relative z-10">
          <div className="flex-grow">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C15A3E] mb-8 border-b-2 border-dashed border-gray-200 pb-4">
              Reservation Summary
            </h3>
            
            <div className="mb-8">
              <h4 className="font-['Playfair_Display'] text-2xl italic text-gray-900 mb-2">{theme.villaName}</h4>
              <div className="text-sm text-gray-500 mb-1">{displayCheckIn} — {displayCheckOut}</div>
              <div className="text-sm text-gray-500 mb-4">{villaCart.guests} Guests</div>
              
              <div className="flex justify-between items-center text-base font-semibold text-gray-900 mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="text-sm font-normal text-gray-600">Base Rate ({nights} night{nights > 1 ? 's' : ''})</span>
                <span>₱{basePrice.toLocaleString()}</span>
              </div>
            </div>

            {amenitiesCart.length > 0 && (
              <div className="pt-6 border-t-2 border-dashed border-gray-200">
                <h4 className="text-[9px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-4">Added Experiences</h4>
                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                  {amenitiesCart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start group">
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {item.name} {item.qty > 1 ? `(x${item.qty})` : ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.timeLabel === "Entire Stay" ? "Refundable Deposit" : `${item.date} @ ${item.timeLabel}`}</div>
                      </div>
                      <div className="text-sm font-semibold text-[#C15A3E]">₱{(item.price * (item.qty || 1)).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 mt-auto border-t-2 border-dashed border-gray-200 bg-white">
            <div className="flex justify-between items-end mb-6">
              <span className="text-xs font-bold tracking-widest uppercase text-gray-400">Total Due</span>
              <span className="font-['Playfair_Display'] text-4xl italic text-[#2A1A12]">₱{masterTotal.toLocaleString()}</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full py-4 bg-[#2A1A12] text-[#C15A3E] text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-[#1a100b] transition-all duration-300 rounded-xl shadow-[0_10px_20px_-10px_rgba(42,26,18,0.5)] hover:-translate-y-0.5"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE STICKY FOOTER (Restored) ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-6 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex justify-between items-center">
        <div>
          <div className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1">Total Due</div>
          <div className="font-['Playfair_Display'] text-2xl italic text-[#2A1A12] leading-none">₱{masterTotal.toLocaleString()}</div>
        </div>
        <button 
          onClick={onCheckout}
          className="px-8 py-3.5 bg-[#2A1A12] text-[#C15A3E] text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-[#0D1A12] transition-colors rounded-xl shadow-md"
        >
          Checkout
        </button>
      </div>

    </div>
  );
}