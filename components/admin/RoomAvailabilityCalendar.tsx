'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { roomAPI } from '@/lib/api';
import type { Hotel } from '@/types';

const RANGE_DAYS = 14;

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

const STATUS_STYLE: Record<string, string> = {
  available: 'bg-green-500/10 text-green-400 border-green-500/20',
  occupied: 'bg-red-500/10 text-red-400 border-red-500/20',
  maintenance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function RoomAvailabilityCalendar({ hotels }: { hotels: Hotel[] }) {
  const [hotelId, setHotelId] = useState(hotels[0]?._id || '');
  const [rangeStart, setRangeStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (hotels.length && !hotelId) setHotelId(hotels[0]._id); }, [hotels, hotelId]);

  useEffect(() => {
    if (!hotelId) return;
    setLoading(true);
    const from = toISODate(rangeStart);
    const to = toISODate(addDays(rangeStart, RANGE_DAYS - 1));
    roomAPI.getAvailability(hotelId, from, to)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [hotelId, rangeStart]);

  const formatDay = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return { weekday: d.toLocaleDateString(undefined, { weekday: 'short' }), day: d.getDate() };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <select value={hotelId} onChange={e => setHotelId(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={() => setRangeStart(d => addDays(d, -RANGE_DAYS))} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">
            {data ? `${data.from} → ${data.to}` : '—'}
          </span>
          <button onClick={() => setRangeStart(d => addDays(d, RANGE_DAYS))} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {Object.entries(STATUS_STYLE).map(([status, cls]) => (
            <span key={status} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border capitalize ${cls}`}>
              <span className="w-2 h-2 rounded-full bg-current" /> {status}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading availability…</div>
      ) : !data || data.rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No active rooms for this hotel.</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left py-2.5 px-3 font-semibold text-gray-400 uppercase sticky left-0 bg-gray-800/95">Room</th>
                {data.dates.map((iso: string) => {
                  const { weekday, day } = formatDay(iso);
                  return (
                    <th key={iso} className="py-2.5 px-2 font-semibold text-gray-400 min-w-[46px]">
                      <div>{weekday}</div>
                      <div className="text-gray-200">{day}</div>
                    </th>
                  );
                })}
              </tr>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                <td className="py-1.5 px-3 text-gray-500 sticky left-0 bg-gray-800/95">Occupancy</td>
                {data.dates.map((iso: string) => (
                  <td key={iso} className="py-1.5 px-2 text-center text-gray-400">{data.occupancy[iso]?.rate ?? 0}%</td>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rooms.map((room: any) => (
                <tr key={room.roomId} className="border-b border-gray-800/50">
                  <td className="py-2 px-3 text-white font-medium sticky left-0 bg-gray-900">
                    #{room.roomNumber}
                    <span className="block text-[10px] text-gray-500 capitalize">{room.type} · Floor {room.floor}</span>
                  </td>
                  {data.dates.map((iso: string) => (
                    <td key={iso} className="p-1">
                      <div className={`h-6 rounded-md border text-center leading-6 capitalize ${STATUS_STYLE[room.days[iso]] || ''}`} title={room.days[iso]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
