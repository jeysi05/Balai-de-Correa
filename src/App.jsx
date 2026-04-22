import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { injectTheme } from './injectTheme';

import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import BookingPage from './components/BookingPage'; 
import PaymentModal from './components/PaymentModal';
import AdminDashboard from './components/AdminDashboard'; 

import './index.css';

export default function App() {
  const [page, setPage] = useState('home'); 
  const [isAdmin, setIsAdmin] = useState(false); 
  
  // Real-time Database State
  const [liveReservations, setLiveReservations] = useState([]);
  const [liveAmenities, setLiveAmenities] = useState([]);

  // Master Cart State
  const [villaCart, setVillaCart] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    package: 'Tres Package', // <-- Added Package State
    occasion: '',
    basePrice: 0 
  });
  const [amenitiesCart, setAmenitiesCart] = useState([]); 
  const [showPayment, setShowPayment] = useState(false);

  // Inject brand colors on mount
  useEffect(() => { injectTheme(); }, []);

  // Sync Parent and Child tables dynamically
  useEffect(() => {
    const unsubVilla = onSnapshot(collection(db, 'villa_reservations'), snap => {
      setLiveReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAmenities = onSnapshot(collection(db, 'amenity_bookings'), snap => {
      setLiveAmenities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubVilla(); unsubAmenities(); };
  }, []);

  // Admin Routing Handler
  const handleAdminLogin = () => {
    setIsAdmin(true);
    setPage('admin');
  };

  // Render Admin Dashboard bypassing the normal site shell
  if (isAdmin) {
    return (
      <AdminDashboard
        onLogout={() => { setIsAdmin(false); setPage('home'); }}
        onBack={() => { setIsAdmin(false); setPage('home'); }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
      <Navbar
        onLogoClick={() => setPage('home')}
        showBack={page === 'booking'}
        onBackClick={() => setPage('home')}
        onAdminClick={handleAdminLogin} 
        onBookClick={() => setPage('booking')} 
      />

      {page === 'home' && (
        <HomePage
          villaCart={villaCart}
          setVillaCart={setVillaCart}
          onProceed={() => setPage('booking')}
          liveReservations={liveReservations}
        />
      )}

      {page === 'booking' && (
        <BookingPage
          villaCart={villaCart}
          amenitiesCart={amenitiesCart}
          setAmenitiesCart={setAmenitiesCart}
          liveAmenities={liveAmenities}
          onCheckout={() => setShowPayment(true)}
          onBack={() => setPage('home')}
        />
      )}

      {showPayment && (
        <PaymentModal
          villaCart={villaCart}
          amenitiesCart={amenitiesCart}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            // Reset state including the new package field
            setVillaCart({ checkIn: '', checkOut: '', guests: 2, package: 'Tres Package', occasion: '', basePrice: 0 });
            setAmenitiesCart([]);
            setPage('home');
          }}
        />
      )}
    </div>
  );
}