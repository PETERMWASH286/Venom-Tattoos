export const ADDRESS = "232a Queen St W, Toronto, ON M5V 1Z6";
export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=232a+Queen+St+W,+Toronto,+ON+M5V+1Z6";
export const STUDIO_RATE_CAD_PER_USDT = 1.38;

export type Service = {
  id: string;
  name: string;
  blurb: string;
  session: string;
  from: number;
  deposit: number;
};

export const services: Service[] = [
  {
    id: "consult",
    name: "Consult & drawing",
    blurb: "Sit with an artist, lock the idea, leave with a date.",
    session: "45 min",
    from: 0,
    deposit: 50,
  },
  {
    id: "small",
    name: "Small piece",
    blurb: "Palm-sized work. Fine line, symbols, tiny ornament.",
    session: "1–2 hrs",
    from: 180,
    deposit: 80,
  },
  {
    id: "session",
    name: "Half day",
    blurb: "A proper sitting. Blackwork, color, or a realism study.",
    session: "4 hrs",
    from: 700,
    deposit: 150,
  },
  {
    id: "day",
    name: "Full day",
    blurb: "Sleeves, backs, and cover-ups that need the whole chair.",
    session: "7 hrs",
    from: 1400,
    deposit: 250,
  },
];

export type Artist = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  days: number[];
};

export const artists: Artist[] = [
  {
    id: "mira",
    name: "Mira Chen",
    role: "Blackwork & ornament",
    bio: "Draws like an engraver. Heavy black, symmetry, marks that read from across the street.",
    image: "/studio/artist-mira.jpg",
    days: [2, 3, 4],
  },
  {
    id: "jules",
    name: "Jules Okonkwo",
    role: "Realism & creatures",
    bio: "Portraits and animals with quiet eyes. If it needs to look alive, it sits with Jules.",
    image: "/studio/artist-jules.jpg",
    days: [3, 4, 5, 6],
  },
  {
    id: "soren",
    name: "Soren Vale",
    role: "Fine line & botanical",
    bio: "Hairline plants, insects, and lines you only notice up close.",
    image: "/studio/artist-soren.jpg",
    days: [0, 4, 5, 6],
  },
];

export type Piece = {
  src: string;
  title: string;
  style: string;
  artistId: string;
  placement: string;
};

export const pieces: Piece[] = [
  {
    src: "/studio/tattoo-serpent.jpg",
    title: "Serpent coil",
    style: "Blackwork",
    artistId: "mira",
    placement: "Forearm",
  },
  {
    src: "/studio/tattoo-botanical.jpg",
    title: "Orchid study",
    style: "Fine line",
    artistId: "soren",
    placement: "Collarbone",
  },
  {
    src: "/studio/tattoo-dragon.jpg",
    title: "Storm dragon",
    style: "Irezumi",
    artistId: "jules",
    placement: "Shoulder",
  },
  {
    src: "/studio/tattoo-ornament.jpg",
    title: "Thorn mirror",
    style: "Ornament",
    artistId: "mira",
    placement: "Ribs",
  },
  {
    src: "/studio/tattoo-peony.jpg",
    title: "Peony sleeve",
    style: "Color",
    artistId: "soren",
    placement: "Arm",
  },
];

export const hours: { label: string; value: string }[] = [
  { label: "Monday", value: "Closed" },
  { label: "Tuesday – Friday", value: "12–8" },
  { label: "Saturday", value: "11–7" },
  { label: "Sunday", value: "12–5" },
];

export const ticker = [
  "Blackwork",
  "Fine line",
  "Irezumi",
  "Realism",
  "Ornament",
  "Color",
  "Cover-ups",
];

export function money(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function cadToUsdt(cad: number) {
  return (cad / STUDIO_RATE_CAD_PER_USDT).toFixed(2);
}

export function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} ${d}`;
}

export function prettyTime(time: string) {
  const [hRaw, minRaw] = time.split(":");
  const h = Number(hRaw);
  const min = Number(minRaw);
  const suffix = h >= 12 ? "pm" : "am";
  const hr = h % 12 || 12;
  return `${hr}:${String(min).padStart(2, "0")} ${suffix}`;
}

export function artistById(id: string) {
  return artists.find((artist) => artist.id === id) ?? artists[0];
}

export function serviceById(id: string) {
  return services.find((service) => service.id === id) ?? services[2];
}

export function upcomingDates(artistId: string, count = 10) {
  const artist = artists.find((item) => item.id === artistId);
  const open = artist ? artist.days : [0, 2, 3, 4, 5, 6];
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  while (dates.length < count) {
    if (open.includes(cursor.getDay())) dates.push(ymd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function slotsFor(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(y, (m ?? 1) - 1, d ?? 1).getDay();
  if (day === 0) return ["12:00", "14:30"];
  return ["12:00", "14:30", "17:00"];
}

export function dateBits(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return {
    week: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: String(d),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

/** Client clock only — don't call during SSR or the label will mismatch hydration. */
export function studioOpen(now: Date) {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const windows: Record<number, [number, number] | null> = {
    0: [12 * 60, 17 * 60],
    1: null,
    2: [12 * 60, 20 * 60],
    3: [12 * 60, 20 * 60],
    4: [12 * 60, 20 * 60],
    5: [12 * 60, 20 * 60],
    6: [11 * 60, 19 * 60],
  };
  const window = windows[day];
  if (window && mins >= window[0] && mins < window[1]) {
    return { open: true as const, label: "Open now" };
  }
  return { open: false as const, label: "By appointment" };
}

export function dayNames(days: number[]) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((day) => names[day])
    .join(" · ");
}

