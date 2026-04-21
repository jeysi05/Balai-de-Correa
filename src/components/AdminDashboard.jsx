import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import theme from '../theme.config';

// ── Login Component ────────────────────────────────────────────────────────
function AdminLogin({ onLogin, onBack }) {
  const [pw, setPw] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    if (pw === import.meta.env.VITE_ADMIN_PASSWORD) {
      onLogin();
    } else {
      alert('Incorrect password.');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--b-ink)' }}>
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 md:top-10 md:left-10 text-white/40 hover:text-white font-['Syne'] text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-2"
      >
        <span className="text-lg leading-none mb-1">←</span> Back to Website
      </button>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-8 md:p-10 w-full max-w-sm flex flex-col items-center shadow-2xl rounded-2xl relative z-10 backdrop-blur-md">
        <div className="w-12 h-12 mb-4 rounded-full bg-[#2A1A12] flex items-center justify-center border border-[#C15A3E]/30">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C15A3E" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h2 className="font-['Playfair_Display'] text-3xl italic mb-2 text-center" style={{ color: 'var(--b-accent)' }}>{theme.villaName}</h2>
        <p className="font-['Syne'] text-[9px] tracking-[0.2em] uppercase text-white/40 mb-8">Owner Workspace</p>
        <input
          type="password"
          placeholder="Enter access code"
          value={pw}
          onChange={e => setPw(e.target.value)}
          className="w-full bg-black/20 border border-white/10 p-4 text-center text-white font-sans text-[13px] outline-none mb-6 focus:border-[var(--b-accent)] transition-colors rounded-xl"
          autoFocus
        />
        <button type="submit" className="w-full py-4 font-['Syne'] text-[10px] font-bold tracking-[0.15em] uppercase transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg rounded-xl" style={{ background: 'var(--b-accent)', color: 'var(--b-ink)' }}>
          Secure Login
        </button>
      </form>
    </div>
  );
}

// ── Command Center Dashboard ───────────────────────────────────────────────
export default function AdminDashboard({ onLogout, onBack }) {
  const [authed, setAuthed] = useState(false);
  const [currentView, setCurrentView] = useState('reservations'); 
  
  const [reservations, setReservations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [filter, setFilter] = useState('pending_payment');

  // Calendar State
  const [calMonth, setCalMonth] = useState(new Date());

  useEffect(() => {
    if (!authed) return;
    const q = query(collection(db, 'villa_reservations'), orderBy('createdAt', 'desc'));
    const unsubRes = onSnapshot(q, snap => {
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAm = onSnapshot(collection(db, 'amenity_bookings'), snap => {
      setAmenities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubRes(); unsubAm(); };
  }, [authed]);

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} onBack={onBack} />; 

  // --- Actions ---
  const handleVerifyPayment = async (res) => {
    try {
      await updateDoc(doc(db, 'villa_reservations', res.id), { status: 'confirmed' });
      const linkedAmenities = amenities.filter(a => a.reservation_id === res.id);
      await Promise.all(linkedAmenities.map(am => 
        updateDoc(doc(db, 'amenity_bookings', am.id), { status: 'confirmed' })
      ));
    } catch (e) {
      console.error(e);
      alert('Error verifying payment.');
    }
  };

  const handleCancel = async (resId) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    await updateDoc(doc(db, 'villa_reservations', resId), { status: 'cancelled' });
    const linkedAmenities = amenities.filter(a => a.reservation_id === resId);
    await Promise.all(linkedAmenities.map(am => updateDoc(doc(db, 'amenity_bookings', am.id), { status: 'cancelled' })));
  };

  const handleDelete = async (resId) => {
    if (!confirm('Permanently delete this record?')) return;
    await deleteDoc(doc(db, 'villa_reservations', resId));
    const linkedAmenities = amenities.filter(a => a.reservation_id === resId);
    await Promise.all(linkedAmenities.map(am => deleteDoc(doc(db, 'amenity_bookings', am.id))));
  };

  // --- KPI Math ---
  const confirmedRes = reservations.filter(r => r.status === 'confirmed');
  const totalRevenue = confirmedRes.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const pendingRevenue = reservations.filter(r => r.status === 'pending_payment').reduce((sum, r) => sum + (r.totalPrice || 0), 0);

  // --- Calendar Logic ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const currentYear = calMonth.getFullYear();
  const currentMonthIdx = calMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonthIdx);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonthIdx);
  
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCalMonth(new Date(currentYear, currentMonthIdx - 1, 1));
  const nextMonth = () => setCalMonth(new Date(currentYear, currentMonthIdx + 1, 1));

  // Helper to check if a date has a booking
  const getBookingsForDate = (day) => {
    const checkDateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDateObj = new Date(checkDateStr);
    
    return confirmedRes.filter(res => {
      const start = new Date(res.checkIn);
      const end = new Date(res.checkOut);
      // Include date if it falls between checkIn and checkOut
      return checkDateObj >= start && checkDateObj < end; 
    });
  };

  // --- UI Helpers ---
  const StatusPill = ({ status }) => {
    if (status === 'confirmed') return <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-200">Confirmed</span>;
    if (status === 'pending_payment') return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-200">Pending Pay</span>;
    if (status === 'cancelled') return <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-gray-200">Cancelled</span>;
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F9F8F6] text-[#0D1A12] font-sans">
      
      {/* ─── SIDEBAR ─── */}
      <div className="w-full md:w-72 p-6 flex flex-col justify-between shrink-0 border-r border-white/10 shadow-2xl z-10" style={{ background: 'var(--b-ink)' }}>
        <div>
          <div className="flex items-center gap-3 mb-10 mt-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C15A3E] font-['Playfair_Display'] italic text-xl">
              {theme.villaName.charAt(0)}
            </div>
            <div>
              <div className="font-['Syne'] text-[8px] tracking-[0.2em] uppercase text-[#C15A3E] mb-0.5">Resort OS</div>
              <h1 className="font-['Playfair_Display'] text-lg italic text-white leading-none">{theme.villaName}</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'reservations', label: 'Reservations', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'calendar', label: 'Calendar Sync', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { id: 'analytics', label: 'Revenue Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[12px] font-semibold transition-all ${
                  currentView === tab.id 
                    ? 'bg-[#C15A3E] text-[#0D1A12] shadow-lg shadow-[#C15A3E]/20' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-white/30 hover:text-white text-[12px] transition-colors pt-6 md:pt-0 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Log out
        </button>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        
        {/* VIEW: RESERVATIONS */}
        {currentView === 'reservations' && (
          <div className="animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-['Playfair_Display'] text-4xl italic text-[#2A1A12] leading-none mb-2">Reservations</h2>
                <p className="text-gray-500 text-sm">Manage your upcoming guests and payments.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Gross Revenue</div>
                <div className="font-['Playfair_Display'] text-3xl italic text-gray-900">₱{totalRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Confirmed Stays</div>
                <div className="font-['Playfair_Display'] text-3xl italic text-gray-900">{confirmedRes.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Pending Actions</div>
                <div className="font-['Playfair_Display'] text-3xl italic text-[#C15A3E]">
                  {reservations.filter(r => r.status === 'pending_payment').length}
                </div>
              </div>
            </div>

            <div className="flex gap-6 border-b border-gray-200 mb-6 px-2">
              {['pending_payment', 'confirmed', 'cancelled'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`pb-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all relative ${filter === tab ? 'text-[#2A1A12]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab.replace('_', ' ')}
                  {filter === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2A1A12] rounded-t-full"></div>}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {reservations.filter(r => r.status === filter).map(res => {
                const childAmenities = amenities.filter(a => a.reservation_id === res.id);
                return (
                  <div key={res.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-lg font-bold text-gray-900">{res.guestName}</div>
                          <StatusPill status={res.status} />
                        </div>
                        <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                          <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {res.checkIn} to {res.checkOut} <span className="mx-1">•</span> {res.guests} Pax
                        </div>
                        <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          {res.paymentChannel} Ref: {res.referenceNo}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">
                        <div className="font-['Playfair_Display'] text-2xl italic text-[#2A1A12]">₱{res.totalPrice?.toLocaleString()}</div>
                        <div className="flex gap-2">
                          {res.status === 'pending_payment' && (
                            <button onClick={() => handleVerifyPayment(res)} className="px-5 py-2.5 bg-[#2A1A12] text-[#C15A3E] rounded-lg font-['Syne'] text-[9px] font-bold tracking-widest uppercase hover:bg-[#0D1A12] transition-colors shadow-sm">
                              Verify Payment
                            </button>
                          )}
                          {res.status !== 'cancelled' && (
                            <button onClick={() => handleCancel(res.id)} className="px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-['Syne'] text-[9px] font-bold tracking-widest uppercase transition-colors">
                              Cancel
                            </button>
                          )}
                          <button onClick={() => handleDelete(res.id)} className="p-2.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {childAmenities.length > 0 && (
                      <div className="bg-gray-50 border-t border-gray-100 p-5 px-6 md:px-8">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">Attached Add-ons</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {childAmenities.map(am => (
                            <div key={am.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center text-xs shadow-sm">
                              <span className="font-semibold text-gray-800">{am.name}</span>
                              <span className="text-[#C15A3E] font-medium">{am.date} @ {am.timeLabel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {reservations.filter(r => r.status === filter).length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.894.553l-.242.484a1 1 0 01-.894.553H10.618a1 1 0 01-.894-.553l-.242-.484a1 1 0 00-.894-.553H4" /></svg>
                  </div>
                  <div className="text-gray-500 font-medium text-sm">No reservations found in this queue.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: CALENDAR SYNC (NEW INTEGRATED CALENDAR) */}
        {currentView === 'calendar' && (
          <div className="animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h2 className="font-['Playfair_Display'] text-4xl italic text-[#2A1A12] leading-none mb-2">Availability Calendar</h2>
                <p className="text-gray-500 text-sm">Your master view of all direct bookings.</p>
              </div>
              
              {/* Premium Sync Action */}
              <button 
                onClick={() => alert(`iCal Sync Link:\nhttps://api.resortos.com/ical/${theme.id || 'casa-verde'}.ics\n\n(Paste this into Google Calendar or Airbnb to sync)`)}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-800 text-xs font-bold uppercase tracking-widest rounded-xl hover:border-[#C15A3E] hover:text-[#C15A3E] transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Sync to Google Calendar
              </button>
            </div>

            {/* The Integrated Native Calendar */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
              
              {/* Calendar Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={nextMonth} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px">
                {blanks.map((_, i) => (
                  <div key={`blank-${i}`} className="bg-white min-h-[120px] p-2"></div>
                ))}
                
                {days.map(day => {
                  const dayBookings = getBookingsForDate(day);
                  const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonthIdx && new Date().getFullYear() === currentYear;

                  return (
                    <div key={day} className={`bg-white min-h-[120px] p-2 transition-colors hover:bg-gray-50 relative ${isToday ? 'bg-amber-50/30' : ''}`}>
                      <div className={`text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-[#2A1A12] text-[#C15A3E]' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      
                      {/* Booking Bar Render */}
                      <div className="space-y-1">
                        {dayBookings.map(b => (
                          <div key={b.id} className="px-2 py-1.5 bg-[#2A1A12] text-white text-[10px] font-medium rounded-md truncate shadow-sm border border-[#2A1A12]/80 cursor-pointer" title={`${b.guestName} (${b.guests} Pax)`}>
                            {b.guestName.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        )}

        {/* VIEW: REVENUE ANALYTICS */}
        {currentView === 'analytics' && (
          <div className="animate-fade-in max-w-6xl mx-auto">
            <h2 className="font-['Playfair_Display'] text-4xl italic text-[#2A1A12] leading-none mb-2">Revenue Analytics</h2>
            <p className="text-gray-500 text-sm mb-10">Deep insights into your property's direct booking performance.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#2A1A12] text-white p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-[0.03]">
                  {/* NEW PESO WATERMARK SVG */}
                  <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-[-10deg]">
                    <path d="M8 19V5" />
                    <path d="M8 5h6.5a4.5 4.5 0 1 1 0 9H8" />
                    <path d="M5 10h11" />
                    <path d="M5 14h11" />
                  </svg>
                </div>
                <div className="font-['Syne'] text-[10px] text-[#C15A3E] font-bold tracking-widest uppercase mb-3 relative z-10">Total Confirmed Revenue</div>
                <div className="font-['Playfair_Display'] text-5xl md:text-6xl italic mb-6 relative z-10">₱{totalRevenue.toLocaleString()}</div>
                <div className="flex items-center gap-2 text-xs font-medium text-white/70 relative z-10">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md">↑ 12%</span> vs last month
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 p-8 md:p-10 rounded-3xl shadow-sm flex flex-col justify-center">
                <div className="font-['Syne'] text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Revenue in Pipeline</div>
                <div className="font-['Playfair_Display'] text-4xl italic text-gray-900 mb-3">₱{pendingRevenue.toLocaleString()}</div>
                <div className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-lg inline-block w-max">Awaiting payment verification</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 md:p-10 rounded-3xl shadow-sm mb-8">
              <h3 className="font-['Playfair_Display'] text-2xl italic mb-8 text-[#2A1A12]">Revenue Trajectory</h3>
              <div className="flex items-end gap-3 h-56 mt-4 border-b border-gray-100 pb-2">
                {[30, 45, 20, 60, 85, 50, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group h-full">
                    <div className="w-full bg-[#2A1A12]/5 group-hover:bg-[#C15A3E] transition-all duration-300 rounded-t-xl relative" style={{ height: `${h}%` }}>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0D1A12] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all shadow-lg pointer-events-none">
                        ₱{(h * 1500).toLocaleString()}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0D1A12] rotate-45"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}