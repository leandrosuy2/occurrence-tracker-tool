import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Occurrence, PoliceStation } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  AlertCircle,
  CircleAlert,
  Loader2
} from 'lucide-react';

interface MapProps {
  occurrences?: Occurrence[];
  policeStations?: PoliceStation[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectionMode?: boolean;
  height?: string;
  getUserLocation?: boolean;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoibGVhbmRyb3N1eSIsImEiOiJjbTg4YWZxcTMwZzhlMm9vZ3dtcjJoMGYzIn0.GjzYAyM1SGFYepf8qDqebg";

const Map: React.FC<MapProps> = ({
  occurrences = [],
  policeStations = [],
  center = [-47.9292, -15.7801], // Brasília como padrão
  zoom = 10,
  onLocationSelect,
  selectionMode = false,
  height = "h-full",
  getUserLocation = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const policeStationsRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  
  // Create marker elements for different occurrence types
  const createMarkerElement = (type: string) => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    
    switch(type) {
      case 'homicidio':
        el.style.backgroundColor = '#E63946';
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        break;
      case 'furto':
        el.style.backgroundColor = '#FFB703';
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path><path d="M3.5 12h5"></path><path d="M6 9.5v5"></path></svg>';
        break;
      case 'roubo':
        el.style.backgroundColor = '#FB8500';
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        break;
      default:
        el.style.backgroundColor = '#457B9D';
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    return el;
  };
  
  const createPoliceStationMarker = () => {
    const el = document.createElement('div');
    el.className = 'police-station-marker';
    el.style.width = '35px';
    el.style.height = '35px';
    el.style.backgroundColor = '#1D3557';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 15 8-8 8 8"></path><path d="M4 22h16"></path><path d="M10 9v13"></path><path d="M14 9v13"></path></svg>';
    
    return el;
  };
  
  const createUserLocationMarker = () => {
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.backgroundColor = '#4285F4';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 0 2px rgba(66, 133, 244, 0.3)';
    
    // Add a pulsing effect
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.top = '-10px';
    pulse.style.left = '-10px';
    pulse.style.width = '40px';
    pulse.style.height = '40px';
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = 'rgba(66, 133, 244, 0.3)';
    pulse.style.animation = 'pulse 1.5s infinite';
    
    // Add the keyframes for the pulse animation
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(0.8); opacity: 0.8; }
        70% { transform: scale(1.2); opacity: 0; }
        100% { transform: scale(0.8); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    el.appendChild(pulse);
    
    return el;
  };
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Initialize map with the token provided
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Only create the map if it doesn't exist
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: center,
        zoom: zoom,
        attributionControl: false
      });
      
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add attribution control at the bottom left on larger screens, bottom on mobile
      const mediaQuery = window.matchMedia('(min-width: 768px)');
      const attributionPosition = mediaQuery.matches ? 'bottom-left' : 'bottom';
      map.current.addControl(new mapboxgl.AttributionControl(), attributionPosition);
      
      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    }
    
    // Resize map when the container changes size
    const resizeHandler = () => {
      if (map.current) {
        map.current.resize();
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []); // Empty dependency array - only run once

  // Add effect to update map center and zoom when props change
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({
        center: center,
        zoom: zoom,
        speed: 1.5
      });
    }
  }, [center, zoom]);

  // Separate effect for markers
  useEffect(() => {
    if (!map.current) return;

    // Clear all existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    Object.values(policeStationsRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    policeStationsRef.current = {};

    // Add occurrences to map
    occurrences.forEach(occurrence => {
      const key = `occurrence-${occurrence.id || occurrence.latitude}-${occurrence.longitude}`;
      const el = createMarkerElement(occurrence.type);
      
      markersRef.current[key] = new mapboxgl.Marker(el)
        .setLngLat([occurrence.longitude, occurrence.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
            .setHTML(
              `<div class="p-2">
                <h3 class="text-base font-semibold mb-1">${occurrence.title}</h3>
                <p class="text-sm mb-1">${occurrence.date} - ${occurrence.time}</p>
                <p class="text-sm">${occurrence.description}</p>
              </div>`
            )
        )
        .addTo(map.current!);
    });

    // Add police stations to map
    policeStations.forEach(station => {
      const key = `station-${station.id || station.latitude}-${station.longitude}`;
      const el = createPoliceStationMarker();
      
      policeStationsRef.current[key] = new mapboxgl.Marker(el)
        .setLngLat([station.longitude, station.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
            .setHTML(
              `<div class="p-2">
                <h3 class="text-base font-semibold mb-1">${station.name}</h3>
                <p class="text-sm mb-1">Email: ${station.email}</p>
                <p class="text-sm">Telefone: ${station.phone}</p>
              </div>`
            )
        )
        .addTo(map.current!);
    });

    return () => {
      // Cleanup markers on unmount
      Object.values(markersRef.current).forEach(marker => marker.remove());
      Object.values(policeStationsRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      policeStationsRef.current = {};
    };
  }, [occurrences, policeStations]);

  const getUserCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      alert("Seu navegador não suporta geolocalização. Por favor, use um navegador mais moderno.");
      return;
    }

    setLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Location obtained:", { latitude, longitude }); // Debug log
        
        // If map is loaded, add or update user location marker
        if (map.current) {
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLngLat([longitude, latitude]);
          } else {
            const el = createUserLocationMarker();
            userLocationMarkerRef.current = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          }
          
          // Always center map on user location when it's obtained
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            speed: 1.5
          });
        }
        
        // If in selection mode, update selected location
        if (selectionMode && onLocationSelect) {
          setSelectedLocation([longitude, latitude]);
          onLocationSelect(latitude, longitude);
        }
        
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoadingLocation(false);
        
        // More specific error messages based on the error code
        let errorMessage = "Não foi possível obter sua localização.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Por favor, permita o acesso à sua localização nas configurações do navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Não foi possível determinar sua localização. Verifique se o GPS está ativado.";
            break;
          case error.TIMEOUT:
            errorMessage = "A solicitação de localização expirou. Tente novamente.";
            break;
          default:
            errorMessage = "Ocorreu um erro ao obter sua localização. Tente novamente.";
        }
        alert(errorMessage);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  // Separate effect for selection mode
  useEffect(() => {
    if (!map.current || !selectionMode) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation([lng, lat]);
      
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      const el = document.createElement('div');
      el.className = 'selection-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#1E88E5';
      el.style.border = '2px solid white';
      
      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);
      
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
    };

    map.current.on('click', handleClick);
    return () => {
      map.current?.off('click', handleClick);
    };
  }, [selectionMode, onLocationSelect]);

  return (
    <div className={`relative w-full ${height} rounded-lg overflow-hidden shadow-lg`}>
      <div ref={mapContainer} className="absolute inset-0" />
      
      {selectionMode && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded-md shadow-md z-10 max-w-[200px] sm:max-w-[300px]">
          <p className="text-sm text-gray-700">Clique no mapa para selecionar a localização</p>
          {selectedLocation && (
            <p className="text-xs text-gray-500 mt-1">
              Lat: {selectedLocation[1].toFixed(4)}, Lng: {selectedLocation[0].toFixed(4)}
            </p>
          )}
        </div>
      )}
      
      {getUserLocation && (
        <button 
          onClick={getUserCurrentLocation}
          className="absolute bottom-2 right-2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
          title="Ir para minha localização"
          aria-label="Ir para minha localização"
        >
          {loadingLocation ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5 text-blue-500" />
          )}
        </button>
      )}
    </div>
  );
};

export default Map;
