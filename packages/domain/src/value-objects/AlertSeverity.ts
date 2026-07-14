import { ValueObject, Result, ok, err } from '../core/index.js';

export enum AlertSeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

interface AlertSeverityProps {
  level: AlertSeverityLevel;
}

/**
 * AlertSeverity value object.
 * Provides ordering and colour mapping for UI.
 */
export class AlertSeverity extends ValueObject<AlertSeverityProps> {
  private static readonly ORDER: Record<AlertSeverityLevel, number> = {
    [AlertSeverityLevel.LOW]: 1,
    [AlertSeverityLevel.MEDIUM]: 2,
    [AlertSeverityLevel.HIGH]: 3,
    [AlertSeverityLevel.CRITICAL]: 4,
  };

  private constructor(props: AlertSeverityProps) {
    super(props);
  }

  static create(level: AlertSeverityLevel): Result<AlertSeverity> {
    if (!Object.values(AlertSeverityLevel).includes(level)) {
      return err(`Unknown severity level: ${level}`);
    }
    return ok(new AlertSeverity({ level }));
  }

  static low(): AlertSeverity {
    return new AlertSeverity({ level: AlertSeverityLevel.LOW });
  }
  static medium(): AlertSeverity {
    return new AlertSeverity({ level: AlertSeverityLevel.MEDIUM });
  }
  static high(): AlertSeverity {
    return new AlertSeverity({ level: AlertSeverityLevel.HIGH });
  }
  static critical(): AlertSeverity {
    return new AlertSeverity({ level: AlertSeverityLevel.CRITICAL });
  }

  get level(): AlertSeverityLevel {
    return this.props.level;
  }

  isAtLeast(other: AlertSeverity): boolean {
    return AlertSeverity.ORDER[this.props.level] >= AlertSeverity.ORDER[other.props.level];
  }

  isSevererThan(other: AlertSeverity): boolean {
    return AlertSeverity.ORDER[this.props.level] > AlertSeverity.ORDER[other.props.level];
  }

  get color(): string {
    const colors: Record<AlertSeverityLevel, string> = {
      [AlertSeverityLevel.LOW]: '#4CAF50',
      [AlertSeverityLevel.MEDIUM]: '#FF9800',
      [AlertSeverityLevel.HIGH]: '#F44336',
      [AlertSeverityLevel.CRITICAL]: '#9C27B0',
    };
    return colors[this.props.level];
  }
}
