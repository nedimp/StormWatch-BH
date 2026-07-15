import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import { useAlertStore } from '../../store/alertStore';
import { useQuery } from '@tanstack/react-query';
import { regionsApi } from '../../services/api';
import { SEVERITY_BADGE_LABELS } from '../../constants/severity';
import type { RegionDto } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const BIH_CENTER: [number, number] = [44.1, 17.6];

/**
 * WeatherMap
 *
 * Shows ONLY regions with active alerts — no noise from region-boundary dots.
 * Each marker:
 *  - Size reflects severity (CRITICAL=28, HIGH=22, MEDIUM=16, LOW=12)
 *  - Color matches the alert severity color
 *  - Popup shows the alert title, description and time ago
 *
 * If there are no active alerts the map shows a "no alerts" overlay
 * so the user knows the map loaded correctly.
 */
export function WeatherMap() {
  const alerts = useAlertStore((s) => s.alerts);
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: regionsApi.getAll,
    staleTime: Infinity,
  });

  const regions: RegionDto[] = regionsData?.data ?? [];
  const alertsByRegion = new Map(alerts.map((a) => [a.regionId, a]));

  // Only render markers for regions that have an active alert
  const alertRegions = regions.filter((r) => alertsByRegion.has(r.id));

  // Radius by severity — bigger = more urgent
  const severityRadius: Record<string, number> = {
    CRITICAL: 28,
    HIGH: 22,
    MEDIUM: 16,
    LOW: 12,
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={BIH_CENTER}
        zoom={8}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />

        {alertRegions.map((region) => {
          const alert = alertsByRegion.get(region.id)!;
          const radius = severityRadius[alert.severity] ?? 16;
          const timeAgo = formatDistanceToNow(new Date(alert.issuedAt), { addSuffix: true });

          return (
            <CircleMarker
              key={region.id}
              center={[region.centroid.lat, region.centroid.lng]}
              radius={radius}
              fillColor={alert.severityColor}
              color="#ffffff"
              weight={2.5}
              fillOpacity={0.85}
            >
              <Popup>
                <div style={{ minWidth: 210 }}>
                  {/* Severity badge + region */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <strong style={{ color: '#1e293b', fontSize: 13 }}>{region.localName}</strong>
                    <span style={{
                      backgroundColor: alert.severityColor,
                      color: '#fff',
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      marginLeft: 8,
                      whiteSpace: 'nowrap',
                    }}>
                      {SEVERITY_BADGE_LABELS[alert.severity]}
                    </span>
                  </div>

                  {/* Alert title + description */}
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${alert.severityColor}40`,
                    backgroundColor: `${alert.severityColor}12`,
                    marginBottom: 6,
                  }}>
                    <p style={{ color: alert.severityColor, fontWeight: 700, fontSize: 12, margin: '0 0 4px' }}>
                      {alert.title}
                    </p>
                    <p style={{ color: '#64748b', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                      {alert.description}
                    </p>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: 10, margin: 0 }}>{timeAgo}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* No-alerts overlay */}
      {alertRegions.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 12,
          padding: '12px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          zIndex: 1000,
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
          <p style={{ color: '#22c55e', fontWeight: 700, fontSize: 13, margin: 0 }}>Nema aktivnih upozorenja</p>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: '2px 0 0' }}>Svi regioni su bez nevremena</p>
        </div>
      )}
    </div>
  );
}
