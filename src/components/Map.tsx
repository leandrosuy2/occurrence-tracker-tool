
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Occurrence, PoliceStation } from '../types';

interface MapProps {
  occurrences?: Occurrence[];
  policeStations?: PoliceStation[];
  center?: [number, number];
  zoom?: number;
}

const Map: React.FC<MapProps> = ({
  occurrences = [],
  policeStations = [],
  center = [-47.9292, -15.7801], // Brasília como padrão
  zoom = 10
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Utilizar token armazenado ou solicitar do usuário
    const storedToken = localStorage.getItem('mapboxToken');
    if (storedToken) {
      setMapboxToken(storedToken);
      initializeMap(storedToken);
    }
  }, [mapboxToken]);
  
  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;
    
    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      if (!map.current) return;
      
      // Adicionar ocorrências ao mapa
      occurrences.forEach(occurrence => {
        const el = document.createElement('div');
        el.className = 'occurrence-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        
        // Cores diferentes por tipo de ocorrência
        switch(occurrence.type) {
          case 'homicidio':
            el.style.backgroundColor = '#E63946';
            break;
          case 'furto':
            el.style.backgroundColor = '#FFB703';
            break;
          case 'roubo':
            el.style.backgroundColor = '#FB8500';
            break;
          default:
            el.style.backgroundColor = '#457B9D';
        }
        
        new mapboxgl.Marker(el)
          .setLngLat([occurrence.longitude, occurrence.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<h3 class="text-base font-semibold">${occurrence.title}</h3>
                <p>${occurrence.date} - ${occurrence.time}</p>
                <p>${occurrence.description}</p>`
              )
          )
          .addTo(map.current);
      });
      
      // Adicionar delegacias ao mapa
      policeStations.forEach(station => {
        const el = document.createElement('div');
        el.className = 'police-station-marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.backgroundColor = '#1D3557';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        
        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<h3 class="text-base font-semibold">${station.name}</h3>
                <p>Email: ${station.email}</p>
                <p>Telefone: ${station.phone}</p>`
              )
          )
          .addTo(map.current);
      });
    });
    
    return () => {
      map.current?.remove();
    };
  };
  
  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('mapboxToken') as string;
    
    if (token) {
      localStorage.setItem('mapboxToken', token);
      setMapboxToken(token);
      initializeMap(token);
    }
  };
  
  if (!mapboxToken) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Configuração do Mapa</h2>
        <p className="mb-4">Para visualizar o mapa, informe seu token público do Mapbox:</p>
        <form onSubmit={handleTokenSubmit} className="space-y-4">
          <div>
            <label htmlFor="mapboxToken" className="block text-sm font-medium mb-1">
              Token Público do Mapbox
            </label>
            <input
              id="mapboxToken"
              name="mapboxToken"
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="pk.eyJ1..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Obtenha seu token em{" "}
              <a
                href="https://account.mapbox.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-ocorrencia-azul-escuro text-white py-2 px-4 rounded-md hover:bg-ocorrencia-azul-medio transition-colors"
          >
            Salvar e Carregar Mapa
          </button>
        </form>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;
