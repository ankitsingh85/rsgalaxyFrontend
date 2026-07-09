'use client';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const containerStyle = { width: '100%', height: '320px', borderRadius: '1rem' };

export default function RoomLocationMap({ latitude, longitude, name }: { latitude?: number; longitude?: number; name: string }) {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-[320px] bg-stone-100 border border-stone-200 rounded-2xl text-sm text-gray-400 text-center px-6">
        Map unavailable — location services not configured.
      </div>
    );
  }
  if (latitude == null || longitude == null) {
    return (
      <div className="flex items-center justify-center h-[320px] bg-stone-100 border border-stone-200 rounded-2xl text-sm text-gray-400 text-center px-6">
        Location not available for this property yet.
      </div>
    );
  }
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-[320px] bg-stone-100 border border-stone-200 rounded-2xl text-sm text-gray-400">Loading map…</div>;
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={{ lat: latitude, lng: longitude }} zoom={13}>
      <MarkerF position={{ lat: latitude, lng: longitude }} title={name} />
    </GoogleMap>
  );
}
