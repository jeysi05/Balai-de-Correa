import { initializeApp, getApps, getApp } from "firebase/app";
import {
  collection,
  doc,
  initializeFirestore,
  writeBatch,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function validateFirebaseConfig(config) {
  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingKeys.join(", ")}. Check your .env file locally and your Vercel Environment Variables.`
    );
  }
}

validateFirebaseConfig(firebaseConfig);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export const storage = getStorage(app);

function withTimeout(promise, timeoutMs = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Firestore request timed out. Please check your internet connection, browser extensions, Firebase rules, or Vercel environment variables."
          )
        );
      }, timeoutMs);
    }),
  ]);
}

export const commitMasterBooking = async (villaReservation, amenityBookings = []) => {
  if (!villaReservation) {
    throw new Error("Missing reservation data.");
  }

  const batch = writeBatch(db);
  const reservationRef = doc(collection(db, "villa_reservations"));

  const reservationStatus = villaReservation.status || "pending_payment";
  const paymentStatus = villaReservation.paymentStatus || "pending_owner_review";

  batch.set(reservationRef, {
    ...villaReservation,
    id: reservationRef.id,
    createdAt: villaReservation.createdAt || new Date().toISOString(),
    status: reservationStatus,
    paymentStatus,
  });

  amenityBookings.forEach((amenity) => {
    if (!amenity || !amenity.amenityId) return;

    const amenityRef = doc(collection(db, "amenity_bookings"));

    batch.set(amenityRef, {
      ...amenity,
      id: amenityRef.id,
      reservation_id: reservationRef.id,
      status: reservationStatus,
      createdAt: new Date().toISOString(),
    });
  });

  await withTimeout(batch.commit(), 12000);

  return reservationRef.id;
};