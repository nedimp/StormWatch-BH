import { describe, it, expect } from 'vitest';
import { WeatherAlert } from '../entities/WeatherAlert';
import { AlertSeverity } from '../value-objects/AlertSeverity';
import { WeatherCondition, WeatherConditionType } from '../value-objects/WeatherCondition';
import { Coordinates } from '../value-objects/Coordinates';
import { AlertCreatedEvent, AlertEscalatedEvent, AlertResolvedEvent } from '../events/AlertCreatedEvent';

function makeAlert(id = 'alert-1') {
  const coords = Coordinates.create(43.8564, 18.4131);
  if (!coords.ok) throw new Error(coords.error);

  const condition = WeatherCondition.create(WeatherConditionType.THUNDERSTORM, 'Test storm');
  if (!condition.ok) throw new Error(condition.error);

  const result = WeatherAlert.create(id, {
    regionId: 'sarajevo',
    regionName: 'Sarajevo',
    affectedArea: [coords.value, coords.value, coords.value],
    severity: AlertSeverity.medium(),
    condition: condition.value,
    title: 'Test Alert',
    description: 'Test description',
    recommendations: ['Stay indoors'],
    issuedAt: new Date('2024-01-01T10:00:00Z'),
    validUntil: new Date('2024-01-01T16:00:00Z'),
    observationIds: ['obs-1'],
  });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('WeatherAlert', () => {
  describe('create', () => {
    it('creates an active alert with AlertCreatedEvent', () => {
      const alert = makeAlert();
      expect(alert.status).toBe('ACTIVE');
      expect(alert.domainEvents).toHaveLength(1);
      expect(alert.domainEvents[0]).toBeInstanceOf(AlertCreatedEvent);
    });

    it('fails when validUntil <= issuedAt', () => {
      const coords = Coordinates.create(43.8564, 18.4131);
      if (!coords.ok) throw new Error();
      const condition = WeatherCondition.create(WeatherConditionType.THUNDERSTORM, 'storm');
      if (!condition.ok) throw new Error();

      const result = WeatherAlert.create('bad-alert', {
        regionId: 'sarajevo',
        regionName: 'Sarajevo',
        affectedArea: [coords.value, coords.value, coords.value],
        severity: AlertSeverity.medium(),
        condition: condition.value,
        title: 'Bad',
        description: 'Bad',
        recommendations: [],
        issuedAt: new Date('2024-01-01T10:00:00Z'),
        validUntil: new Date('2024-01-01T09:00:00Z'), // before issuedAt
        observationIds: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain('validUntil');
    });
  });

  describe('escalate', () => {
    it('escalates to higher severity and emits AlertEscalatedEvent', () => {
      const alert = makeAlert();
      alert.clearDomainEvents();

      const result = alert.escalate(AlertSeverity.critical());
      expect(result.ok).toBe(true);
      expect(alert.status).toBe('ESCALATED');
      expect(alert.severity.level).toBe('CRITICAL');
      expect(alert.domainEvents).toHaveLength(1);
      expect(alert.domainEvents[0]).toBeInstanceOf(AlertEscalatedEvent);
    });

    it('rejects escalation to same or lower severity', () => {
      const alert = makeAlert();
      const result = alert.escalate(AlertSeverity.low());
      expect(result.ok).toBe(false);
    });

    it('rejects escalation of resolved alert', () => {
      const alert = makeAlert();
      alert.resolve(new Date());
      const result = alert.escalate(AlertSeverity.critical());
      expect(result.ok).toBe(false);
    });
  });

  describe('resolve', () => {
    it('resolves an active alert and emits AlertResolvedEvent', () => {
      const alert = makeAlert();
      alert.clearDomainEvents();

      const result = alert.resolve(new Date());
      expect(result.ok).toBe(true);
      expect(alert.status).toBe('RESOLVED');
      expect(alert.isActive()).toBe(false);
      expect(alert.domainEvents[0]).toBeInstanceOf(AlertResolvedEvent);
    });

    it('rejects double resolve', () => {
      const alert = makeAlert();
      alert.resolve(new Date());
      const result = alert.resolve(new Date());
      expect(result.ok).toBe(false);
    });
  });

  describe('isCritical', () => {
    it('returns false for MEDIUM severity', () => {
      expect(makeAlert().isCritical()).toBe(false);
    });

    it('returns true after escalating to CRITICAL', () => {
      const alert = makeAlert();
      alert.escalate(AlertSeverity.critical());
      expect(alert.isCritical()).toBe(true);
    });
  });
});
