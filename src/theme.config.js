// ─────────────────────────────────────────────
// EL NISSI STAYCATION — WHITE-LABEL TENANT CONFIG
// Staycation Booking Prototype
// ─────────────────────────────────────────────

const defaultTenantConfig = {
  // Brand & Identity
  id: "el-nissi-staycation-001",
  villaName: "El Nissi Staycation",
  tagline: "Beside Enchanted Kingdom · Santa Rosa",
  location: "Santa Rosa, Laguna",
  locationNote: "Beside Enchanted Kingdom",

  // Images from /public
  // Replace these with approved El Nissi photos before sending the final client link.
  logo: "/el-nissi-logo.jpg",

  heroImages: ["/el-nissi-hero.jpg"],

  galleryImages: [
    "/el-nissi-hero.jpg",
    "/el-nissi-family-cabin.jpg",
    "/el-nissi-deluxe-cabin.jpg",
    "/el-nissi-bariquit-suite.jpg",
    "/el-nissi-bohemian-suite.jpg",
  ],

  // Hero Copy
  heroHeadline: ["Cozy staycations,", "beside Enchanted Kingdom."],
  heroHeadlineAccent: "staycations",
  heroDescription:
    "A warm, condo-style staycation experience in Santa Rosa, Laguna — designed for families, barkadas, and business travelers who want a comfortable home-like stay near Enchanted Kingdom.",

  // About Section
  aboutBody:
    "El Nissi Staycation offers thoughtfully designed condo-style accommodations near Enchanted Kingdom in Santa Rosa, Laguna. Each room is styled to feel comfortable, cozy, and home-like, making it ideal for family trips, barkada getaways, quick celebrations, and business stays. Guests can enjoy unique interiors, relaxing spaces, and convenient access to nearby attractions.",

  // Property Specs
  specs: [
    { value: "EK", label: "Nearby" },
    { value: "4", label: "Room Types" },
    { value: "5–10", label: "Group Fit" },
    { value: "Home", label: "Like Stay" },
  ],

  amenities: [
    "Condo-style Staycation Rooms",
    "Family-friendly Accommodations",
    "Unique Themed Interiors",
    "Comfortable Home-like Setup",
    "Near Enchanted Kingdom",
    "Good for Families, Barkadas, and Business Travelers",
  ],

  // Room Types
  // Prices are intentionally left as request-based until the client confirms actual rates.
  roomTypes: [
    {
      id: "family_cabin",
      name: "Family Cabin",
      shortName: "Family",
      note: "Family-friendly room for relaxed group stays.",
      capacity: "Good for families",
      price: 0,
      per: "request",
      image: "/el-nissi-family-cabin.jpg",
      highlights: ["Family-friendly setup", "Comfortable stay", "Good for groups"],
    },
    {
      id: "deluxe_cabin",
      name: "Deluxe Cabin",
      shortName: "Deluxe",
      note: "Cozy condo-style room near Enchanted Kingdom.",
      capacity: "Good for small groups",
      price: 0,
      per: "request",
      image: "/el-nissi-deluxe-cabin.jpg",
      highlights: ["Warm room styling", "Near EK", "Home-like comfort"],
    },
    {
      id: "bariquit_suite",
      name: "Bariquit Suite",
      shortName: "Bariquit",
      note: "A styled staycation suite for guests who want a more distinct room experience.",
      capacity: "Capacity to confirm",
      price: 0,
      per: "request",
      image: "/el-nissi-bariquit-suite.jpg",
      highlights: ["Styled interiors", "Private stay", "Rate to confirm"],
    },
    {
      id: "bohemian_suite",
      name: "Bohemian Suite",
      shortName: "Bohemian",
      note: "A cozy boho-inspired suite designed for comfort and camaraderie.",
      capacity: "Good for group stays",
      price: 0,
      per: "request",
      image: "/el-nissi-bohemian-suite.jpg",
      highlights: ["Bohemian theme", "Cozy interiors", "Family staycation"],
    },
  ],

  // Backward-compatible rates section for the existing UI.
  rates: [
    {
      name: "Family Cabin",
      note: "Family-friendly room · Rate to be confirmed",
      price: 0,
      per: "request",
    },
    {
      name: "Deluxe Cabin",
      note: "Condo-style stay · Rate to be confirmed",
      price: 0,
      per: "request",
    },
    {
      name: "Bariquit Suite",
      note: "Styled suite · Rate to be confirmed",
      price: 0,
      per: "request",
    },
    {
      name: "Bohemian Suite",
      note: "Boho-inspired room · Rate to be confirmed",
      price: 0,
      per: "request",
    },
  ],

  // Booking Constraints
  maxGuests: 12,

  occasions: [
    "Family Staycation",
    "Enchanted Kingdom Trip",
    "Barkada Getaway",
    "Birthday Stay",
    "Business Travel",
    "Quick Weekend Stay",
  ],

  stayTypes: ["Overnight Stay", "Weekend Stay", "Custom Stay Request"],

  // Add-ons
  // We will simplify BookingPage next. For now, these keep the existing add-ons flow working.
  hourlyAmenities: [
    {
      id: "early_checkin",
      name: "Early Check-in",
      price: 500,
      unit: "hour",
      note: "Subject to room availability before standard check-in time.",
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80",
    },
    {
      id: "late_checkout",
      name: "Late Checkout",
      price: 500,
      unit: "hour",
      note: "Subject to room availability after standard checkout time.",
      image:
        "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&q=80",
    },
    {
      id: "extra_guest",
      name: "Extra Guest",
      price: 500,
      unit: "head",
      note: "Additional guest charge, subject to room capacity.",
      image:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80",
    },
    {
      id: "extra_bedding",
      name: "Extra Bedding",
      price: 300,
      unit: "set",
      note: "Additional bedding set for group stays.",
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80",
    },
    {
      id: "security_dep",
      name: "Security Deposit",
      price: 1000,
      unit: "stay",
      note: "Final security deposit amount can be confirmed by the owner.",
      image: "",
    },
  ],

  // Payment Details
  // Replace QR files/details only after the owner approves.
  gcashName: "EL NISSI STAYCATION",
  gcashNumber: "09190741207",
  gcashDisplay: "0919 074 1207",
  gcashQR: "/gcash-qr.jpg",

  mayaName: "EL NISSI STAYCATION",
  mayaNumber: "09190741207",
  mayaDisplay: "0919 074 1207",
  mayaQR: "/maya-qr.jpg",

  bankName: "EL NISSI STAYCATION",
  bankNumber: "Bank details to be confirmed",
  bankDisplay: "Bank Transfer Details",
  instaPayQR: "/chinabank-qr.jpg",

  // Optional future calendar sync URL
  calendarSyncUrl: "",

  // Environment Variables
  semaphoreApiKey: import.meta.env.VITE_SEMAPHORE_API_KEY,

  // White-Label Brand Colors
  colors: {
    primary: "#2A1A12",
    accent: "#C15A3E",
    accent2: "#B99655",
    ink: "#2A1A12",
    canvas: "#F7EFE6",
    canvas2: "#FFF9F2",
    canvas3: "#E8D8C8",
    mist: "#8A7768",
  },

  // Contact Details
  contact: {
    facebook: "El Nissi Staycation - Beside Enchanted Kingdom",
    facebookUrl: "https://www.facebook.com/",
    email: "elnissistaycationph@gmail.com",
    phone: "0919 074 1207",
    address: "Santa Rosa, Laguna, 4026",
    mapsUrl: "https://www.google.com/maps/search/Santa+Rosa+Laguna+4026",
    ocularNote: "Message the page for availability, inquiries, and stay details.",
  },
};

export default defaultTenantConfig;