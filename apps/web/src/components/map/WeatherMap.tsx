import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useAlertStore } from '../../store/alertStore';
import { useQuery } from '@tanstack/react-query';
import { regionsApi } from '../../services/api';
import type { RegionDto } from '../../types';

const BIH_CENTER: [number, number] = [44.1, 17.6];

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
      className="h-full w-full rounded-xl"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {regions.map((region) => {
        const alert = alertsByRegion.get(region.id);
        const color = alert?.severityColor ?? '#4CAF50';
        const radius = alert ? 20 : 8;

        return (
          <CircleMarker
            key={region.id}
            center={[region.centroid.lat, region.centroid.lng]}
            radius={radius}
            fillColor={color}
            color={alert ? '#fff' : color}
            weight={alert ? 2 : 1}
            fillOpacity={0.7}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-bold">{region.localName}</p>
                <p className="text-xs text-gray-500">{region.entity}</p>
                {alert ? (
                  <>
                    <hr className="my-1" />
                    <p className="text-sm font-medium" style={{ color: alert.severityColor }}>
                      {alert.title}
                    </p>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-green-600">Nema upozorenja</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
