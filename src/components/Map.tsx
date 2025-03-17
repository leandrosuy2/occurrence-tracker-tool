
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Occurrence, PoliceStation } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  AlertCircle,
  CircleAlert
} from 'lucide-react';

interface MapProps {
  occurrences?: Occurrence[];
  policeStations?: PoliceStation[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectionMode?: boolean;
  height?: string;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoibGVhbmRyb3N1eSIsImEiOiJjbTg4YWZxcTMwZzhlMm9vZ3dtcjJoMGYzIn0.GjzYAyM1SGFYepf8qDqebg";

const Map: React.FC<MapProps> = ({
  occurrences = [],
  policeStations = [],
  center = [-47.9292, -15.7801], // Brasília como padrão
  zoom = 10,
  onLocationSelect,
  selectionMode = false,
  height = "h-full"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  
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
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Inicializar mapa com o token fornecido
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Resize mapa quando o container mudar de tamanho
    const resizeHandler = () => {
      if (map.current) {
        map.current.resize();
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    
    if (selectionMode) {
      // Em modo de seleção, permitir clique no mapa para selecionar localização
      map.current.on('click', (e) => {
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
      });
    }
    
    map.current.on('load', () => {
      if (!map.current) return;
      
      // Adicionar ocorrências ao mapa
      occurrences.forEach(occurrence => {
        const el = createMarkerElement(occurrence.type);
        
        new mapboxgl.Marker(el)
          .setLngLat([occurrence.longitude, occurrence.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
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
      
      // Adicionar delegacias ao mapa
      policeStations.forEach(station => {
        const el = createPoliceStationMarker();
        
        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
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
      
      // Adicionar o marcador de seleção se já temos uma localização e estamos em modo de seleção
      if (selectionMode && selectedLocation) {
        const el = document.createElement('div');
        el.className = 'selection-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#1E88E5';
        el.style.border = '2px solid white';
        
        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat(selectedLocation)
          .addTo(map.current);
      }
    });
    
    return () => {
      window.removeEventListener('resize', resizeHandler);
      map.current?.remove();
    };
  }, [center, zoom, occurrences, policeStations, selectionMode, onLocationSelect]);
  
  return (
    <div className={`relative w-full ${height} rounded-lg overflow-hidden shadow-lg`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {selectionMode && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded-md shadow-md z-10 max-w-[200px]">
          <p className="text-sm text-gray-700">Clique no mapa para selecionar a localização</p>
          {selectedLocation && (
            <p className="text-xs text-gray-500 mt-1">
              Lat: {selectedLocation[1].toFixed(4)}, Lng: {selectedLocation[0].toFixed(4)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Map;
