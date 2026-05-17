// ─────────────────────────────────────────────
// BALAI DE CORREA — WHITE-LABEL TENANT CONFIG
// Private Villa Booking Prototype
// ─────────────────────────────────────────────

const defaultTenantConfig = {
  // Brand & Identity
  id: "balai-de-correa-001",
  villaName: "Balai de Correa",
  tagline: "Private Villa · Tagaytay City",
  location: "Tagaytay City, Cavite",
  locationNote: "Exclusive Forest Retreat",

  // Images from /public
  logo: "/logo.jpg",

  heroImages: [
    "/villa.jpg",
  ],

  galleryImages: [
    "/villa.jpg",
    "/pool.jpg",
    "/karaoke.jpg",
    "/atv.jpg",
  ],

  // Hero Copy
  heroHeadline: ["Private villa stays,", "made simple."],
  heroHeadlineAccent: "villa",
  heroDescription:
    "A secluded, relaxing vacation home tucked in the heart of Tagaytay — perfect for family bondings, intimate celebrations, and peaceful weekends away from the city.",

  // About Section
  aboutBody:
    "Balai de Correa is a private staycation villa in the forested highlands of Tagaytay. The property features spacious rooms, a private pool area, karaoke and entertainment amenities, outdoor gathering spaces, and on-site caretakers who can assist throughout your stay. It is designed for families and groups who want privacy, comfort, and a slower weekend away from the city.",

  // Property Specs
  specs: [
    { value: "4", label: "Bedrooms" },
    { value: "21", label: "Max Guests" },
    { value: "4", label: "Bathrooms" },
    { value: "22h", label: "Accommodation" },
  ],

  amenities: [
    "Private Swimming Pool & Lounge",
    "Karaoke & Entertainment Area",
    "Air-conditioned Primary Rooms",
    "Fully-Equipped Kitchen & Pantry",
    "Outdoor Dining & Charcoal Grill",
    "Two (2) On-site Caretakers",
  ],

  // Base Pricing Engine
  rates: [
    {
      name: "Tres Package",
      note: "1-3 Guests · 1-2 Primary Rooms",
      price: 9000,
      per: "night",
    },
    {
      name: "Seis Package",
      note: "4-6 Guests · 2-3 Primary Rooms",
      price: 13500,
      per: "night",
    },
    {
      name: "Doce Package",
      note: "7-12 Guests · All Rooms",
      price: 20500,
      per: "night",
    },
    {
      name: "Day Tour",
      note: "Max 25 Guests · 10 Hours",
      price: 1000,
      per: "head",
    },
  ],

  // Booking Constraints
  maxGuests: 21,

  occasions: [
    "Family Vacation",
    "Barkada Getaway",
    "Day Tour",
    "Intimate Celebration",
    "Birthday Celebration",
    "Company Outing",
  ],

  stayTypes: [
    "Overnight Stay (22 hours)",
    "Day Tour (10 hours)",
  ],

  // Add-ons
  hourlyAmenities: [
    {
      id: "early_checkin",
      name: "Early Check-in",
      price: 1000,
      unit: "hour",
      note: "Subject to availability before the standard check-in time.",
      image:
        "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&q=80",
    },
    {
      id: "late_checkout",
      name: "Late Checkout",
      price: 1000,
      unit: "hour",
      note: "Subject to availability after the standard checkout time.",
      image:
        "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&q=80",
    },
    {
      id: "towel_rental",
      name: "Towels",
      price: 100,
      unit: "piece",
      note: "Additional towel rental per piece.",
      image:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80",
    },
    {
      id: "house_cook_12",
      name: "House Cook (1-12 guests)",
      price: 1500,
      unit: "night",
      note: "Cooking and dishwashing labor only. Ingredients are not included.",
      image:
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80",
    },
    {
      id: "house_cook_21",
      name: "House Cook (13-21 guests)",
      price: 3000,
      unit: "night",
      note: "Cooking and dishwashing labor only. Ingredients are not included.",
      image:
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80",
    },
    {
      id: "laundry_service",
      name: "Laundry Service (1-5kg)",
      price: 500,
      unit: "service",
      note: "Wash, dry, and fold service.",
      image:
        "https://images.unsplash.com/photo-1545173168-9f1947e8017e?auto=format&fit=crop&q=80",
    },
    {
      id: "security_dep",
      name: "Security Deposit",
      price: 5000,
      unit: "stay",
      note: "Refundable after checkout inspection if there are no damages or unpaid charges.",
      image: "",
    },
  ],

  // Payment Details
  gcashName: "BALAI DE CORREA",
  gcashNumber: "09171234567",
  gcashDisplay: "0917 123 4567",
  gcashQR: "/gcash-qr.jpg",

  mayaName: "BALAI DE CORREA",
  mayaNumber: "09171234567",
  mayaDisplay: "0917 123 4567",
  mayaQR: "/maya-qr.jpg",

  bankName: "BALAI DE CORREA",
  bankNumber: "China Bank Account",
  bankDisplay: "China Bank Transfer",
  instaPayQR: "/chinabank-qr.jpg",

  // Optional future calendar sync URL
  calendarSyncUrl: "",

  // Environment Variables
  semaphoreApiKey: import.meta.env.VITE_SEMAPHORE_API_KEY,

  // White-Label Brand Colors
  colors: {
    primary: "#2A1A12",
    accent: "#C15A3E",
    accent2: "#1A3A2A",
    ink: "#2A1A12",
    canvas: "#F6EFE6",
    canvas2: "#FFF9F2",
    canvas3: "#E7D8CA",
    mist: "#8A7768",
  },

  // Contact Details
  contact: {
    facebook: "Balai de Correa Tagaytay",
    facebookUrl: "https://www.facebook.com/profile.php?id=61580241952007",
    email: "balaidecorrea@gmail.com",
    phone: "(+63) 917 882 7422",
    address: "Monte Vista Subdivision, Tagaytay City",
    mapsUrl: "https://share.google/lIWFsRlUx6QT6WFC7_",
    ocularNote: "Open for ocular visits by appointment",
  },
};

export default defaultTenantConfig;