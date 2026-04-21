import React, { useState, useEffect } from 'react';

const STANDARD_CHECK_IN = 14; 
const STANDARD_CHECK_OUT = 11;

export default function AmenityCard({
  amenity, villaCart, amenitiesCart, setAmenitiesCart, liveAmenities
}) {
  const [selectedDate, setSelectedDate] = useState(villaCart.checkIn);
  const [qty, setQty] = useState(1);

  // --- 1. AUTO-ADD MANDATORY SECURITY DEPOSIT ---
  useEffect(() => {
    if (amenity.id === 'security_dep') {
      const exists = amenitiesCart.find(item => item.amenityId === 'security_dep');
      if (!exists && villaCart.checkIn) {
        setAmenitiesCart(prev => [...prev, {
          amenityId: amenity.id,
          name: amenity.name,
          date: villaCart.checkIn,
          timeLabel: "Entire Stay",
          price: amenity.price,
          qty: 1,
          isMandatory: true
        }]);
      }
    }
  }, [villaCart.checkIn, amenity.id]);

  // --- 2. TIME SLOT LOGIC ---
  const generateTimeSlots = () => {
    const slots = [];
    if (amenity.id === 'early_checkin') {
      for (let i = 6; i < STANDARD_CHECK_IN; i++) slots.push(i);
    } else if (amenity.id === 'late_checkout') {
      for (let i = STANDARD_CHECK_OUT + 1; i <= 22; i++) slots.push(i);
    } else {
      for (let i = 8; i <= 21; i++) slots.push(i);
    }
    return slots;
  };

  const formatTime = (time) => {
    const hour = Math.floor(time);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return { label: `${displayHour}:00 ${ampm}`, val: time };
  };

  const toggleSlot = (timeVal, timeLabel, customQty = 1) => {
    if (amenity.id === 'security_dep') return; // Cannot remove mandatory item

    const exists = amenitiesCart.find(item => 
      item.amenityId === amenity.id && (amenity.id === 'towel_rental' ? true : item.timeVal === timeVal)
    );

    if (exists) {
      if (amenity.id === 'towel_rental') {
        // Update quantity if already in cart
        setAmenitiesCart(prev => prev.map(item => 
          item.amenityId === amenity.id ? { ...item, qty: customQty } : item
        ));
      } else {
        setAmenitiesCart(prev => prev.filter(item => item !== exists));
      }
    } else {
      setAmenitiesCart(prev => {
        // Ensure only one time slot for check-in/out extensions
        const filtered = (amenity.id === 'early_checkin' || amenity.id === 'late_checkout') 
          ? prev.filter(item => item.amenityId !== amenity.id) 
          : prev;

        return [...filtered, {
          amenityId: amenity.id,
          name: amenity.name,
          date: selectedDate,
          timeVal: timeVal,
          timeLabel: timeLabel,
          price: amenity.price,
          qty: customQty
        }];
      });
    }
  };

  const isTowel = amenity.id === 'towel_rental';
  const isDeposit = amenity.id === 'security_dep';
  const isLockedDate = ['early_checkin', 'late_checkout'].includes(amenity.id);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all duration-300 flex flex-col group ${isDeposit ? 'border-[#C15A3E]/40 bg-[#C15A3E]/[0.02]' : 'border-gray-100 hover:shadow-xl'}`}>
      
      {/* Header Image */}
      <div className="h-40 overflow-hidden relative">
        <img src={amenity.image} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
          <h3 className="text-white text-xl italic font-['Playfair_Display']">{amenity.name}</h3>
          <span className="text-[10px] font-bold text-[#C15A3E] bg-black/60 px-2 py-1 rounded-md uppercase tracking-widest">
            ₱{amenity.price}/{amenity.unit || 'hr'}
          </span>
        </div>
      </div>

      <div className="p-5 flex-grow flex flex-col gap-5">
        
        {/* CONDITION 1: SECURITY DEPOSIT (Badge only) */}
        {isDeposit && (
          <div className="py-4 px-4 bg-[#C15A3E]/10 border border-[#C15A3E]/20 rounded-xl flex flex-col items-center justify-center gap-1">
             <span className="text-[10px] font-bold text-[#C15A3E] tracking-widest uppercase">Mandatory Security Deposit</span>
             <span className="text-[9px] text-[#C15A3E]/60 italic">Included in total booking</span>
          </div>
        )}

        {/* CONDITION 2: TOWEL RENTAL (Qty Selector) */}
        {isTowel && (
          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-2">How many pieces?</label>
              <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">-</button>
                <span className="flex-1 text-center font-bold text-[#2A1A12]">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">+</button>
              </div>
            </div>
            <button 
              onClick={() => toggleSlot(0, "Rental", qty)}
              className={`w-full py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
                amenitiesCart.some(i => i.amenityId === amenity.id) ? 'bg-[#C15A3E] text-white' : 'bg-[#2A1A12] text-[#C15A3E]'
              }`}
            >
              {amenitiesCart.some(i => i.amenityId === amenity.id) ? 'Update in Cart' : 'Add to Reservation'}
            </button>
          </div>
        )}

        {/* CONDITION 3: ACTIVITIES (Calendar + Grid) */}
        {!isDeposit && !isTowel && (
          <>
            <div>
              <label className="block text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-2">
                {isLockedDate ? "Locked to Stay" : "Select Day"}
              </label>
              <input
                type="date"
                value={selectedDate || ''}
                disabled={isLockedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold outline-none ${isLockedDate ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {generateTimeSlots().map((time) => {
                const { label, val } = formatTime(time);
                const isInCart = amenitiesCart.some(item => 
                  item.amenityId === amenity.id && item.timeVal === val
                );
                return (
                  <button
                    key={val}
                    onClick={() => toggleSlot(val, label)}
                    className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                      isInCart ? 'bg-[#2A1A12] border-[#2A1A12] text-[#C15A3E]' : 'bg-white border-gray-100 text-gray-500 hover:border-[#C15A3E]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}