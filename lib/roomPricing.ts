interface CustomRate {
  startDate: string;
  endDate: string;
  price: number;
}

interface RoomRate {
  price: number;
  weekendRate?: number;
  customRates?: CustomRate[];
}

export interface StayEstimate {
  nights: number;
  subtotal: number;
  tax: number;
  total: number;
}

const dateKey = (d: Date): string => d.toISOString().slice(0, 10);

// Mirrors the backend's utils/pricing.ts priority exactly: a custom date-range override
// beats the weekend rate, which beats the base price. Kept as the single client-side
// source of truth for price previews so they never drift from what the server charges.
const rateForNight = (room: RoomRate, d: Date): number => {
  const key = dateKey(d);
  const custom = room.customRates?.find(r => key >= r.startDate.slice(0, 10) && key <= r.endDate.slice(0, 10));
  if (custom) return custom.price;

  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return isWeekend && room.weekendRate ? room.weekendRate : room.price;
};

export const estimateStayTotal = (room: RoomRate | null | undefined, checkIn: string, checkOut: string): StayEstimate => {
  if (!room || !checkIn || !checkOut) return { nights: 0, subtotal: 0, tax: 0, total: 0 };

  let nights = 0;
  let subtotal = 0;
  for (let d = new Date(checkIn); d < new Date(checkOut); d.setDate(d.getDate() + 1)) {
    subtotal += rateForNight(room, d);
    nights++;
  }
  const tax = Math.round(subtotal * 0.12);
  return { nights, subtotal, tax, total: subtotal + tax };
};
