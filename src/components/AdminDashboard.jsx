import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import theme from '../theme.config';

const FILTERS = [
  { id: 'pending_payment', label: 'Needs Verification' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

const VIEWS = [
  {
    id: 'reservations',
    label: 'Reservations',
    description: 'Verify payments and manage guest requests.',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'See blocked and upcoming stay dates.',
  },
  {
    id: 'insights',
    label: 'Insights',
    description: 'Review real booking revenue and pipeline.',
  },
];

function formatPHP(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH')}`;
}

function toLocalDate(value) {
  if (!value) return null;

  if (value?.toDate) {
    const date = value.toDate();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string' && value.includes('-')) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(value) {
  const date = toLocalDate(value);

  if (!date) return 'No date';

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateRange(checkIn, checkOut) {
  return `${formatDate(checkIn)} → ${formatDate(checkOut)}`;
}

function formatDateTime(value) {
  if (!value) return 'Recently';

  let date;

  if (value?.toDate) {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return 'Recently';

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateNights(checkIn, checkOut) {
  const start = toLocalDate(checkIn);
  const end = toLocalDate(checkOut);

  if (!start || !end) return 0;

  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return diff > 0 ? diff : 0;
}

function getStatusMeta(status) {
  if (status === 'confirmed') {
    return {
      label: 'Confirmed',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      card: 'border-emerald-200',
    };
  }

  if (status === 'cancelled') {
    return {
      label: 'Cancelled',
      dot: 'bg-gray-400',
      badge: 'bg-gray-100 text-gray-500 border-gray-200',
      card: 'border-gray-200',
    };
  }

  return {
    label: 'Needs Verification',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    card: 'border-amber-200',
  };
}

function reservationOverlapsDate(reservation, date) {
  const start = toLocalDate(reservation.checkIn);
  const end = toLocalDate(reservation.checkOut);

  if (!start || !end || !date) return false;

  return date >= start && date < end;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function AdminLogin({ onLogin, onBack }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (!expectedPassword) {
      setError('Admin password is not configured in your .env file.');
      return;
    }

    if (password === expectedPassword) {
      onLogin();
      return;
    }

    setError('Incorrect access code.');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#2A1A12] p-4">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-5 top-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-white md:left-10 md:top-10"
      >
        <span className="text-lg leading-none">←</span>
        Back to Website
      </button>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-10"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C15A3E]/35 bg-black/20 text-[#C15A3E]">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
          Owner Portal
        </p>

        <h1 className="font-display text-4xl font-semibold italic leading-none text-[#FFF9F2]">
          {theme.villaName}
        </h1>

        <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-white/45">
          Enter the owner access code to review booking requests and verify payments.
        </p>

        <input
          type="password"
          placeholder="Access code"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-8 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#C15A3E]"
          autoFocus
        />

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-[#C15A3E] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#A34930]"
        >
          Secure Login
        </button>
      </form>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#2A1A12]/15 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2A1A12]/5 text-[#2A1A12]/30">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.5a1 1 0 00-.9.55l-.2.45a1 1 0 01-.9.55h-4.9a1 1 0 01-.9-.55l-.2-.45A1 1 0 008.5 13H4"
          />
        </svg>
      </div>

      <h3 className="font-display text-3xl font-semibold italic text-[#2A1A12]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-7 text-[#2A1A12]/50">{description}</p>
    </div>
  );
}

export default function AdminDashboard({ onLogout, onBack }) {
  const [authed, setAuthed] = useState(false);
  const [currentView, setCurrentView] = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [filter, setFilter] = useState('pending_payment');
  const [calMonth, setCalMonth] = useState(new Date());

  useEffect(() => {
    if (!authed) return undefined;

    const reservationsQuery = query(
      collection(db, 'villa_reservations'),
      orderBy('createdAt', 'desc')
    );

    const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
      setReservations(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
    });

    const unsubAmenities = onSnapshot(collection(db, 'amenity_bookings'), (snapshot) => {
      setAmenities(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
    });

    return () => {
      unsubReservations();
      unsubAmenities();
    };
  }, [authed]);

  const confirmedReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'confirmed'),
    [reservations]
  );

  const pendingReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'pending_payment'),
    [reservations]
  );

  const cancelledReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'cancelled'),
    [reservations]
  );

  const filteredReservations = useMemo(() => {
    if (filter === 'all') return reservations;

    return reservations.filter((reservation) => reservation.status === filter);
  }, [filter, reservations]);

  const totalRevenue = confirmedReservations.reduce(
    (sum, reservation) => sum + Number(reservation.totalPrice || 0),
    0
  );

  const pipelineRevenue = pendingReservations.reduce(
    (sum, reservation) => sum + Number(reservation.totalPrice || 0),
    0
  );

  const averageConfirmedBooking =
    confirmedReservations.length > 0
      ? Math.round(totalRevenue / confirmedReservations.length)
      : 0;

  const today = toLocalDate(new Date());

  const upcomingConfirmed = confirmedReservations.filter((reservation) => {
    const checkOut = toLocalDate(reservation.checkOut);
    return checkOut && today && checkOut >= today;
  });

  const monthBuckets = useMemo(() => {
    const now = new Date();
    const buckets = [];

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      buckets.push({
        key: getMonthKey(date),
        label: date.toLocaleDateString('en-PH', { month: 'short' }),
        amount: 0,
      });
    }

    confirmedReservations.forEach((reservation) => {
      const date = toLocalDate(reservation.checkIn || reservation.createdAt);
      if (!date) return;

      const key = getMonthKey(date);
      const bucket = buckets.find((item) => item.key === key);

      if (bucket) {
        bucket.amount += Number(reservation.totalPrice || 0);
      }
    });

    return buckets;
  }, [confirmedReservations]);

  const maxMonthAmount = Math.max(...monthBuckets.map((bucket) => bucket.amount), 1);

  const currentYear = calMonth.getFullYear();
  const currentMonthIdx = calMonth.getMonth();
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonthIdx, 1).getDay();

  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const getBookingsForDate = (day) => {
    const date = new Date(currentYear, currentMonthIdx, day);

    return reservations
      .filter((reservation) => reservation.status !== 'cancelled')
      .filter((reservation) => reservationOverlapsDate(reservation, date));
  };

  const handleVerifyPayment = async (reservation) => {
    const confirmed = window.confirm(
      `Verify payment for ${reservation.guestName || 'this guest'}?\n\nReference: ${
        reservation.referenceNo || 'No reference'
      }\nAmount: ${formatPHP(reservation.totalPrice)}`
    );

    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'villa_reservations', reservation.id), {
        status: 'confirmed',
        paymentStatus: 'verified',
        verifiedAt: new Date().toISOString(),
      });

      const linkedAmenities = amenities.filter(
        (amenity) => amenity.reservation_id === reservation.id
      );

      await Promise.all(
        linkedAmenities.map((amenity) =>
          updateDoc(doc(db, 'amenity_bookings', amenity.id), {
            status: 'confirmed',
          })
        )
      );
    } catch (error) {
      console.error(error);
      alert('Payment could not be verified. Please try again.');
    }
  };

  const handleCancel = async (reservation) => {
    const confirmed = window.confirm(
      `Cancel reservation for ${reservation.guestName || 'this guest'}?`
    );

    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'villa_reservations', reservation.id), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      });

      const linkedAmenities = amenities.filter(
        (amenity) => amenity.reservation_id === reservation.id
      );

      await Promise.all(
        linkedAmenities.map((amenity) =>
          updateDoc(doc(db, 'amenity_bookings', amenity.id), {
            status: 'cancelled',
          })
        )
      );
    } catch (error) {
      console.error(error);
      alert('Reservation could not be cancelled. Please try again.');
    }
  };

  const handleDelete = async (reservation) => {
    const confirmed = window.confirm(
      `Permanently delete the record for ${reservation.guestName || 'this guest'}?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'villa_reservations', reservation.id));

      const linkedAmenities = amenities.filter(
        (amenity) => amenity.reservation_id === reservation.id
      );

      await Promise.all(
        linkedAmenities.map((amenity) => deleteDoc(doc(db, 'amenity_bookings', amenity.id)))
      );
    } catch (error) {
      console.error(error);
      alert('Record could not be deleted. Please try again.');
    }
  };

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-[#F6EFE6] text-[#2A1A12] lg:flex">
      <aside className="border-b border-white/10 bg-[#2A1A12] p-5 text-[#FFF9F2] lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:border-b-0 lg:border-r lg:p-7">
        <div className="flex items-center justify-between gap-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#C15A3E]/35 bg-white/5 font-display text-2xl italic text-[#C15A3E]">
              {theme.villaName?.charAt(0) || 'B'}
            </div>

            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-[#C15A3E]">
                Owner Portal
              </p>

              <h1 className="font-display text-2xl font-semibold italic leading-none">
                {theme.villaName}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-white lg:hidden"
          >
            Logout
          </button>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {VIEWS.map((view) => (
            <button
              type="button"
              key={view.id}
              onClick={() => setCurrentView(view.id)}
              className={`min-w-max rounded-2xl px-4 py-3 text-left transition lg:min-w-0 ${
                currentView === view.id
                  ? 'bg-[#C15A3E] text-white shadow-lg shadow-[#C15A3E]/20'
                  : 'bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]">
                {view.label}
              </div>

              <div className="mt-1 hidden text-xs leading-5 opacity-65 lg:block">
                {view.description}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
            Today’s Focus
          </p>

          <div className="mt-4 font-display text-5xl italic leading-none text-white">
            {pendingReservations.length}
          </div>

          <p className="mt-3 text-sm leading-7 text-white/45">
            booking request{pendingReservations.length === 1 ? '' : 's'} waiting for manual payment verification.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-8 hidden text-[11px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-white lg:block"
        >
          Log out
        </button>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        {currentView === 'reservations' && (
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
                  Reservation Queue
                </p>

                <h2 className="font-display text-5xl font-semibold italic leading-none tracking-[-0.035em] md:text-6xl">
                  Owner workspace.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2A1A12]/58">
                  Review new booking requests, match the payment reference, then confirm the stay once payment is verified.
                </p>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="w-fit rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/60 transition hover:border-[#C15A3E]/40 hover:text-[#C15A3E]"
              >
                View Website
              </button>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/38">
                  Needs Verification
                </div>

                <div className="font-display mt-3 text-5xl italic leading-none text-[#C15A3E]">
                  {pendingReservations.length}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/38">
                  Confirmed Stays
                </div>

                <div className="font-display mt-3 text-5xl italic leading-none">
                  {upcomingConfirmed.length}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/38">
                  Confirmed Revenue
                </div>

                <div className="font-display mt-3 text-4xl italic leading-none">
                  {formatPHP(totalRevenue)}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/38">
                  Pending Pipeline
                </div>

                <div className="font-display mt-3 text-4xl italic leading-none text-[#C15A3E]">
                  {formatPHP(pipelineRevenue)}
                </div>
              </div>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-2">
              {FILTERS.map((item) => {
                const count =
                  item.id === 'all'
                    ? reservations.length
                    : reservations.filter((reservation) => reservation.status === item.id).length;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={`min-w-max rounded-2xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                      filter === item.id
                        ? 'bg-[#2A1A12] text-[#FFF9F2]'
                        : 'text-[#2A1A12]/45 hover:bg-[#2A1A12]/5 hover:text-[#2A1A12]'
                    }`}
                  >
                    {item.label}
                    <span className="ml-2 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {filteredReservations.map((reservation) => {
                const statusMeta = getStatusMeta(reservation.status);
                const childAmenities = amenities.filter(
                  (amenity) => amenity.reservation_id === reservation.id
                );
                const nights = calculateNights(reservation.checkIn, reservation.checkOut);

                return (
                  <article
                    key={reservation.id}
                    className={`overflow-hidden rounded-[28px] border bg-[#FFF9F2] shadow-[0_18px_50px_rgba(42,26,18,0.06)] ${statusMeta.card}`}
                  >
                    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1.1fr_0.8fr_auto] lg:items-center lg:p-7">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-[#2A1A12]">
                            {reservation.guestName || 'Unnamed Guest'}
                          </h3>

                          <StatusBadge status={reservation.status} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm text-[#2A1A12]/58 sm:grid-cols-2">
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                              Stay Dates
                            </div>

                            <div className="mt-1 font-medium text-[#2A1A12]">
                              {formatDateRange(reservation.checkIn, reservation.checkOut)}
                            </div>

                            <div className="mt-1 text-xs text-[#2A1A12]/45">
                              {nights || 1} night{(nights || 1) > 1 ? 's' : ''} · {reservation.guests || 0} guest{Number(reservation.guests || 0) === 1 ? '' : 's'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                              Guest Contact
                            </div>

                            <div className="mt-1 font-medium text-[#2A1A12]">
                              {reservation.guestContact || 'No contact saved'}
                            </div>

                            <div className="mt-1 text-xs text-[#2A1A12]/45">
                              Requested {formatDateTime(reservation.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#2A1A12]/10 bg-white p-4">
                        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                          Payment Reference
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-4">
                          <div>
                            <div className="font-mono text-lg font-bold tracking-[0.1em] text-[#C15A3E]">
                              {reservation.referenceNo || '—'}
                            </div>

                            <div className="mt-1 text-xs text-[#2A1A12]/45">
                              {reservation.paymentChannel || 'Payment channel not saved'}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-display text-3xl italic leading-none">
                              {formatPHP(reservation.totalPrice)}
                            </div>

                            <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#2A1A12]/35">
                              total
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-[190px]">
                        {reservation.status === 'pending_payment' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment(reservation)}
                            className="rounded-2xl bg-[#2A1A12] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFF9F2] transition hover:bg-[#C15A3E]"
                          >
                            Verify Payment
                          </button>
                        )}

                        {reservation.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(reservation)}
                            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-100"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(reservation)}
                          className="rounded-2xl border border-[#2A1A12]/10 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/40 transition hover:border-[#2A1A12]/25 hover:text-[#2A1A12]"
                        >
                          Delete Record
                        </button>
                      </div>
                    </div>

                    {childAmenities.length > 0 && (
                      <div className="border-t border-[#2A1A12]/10 bg-[#F6EFE6] p-5 lg:px-7">
                        <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#2A1A12]/38">
                          Add-ons & Deposit
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {childAmenities.map((amenity) => (
                            <div
                              key={amenity.id}
                              className="rounded-2xl border border-[#2A1A12]/10 bg-[#FFF9F2] p-4"
                            >
                              <div className="font-semibold text-[#2A1A12]">{amenity.name}</div>

                              <div className="mt-1 text-xs leading-6 text-[#2A1A12]/50">
                                {amenity.timeLabel === 'Entire Stay'
                                  ? 'Entire stay'
                                  : `${amenity.date || 'Selected date'} · ${
                                      amenity.timeLabel || 'Selected time'
                                    }`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {filteredReservations.length === 0 && (
                <EmptyState
                  title="No bookings here yet."
                  description="Once guests submit booking requests, they will appear in this queue."
                />
              )}
            </div>
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
                  Availability Calendar
                </p>

                <h2 className="font-display text-5xl font-semibold italic leading-none tracking-[-0.035em] md:text-6xl">
                  Booking calendar.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2A1A12]/58">
                  Confirmed and pending reservations appear here so owners can quickly see blocked dates.
                </p>
              </div>

              <button
                type="button"
                disabled={!theme.calendarSyncUrl}
                onClick={() => {
                  if (!theme.calendarSyncUrl) {
                    alert('Calendar sync URL is not configured yet.');
                    return;
                  }

                  navigator.clipboard.writeText(theme.calendarSyncUrl);
                  alert('Calendar sync URL copied.');
                }}
                className={`w-fit rounded-2xl px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
                  theme.calendarSyncUrl
                    ? 'bg-[#2A1A12] text-[#FFF9F2] hover:bg-[#C15A3E]'
                    : 'cursor-not-allowed border border-[#2A1A12]/10 bg-[#FFF9F2] text-[#2A1A12]/35'
                }`}
              >
                {theme.calendarSyncUrl ? 'Copy Sync URL' : 'Sync URL Not Configured'}
              </button>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] shadow-[0_20px_60px_rgba(42,26,18,0.06)]">
              <div className="flex items-center justify-between border-b border-[#2A1A12]/10 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => setCalMonth(new Date(currentYear, currentMonthIdx - 1, 1))}
                  className="rounded-xl border border-[#2A1A12]/10 bg-white p-2 text-[#2A1A12]/55 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
                  aria-label="Previous month"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <h3 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-[#2A1A12] sm:text-xl">
                  {calMonth.toLocaleDateString('en-PH', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>

                <button
                  type="button"
                  onClick={() => setCalMonth(new Date(currentYear, currentMonthIdx + 1, 1))}
                  className="rounded-xl border border-[#2A1A12]/10 bg-white p-2 text-[#2A1A12]/55 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
                  aria-label="Next month"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 border-b border-[#2A1A12]/10 bg-[#F6EFE6]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[#2A1A12]/35"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-[#2A1A12]/10">
                {blanks.map((_, index) => (
                  <div key={`blank-${index}`} className="min-h-[72px] bg-white p-1 sm:min-h-[120px] sm:p-2" />
                ))}

                {days.map((day) => {
                  const dayBookings = getBookingsForDate(day);
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentMonthIdx &&
                    new Date().getFullYear() === currentYear;

                  return (
                    <div
                      key={day}
                      className={`min-h-[72px] bg-white p-1 sm:min-h-[120px] sm:p-2 ${
                        isToday ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div
                        className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 ${
                          isToday ? 'bg-[#C15A3E] text-white' : 'text-[#2A1A12]/70'
                        }`}
                      >
                        {day}
                      </div>

                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className={`truncate rounded-lg px-2 py-1 text-[9px] font-bold ${
                              booking.status === 'confirmed'
                                ? 'bg-[#2A1A12] text-white'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                            title={`${booking.guestName} · ${booking.guests} guests`}
                          >
                            {booking.guestName?.split(' ')[0] || 'Guest'}
                          </div>
                        ))}

                        {dayBookings.length > 2 && (
                          <div className="text-[9px] font-semibold text-[#2A1A12]/35">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentView === 'insights' && (
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
                Real Insights
              </p>

              <h2 className="font-display text-5xl font-semibold italic leading-none tracking-[-0.035em] md:text-6xl">
                Revenue overview.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2A1A12]/58">
                These numbers are calculated from actual saved reservations. No fake growth percentages.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[28px] bg-[#2A1A12] p-7 text-[#FFF9F2]">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                  Confirmed Revenue
                </div>

                <div className="font-display mt-4 text-5xl italic leading-none">
                  {formatPHP(totalRevenue)}
                </div>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  From {confirmedReservations.length} confirmed booking{confirmedReservations.length === 1 ? '' : 's'}.
                </p>
              </div>

              <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-7">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/38">
                  Pending Pipeline
                </div>

                <div className="font-display mt-4 text-5xl italic leading-none text-[#C15A3E]">
                  {formatPHP(pipelineRevenue)}
                </div>

                <p className="mt-4 text-sm leading-7 text-[#2A1A12]/50">
                  From {pendingReservations.length} booking request{pendingReservations.length === 1 ? '' : 's'} waiting for verification.
                </p>
              </div>

              <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-7">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/38">
                  Average Confirmed Booking
                </div>

                <div className="font-display mt-4 text-5xl italic leading-none">
                  {formatPHP(averageConfirmedBooking)}
                </div>

                <p className="mt-4 text-sm leading-7 text-[#2A1A12]/50">
                  Based only on confirmed reservations.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-6 md:p-8">
              <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/38">
                    Last 6 Months
                  </div>

                  <h3 className="font-display mt-2 text-3xl font-semibold italic">
                    Confirmed revenue by check-in month.
                  </h3>
                </div>
              </div>

              <div className="flex h-64 items-end gap-3 border-b border-[#2A1A12]/10 pb-3">
                {monthBuckets.map((bucket) => {
                  const height = Math.max(8, (bucket.amount / maxMonthAmount) * 100);

                  return (
                    <div key={bucket.key} className="flex h-full flex-1 flex-col justify-end">
                      <div className="group relative flex flex-1 items-end">
                        <div
                          className="w-full rounded-t-2xl bg-[#2A1A12]/10 transition hover:bg-[#C15A3E]"
                          style={{ height: `${height}%` }}
                        />

                        <div className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 rounded-xl bg-[#2A1A12] px-3 py-2 text-[10px] font-bold text-white shadow-xl group-hover:block">
                          {formatPHP(bucket.amount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#2A1A12]/35">
                {monthBuckets.map((bucket) => (
                  <span key={bucket.key}>{bucket.label}</span>
                ))}
              </div>
            </div>

            {reservations.length === 0 && (
              <div className="mt-6">
                <EmptyState
                  title="No data yet."
                  description="Analytics will become useful once test or real reservations are submitted."
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}