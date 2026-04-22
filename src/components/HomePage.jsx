import React, { useState } from 'react';
import theme from '../theme.config';
import { formatPHP } from '../utils/formatters';

export default function HomePage({ villaCart, setVillaCart, onProceed, liveReservations = [] }) {
  const heroImg = theme.heroImages?.[0] || "https://images.unsplash.com/photo-1613490900233-a312cdcd94c4?auto=format&fit=crop&q=80";
  const headline = theme.heroHeadline || ["Your perfect", "getaway", "retreat."];
  
  const [calMonth, setCalMonth] = useState(new Date());

  const handleCartUpdate = (field, value) => {
    setVillaCart(prev => ({ ...prev, [field]: value }));
  };

  const getLocalTodayString = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };

  const canProceed = villaCart?.checkIn && villaCart?.checkOut;

  const currentYear = calMonth.getFullYear();
  const currentMonthIdx = calMonth.getMonth();
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonthIdx, 1).getDay();
  
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCalMonth(new Date(currentYear, currentMonthIdx - 1, 1));
  const nextMonth = () => setCalMonth(new Date(currentYear, currentMonthIdx + 1, 1));

  const isDateBooked = (day) => {
    const checkDateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDateObj = new Date(checkDateStr);
    const activeReservations = liveReservations.filter(res => res.status !== 'cancelled');

    return activeReservations.some(res => {
      const start = new Date(res.checkIn);
      const end = new Date(res.checkOut);
      return checkDateObj >= start && checkDateObj < end; 
    });
  };

  const isPastDate = (day) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDateObj = new Date(currentYear, currentMonthIdx, day);
    return checkDateObj < today;
  };

  const handleDateClick = (day) => {
    if (isDateBooked(day) || isPastDate(day)) return;
    const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (!villaCart.checkIn || (villaCart.checkIn && villaCart.checkOut)) {
      handleCartUpdate('checkIn', dateStr);
      handleCartUpdate('checkOut', ''); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (villaCart.checkIn && !villaCart.checkOut) {
      const inDate = new Date(villaCart.checkIn);
      const outDate = new Date(dateStr);
      if (outDate > inDate) {
         handleCartUpdate('checkOut', dateStr);
         window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
         handleCartUpdate('checkIn', dateStr); 
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans selection:bg-[#C15A3E] selection:text-white pb-20">
      
      {/* ─── 1. LUXURY HERO SECTION (ID: gallery) ─── */}
      <div id="gallery" className="relative h-[85vh] min-h-[600px] w-full bg-[#2A1A12]">
        <img 
          src={heroImg} 
          alt={theme.villaName} 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-[10px] font-bold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            {theme.location}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-['Playfair_Display'] text-white italic tracking-tight leading-tight mb-6 max-w-4xl drop-shadow-lg">
            {headline.join(' ')}
          </h1>
          
          <p className="text-sm md:text-base text-white/80 max-w-lg font-light leading-relaxed">
            {theme.heroDescription}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 z-20">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] p-2 md:p-4 flex flex-col md:flex-row items-center gap-2 border border-gray-100">
            <div className="flex w-full flex-col md:flex-row gap-2">
              
              <div className="flex-1 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-3 md:p-4 cursor-pointer relative group border border-transparent focus-within:border-[#C15A3E]">
                <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Check In</label>
                <input 
                  type="date" 
                  min={getLocalTodayString()}
                  value={villaCart?.checkIn || ''}
                  onChange={(e) => handleCartUpdate('checkIn', e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer"
                />
              </div>

              <div className="flex-1 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-3 md:p-4 cursor-pointer relative group border border-transparent focus-within:border-[#C15A3E]">
                <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Check Out</label>
                <input 
                  type="date" 
                  min={villaCart?.checkIn || getLocalTodayString()}
                  value={villaCart?.checkOut || ''}
                  onChange={(e) => handleCartUpdate('checkOut', e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer"
                />
              </div>

              {/* NEW: PACKAGE DROPDOWN */}
              <div className="flex-1 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-3 md:p-4 cursor-pointer border border-transparent focus-within:border-[#C15A3E]">
                <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Package</label>
                <select 
                  value={villaCart?.package || 'Tres Package'}
                  onChange={(e) => handleCartUpdate('package', e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer"
                >
                  {/* We filter out 'Day Tour' so only the overnight packages show */}
                  {theme.rates.filter(r => r.name !== 'Day Tour').map((rate, i) => (
                    <option key={i} value={rate.name}>{rate.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-3 md:p-4 cursor-pointer border border-transparent focus-within:border-[#C15A3E]">
                <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Guests</label>
                <select 
                  value={villaCart?.guests || 2}
                  onChange={(e) => handleCartUpdate('guests', e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer"
                >
                  {[...Array(theme.maxGuests)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} Guests</option>
                  ))}
                </select>
              </div>

            </div>

            <button 
              onClick={onProceed}
              disabled={!canProceed}
              className={`w-full md:w-auto h-full min-h-[64px] px-8 rounded-xl font-bold tracking-widest uppercase text-xs transition-all duration-300 ${canProceed ? 'bg-[#C15A3E] text-white shadow-lg hover:bg-[#A34930] hover:shadow-xl hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Proceed <br className="hidden md:block"/> to Booking
            </button>
          </div>
        </div>
      </div>

      <div className="h-48 md:h-32 w-full"></div>

      <div className="max-w-4xl mx-auto px-6 mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-['Playfair_Display'] italic text-[#2A1A12] mb-3">Live Availability</h2>
          <p className="text-gray-500 text-sm font-light">Select your desired check-in date below to begin.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#FAFAFA]">
            <button onClick={prevMonth} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-[#C15A3E]">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="text-xl font-bold text-[#2A1A12] uppercase tracking-widest font-['Syne']">
              {calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-[#C15A3E]">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr bg-gray-50 gap-px">
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="bg-white min-h-[100px] p-2"></div>
            ))}
            {days.map(day => {
              const booked = isDateBooked(day);
              const past = isPastDate(day);
              const unavailable = booked || past;
              const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = villaCart.checkIn === dateStr || villaCart.checkOut === dateStr;

              return (
                <div 
                  key={day} 
                  onClick={() => handleDateClick(day)}
                  className={`bg-white min-h-[100px] p-3 flex flex-col items-center justify-center transition-all relative ${unavailable ? 'opacity-40 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 cursor-pointer group'}`}
                >
                  <div className={`text-lg font-medium w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-[#C15A3E] text-white shadow-md' : unavailable ? 'text-gray-400' : 'text-gray-800 group-hover:bg-[#C15A3E]/10 group-hover:text-[#C15A3E]'}`}>
                    {day}
                  </div>
                  {booked && <span className="text-[8px] font-bold uppercase tracking-widest text-red-400 mt-2">Booked</span>}
                  {!unavailable && !isSelected && <span className="text-[8px] font-bold uppercase tracking-widest text-green-500/0 group-hover:text-green-500 mt-2 transition-colors">Available</span>}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-center gap-6 mt-6">
          <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 rounded-full border border-gray-300 bg-white"></div> Available</div>
          <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 rounded-full bg-gray-200"></div> Booked</div>
          <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 rounded-full bg-[#C15A3E]"></div> Selected</div>
        </div>
      </div>

      {/* ─── 3. PROPERTY OVERVIEW / RATES (ID: rates) ─── */}
      <div id="rates" className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 mb-24 border-t border-gray-200 pt-24">
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C15A3E] mb-4">The Property</h3>
          <h2 className="text-4xl font-['Playfair_Display'] italic text-[#2A1A12] mb-6 leading-tight">Designed for those who seek absolute privacy.</h2>
          <p className="text-gray-600 leading-relaxed font-light mb-8">{theme.aboutBody}</p>
          <div className="grid grid-cols-2 gap-4">
            {theme.amenities.map((amenity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                <div className="w-8 h-8 rounded-full bg-[#C15A3E]/10 flex items-center justify-center text-[#C15A3E]">✧</div>
                {amenity}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col justify-center">
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-8 border-b border-gray-100 pb-4">Standard Rates</h3>
          <div className="space-y-6">
            {theme.rates.slice(0, 3).map((rate, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-[#C15A3E] transition-colors">{rate.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{rate.note}</div>
                </div>
                <div className="text-right">
                  <div className="font-['Playfair_Display'] italic text-2xl text-[#2A1A12]">{formatPHP(rate.price)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">/ {rate.per}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#2A1A12] text-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {theme.specs.slice(0, 4).map((spec, i) => (
            <div key={i}>
              <div className="font-['Playfair_Display'] italic text-4xl md:text-5xl text-[#C15A3E] mb-3">{spec.value}</div>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">{spec.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 5. CONTACT DETAILS (ID: contact) ─── */}
      <div id="contact" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-200">
        <div className="text-center mb-16">
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C15A3E] mb-4">Inquiries</h3>
          <h2 className="text-4xl font-['Playfair_Display'] italic text-[#2A1A12]">Contact Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Facebook</div>
            <a href={theme.contact?.facebookUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#2A1A12] hover:text-[#C15A3E] transition-colors">
              {theme.contact?.facebook}
            </a>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Email</div>
            <a href={`mailto:${theme.contact?.email}`} className="font-medium text-[#2A1A12] hover:text-[#C15A3E] transition-colors">
              {theme.contact?.email}
            </a>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Contact No.</div>
            <div className="font-medium text-[#2A1A12]">{theme.contact?.phone}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Address</div>
            <a href={theme.contact?.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#2A1A12] hover:text-[#C15A3E] transition-colors leading-relaxed block">
              {theme.contact?.address}
            </a>
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-block px-6 py-2 rounded-full border border-gray-200 text-xs italic text-gray-500 font-['Playfair_Display']">
            {theme.contact?.ocularNote}
          </div>
        </div>
      </div>

    </div>
  );
}