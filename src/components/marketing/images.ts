// Unsplash photography (free Unsplash License), served straight from
// images.unsplash.com so it does not use Vercel image optimisation.
// Placeholder imagery until Drefit has its own shoot of real members/coaches.
const u = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=${w}`

export const PHOTOS = {
  // Edgar Chaparro, "grayscale photo of man working out" (unsplash.com/photos/sHfo3WOgGTU)
  training: { src: u("1526506118085-60ce8714f8c5", 1200), srcSet: `${u("1526506118085-60ce8714f8c5", 640)} 640w, ${u("1526506118085-60ce8714f8c5", 1200)} 1200w`, alt: "An athlete mid pull-up in a dim gym, back muscles taut" },
  // Keesha's Kitchen, jollof rice (unsplash.com/photos/woC24wGXsQ8)
  meals: { src: u("1664992960082-0ea299a9c53e", 1200), srcSet: `${u("1664992960082-0ea299a9c53e", 640)} 640w, ${u("1664992960082-0ea299a9c53e", 1200)} 1200w`, alt: "A dish of jollof rice topped with grilled chicken and pepper skewers" },
  // Jeremy Stewart, "a woman running down a road next to a lake" (unsplash.com/photos/a3DjtwLJ-_Y)
  running: { src: u("1631899560971-394ded28a80f", 1200), srcSet: `${u("1631899560971-394ded28a80f", 640)} 640w, ${u("1631899560971-394ded28a80f", 1200)} 1200w`, alt: "A woman running along a lakeside path on an overcast morning" },
} as const

export type Photo = (typeof PHOTOS)[keyof typeof PHOTOS]
