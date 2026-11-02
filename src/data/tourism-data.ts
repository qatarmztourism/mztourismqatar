export interface Currency {
  code: string;
  symbol: string;
  rateAgainstQAR: number; // 1 QAR = rate in target currency
  label: string;
}

export const CURRENCIES: Record<string, Currency> = {
  QAR: { code: "QAR", symbol: "QR", rateAgainstQAR: 1, label: "QAR (Qatari Riyal)" },
  USD: { code: "USD", symbol: "$", rateAgainstQAR: 0.274, label: "USD (US Dollar)" },
  EUR: { code: "EUR", symbol: "€", rateAgainstQAR: 0.255, label: "EUR (Euro)" },
  GBP: { code: "GBP", symbol: "£", rateAgainstQAR: 0.218, label: "GBP (British Pound)" },
  SAR: { code: "SAR", symbol: "SAR", rateAgainstQAR: 1.03, label: "SAR (Saudi Riyal)" },
};

export interface ExperienceCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
  iconName: string;
  count: string;
}

export const CATEGORIES: ExperienceCategory[] = [
  {
    id: "safari",
    title: "Desert Safaris & Inland Sea",
    subtitle: "Khor Al Adaid Expeditions",
    description: "Private dune drives in bespoke 4x4s, falconry exhibitions, and candlelit dinners where desert dunes plunge into the azure sea.",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    tag: "Signature",
    iconName: "Compass",
    count: "4 Journeys",
  },
  {
    id: "city",
    title: "Qatar City & Heritage Tours",
    subtitle: "Doha Curated Excursions",
    description: "Private museum curator tours, VIP Souq Waqif culinary walks, Katara Cultural Village, and architectural wonders of West Bay.",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    tag: "Cultural",
    iconName: "Landmark",
    count: "5 Journeys",
  },
  {
    id: "chauffeur",
    title: "Chauffeur & Airport Fleet",
    subtitle: "VIP Hamad Int'l Transfers",
    description: "Armored and executive fleet including Mercedes-Maybach, Rolls-Royce Cullinan, and Range Rover with discrete bilingual chauffeurs.",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
    tag: "Executive",
    iconName: "Car",
    count: "24/7 Service",
  },
  {
    id: "resorts",
    title: "Resorts & Accommodation",
    subtitle: "Private Overwater & Desert Oases",
    description: "Secluded island villas at Banana Island, suites at Raffles Doha, and private royal compound bookings with private butlers.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    tag: "Sanctuary",
    iconName: "Hotel",
    count: "6 Estates",
  },
  {
    id: "equestrian",
    title: "Royal Arabian Horse Riding",
    subtitle: "Al Shaqab Lineage Experiences",
    description: "Sunrise gallops on champion purebred Arabian stallions through golden dunes, accompanied by master equestrian trainers.",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    tag: "Heritage",
    iconName: "Award",
    count: "3 Programs",
  },
  {
    id: "events",
    title: "Private Parties & Galas",
    subtitle: "Desert Elegance & Banquets",
    description: "Bespoke desert pavilions with live oud performances, Michelin-standard private chefs, chandeliers under open constellations.",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    tag: "VIP Events",
    iconName: "Sparkles",
    count: "Bespoke",
  },
  {
    id: "tents",
    title: "Luxury Tents & Desert Camps",
    subtitle: "Glamping in Supreme Comfort",
    description: "Air-conditioned royal majlis tents with en-suite marble bathrooms, artisan carpets, telescope astronomy, and desert serenity.",
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    tag: "Immersion",
    iconName: "Tent",
    count: "4 Enclaves",
  },
  {
    id: "gcc",
    title: "Customized GCC Packages",
    subtitle: "Regional Arabian Grand Tour",
    description: "Seamless multi-country itineraries linking Qatar, Saudi Arabia (AlUla), United Arab Emirates, and the fjords of Oman via private jet.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    tag: "Cross-Border",
    iconName: "Globe",
    count: "Bespoke Routes",
  },
];

export interface TourPackage {
  id: string;
  title: string;
  category: string;
  tagline: string;
  priceInQAR: number;
  duration: string;
  groupType: string;
  rating: number;
  reviewsCount: number;
  badge: string;
  image: string;
  gallery: string[];
  overview: string;
  highlights: string[];
  inclusions: string[];
  schedule: { time: string; activity: string }[];
}

export const FEATURED_TOURS: TourPackage[] = [
  {
    id: "inland-sea-royal",
    title: "The Royal Khor Al Adaid Expedition",
    category: "safari",
    tagline: "UNESCO-recognized desert-sea wonderland with private falconer & five-star dune dinner",
    priceInQAR: 4200,
    duration: "8 Hours",
    groupType: "Private (Up to 4 Guests)",
    rating: 5.0,
    reviewsCount: 84,
    badge: "Signature Collection",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "Journey deep into the southern Qatari desert where monumental sand waves roll directly into the Arabian Gulf. Accompanied by expert desert masters in bespoke luxury 4WD vehicles, you will witness live royal falconry, explore the pristine shores of the Inland Sea, and dine on an exclusive private five-course feast prepared by your personal chef on the dunes at sunset.",
    highlights: [
      "Private luxury 4x4 convoy with certified desert captains",
      "Authentic royal falconry demonstration with master falconer",
      "Scenic sunset tea and Arabian coffee in a private beachfront majlis",
      "Multi-course gourmet Arabian barbecue with private butler service",
      "Stargazing through high-powered astronomical telescopes",
    ],
    inclusions: [
      "Roundtrip chauffeur transfers from any Doha hotel or residence",
      "Full private vehicle buyout",
      "Gourmet dining, refreshments & chilled artisanal mocktails",
      "Dedicated professional photographer for high-res souvenirs",
      "Comprehensive luxury passenger insurance",
    ],
    schedule: [
      { time: "14:00", activity: "Chauffeured pickup from your Doha hotel or villa in a private Range Rover" },
      { time: "15:00", activity: "Arrival at the desert gateway; tire adjustment and traditional Gahwa welcome" },
      { time: "15:45", activity: "Thrilling dune navigation toward the UNESCO-designated Inland Sea" },
      { time: "17:15", activity: "Golden hour royal falconry exhibition overlooking the Gulf waters" },
      { time: "18:30", activity: "Private candlelit majlis dinner under the Arabian night sky" },
      { time: "21:30", activity: "Smooth chauffeured return to your hotel in Doha" },
    ],
  },
  {
    id: "doha-cultural-odyssey",
    title: "Doha Imperial Cultural & Architecture Tour",
    category: "city",
    tagline: "Private curator access to Museum of Islamic Art, Souq Waqif royal stables, & Katara",
    priceInQAR: 2800,
    duration: "Full Day (7 Hours)",
    groupType: "Private (Up to 6 Guests)",
    rating: 4.9,
    reviewsCount: 62,
    badge: "Heritage Masterpiece",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "Experience Doha's extraordinary blend of historic Bedouin spirit and avant-garde modern architecture. Led by a private cultural historian, you will enjoy private access to I.M. Pei's Museum of Islamic Art, inspect royal Arabian horses at the Souq Waqif police stables, sample rare saffron perfumes, and take an artisanal dhow cruise around The Pearl marina.",
    highlights: [
      "Curator-accompanied tour of the Museum of Islamic Art & Jean Nouvel's National Museum",
      "Private walkthrough of the Souq Waqif royal Arabian police stables and falcon souq",
      "Exclusive lunch at a Michelin-star awarded waterfront restaurant in Katara",
      "Private wooden dhow cruise with refreshments around West Bay skyline",
    ],
    inclusions: [
      "Luxury Mercedes-Benz V-Class / S-Class private transport",
      "VIP skip-the-line museum admissions with dedicated historian",
      "Full fine dining lunch with beverage pairings",
      "Saffron, oud, and artisanal dates gifting box",
    ],
    schedule: [
      { time: "09:30", activity: "Chauffeur arrival at your residence" },
      { time: "10:00", activity: "Private morning walkthrough at the National Museum of Qatar" },
      { time: "12:30", activity: "Waterfront fine dining lunch at Katara Cultural Village" },
      { time: "14:30", activity: "Explore the Museum of Islamic Art with architectural perspective" },
      { time: "16:00", activity: "Souq Waqif heritage exploration, falcon hospital, and spice tasting" },
      { time: "17:30", activity: "Sunset private dhow sailing with views of the illuminated Doha Corniche" },
    ],
  },
  {
    id: "royal-equestrian-shaqab",
    title: "Al Shaqab Purebred Arabian Dawn Trek",
    category: "equestrian",
    tagline: "Sunrise desert gallop on world-renowned purebred Arabian bloodlines with master riders",
    priceInQAR: 3600,
    duration: "4.5 Hours",
    groupType: "Private (1 to 4 Equestrians)",
    rating: 5.0,
    reviewsCount: 47,
    badge: "Royalty Favorite",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "Ride the legendary horses of kings. Arabian horses are celebrated worldwide for their grace, intelligence, and stamina. This dawn ride invites seasoned or leisure riders to experience galloping across soft singing sand dunes as the golden sun breaks over the horizon, followed by a lavish champagne or sparkling date-juice brunch in a private Bedouin tent.",
    highlights: [
      "Access to prize-winning Arabian stallions and calm seasoned mounts",
      "Personal instruction by certified FEI equestrian masters",
      "Sunrise desert photo session capturing your ride across sand crests",
      "Opulent morning brunch with freshly baked flatbreads, organic honey, and Karak",
    ],
    inclusions: [
      "Custom riding gear, helmets, and safety accompaniment",
      "Private roundtrip transfer in executive SUV",
      "Gourmet breakfast in private air-conditioned desert tent",
      "Equestrian groom and safety escort during the entire ride",
    ],
    schedule: [
      { time: "05:00", activity: "Early morning pickup to catch the crisp desert dawn" },
      { time: "05:45", activity: "Arrival at private equestrian desert estate; horse matching & briefing" },
      { time: "06:15", activity: "Sunrise trek through pristine dunes as the sky turns gold and violet" },
      { time: "08:00", activity: "Return to private majlis pavilion for bespoke Arabian gourmet breakfast" },
      { time: "09:30", activity: "Comfortable chauffeured transfer back to your villa" },
    ],
  },
  {
    id: "presidential-fleet-service",
    title: "Presidential Fleet & VIP Tarmac Concierge",
    category: "chauffeur",
    tagline: "Unrestricted luxury mobility with Mercedes-Maybach, Rolls-Royce, & tarmac greeting",
    priceInQAR: 5500,
    duration: "Full Day (12 Hours Dedicated)",
    groupType: "Executive Buyout",
    rating: 4.9,
    reviewsCount: 95,
    badge: "Ultra-VIP",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "For dignitaries, executives, and high-net-worth guests requiring absolute discretion, security, and poise. Our presidential fleet service provides a dedicated latest-model Mercedes-Maybach S-Class or Rolls-Royce Cullinan with an advanced security-trained, bilingual chauffeur on stand-by throughout your stay in Qatar.",
    highlights: [
      "Hamad International Airport (DOH) VIP tarmac protocol & expedited diplomatic customs",
      "Choice of Rolls-Royce Cullinan, Maybach S680, or Range Rover Autobiography",
      "Bilingual, certified close-protection executive chauffeurs",
      "Fully stocked cabin bar with Evian, cold-pressed juices, and fresh Arabic sweets",
      "Complimentary high-speed satellite Wi-Fi and privacy curtains",
    ],
    inclusions: [
      "12 continuous hours of unrestricted chauffeur service",
      "All airport VIP lounge fees and clearance handling",
      "Fuel, private parking permits, and toll passes",
      "24/7 dedicated concierge dispatcher on WhatsApp/direct phone",
    ],
    schedule: [
      { time: "Flexible", activity: "Tarmac or terminal greeting upon landing in Doha" },
      { time: "Executive", activity: "Dedicated seamless mobility for meetings, dining, or leisure" },
      { time: "On-Call", activity: "Driver remains stationed at your immediate call throughout the day" },
    ],
  },
  {
    id: "banana-island-sanctuary",
    title: "Banana Island Overwater Villa & Gulf Yacht Cruise",
    category: "resorts",
    tagline: "Private catamaran charter, overwater villa day sanctuary, and sunset yacht sail",
    priceInQAR: 8900,
    duration: "Full Day & Evening",
    groupType: "Private (Up to 8 Guests)",
    rating: 5.0,
    reviewsCount: 39,
    badge: "Island Retreat",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "Escape to Qatar's premier private island paradise. Board a private 55-foot luxury yacht from The Pearl-Qatar to Banana Island Resort Doha. Unwind in a reserved overwater villa with a private plunge pool, indulge in holistic hammam treatments at Anantara Spa, and conclude with a sunset cruising dinner overlooking the glittering West Bay skyline.",
    highlights: [
      "Private luxury yacht voyage from The Pearl to Banana Island and return",
      "Exclusive day buyout of a luxury 2-bedroom overwater pool villa",
      "Signature 90-minute Royal Moroccan Hammam treatment for two",
      "Chef-prepared four-course Mediterranean & seafood dinner on the yacht deck",
    ],
    inclusions: [
      "Private yacht charter with professional captain & maritime crew",
      "Full access to Banana Island private beaches, pools, and sports facilities",
      "Spa treatments and wellness amenities",
      "Gourmet dining and premium beverage service throughout",
    ],
    schedule: [
      { time: "11:00", activity: "Board private yacht at The Pearl-Qatar Marina" },
      { time: "11:45", activity: "Arrive at Banana Island; escorted to your private overwater pool villa" },
      { time: "13:00", activity: "Private seaside lunch served on your villa terrace" },
      { time: "15:00", activity: "Anantara Spa Moroccan Hammam & relaxation ritual" },
      { time: "17:30", activity: "Board yacht for golden hour cruising across Doha Bay" },
      { time: "19:00", activity: "Private chef dinner on the yacht under the stars" },
    ],
  },
  {
    id: "desert-gala-celebration",
    title: "Imperial Desert Gala & Private Celebration",
    category: "events",
    tagline: "Bespoke desert encampment with crystal chandeliers, live musicians, & Michelin chef",
    priceInQAR: 18500,
    duration: "Evening (6 Hours)",
    groupType: "Private Gathering (Up to 25 Guests)",
    rating: 5.0,
    reviewsCount: 28,
    badge: "Bespoke Event",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "Transform the vast desert into an unforgettable private realm for milestone anniversaries, executive summits, or royal gatherings. We construct an ethereal open-air desert ballroom illuminated by hundreds of lanterns, brass fire pits, and crystal chandeliers suspended over velvet dining tables.",
    highlights: [
      "Complete custom-built luxury desert pavilion and private majlis lounges",
      "Live acoustic Oud and Kanun musical performances by master instrumentalists",
      "Five-course customized banquet by Michelin-experienced private chef team",
      "Drone light show or bespoke fireworks display option",
      "Dedicated event director, sommelier, and silver-service staff",
    ],
    inclusions: [
      "Full site setup, luxury Persian rugs, audio-visual ambiance lighting",
      "Luxury fleet shuttle for all attending guests from Doha",
      "Private restrooms with luxury amenities and climate control",
      "Pre-event tasting menu consultation with your private chef",
    ],
    schedule: [
      { time: "17:00", activity: "Chauffeured arrival of guests; welcome mocktails and incense ritual" },
      { time: "17:45", activity: "Sunset falconry interaction and traditional sword dance (Arda) preview" },
      { time: "19:00", activity: "Gourmet banquet seated service under starlit crystal chandeliers" },
      { time: "21:00", activity: "Live oriental music and open-fire artisan tea & dessert showcase" },
      { time: "23:00", activity: "Chauffeured departures to luxury residences and hotels" },
    ],
  },
  {
    id: "luxury-tent-glamping",
    title: "Al Majlis Royal Desert Camp & Astronomy",
    category: "tents",
    tagline: "Overnight luxury pavilion glamping with en-suite marble bath, butler, & stargazing",
    priceInQAR: 6800,
    duration: "Overnight (20 Hours)",
    groupType: "Private Couple or Family",
    rating: 4.9,
    reviewsCount: 51,
    badge: "Overnight Escape",
    image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "Sleep in absolute luxury surrounded by the silent majesty of the dunes. Our private desert pavilion features king-sized Egyptian cotton bedding, silent whisper-quiet air conditioning, an en-suite rain shower, private butler, and an evening guided by an astrophysicist exploring the constellations of the Arabian night.",
    highlights: [
      "Private standalone luxury tent suite with handcrafted woodwork and air conditioning",
      "En-suite private bathroom with designer amenities and hot rain shower",
      "Guided celestial telescope tour of Saturn's rings and distant nebulae",
      "Bedouin campfire storytelling with fresh mint tea and dates",
      "Sunrise dune meditation and breakfast served at your private veranda",
    ],
    inclusions: [
      "Private roundtrip 4x4 desert transfers from Doha",
      "All meals: three-course dinner, nighttime snacks, and dawn breakfast",
      "Dedicated 24-hour camp butler and security team",
      "Professional telescope and astronomical stargazing guide",
    ],
    schedule: [
      { time: "16:00", activity: "Afternoon departure from Doha into the quiet desert" },
      { time: "17:15", activity: "Arrive at your secluded camp; check-in and sunset tea" },
      { time: "19:30", activity: "Private chef dinner served at the edge of the dunes" },
      { time: "21:00", activity: "Deep sky telescope stargazing with astronomer" },
      { time: "06:30", activity: "Sunrise breakfast over golden sand peaks" },
      { time: "11:00", activity: "Check-out and chauffeured return to Doha" },
    ],
  },
  {
    id: "gcc-grand-tour",
    title: "The Grand GCC Royal Circuit (Qatar, KSA & UAE)",
    category: "gcc",
    tagline: "Bespoke multi-nation journey connecting Doha, AlUla Nabataean tombs, & Dubai",
    priceInQAR: 48000,
    duration: "7 Days / 6 Nights",
    groupType: "VIP Private Jet / First Class",
    rating: 5.0,
    reviewsCount: 19,
    badge: "Cross-Border Grandeur",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    ],
    overview:
      "The pinnacle of Gulf exploration. Seamlessly travel between Qatar's cultural renaissance, Saudi Arabia's ancient wonderland in AlUla (Hegra UNESCO site), and Dubai's ultra-modern luxury. Fully coordinated by your personal Al Mirqab concierge director who travels ahead to ensure flawless execution at every destination.",
    highlights: [
      "Days 1-3: Qatar Inland Sea safari, National Museum private curator, and Katara Towers suite",
      "Days 4-5: Saudi Arabia - Private chartered flight to AlUla, Hegra tombs, and Banyan Tree pool villa",
      "Days 6-7: Dubai - Burj Al Arab suite, private helicopter tour of Palm Jumeirah, desert dining",
      "Seamless VIP diplomatic fast-track immigration at all airports",
    ],
    inclusions: [
      "Dedicated senior journey director accompanying throughout",
      "All 5-star ultra-luxury suite accommodations",
      "Private regional jet / first class flight bookings",
      "All private tours, private yachts, chauffeured Maybachs, and gourmet dining",
    ],
    schedule: [
      { time: "Day 1-2", activity: "Arrival in Doha: VIP protocol, Inland Sea safari & Doha cultural gems" },
      { time: "Day 3", activity: "Private dhow charter & Michelin dining in Doha" },
      { time: "Day 4-5", activity: "Fly to AlUla: Hegra ancient tombs, Elephant Rock, stargazing in desert oasis" },
      { time: "Day 6-7", activity: "Fly to Dubai: Helicopter charter, Burj Al Arab stay & departure concierge" },
    ],
  },
];

export interface Destination {
  id: string;
  name: string;
  region: string;
  subtitle: string;
  description: string;
  image: string;
  isQatar: boolean;
  highlights: string[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: "khor-al-adaid",
    name: "Khor Al Adaid",
    region: "Southern Qatar",
    subtitle: "The Inland Sea",
    description: "One of only three places on Earth where pristine desert sand dunes cascade directly into a tidal ocean lagoon.",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80",
    isQatar: true,
    highlights: ["UNESCO Reserve", "Singing Dunes", "Tidal Lagoon", "Rare Marine Fauna"],
  },
  {
    id: "doha-corniche",
    name: "Doha Bay & West Bay",
    region: "Doha, Qatar",
    subtitle: "The Modern Metropolis",
    description: "Futuristic skyscrapers reflecting on turquoise water alongside traditional wooden dhows and waterfront promenades.",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80",
    isQatar: true,
    highlights: ["Iconic Skyline", "Dhow Sailing", "Museum of Islamic Art", "Fine Dining"],
  },
  {
    id: "katara-pearl",
    name: "The Pearl & Katara",
    region: "Doha, Qatar",
    subtitle: "The Riviera of Arabia",
    description: "Luxury yacht marinas, European-inspired canal bridges, world-class amphitheatres, and high-jewelry boutiques.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80",
    isQatar: true,
    highlights: ["Superyacht Marina", "Amphitheatre", "Venetian Quartier", "Haute Cuisine"],
  },
  {
    id: "souq-waqif",
    name: "Souq Waqif & Msheireb",
    region: "Doha, Qatar",
    subtitle: "Ancient Heart & Heritage",
    description: "A labyrinth of aromatic spices, royal falcon hospitals, Arabian horse stables, and sustainable smart city architecture.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80",
    isQatar: true,
    highlights: ["Falcon Souq", "Oud & Perfumes", "Royal Stables", "Msheireb Downtown"],
  },
  {
    id: "alula",
    name: "AlUla & Hegra",
    region: "Saudi Arabia (GCC)",
    subtitle: "Ancient Living Museum",
    description: "Millennia-old monumental Nabataean tombs carved into sandstone monoliths amidst lush date palm oases.",
    image: "https://images.unsplash.com/photo-1578895101407-28d8b6bc0e9e?auto=format&fit=crop&w=1000&q=80",
    isQatar: false,
    highlights: ["Hegra UNESCO", "Maraya Mirror Hall", "Luxury Oasis Stays", "Stargazing"],
  },
  {
    id: "dubai-emirates",
    name: "Dubai & Abu Dhabi",
    region: "UAE (GCC)",
    subtitle: "Glamour & Grandeur",
    description: "Private island resorts, helicopter transfers over Palm Jumeirah, and private viewing of the Louvre Abu Dhabi.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80",
    isQatar: false,
    highlights: ["Burj Al Arab", "Louvre Abu Dhabi", "Yacht Cruises", "Desert Palaces"],
  },
  {
    id: "musandam",
    name: "Musandam Fjords",
    region: "Oman (GCC)",
    subtitle: "The Norway of Arabia",
    description: "Sheer limestone sea cliffs rising out of crystalline fjord waters, dolphin spotting, and private dhow cruising.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    isQatar: false,
    highlights: ["Fjord Navigation", "Wild Dolphins", "Snorkeling Reefs", "Traditional Dhows"],
  },
];

export interface Review {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  date: string;
  tourTaken: string;
  comment: string;
  avatar: string;
}

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "Lady Camilla Sterling",
    title: "Private Collector & Traveler",
    location: "London, United Kingdom",
    rating: 5,
    date: "February 2026",
    tourTaken: "The Royal Khor Al Adaid Expedition",
    comment:
      "Having traveled extensively across the Middle East, Al Mirqab represents the zenith of discreet Arabian hospitality. The desert setup at the Inland Sea was breathtaking—fine china, private butler, and an astronomer under the night sky. Truly five-star in every sense.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "rev-2",
    name: "Sheikh Faisal Al-Humaid",
    title: "Managing Partner",
    location: "Riyadh, Saudi Arabia",
    rating: 5,
    date: "January 2026",
    tourTaken: "Presidential Fleet & VIP Tarmac Concierge",
    comment:
      "Flawless execution from tarmac meet-and-greet at Hamad International to executive transport across Doha for our delegation. The Mercedes-Maybach fleet was immaculate, and the drivers possessed the highest standard of executive etiquette.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "rev-3",
    name: "Dr. Maximilian von Berg",
    title: "Cultural Patron & Architect",
    location: "Zurich, Switzerland",
    rating: 5,
    date: "March 2026",
    tourTaken: "Doha Imperial Cultural Odyssey",
    comment:
      "Our private historian guide unlocked doors in Doha that ordinary tourists never see. Private access to the Museum of Islamic Art and an intimate walk through the Souq Waqif stables made this an unforgettable cultural masterpiece.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "rev-4",
    name: "Elena Rostova",
    title: "Luxury Event Director",
    location: "Monaco",
    rating: 5,
    date: "December 2025",
    tourTaken: "Imperial Desert Gala & Celebration",
    comment:
      "We hosted a 40th anniversary desert gala for 20 high-profile guests. The crystal chandeliers in the dunes, the live Oud musicians, and the Michelin-trained private chef left our international guests utterly spellbound.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
  },
];
