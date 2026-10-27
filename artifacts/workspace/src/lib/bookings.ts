import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PayMethod = "card" | "paypal" | "usdt";

export type Draft = {
  serviceId: string;
  artistId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  placement: string;
  idea: string;
};

export const emptyDraft: Draft = {
  serviceId: "session",
  artistId: "mira",
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  placement: "",
  idea: "",
};

export type Booking = Draft & {
  id: string;
  code: string;
  deposit: number;
  method: PayMethod;
  paymentRef: string;
  live: boolean;
  createdAt: string;
  passToken?: string;
};

type BookingState = {
  draft: Draft;
  bookings: Booking[];
  setDraft: (patch: Partial<Draft>) => void;
  resetDraft: () => void;
  addBooking: (booking: Booking) => void;
  attachPass: (id: string, passToken: string) => void;
};

export const useBookings = create<BookingState>()(
  persist(
    (set) => ({
      draft: emptyDraft,
      bookings: [],
      setDraft: (patch) =>
        set((state) => ({ draft: { ...state.draft, ...patch } })),
      resetDraft: () => set({ draft: emptyDraft }),
      addBooking: (booking) =>
        set((state) => ({ bookings: [booking, ...state.bookings] })),
      attachPass: (id, passToken) =>
        set((state) => ({
          bookings: state.bookings.map((item) => (item.id === id ? { ...item, passToken } : item)),
        })),
    }),
    {
      name: "venom-bookings",
      skipHydration: true,
    },
  ),
);

export function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 4; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `VNM-${body}`;
}
