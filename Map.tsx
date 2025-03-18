import React, { useEffect, useRef } from 'react';

const Map: React.FC = () => {
  const map = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});
  const policeStationsRef = useRef<{ [key: string]: google.maps.Marker }>({});

  useEffect(() => {
    if (!map.current) return;

    // Add type check before forEach
    if (!Array.isArray(occurrences)) {
      console.warn('occurrences is not an array:', occurrences);
      return;
    }

    // Clear all existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    Object.values(policeStationsRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    policeStationsRef.current = {};

    // Add occurrences to map
    occurrences.forEach(occurrence => {
      // ... rest of the marker creation code ...
    });

    // ... rest of the effect code ...
  }, [occurrences, policeStations]);

  return (
    // ... rest of the component code ...
  );
};

export default Map; 