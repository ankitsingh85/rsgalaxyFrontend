'use client';
import { useState } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import { Star } from 'lucide-react';
import type { Hotel } from '@/types';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const containerStyle = { width: '100%', height: '520px', borderRadius: '1rem' };
const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India

export default function HotelMapView({ hotels, onEdit }: { hotels: Hotel[]; onEdit: (hotel: Hotel) => void }) {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [active, setActive] = useState<Hotel | null>(null);
  const located = hotels.filter(h => h.latitude != null && h.longitude != null);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-[520px] bg-gray-900 border border-gray-800 rounded-2xl text-sm text-gray-500 text-center px-6">
        Google Maps key not configured — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in frontend/.env.local to enable the map view.
      </div>
    );
  }
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-[520px] bg-gray-900 border border-gray-800 rounded-2xl text-sm text-gray-500">Loading map…</div>;
  }
  if (located.length === 0) {
    return (
      <div className="flex items-center justify-center h-[520px] bg-gray-900 border border-gray-800 rounded-2xl text-sm text-gray-500 text-center px-6">
        None of the filtered hotels have geo-coordinates set yet.
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={{ lat: located[0].latitude as number, lng: located[0].longitude as number }}
      zoom={5}
    >
      {located.map(hotel => (
        <MarkerF key={hotel._id} position={{ lat: hotel.latitude as number, lng: hotel.longitude as number }}
          onClick={() => setActive(hotel)} />
      ))}
      {active && (
        <InfoWindowF position={{ lat: active.latitude as number, lng: active.longitude as number }} onCloseClick={() => setActive(null)}>
          <div className="w-48">
            <img src={active.images?.[0] || active.image} alt={active.name} className="w-full h-24 object-cover rounded-lg mb-2" />
            <p className="font-bold text-gray-900 text-sm">{active.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{active.rating} · {active.city}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{active.status}</span>
            <button onClick={() => onEdit(active)} className="mt-2 w-full text-xs bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg font-semibold">Edit</button>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
