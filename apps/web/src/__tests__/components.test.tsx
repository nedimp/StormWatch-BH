/**
 * Frontend component tests — render with jsdom, assert DOM output.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertCard } from '../components/alerts/AlertCard';
import { StationRow } from '../components/dashboard/StationRow';
import type { AlertDto, CurrentConditionDto } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const OBSERVED_ALERT: AlertDto = {
  id: 'alert-1',
  regionId: 'sarajevo',
  regionName: 'Kanton Sarajevo',
  severity: 'HIGH',
  condition: 'STRONG_WIND',
  title: 'Uzbuna: Jak vjetar',
  description: 'Jak vjetar 65 km/h',
  recommendations: ['Opreznost pri vožnji', 'Sklonite predmete s terasa'],
  status: 'ACTIVE',
  issuedAt: new Date(Date.now() - 3_600_000).toISOString(),
  validUntil: new Date(Date.now() + 6_000_000).toISOString(),
  severityColor: '#F44336',
  isForecasted: false,
};

const FORECAST_ALERT: AlertDto = {
  ...OBSERVED_ALERT,
  id: 'alert-2',
  severity: 'MEDIUM',
  title: 'Prognoza (prekosutra): Jak vjetar',
  isForecasted: true,
  forecastFor: new Date(Date.now() + 48 * 3_600_000).toISOString(),
};

const STATION_OBS: CurrentConditionDto = {
  id: 'obs-1',
  stationId: 'station-sarajevo',
  stationName: 'Sarajevo (Bjelave)',
  regionId: 'sarajevo',
  latitude: 43.85,
  longitude: 18.41,
  temperatureCelsius: 28,
  windSpeedKmh: 12,
  windGustKmh: 18,
  precipitationMmPerHour: 0,
  humidityPercent: 55,
  visibilityKm: 10,
  pressureHpa: 1013,
  weatherCode: 1,
  observedAt: new Date().toISOString(),
  source: 'API_PROVIDER',
};

// ── AlertCard tests ───────────────────────────────────────────────────────────

describe('AlertCard', () => {
  describe('observed alert', () => {
    it('renders the alert title', () => {
      render(<AlertCard alert={OBSERVED_ALERT} />);
      expect(screen.getByText('Uzbuna: Jak vjetar')).toBeInTheDocument();
    });

    it('renders the region name', () => {
      render(<AlertCard alert={OBSERVED_ALERT} />);
      expect(screen.getByText('Kanton Sarajevo')).toBeInTheDocument();
    });

    it('renders the severity badge in Bosnian (VISOKO not HIGH)', () => {
      render(<AlertCard alert={OBSERVED_ALERT} />);
      expect(screen.getByText('VISOKO')).toBeInTheDocument();
      expect(screen.queryByText('HIGH')).not.toBeInTheDocument();
    });

    it('does NOT show forecast badge for observed alerts', () => {
      render(<AlertCard alert={OBSERVED_ALERT} />);
      expect(screen.queryByText(/PROGNOZA/i)).not.toBeInTheDocument();
    });
  });

  describe('forecast alert', () => {
    it('renders the forecast title', () => {
      render(<AlertCard alert={FORECAST_ALERT} />);
      expect(screen.getByText('Prognoza (prekosutra): Jak vjetar')).toBeInTheDocument();
    });

    it('shows PROGNOZA badge', () => {
      render(<AlertCard alert={FORECAST_ALERT} />);
      // The badge contains both 'PROGNOZA' and the date — use getAllByText
      const badges = screen.getAllByText(/PROGNOZA/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows forecast date in dd.mm.yyyy format', () => {
      render(<AlertCard alert={FORECAST_ALERT} />);
      // Find the badge element by its class/content pattern
      const badge = screen.getAllByText(/PROGNOZA/i)[0]!;
      expect(badge.textContent).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });
  });
});

// ── StationRow tests ──────────────────────────────────────────────────────────

describe('StationRow', () => {
  it('renders station name', () => {
    render(<StationRow obs={STATION_OBS} />);
    expect(screen.getByText('Sarajevo (Bjelave)')).toBeInTheDocument();
  });

  it('shows no badge when there is no alert', () => {
    render(<StationRow obs={STATION_OBS} />);
    expect(screen.queryByText('VISOKO')).not.toBeInTheDocument();
  });

  it('shows severity badge when alert is present', () => {
    render(<StationRow obs={STATION_OBS} alert={OBSERVED_ALERT} />);
    expect(screen.getByText('VISOKO')).toBeInTheDocument();
  });

  it('alert description is hidden initially', () => {
    render(<StationRow obs={STATION_OBS} alert={OBSERVED_ALERT} />);
    expect(screen.queryByText('Jak vjetar 65 km/h')).not.toBeInTheDocument();
  });

  it('clicking badge reveals alert description', () => {
    render(<StationRow obs={STATION_OBS} alert={OBSERVED_ALERT} />);
    fireEvent.click(screen.getByText('VISOKO'));
    expect(screen.getByText('Jak vjetar 65 km/h')).toBeInTheDocument();
  });

  it('clicking badge again hides the description (toggle)', () => {
    render(<StationRow obs={STATION_OBS} alert={OBSERVED_ALERT} />);
    fireEvent.click(screen.getByText('VISOKO'));
    fireEvent.click(screen.getByText('VISOKO'));
    expect(screen.queryByText('Jak vjetar 65 km/h')).not.toBeInTheDocument();
  });

  it('shows temperature', () => {
    render(<StationRow obs={STATION_OBS} />);
    expect(screen.getByText('28')).toBeInTheDocument();
  });
});
