// Shared between the UI and the server prompt builder

export const STYLE_PRESETS = [
  { id: "modern", label: "Modern", description: "clean modern SaaS look, generous whitespace, soft shadows, rounded cards" },
  { id: "minimal", label: "Minimal", description: "minimalist, lots of whitespace, restrained typography, almost monochrome" },
  { id: "bold", label: "Bold", description: "bold and vibrant, large expressive headlines, strong contrast, energetic gradients" },
  { id: "corporate", label: "Corporate", description: "professional corporate style, trustworthy, structured grid, muted palette" },
  { id: "playful", label: "Playful", description: "playful and friendly, rounded shapes, bright colours, light illustrations made with SVG" },
  { id: "dark", label: "Dark", description: "dark mode design, deep background, glowing accents, high contrast text" },
  { id: "glass", label: "Glass", description: "glassmorphism, frosted translucent panels over colourful gradient backgrounds" },
] as const;

export const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "testimonials", label: "Testimonials" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
  { id: "footer", label: "Footer" },
] as const;

export type StyleId = (typeof STYLE_PRESETS)[number]["id"];
export type SectionId = (typeof SECTIONS)[number]["id"];

export const STYLE_IDS = STYLE_PRESETS.map((s) => s.id) as [StyleId, ...StyleId[]];
export const SECTION_IDS = SECTIONS.map((s) => s.id) as [SectionId, ...SectionId[]];

export const STARTER_PROMPTS = [
  "A sleek landing page for an AI note-taking app with a waitlist signup",
  "A cosy coffee shop with menu highlights, opening hours and location",
  "A fitness coach offering online programs with pricing tiers",
  "A portfolio for a freelance UI/UX designer with case studies",
  "A mobile banking app launch with app store buttons and security features",
  "A wedding photography studio with a gallery and booking section",
];

export const REFINE_SUGGESTIONS = [
  "Switch to a dark theme",
  "Add a pricing section with 3 tiers",
  "Add subtle scroll animations",
  "Make the hero more eye-catching",
  "Improve the mobile layout",
  "Add a testimonials carousel",
];
