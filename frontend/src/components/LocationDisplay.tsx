import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import { LocationData } from '@/types/api'; // Assuming you have this in your types

interface LocationDisplayProps {
  locations: LocationData[] | null;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ locations }) => {
  // 1. Show a placeholder if there are no locations
  if (!locations || locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-wave rounded-lg border border-border shadow-inner">
        <div className="text-center p-8 animate-fade-in">
          <MapPin className="mx-auto mb-4 text-primary/20" size={64} />
          <p className="text-lg font-medium text-muted-foreground">
            Your map visualization will appear here
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Queries with geographic data will generate a map
          </p>
        </div>
      </div>
    );
  }

  // 2. Calculate the center point of all locations for the map view
  const center: [number, number] = [
    locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
    locations.reduce((sum, loc) => sum + loc.lon, 0) / locations.length,
  ];

  return (
    <div className="h-full bg-card rounded-lg border border-border shadow-lg p-2 animate-fade-in">
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full rounded-md"
      >
        {/* Using OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 3. Render a marker for each location */}
        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.lat, loc.lon]}>
            <Popup>
              {loc.label || `Latitude: ${loc.lat.toFixed(4)}, Longitude: ${loc.lon.toFixed(4)}`}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LocationDisplay;