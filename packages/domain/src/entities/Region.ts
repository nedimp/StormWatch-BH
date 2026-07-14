import { Entity, Result, ok, err } from '../core/index.js';
import { Coordinates } from '../value-objects/Coordinates.js';

export interface RegionProps {
  name: string;
  localName: string;
  canton?: string;
  entity: 'FBiH' | 'RS' | 'BD'; // Federation, Republika Srpska, Brcko District
  boundary: Coordinates[];
  centroid: Coordinates;
  population: number;
}

/**
 * Region entity — a geographic area of BiH for which alerts are issued.
 *
 * Not an aggregate root because regions are managed through the
 * RegionRegistry service, not independently.
 */
export class Region extends Entity<string> {
  private readonly props: RegionProps;

  private constructor(id: string, props: RegionProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, props: RegionProps): Result<Region> {
    if (!id.trim()) return err('Region ID cannot be empty');
    if (!props.name.trim()) return err('Region name cannot be empty');
    if (props.boundary.length < 3) return err('Region boundary needs at least 3 coordinates');
    return ok(new Region(id, props));
  }

  get name(): string {
    return this.props.name;
  }
  get localName(): string {
    return this.props.localName;
  }
  get canton(): string | undefined {
    return this.props.canton;
  }
  get entity(): RegionProps['entity'] {
    return this.props.entity;
  }
  get boundary(): ReadonlyArray<Coordinates> {
    return this.props.boundary;
  }
  get centroid(): Coordinates {
    return this.props.centroid;
  }
  get population(): number {
    return this.props.population;
  }

  containsPoint(point: Coordinates): boolean {
    // Ray casting algorithm
    const polygon = this.props.boundary;
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i]!.longitude;
      const yi = polygon[i]!.latitude;
      const xj = polygon[j]!.longitude;
      const yj = polygon[j]!.latitude;
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
