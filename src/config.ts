// Site-wide configuration
export interface SiteConfig {
  language: string;
  siteName: string;
  siteDescription: string;
  /** Public site origin for canonical URLs in production (optional; override with VITE_SITE_URL). */
  canonicalOrigin?: string;
}

export const siteConfig: SiteConfig = {
  language: "en",
  siteName: "Zuri Adventures",
  siteDescription: "Unforgettable Trips, Memorable Adventures - Experience the Best of Coastal Kenya",
  canonicalOrigin: "https://zuriadventures.com",
};

// Hero Section
export interface HeroConfig {
  backgroundImage: string;
  backgroundAlt: string;
  title: string;
  subtitle: string;
}

export const heroConfig: HeroConfig = {
  backgroundImage: "/hero-bg.jpg",
  backgroundAlt: "Beautiful Kenyan coastline with turquoise waters and dhow boats",
  title: "Zuri Adventures",
  subtitle: "Unforgettable Trips, Memorable Adventures",
};

// Narrative Text Section
export interface NarrativeTextConfig {
  line1: string;
  line2: string;
  line3: string;
}

export const narrativeTextConfig: NarrativeTextConfig = {
  line1: "Experience the Best of Coastal Kenya",
  line2: "Discover hidden gems and create unforgettable memories",
  line3: "From pristine beaches to marine wildlife encounters, we curate exceptional adventures along Kenya's stunning coastline. Our expertly crafted experiences blend culture, nature, and adventure for journeys that stay with you forever.",
};

// ZigZag Grid Section
export interface ZigZagGridItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse: boolean;
  /** Longer summary for meta descriptions and detail pages */
  seoDescription?: string;
  /** Cross-link to a package detail URL slug */
  relatedPackageSlug?: string;
}

export interface ZigZagGridConfig {
  sectionLabel: string;
  sectionTitle: string;
  items: ZigZagGridItem[];
}

export const zigZagGridConfig: ZigZagGridConfig = {
  sectionLabel: "Our Adventures",
  sectionTitle: "Explore Coastal Kenya",
  items: [
    {
      id: "malindi",
      title: "Malindi Full Day Adventure",
      subtitle: "Desert & Culture",
      description: "Enjoy a full day exploring Malindi's treasures. Visit the historic falconry center, discover the mysteries of Lost Malindi, ride quad bikes across the stunning Mambrui Sand Dunes, and experience the thrill of desert adventure on Kenya's coast.",
      image: "/malindi-quad.jpg",
      imageAlt: "Quad bike adventure on Mambrui sand dunes",
      reverse: false,
      seoDescription:
        "Full-day Malindi adventure in Kenya: falconry, Lost Malindi, Mambrui sand dunes quad biking, lunch, and expert local guides.",
      relatedPackageSlug: "malindi-explorer",
    },
    {
      id: "diani",
      title: "Diani Full Day Experience",
      subtitle: "Hidden Gems",
      description: "Discover some of Diani's best-kept secrets. Visit the enchanting African Pool, explore the wildlife at Bora Bora Game Reserve, and witness the magical Kongo River sunset sighting as the day ends in golden splendor.",
      image: "/diani-sunset.jpg",
      imageAlt: "Diani beach sunset with traditional dhow boat",
      reverse: true,
      seoDescription:
        "Discover Diani Beach: African Pool, Bora Bora Game Reserve, Kongo River sunset, and coastal Kenya highlights with Zuri Adventures.",
      relatedPackageSlug: "diani-discovery",
    },
    {
      id: "wasini",
      title: "Wasini Island Marine Excursion",
      subtitle: "Ocean Adventure",
      description: "A perfect ocean adventure awaits at Wasini Island. Experience dolphin sightseeing in their natural habitat, snorkel among vibrant coral reefs, and savor a delicious seafood lunch freshly prepared by local chefs.",
      image: "/snorkeling.jpg",
      imageAlt: "Snorkeling with colorful coral reef and marine life",
      reverse: false,
      seoDescription:
        "Wasini Island day trip: dolphin watching, coral reef snorkeling, seafood lunch, and marine guides on the Kenya coast.",
      relatedPackageSlug: "wasini-marine",
    },
    {
      id: "mombasa",
      title: "Mombasa Sunset Experience",
      subtitle: "City & Sea",
      description: "Experience the magic of Mombasa at dusk. Enjoy a serene sunset dhow cruise along the coast, followed by a night city tour where you'll savor delicious Swahili cuisine and discover the vibrant culture of this historic port city.",
      image: "/mombasa-cruise.jpg",
      imageAlt: "Traditional dhow cruise at sunset in Mombasa",
      reverse: true,
      seoDescription:
        "Mombasa sunset dhow cruise, Swahili dinner, and evening city tour — half-day coastal Kenya experience.",
      relatedPackageSlug: "mombasa-sunset",
    },
  ],
};

// Breath Section
export interface BreathSectionConfig {
  backgroundImage: string;
  backgroundAlt: string;
  title: string;
  subtitle: string;
  description: string;
}

export const breathSectionConfig: BreathSectionConfig = {
  backgroundImage: "/safari-elephant.jpg",
  backgroundAlt: "African elephant in savanna at golden sunset",
  title: "All Packages Include Transport",
  subtitle: "Private Experiences | Group Trips",
  description: "Pick a location and let Zuri Adventures create unforgettable memories for you. We handle all logistics so you can focus on the experience.",
};

// Card Stack Section
export interface CardStackItem {
  id: number;
  image: string;
  title: string;
  description: string;
  rotation: number;
}

export interface CardStackConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  cards: CardStackItem[];
}

export const cardStackConfig: CardStackConfig = {
  sectionTitle: "Adventure Highlights",
  sectionSubtitle: "What Awaits You",
  cards: [
    {
      id: 1,
      image: "/falconry.jpg",
      title: "Falconry Visit",
      description: "Witness magnificent birds of prey up close at Malindi's renowned falconry center.",
      rotation: -2,
    },
    {
      id: 2,
      image: "/wasini-dolphins.jpg",
      title: "Dolphin Sighting",
      description: "Watch playful dolphins swim alongside your boat in their natural habitat.",
      rotation: 1,
    },
    {
      id: 3,
      image: "/seafood-lunch.jpg",
      title: "Seafood Feast",
      description: "Savor the freshest catch prepared with authentic coastal flavors.",
      rotation: -1,
    },
  ],
};

// Instagram Reels Section
export interface ReelItem {
  id: number;
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  likes: string;
  comments: string;
}

export interface InstagramReelsConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  instagramLink: string;
  reels: ReelItem[];
}

export const instagramReelsConfig: InstagramReelsConfig = {
  sectionTitle: "Adventure Highlights",
  sectionSubtitle: "Watch Our Adventures",
  instagramLink: "https://instagram.com/zuriadventures",
  reels: [
    {
      id: 1,
      videoUrl: "",
      thumbnail: "/falconry.jpg",
      title: "Falconry Visit",
      description: "Witness magnificent birds of prey up close at Malindi's renowned falconry center. 🦅 #Malindi #Falconry #Kenya",
      likes: "2.4k",
      comments: "128",
    },
    {
      id: 2,
      videoUrl: "",
      thumbnail: "/wasini-dolphins.jpg",
      title: "Dolphin Sighting",
      description: "Watch playful dolphins swim alongside your boat in their natural habitat. 🐬 #Wasini #Dolphins #KenyaCoast",
      likes: "3.1k",
      comments: "245",
    },
    {
      id: 3,
      videoUrl: "",
      thumbnail: "/seafood-lunch.jpg",
      title: "Seafood Feast",
      description: "Savor the freshest catch prepared with authentic coastal flavors. 🦞 #Seafood #KenyanCuisine #Coastal",
      likes: "1.8k",
      comments: "89",
    },
    {
      id: 4,
      videoUrl: "",
      thumbnail: "/malindi-quad.jpg",
      title: "Quad Bike Adventure",
      description: "Ride across the stunning Mambrui Sand Dunes! 🏜️ #QuadBike #Adventure #Malindi",
      likes: "4.2k",
      comments: "312",
    },
  ],
};

// About Section
export interface AboutValue {
  icon: string;
  title: string;
  description: string;
}

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutConfig {
  subtitle: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  yearsExperience: string;
  values: AboutValue[];
  stats: AboutStat[];
  ctaText: string;
  ctaLink: string;
}

export const aboutConfig: AboutConfig = {
  subtitle: "Our Story",
  title: "Creating Unforgettable Memories Since 2015",
  description: "Zuri Adventures was born from a passion for sharing the breathtaking beauty of Kenya's coastline with travelers from around the world. Our team of local experts crafts immersive experiences that go beyond typical tourism, connecting you with the authentic culture, wildlife, and natural wonders of Coastal Kenya.",
  image: "/kenya-beach.jpg",
  imageAlt: "Beautiful Kenyan beach with turquoise waters",
  yearsExperience: "10",
  values: [
    {
      icon: "compass",
      title: "Authentic Experiences",
      description: "Genuine local adventures",
    },
    {
      icon: "heart",
      title: "Passionate Guides",
      description: "Expert local knowledge",
    },
    {
      icon: "shield",
      title: "Safe Adventures",
      description: "Your safety first",
    },
    {
      icon: "users",
      title: "Small Groups",
      description: "Personalized attention",
    },
  ],
  stats: [
    { value: "5,000+", label: "Happy Travelers" },
    { value: "50+", label: "Adventure Tours" },
    { value: "15", label: "Expert Guides" },
    { value: "4.9", label: "Average Rating" },
  ],
  ctaText: "Learn More About Us",
  ctaLink: "#about",
};

// Testimonials Section
export interface Testimonial {
  quote: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  trip: string;
}

export interface TestimonialsConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  testimonials: Testimonial[];
  badges?: string[];
}

export const testimonialsConfig: TestimonialsConfig = {
  sectionTitle: "What Our Travelers Say",
  sectionSubtitle: "Testimonials",
  testimonials: [
    {
      quote: "The Malindi adventure was absolutely incredible! From the falconry visit to quad biking on the sand dunes, every moment was magical. The guides were knowledgeable and made us feel safe throughout.",
      name: "Sarah Mitchell",
      location: "London, UK",
      avatar: "/falconry.jpg",
      rating: 5,
      trip: "Malindi Full Day Adventure",
    },
    {
      quote: "Swimming with dolphins at Wasini Island was a dream come true! The marine life was spectacular and the seafood lunch was the freshest I've ever had. Highly recommend!",
      name: "Michael Chen",
      location: "Singapore",
      avatar: "/wasini-dolphins.jpg",
      rating: 5,
      trip: "Wasini Island Marine Excursion",
    },
    {
      quote: "The sunset dhow cruise in Mombasa was the highlight of our honeymoon. The Swahili dinner was delicious and the city tour gave us a real taste of local culture.",
      name: "Emma & James",
      location: "Sydney, Australia",
      avatar: "/diani-sunset.jpg",
      rating: 5,
      trip: "Mombasa Sunset Experience",
    },
    {
      quote: "Snorkeling the reef was unreal — crystal water, colorful fish everywhere, and guides who knew every tide and current. I felt looked after the whole time.",
      name: "Lisa van den Berg",
      location: "Amsterdam, Netherlands",
      avatar: "/snorkeling.jpg",
      rating: 5,
      trip: "Coastal Reef Snorkel",
    },
    {
      quote: "Quad biking across the dunes was pure adrenaline. Professional briefing, great equipment, and views I’ll never forget. Already planning our next Kenya trip.",
      name: "David Okonkwo",
      location: "Nairobi, Kenya",
      avatar: "/malindi-quad.jpg",
      rating: 5,
      trip: "Malindi Dunes & Quad",
    },
    {
      quote: "Seeing elephants in the wild with a patient guide made this the trip of a lifetime. Respectful distances, amazing photos, and zero rush.",
      name: "Hannah Weber",
      location: "Munich, Germany",
      avatar: "/safari-elephant.jpg",
      rating: 4,
      trip: "Wildlife & Safari Day",
    },
  ],
  badges: ["TripAdvisor Excellence", "Google 5-Star Rated", "Kenya Tourism Board Certified"],
};

// Gallery Section
export interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

export interface GalleryConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  description: string;
  images: GalleryImage[];
  ctaText?: string;
  ctaLink?: string;
}

export const galleryConfig: GalleryConfig = {
  sectionTitle: "Adventure Gallery",
  sectionSubtitle: "Captured Moments",
  description: "Browse through stunning moments from our adventures across Coastal Kenya. Each photo tells a story of discovery, excitement, and natural beauty.",
  images: [
    { src: "/falconry.jpg", alt: "Falconry experience", caption: "Falconry at Malindi" },
    { src: "/wasini-dolphins.jpg", alt: "Dolphin watching", caption: "Dolphins at Wasini Island" },
    { src: "/seafood-lunch.jpg", alt: "Seafood feast", caption: "Fresh coastal cuisine" },
    { src: "/malindi-quad.jpg", alt: "Quad biking", caption: "Sand dune adventure" },
    { src: "/diani-sunset.jpg", alt: "Sunset cruise", caption: "Diani sunset" },
    { src: "/snorkeling.jpg", alt: "Snorkeling", caption: "Underwater exploration" },
    { src: "/mombasa-cruise.jpg", alt: "Dhow cruise", caption: "Traditional dhow experience" },
    { src: "/safari-elephant.jpg", alt: "Safari", caption: "Wildlife encounters" },
  ],
  ctaText: "View More on Instagram",
  ctaLink: "https://instagram.com/zuriadventures",
};

// FAQ Section
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  description: string;
  faqs: FAQItem[];
  ctaText: string;
  ctaLink: string;
}

export const faqConfig: FAQConfig = {
  sectionTitle: "Frequently Asked Questions",
  sectionSubtitle: "Got Questions?",
  description: "Find answers to common questions about our adventures, bookings, and what to expect on your journey with Zuri Adventures.",
  faqs: [
    {
      question: "What should I bring on the tour?",
      answer: "We recommend bringing sunscreen, a hat, comfortable walking shoes, swimwear, a towel, and a camera. For marine excursions, snorkeling gear is provided, but you're welcome to bring your own. Don't forget your sense of adventure!",
    },
    {
      question: "Are the tours suitable for children?",
      answer: "Yes! Most of our tours are family-friendly. The Malindi Quad Bike adventure has a minimum age of 12 years, but our dolphin watching and sunset cruises are perfect for all ages. Please let us know if you're traveling with young children.",
    },
    {
      question: "What's included in the tour price?",
      answer: "All our packages include transportation from your hotel/resort, professional guides, entrance fees, meals as specified, and all activities. The Wasini Island tour includes snorkeling equipment and a delicious seafood lunch.",
    },
    {
      question: "Can I book a private tour?",
      answer: "Absolutely! We specialize in private experiences tailored to your preferences. Whether it's a romantic sunset cruise or a family adventure, we can customize any tour to meet your needs.",
    },
    {
      question: "What is your cancellation policy?",
      answer: "We offer free cancellation up to 48 hours before your scheduled tour for a full refund. Cancellations within 48 hours receive a 50% refund. No-shows are not eligible for refunds.",
    },
    {
      question: "Do you offer hotel pickup?",
      answer: "Yes! We provide complimentary pickup and drop-off from all major hotels and resorts in Mombasa, Diani, and Malindi areas. Just let us know your location when booking.",
    },
  ],
  ctaText: "Contact Us",
  ctaLink: "#contact",
};

// Packages Section
export interface Package {
  /** URL segment for programmatic SEO pages, e.g. /packages/malindi-explorer */
  slug: string;
  name: string;
  duration: string;
  price: string;
  priceNote: string;
  image: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  featured: boolean;
  icon: string;
  seoDescription?: string;
}

export interface PackagesConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  description: string;
  packages: Package[];
  footerNote: string;
}

export const packagesConfig: PackagesConfig = {
  sectionTitle: "Our Packages",
  sectionSubtitle: "Choose Your Adventure",
  description: "From half-day excursions to full-day adventures, we have the perfect package for every traveler. All packages include transportation, expert guides, and unforgettable experiences.",
  packages: [
    {
      slug: "malindi-explorer",
      name: "Malindi Explorer",
      duration: "Full Day",
      price: "$120",
      priceNote: "per person",
      image: "/malindi-quad.jpg",
      seoDescription:
        "Book the Malindi Explorer full-day package: hotel transfers, falconry, Lost Malindi, Mambrui dune quad biking, lunch, and a professional guide.",
      features: [
        "Hotel pickup & drop-off",
        "Falconry center visit",
        "Lost Malindi tour",
        "Quad bike adventure",
        "Lunch included",
        "Professional guide",
      ],
      ctaText: "Book Now",
      ctaLink: "#book",
      featured: true,
      icon: "star",
    },
    {
      slug: "diani-discovery",
      name: "Diani Discovery",
      duration: "Full Day",
      price: "$95",
      priceNote: "per person",
      image: "/diani-sunset.jpg",
      seoDescription:
        "Diani Discovery full-day tour: African Pool, Bora Bora Game Reserve, Kongo River sunset, snacks and drinks, and guided coastal Kenya experience.",
      features: [
        "Hotel pickup & drop-off",
        "African Pool visit",
        "Bora Bora Game Reserve",
        "Kongo River sunset",
        "Snacks & drinks",
        "Professional guide",
      ],
      ctaText: "Book Now",
      ctaLink: "#book",
      featured: false,
      icon: "clock",
    },
    {
      slug: "wasini-marine",
      name: "Wasini Marine",
      duration: "Full Day",
      price: "$140",
      priceNote: "per person",
      image: "/snorkeling.jpg",
      seoDescription:
        "Wasini Marine package: dolphin watching, snorkeling gear, coral reefs, seafood lunch, and marine guides — full day from Coastal Kenya hotels.",
      features: [
        "Hotel pickup & drop-off",
        "Dolphin watching",
        "Snorkeling equipment",
        "Coral reef exploration",
        "Seafood lunch",
        "Marine guide",
      ],
      ctaText: "Book Now",
      ctaLink: "#book",
      featured: false,
      icon: "users",
    },
    {
      slug: "mombasa-sunset",
      name: "Mombasa Sunset",
      duration: "Half Day",
      price: "$75",
      priceNote: "per person",
      image: "/mombasa-cruise.jpg",
      seoDescription:
        "Mombasa Sunset half-day package: dhow cruise, Swahili dinner, night city tour, and hotel pickup on the Kenya coast.",
      features: [
        "Hotel pickup & drop-off",
        "Sunset dhow cruise",
        "Swahili dinner",
        "Night city tour",
        "Cultural experience",
        "Local guide",
      ],
      ctaText: "Book Now",
      ctaLink: "#book",
      featured: false,
      icon: "car",
    },
  ],
  footerNote: "All prices are in USD. Group discounts available for 6+ people. Custom private tours available upon request.",
};

// Footer Section
export interface FooterContactItem {
  type: "email" | "phone";
  label: string;
  value: string;
  href: string;
}

export interface FooterSocialItem {
  platform: string;
  href: string;
}

export interface FooterConfig {
  heading: string;
  description: string;
  ctaText: string;
  contact: FooterContactItem[];
  locationLabel: string;
  address: string[];
  socialLabel: string;
  socials: FooterSocialItem[];
  logoText: string;
  copyright: string;
  links: { label: string; href: string }[];
}

export const footerConfig: FooterConfig = {
  heading: "Ready for Your Adventure?",
  description: "Contact us to book your unforgettable coastal Kenya experience. Our team is ready to help you plan the perfect trip.",
  ctaText: "Book Now",
  contact: [
    {
      type: "phone",
      label: "+254 791 860 054",
      value: "+254791860054",
      href: "tel:+254791860054",
    },
    {
      type: "phone",
      label: "+254 741 770 823",
      value: "+254741770823",
      href: "tel:+254741770823",
    },
  ],
  locationLabel: "Location",
  address: ["Coastal Kenya", "Mombasa, Kenya"],
  socialLabel: "Follow Us",
  socials: [
    {
      platform: "instagram",
      href: "https://instagram.com/zuriadventures",
    },
    {
      platform: "facebook",
      href: "https://facebook.com/zuriadventures",
    },
  ],
  logoText: "Zuri Adventures",
  copyright: "Zuri Adventures. All rights reserved.",
  links: [
    { label: "Packages", href: "/packages" },
    { label: "Adventures", href: "/adventures" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};
