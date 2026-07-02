'use client';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const containerStyle = { width: '100%', height: '260px', borderRadius: '0.75rem' };
const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India

interface Props {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const position = latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">Geo-Coordinates (click map to set)</label>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <input type="number" step="any" placeholder="Latitude" value={latitude ?? ''}
          onChange={e => onChange(Number(e.target.value), longitude ?? defaultCenter.lng)}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
        <input type="number" step="any" placeholder="Longitude" value={longitude ?? ''}
          onChange={e => onChange(latitude ?? defaultCenter.lat, Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
      </div>
      {!GOOGLE_MAPS_API_KEY ? (
        <div className="flex items-center justify-center h-[260px] bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-500 text-center px-6">
          Google Maps key not configured — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map picker. You can still type coordinates above.
        </div>
      ) : !isLoaded ? (
        <div className="flex items-center justify-center h-[260px] bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-500">Loading map…</div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={position || defaultCenter}
          zoom={position ? 12 : 4}
          onClick={e => e.latLng && onChange(e.latLng.lat(), e.latLng.lng())}
        >
          {position && (
            <MarkerF position={position} draggable onDragEnd={e => e.latLng && onChange(e.latLng.lat(), e.latLng.lng())} />
          )}
        </GoogleMap>
      )}
    </div>
  );
}
