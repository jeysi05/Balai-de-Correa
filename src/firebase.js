import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
import { writeBatch, doc, collection } from "firebase/firestore";

export const commitMasterBooking = async (villaReservation, amenityBookings) => {
  const batch = writeBatch(db);
  
  const reservationRef = doc(collection(db, "villa_reservations"));
  batch.set(reservationRef, {
    ...villaReservation,
    createdAt: new Date().toISOString(),
    status: 'pending_payment' 
  });

  amenityBookings.forEach(amenity => {
    const amenityRef = doc(collection(db, "amenity_bookings"));
    batch.set(amenityRef, { 
      ...amenity, 
      reservation_id: reservationRef.id, 
      status: 'pending_payment'
    });
  });

  await batch.commit();
  return reservationRef.id;
};