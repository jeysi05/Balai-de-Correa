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
  { id: 'pending_payment', label: 'Needs Review' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

const VIEWS = [
  {
    id: 'requests',
    label: 'Requests',
    description: 'Review room requests, guest details, and payment references.',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'See requested and confirmed stay dates.',
  },
  {
    id: 'insights',
    label: 'Insights',
    description: 'Review confirmed revenue and pending request value.',
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
    label: 'Needs Review',
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

function getRoomName(reservation) {
  return (
    reservation.roomTypeName ||
    reservation.roomName ||
    reservation.package ||
    reservation.selectedRoom ||
    'Room to confirm'
  );
}

function getPaymentStatusText(reservation) {
  if (reservation.status === 'confirmed') return 'Confirmed by owner';
  if (reservation.status === 'cancelled') return 'Cancelled';

  if (reservation.paymentStatus === 'pending_verification') {
    return 'Payment reference submitted';
  }

  if (reservation.paymentStatus === 'pending_owner_review') {
    return 'Rate and availability to confirm';
  }

  return 'Needs owner review';
}

function getReservationAmountLabel(reservation) {
  const amount = Number(reservation.totalPrice || reservation.amountPaid || 0);

  if (amount > 0) return formatPHP(amount);

  return 'To confirm';
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
          Enter the owner access code to review room requests, payment references, and confirmed stays.
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
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#2A1A12]/15 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2A1A12]/5 text-[#2A1A12]/30">
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.5a1 1 0 00-.9.55l-.2.45a1 1 0 01-.9.55h-4.9a1 1 0 01-.9-.55l-.2-.45A1 1 0 008.5 13H4"
          />
        </svg>
      </div>

      <h3 className="font-display text-3xl font-semibold italic text-[#2A1A12]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-[#2A1A12]/50">
        {description}
      </p>
    </div>
  );
}

export default function AdminDashboard({ onLogout, onBack }) {
  const [authed, setAuthed] = useState(false);
  const [currentView, setCurrentView] = useState('requests');
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
      setReservations(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }))
      );
    });

    const unsubAmenities = onSnapshot(collection(db, 'amenity_bookings'), (snapshot) => {
      setAmenities(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }))
      );
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

  const getLinkedAmenities = (reservationId) => {
    return amenities.filter((amenity) => amenity.reservation_id === reservationId);
  };

  const handleConfirmRequest = async (reservation) => {
    const confirmed = window.confirm(
      `Confirm request for ${reservation.guestName || 'this guest'}?\n\nRoom: ${getRoomName(
        reservation
      )}\nDates: ${formatDateRange(reservation.checkIn, reservation.checkOut)}\nAmount: ${getReservationAmountLabel(
        reservation
      )}`
    );

    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'villa_reservations', reservation.id), {
        status: 'confirmed',
        paymentStatus:
          Number(reservation.totalPrice || 0) > 0 ? 'verified' : 'owner_confirmed',
        verifiedAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      });

      const linkedAmenities = getLinkedAmenities(reservation.id);

      await Promise.all(
        linkedAmenities.map((amenity) =>
          updateDoc(doc(db, 'amenity_bookings', amenity.id), {
            status: 'confirmed',
          })
        )
      );
    } catch (error) {
      console.error(error);
      alert('Request could not be confirmed. Please try again.');
    }
  };

  const handleCancel = async (reservation) => {
    const confirmed = window.confirm(
      `Cancel request for ${reservation.guestName || 'this guest'}?`
    );

    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'villa_reservations', reservation.id), {
        status: 'cancelled',
        paymentStatus: 'cancelled',
        cancelledAt: new Date().toISOString(),
      });

      const linkedAmenities = getLinkedAmenities(reservation.id);

      await Promise.all(
        linkedAmenities.map((amenity) =>
          updateDoc(doc(db, 'amenity_bookings', amenity.id), {
            status: 'cancelled',
          })
        )
      );
    } catch (error) {
      console.error(error);
      alert('Request could not be cancelled. Please try again.');
    }
  };

  const handleDelete = async (reservation) => {
    const confirmed = window.confirm(
      `Permanently delete request for ${reservation.guestName || 'this guest'}?`
    );

    if (!confirmed) return;

    try {
      const linkedAmenities = getLinkedAmenities(reservation.id);

      await Promise.all(
        linkedAmenities.map((amenity) => deleteDoc(doc(db, 'amenity_bookings', amenity.id)))
      );

      await deleteDoc(doc(db, 'villa_reservations', reservation.id));
    } catch (error) {
      console.error(error);
      alert('Request could not be deleted. Please try again.');
    }
  };

  const previousMonth = () => {
    setCalMonth(new Date(currentYear, currentMonthIdx - 1, 1));
  };

  const nextMonth = () => {
    setCalMonth(new Date(currentYear, currentMonthIdx + 1, 1));
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
              {theme.villaName?.charAt(0) || 'E'}
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
            room request{pendingReservations.length === 1 ? '' : 's'} waiting for owner review.
          </p>
        </div>

        <div className="mt-8 hidden lg:block">
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-2xl border border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 transition hover:border-white/20 hover:text-white"
          >
            Back to Website
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full rounded-2xl bg-white/[0.05] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 transition hover:bg-white/[0.08] hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {currentView === 'requests' && (
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
                  Room Requests
                </p>

                <h2 className="font-display text-5xl font-semibold italic leading-none tracking-[-0.035em] md:text-6xl">
                  Owner review.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2A1A12]/58">
                  Review guest stay requests, selected room type, preferred dates, add-ons, and payment reference status.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 md:min-w-[420px]">
                <div className="rounded-[24px] bg-[#2A1A12] p-5 text-[#FFF9F2]">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C15A3E]">
                    Needs Review
                  </div>

                  <div className="font-display mt-2 text-4xl italic">
                    {pendingReservations.length}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                    Confirmed
                  </div>

                  <div className="font-display mt-2 text-4xl italic text-[#2A1A12]">
                    {confirmedReservations.length}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-5">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                    Cancelled
                  </div>

                  <div className="font-display mt-2 text-4xl italic text-[#2A1A12]">
                    {cancelledReservations.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`min-w-max rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                    filter === item.id
                      ? 'border-[#C15A3E] bg-[#C15A3E] text-white'
                      : 'border-[#2A1A12]/10 bg-[#FFF9F2] text-[#2A1A12]/45 hover:border-[#C15A3E]/40 hover:text-[#C15A3E]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredReservations.length === 0 ? (
              <EmptyState
                title="No requests here yet."
                description="New room requests will appear here after guests submit the reservation form."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredReservations.map((reservation) => {
                  const linkedAmenities = getLinkedAmenities(reservation.id);
                  const statusMeta = getStatusMeta(reservation.status);
                  const totalPrice = Number(reservation.totalPrice || 0);
                  const basePrice = Number(reservation.basePrice || 0);
                  const amenityTotal = Number(reservation.amenityTotal || 0);
                  const securityDeposit = Number(reservation.securityDeposit || 0);

                  return (
                    <article
                      key={reservation.id}
                      className={`rounded-[30px] border bg-[#FFF9F2] p-5 shadow-[0_18px_45px_rgba(42,26,18,0.06)] ${statusMeta.card}`}
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <StatusBadge status={reservation.status} />

                          <h3 className="mt-4 font-display text-3xl font-semibold italic leading-none text-[#2A1A12]">
                            {reservation.guestName || 'Guest Request'}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-[#2A1A12]/55">
                            {reservation.guestContact || 'No contact provided'}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                            Request Value
                          </div>

                          <div className="font-display mt-1 text-3xl italic leading-none text-[#2A1A12]">
                            {getReservationAmountLabel(reservation)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#F6EFE6] p-4">
                          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                            Selected Room
                          </div>

                          <div className="mt-1 text-sm font-bold text-[#2A1A12]">
                            {getRoomName(reservation)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#F6EFE6] p-4">
                          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                            Stay Dates
                          </div>

                          <div className="mt-1 text-sm font-bold text-[#2A1A12]">
                            {formatDateRange(reservation.checkIn, reservation.checkOut)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#F6EFE6] p-4">
                          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                            Guests
                          </div>

                          <div className="mt-1 text-sm font-bold text-[#2A1A12]">
                            {reservation.guests || 2} guest
                            {Number(reservation.guests || 2) > 1 ? 's' : ''}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#2A1A12]/10 bg-[#F6EFE6] p-4">
                          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                            Status
                          </div>

                          <div className="mt-1 text-sm font-bold text-[#2A1A12]">
                            {getPaymentStatusText(reservation)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#C15A3E]/20 bg-[#C15A3E]/[0.06] p-4">
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C15A3E]">
                              Reference
                            </div>

                            <div className="mt-1 font-semibold text-[#2A1A12]">
                              {reservation.referenceNo || 'No reference'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C15A3E]">
                              Channel
                            </div>

                            <div className="mt-1 font-semibold text-[#2A1A12]">
                              {reservation.paymentChannel || 'To be confirmed'}
                            </div>
                          </div>
                        </div>

                        {reservation.guestNote && (
                          <div className="mt-4 border-t border-[#C15A3E]/15 pt-4">
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C15A3E]">
                              Guest Note
                            </div>

                            <p className="mt-1 text-sm leading-6 text-[#2A1A12]/60">
                              {reservation.guestNote}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#2A1A12]/10 bg-white p-4">
                        <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                          Price Breakdown
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-[#2A1A12]/55">Room rate</span>
                            <span className="font-semibold text-[#2A1A12]">
                              {basePrice > 0 ? formatPHP(basePrice) : 'To confirm'}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-[#2A1A12]/55">Add-ons</span>
                            <span className="font-semibold text-[#2A1A12]">
                              {amenityTotal > 0 ? formatPHP(amenityTotal) : 'None / to confirm'}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-[#2A1A12]/55">Security deposit</span>
                            <span className="font-semibold text-[#2A1A12]">
                              {securityDeposit > 0 ? formatPHP(securityDeposit) : 'To confirm'}
                            </span>
                          </div>

                          <div className="border-t border-[#2A1A12]/10 pt-2">
                            <div className="flex justify-between gap-4">
                              <span className="font-bold text-[#2A1A12]">Total</span>
                              <span className="font-bold text-[#C15A3E]">
                                {totalPrice > 0 ? formatPHP(totalPrice) : 'To confirm'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {linkedAmenities.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-[#2A1A12]/10 bg-[#F6EFE6] p-4">
                          <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35">
                            Add-ons / Requests
                          </div>

                          <div className="space-y-2">
                            {linkedAmenities.map((amenity) => (
                              <div
                                key={amenity.id}
                                className="flex justify-between gap-4 rounded-xl bg-white px-3 py-2 text-sm"
                              >
                                <div>
                                  <div className="font-semibold text-[#2A1A12]">
                                    {amenity.name || amenity.amenityName || 'Add-on'}
                                  </div>

                                  <div className="text-xs text-[#2A1A12]/45">
                                    {amenity.timeLabel || amenity.date || 'Selected'}
                                  </div>
                                </div>

                                <div className="font-semibold text-[#C15A3E]">
                                  {Number(amenity.price || 0) > 0
                                    ? formatPHP(Number(amenity.price || 0) * Number(amenity.qty || 1))
                                    : 'To confirm'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        {reservation.status !== 'confirmed' && reservation.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleConfirmRequest(reservation)}
                            className="flex-1 rounded-2xl bg-[#2A1A12] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFF9F2] transition hover:bg-[#C15A3E]"
                          >
                            Confirm Request
                          </button>
                        )}

                        {reservation.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(reservation)}
                            className="flex-1 rounded-2xl border border-[#2A1A12]/10 bg-white px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/50 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(reservation)}
                          className="rounded-2xl border border-[#2A1A12]/10 bg-white px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A1A12]/35 transition hover:border-red-200 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-4 border-t border-[#2A1A12]/10 pt-4 text-xs text-[#2A1A12]/38">
                        Created {formatDateTime(reservation.createdAt)}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#C15A3E]">
                Calendar
              </p>

              <h2 className="font-display text-5xl font-semibold italic leading-none tracking-[-0.035em] md:text-6xl">
                Stay dates.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2A1A12]/58">
                Pending and confirmed room requests appear here. Cancelled requests are hidden.
              </p>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-[#2A1A12]/10 bg-[#FFF9F2] shadow-[0_24px_70px_rgba(42,26,18,0.08)]">
              <div className="flex items-center justify-between border-b border-[#2A1A12]/10 p-4 md:p-6">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="rounded-xl border border-[#2A1A12]/12 bg-white p-2 text-[#2A1A12]/60 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
                  aria-label="Previous month"
                >
                  ←
                </button>

                <h3 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-[#2A1A12] md:text-xl">
                  {calMonth.toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-xl border border-[#2A1A12]/12 bg-white p-2 text-[#2A1A12]/60 transition hover:border-[#C15A3E] hover:text-[#C15A3E]"
                  aria-label="Next month"
                >
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 border-b border-[#2A1A12]/10 bg-[#FFF9F2]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[#2A1A12]/35 md:py-4 md:text-[10px]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-[#2A1A12]/10">
                {blanks.map((_, index) => (
                  <div
                    key={`blank-${index}`}
                    className="min-h-[88px] bg-white p-2 md:min-h-[120px]"
                  />
                ))}

                {days.map((day) => {
                  const dayBookings = getBookingsForDate(day);

                  return (
                    <div
                      key={day}
                      className="min-h-[88px] bg-white p-2 md:min-h-[120px]"
                    >
                      <div className="mb-2 text-sm font-semibold text-[#2A1A12]/65">
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
                            title={`${booking.guestName || 'Guest'} · ${getRoomName(booking)}`}
                          >
                            {(booking.guestName || 'Guest').split(' ')[0]} · {getRoomName(booking)}
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
                Request overview.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2A1A12]/58">
                These numbers are calculated from actual saved room requests. Requests with unknown rates are still counted, but not added to revenue.
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
                  From {confirmedReservations.length} confirmed request
                  {confirmedReservations.length === 1 ? '' : 's'}.
                </p>
              </div>

              <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-7">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/38">
                  Pending Pipeline
                </div>

                <div className="font-display mt-4 text-5xl italic leading-none text-[#C15A3E]">
                  {pipelineRevenue > 0 ? formatPHP(pipelineRevenue) : 'To confirm'}
                </div>

                <p className="mt-4 text-sm leading-7 text-[#2A1A12]/50">
                  From {pendingReservations.length} room request
                  {pendingReservations.length === 1 ? '' : 's'} waiting for review.
                </p>
              </div>

              <div className="rounded-[28px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-7">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A1A12]/38">
                  Average Confirmed
                </div>

                <div className="font-display mt-4 text-5xl italic leading-none text-[#2A1A12]">
                  {formatPHP(averageConfirmedBooking)}
                </div>

                <p className="mt-4 text-sm leading-7 text-[#2A1A12]/50">
                  Based only on confirmed requests with saved amounts.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#2A1A12]/10 bg-[#FFF9F2] p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C15A3E]">
                    Last 6 Months
                  </p>

                  <h3 className="font-display text-3xl font-semibold italic text-[#2A1A12]">
                    Confirmed request value.
                  </h3>
                </div>

                <p className="text-sm text-[#2A1A12]/45">
                  Upcoming confirmed stays: {upcomingConfirmed.length}
                </p>
              </div>

              <div className="flex h-72 items-end gap-3">
                {monthBuckets.map((bucket) => {
                  const height = `${Math.max(6, (bucket.amount / maxMonthAmount) * 100)}%`;

                  return (
                    <div key={bucket.key} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex h-56 w-full items-end rounded-2xl bg-[#F6EFE6] p-2">
                        <div
                          className="w-full rounded-xl bg-[#C15A3E]"
                          style={{ height }}
                          title={formatPHP(bucket.amount)}
                        />
                      </div>

                      <div className="text-center">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2A1A12]/45">
                          {bucket.label}
                        </div>

                        <div className="mt-1 text-xs font-semibold text-[#2A1A12]">
                          {formatPHP(bucket.amount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}