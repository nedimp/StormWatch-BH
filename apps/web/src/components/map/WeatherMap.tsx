import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import { useAlertStore } from '../../store/alertStore';
import { useQuery } from '@tanstack/react-query';
import { regionsApi } from '../../services/api';
import type { RegionDto } from '../../types';

const BIH_CENTER: [number, number] = [44.1, 17.6];

const ENTITY_COLOR: Record<string, string> = {
  FBiH: '#60a5fa',
  RS: '#f472b6',
  BD: '#34d399',
};

export function WeatherMap() {
  const alerts = useAlertStore((s) => s.alerts);
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: regionsApi.getAll,
    staleTime: Infinity,
  });

  const regions: RegionDto[] = regionsData?.data ?? [];
  const alertsByRegion = new Map(alerts.map((a) => [a.regionId, a]));

  return (
    <MapContainer
      center={BIH_CENTER}
      zoom={8}
      className="h-full w-full"
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />

      {regions.map((region) => {
        const alert = alertsByRegion.get(region.id);
        const hasAlert = !!alert;
        const color = hasAlert ? alert.severityColor : (ENTITY_COLOR[region.entity] ?? '#60a5fa');
        const radius = hasAlert ? 22 : 10;

        return (
          <CircleMarker
            key={region.id}
            center={[region.centroid.lat, region.centroid.lng]}
            radius={radius}
            fillColor={color}
            color={hasAlert ? '#ffffff' : color}
            weight={hasAlert ? 2 : 1}
            fillOpacity={hasAlert ? 0.85 : 0.45}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <strong style={{ color: '#e2e8f0' }}>{region.localName}</strong>
                  <span
                    style={{
                      backgroundColor: (ENTITY_COLOR[region.entity] ?? '#60a5fa') + '30',
                      color: ENTITY_COLOR[region.entity] ?? '#60a5fa',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {region.entity}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: 11, margin: '4px 0 0' }}>
                  {region.population.toLocaleString()} stanovnika
                </p>
                {alert ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px',
                      borderRadius: 8,
                      border: '1px solid ' + alert.severityColor + '40',
                      backgroundColor: alert.severityColor + '15',
                    }}
                  >
                    <p
                      style={{
                        color: alert.severityColor,
                        fontWeight: 700,
                        fontSize: 12,
                        margin: 0,
                      }}
                    >
                      {alert.title}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: '4px 0 0' }}>
                      {alert.description}
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: '1px solid rgba(52,211,153,0.2)',
                      backgroundColor: 'rgba(52,211,153,0.1)',
                    }}
                  >
                    <p style={{ color: '#34d399', fontSize: 12, margin: 0, fontWeight: 600 }}>
                      ✓ Nema upozorenja
                    </p>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
