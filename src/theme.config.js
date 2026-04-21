// ─────────────────────────────────────────────
// RESORT OS: TENANT SCHEMA BLUEPRINT
// Tailored for Balai de Correa Tagaytay
// ─────────────────────────────────────────────

const defaultTenantConfig = {
  // Brand & Identity
  id: "balai-de-correa-001",
  villaName: "Balai de Correa",
  tagline: "Private Villa · Tagaytay City",
  location: "Tagaytay City, Cavite",
  locationNote: "Exclusive Forest Retreat",

  heroImages: [
    "/villa.jpg" // Located in your /public folder
  ],

  // Hero Copy
  heroHeadline: ["Your perfect", "getaway", "retreat."],
  heroHeadlineAccent: "getaway", 
  heroDescription: "A secluded, relaxing vacation home tucked in the heart of Tagaytay — perfect for family bondings and peaceful weekends.",

  // About Section
  aboutBody: "Balai de Correa sits in the forested highlands of Tagaytay. The property features Kwarto de Maysilo, Arko, and Calasiao, alongside a private infinity pool overlooking the valley, an outdoor dining deck, and a fully-equipped kitchen. Two on-site caretakers are available to assist you to ensure a perfect 22-hour stay.",

  // Property Specs (Displayed in Hero/Overview)
  specs: [
    { value: "4", label: "Bedrooms" },
    { value: "21", label: "Max Guests" },
    { value: "4", label: "Bathrooms" },
    { value: "22h", label: "Accommodation" }
  ],

  amenities: [
    "Infinity Swimming Pool & Lounge",
    "TV with Karaoke & Netflix",
    "Air-conditioned Primary Rooms",
    "Fully-Equipped Kitchen & Pantry",
    "Outdoor Dining & Charcoal Grill",
    "Two (2) On-site Caretakers"
  ],

  // Base Pricing Engine (Reference only for the UI)
  rates: [
    { name: "Tres Package", note: "1-3 Guests · 1-2 Primary Rooms", price: 9000, per: "night" },
    { name: "Seis Package", note: "4-6 Guests · 2-3 Primary Rooms", price: 13500, per: "night" },
    { name: "Doce Package", note: "7-12 Guests · All Rooms", price: 20500, per: "night" },
    { name: "Day Tour", note: "Max 25 Guests (10 Hours)", price: 1000, per: "head" },
  ],

  // Platform Constraint Logic
  maxGuests: 21,
  occasions: ["Family Vacation", "Barkada Getaway", "Day Tour (7AM-9PM)", "Intimate Celebration"],
  stayTypes: ["Overnight Stay (22 hours)", "Day Tour (10 hours)"],

  // ─── THE ADD-ONS (Direct from Menu) ───
  hourlyAmenities: [
    { 
      id: "early_checkin", 
      name: "Early Check-in", 
      price: 1000, 
      unit: "hour",
      image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&q=80" 
    },
    { 
      id: "late_checkout", 
      name: "Late Checkout", 
      price: 1000, 
      unit: "hour",
      image: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&q=80" 
    },
    { 
      id: "towel_rental", 
      name: "Towels", 
      price: 100, 
      unit: "piece",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80" 
    },
    { 
      id: "house_cook_12", 
      name: "House Cook (1-12 guests)", 
      price: 1500, 
      unit: "night",
      note: "Cooking & dishwashing labor only.",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80" 
    },
    { 
      id: "house_cook_21", 
      name: "House Cook (13-21 guests)", 
      price: 3000, 
      unit: "night",
      note: "Cooking & dishwashing labor only.",
      image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80" 
    },
    { 
      id: "laundry_service", 
      name: "Laundry Service (1-5kg)", 
      price: 500, 
      unit: "service",
      note: "Wash, dry, and fold.",
      image: "https://images.unsplash.com/photo-1545173168-9f1947e8017e?auto=format&fit=crop&q=80" 
    },
    { 
      id: "security_dep", 
      name: "Security Deposit", 
      price: 5000, 
      unit: "stay",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a49d?auto=format&fit=crop&q=80" 
    }
  ],

  // Trust & Payment (GCash/Maya)
  gcashName: "BALAI DE CORREA",
  gcashNumber: "09171234567", // Update with real number later
  gcashDisplay: "0917 123 4567",
  gcashQR: "/gcash-qr.jpg",
  mayaQR: "/maya-qr.jpg",
  instaPayQR: "/instapay-qr.jpg",

  // Environment Variables (Loaded from .env)
  semaphoreApiKey: import.meta.env.VITE_SEMAPHORE_API_KEY,

  // White-Label Brand Colors
  colors: {
    primary: "#2A1A12", // Deep Espresso
    accent: "#C15A3E",  // Terracotta / Rust
    accent2: "#1A3A2A", // Forest Green
    ink: "#2A1A12",
    canvas: "#F9F8F6",
    canvas2: "#FAFAFA",
    canvas3: "#EEEEEE",
    mist: "#8A857A",
  },

  // Contact Details & Socials
  contact: {
    facebook: "Balai de Correa Tagaytay",
    facebookUrl: "https://www.facebook.com/profile.php?id=61580241952007",
    email: "balaidecorrea@gmail.com",
    phone: "(+63) 917 882 7422",
    address: "Monte Vista Subdivision, Tagaytay City",
    mapsUrl: "https://share.google/lIWFsRlUx6QT6WFC7_",
    ocularNote: "Open for ocular",
  },
};

export default defaultTenantConfig;