import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Occurrence, PoliceStation } from '@/types';
import { MapPin, AlertTriangle, Shield, FileText } from 'lucide-react';

// Corrigir o problema dos ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

interface MapProps {
  occurrences?: Occurrence[];
  policeStations?: PoliceStation[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectionMode?: boolean;
  getUserLocation?: boolean;
  height?: string;
}

// Componente para atualizar o mapa quando o centro mudar
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Componente para o ícone personalizado
const CustomIcon: React.FC<{ type: string; isCurrentLocation?: boolean }> = ({ type, isCurrentLocation }) => {
  const getIconColor = () => {
    if (isCurrentLocation) return '#3b82f6'; // Azul para localização atual
    switch (type) {
      case 'homicidio':
        return '#ef4444'; // Vermelho
      case 'furto':
        return '#f59e0b'; // Amarelo
      case 'roubo':
        return '#f97316'; // Laranja
      default:
        return '#3b82f6'; // Azul
    }
  };

  const getIcon = () => {
    if (isCurrentLocation) return <MapPin className="w-6 h-6" />;
    switch (type) {
      case 'homicidio':
        return <AlertTriangle className="w-6 h-6" />;
      case 'furto':
      case 'roubo':
        return <FileText className="w-6 h-6" />;
      default:
        return <MapPin className="w-6 h-6" />;
    }
  };

  return (
    <div className="relative">
      <div 
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ color: getIconColor() }}
      >
        {getIcon()}
      </div>
      {!isCurrentLocation && (
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full opacity-20"
          style={{ backgroundColor: getIconColor() }}
        />
      )}
    </div>
  );
};

// Componente para lidar com eventos do mapa
const MapEvents: React.FC<{ onLocationSelect?: (lat: number, lng: number) => void; selectionMode?: boolean }> = ({ 
  onLocationSelect, 
  selectionMode 
}) => {
  useMapEvents({
    click: (e) => {
      if (selectionMode && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

const Map: React.FC<MapProps> = ({
  occurrences = [],
  policeStations = [],
  center = [-23.5505, -46.6333], // São Paulo
  zoom = 13,
  onLocationSelect,
  selectionMode = false,
  getUserLocation = false,
  height = 'h-[400px]'
}) => {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', position.coords);
        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCurrentLocation(newLocation);
        if (mapRef.current) {
          mapRef.current.setView(newLocation, zoom);
          // Força uma atualização do mapa
          mapRef.current.invalidateSize();
        }
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Não foi possível obter sua localização.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Por favor, permita o acesso à sua localização nas configurações do navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Não foi possível determinar sua localização. Verifique se o GPS está ativado.';
            break;
          case error.TIMEOUT:
            errorMessage = 'A solicitação de localização expirou. Tente novamente.';
            break;
          default:
            errorMessage = 'Ocorreu um erro ao obter sua localização. Tente novamente.';
        }
        alert(errorMessage);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Efeito para atualizar o mapa quando a localização mudar
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView(currentLocation, zoom);
      mapRef.current.invalidateSize();
    }
  }, [currentLocation, zoom]);

  useEffect(() => {
    if (getUserLocation && mapReady) {
      getCurrentLocation();
    }
  }, [getUserLocation, mapReady]);

  const handleMapReady = () => {
    setMapReady(true);
    if (getUserLocation) {
      getCurrentLocation();
    }
  };

  return (
    <div className={`w-full ${height} rounded-lg overflow-hidden relative`}>
      <style>
        {`
          .leaflet-container {
            z-index: 0 !important;
          }
          .leaflet-pane {
            z-index: 0 !important;
          }
          .leaflet-control-container {
            z-index: 0 !important;
          }
          .leaflet-popup-pane {
            z-index: 1 !important;
          }
          .leaflet-tooltip-pane {
            z-index: 1 !important;
          }
          .leaflet-marker-pane {
            z-index: 1 !important;
          }
        `}
      </style>
      <MapContainer
        center={currentLocation || center}
        zoom={zoom}
        className="w-full h-full"
        ref={mapRef}
        whenReady={handleMapReady}
      >
        <ChangeView center={currentLocation || center} zoom={zoom} />
        <MapEvents onLocationSelect={onLocationSelect} selectionMode={selectionMode} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marcador de localização atual */}
        {currentLocation && (
          <Marker position={currentLocation}>
            <Popup>
              <div className="text-center">
                <p className="font-medium">Sua localização atual</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de ocorrências */}
        {occurrences.map((occurrence) => (
          <Marker
            key={occurrence.id}
            position={[occurrence.latitude, occurrence.longitude]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div class="relative">
                <div class="absolute -translate-x-1/2 -translate-y-1/2" style="color: ${
                  occurrence.type === 'homicidio' ? '#ef4444' :
                  occurrence.type === 'furto' ? '#f59e0b' :
                  occurrence.type === 'roubo' ? '#f97316' : '#3b82f6'
                }">
                  ${occurrence.type === 'homicidio' ? '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' :
                  occurrence.type === 'furto' ? '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>' :
                  occurrence.type === 'roubo' ? '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' :
                  '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
                }</div>
                <div class="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full opacity-20" style="background-color: ${
                  occurrence.type === 'homicidio' ? '#ef4444' :
                  occurrence.type === 'furto' ? '#f59e0b' :
                  occurrence.type === 'roubo' ? '#f97316' : '#3b82f6'
                }"></div>
                <div class="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full opacity-10 animate-ping" style="background-color: ${
                  occurrence.type === 'homicidio' ? '#ef4444' :
                  occurrence.type === 'furto' ? '#f59e0b' :
                  occurrence.type === 'roubo' ? '#f97316' : '#3b82f6'
                }"></div>
              </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div className="p-4 min-w-[300px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: occurrence.type === 'homicidio' ? '#ef4444' :
                    occurrence.type === 'furto' ? '#f59e0b' :
                    occurrence.type === 'roubo' ? '#f97316' : '#3b82f6'
                  }}></div>
                  <div>
                    <h3 className="font-semibold text-lg">{occurrence.title || 'Sem título'}</h3>
                    <span className={`text-sm font-medium ${
                      occurrence.type === 'homicidio' ? 'text-red-600' :
                      occurrence.type === 'furto' ? 'text-yellow-600' :
                      occurrence.type === 'roubo' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {occurrence.type.charAt(0).toUpperCase() + occurrence.type.slice(1)}
                    </span>
                  </div>
                </div>
                
                {occurrence.description && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-600">{occurrence.description}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Data e Hora:</span>
                    <span className="font-medium">
                      {new Date(occurrence.date).toLocaleDateString('pt-BR')} às {occurrence.time}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      occurrence.resolved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {occurrence.resolved ? 'Resolvido' : 'Não resolvido'}
                    </span>
                  </div>

                  {occurrence.User && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Registrado por:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {occurrence.User.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{occurrence.User.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marcadores de delegacias */}
        {policeStations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-medium mb-1">{station.name}</h3>
                <p className="text-sm text-gray-600">{station.address}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Telefone: {station.phone}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Botão de localização atual */}
      {getUserLocation && (
        <button
          onClick={getCurrentLocation}
          className="absolute bottom-4 right-4 z-50 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          title="Ir para minha localização"
        >
          {loadingLocation ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin className="w-6 h-6 text-blue-500" />
          )}
        </button>
      )}
    </div>
  );
};

export default Map;
