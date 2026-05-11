"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icon marker issue pada Leaflet dengan Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(lat && lng ? new L.LatLng(lat, lng) : null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      setPosition(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 15);
    },
  });

  // Auto locate saat peta dimuat jika belum ada koordinat
  useEffect(() => {
    if (!lat && !lng) {
      map.locate();
    }
  }, [map, lat, lng]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  // Default koordinat (Surabaya Pusat) jika GPS belum aktif
  const center: L.LatLngExpression = lat && lng ? [lat, lng] : [-7.351154242262235, 112.70738586942016];

  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
