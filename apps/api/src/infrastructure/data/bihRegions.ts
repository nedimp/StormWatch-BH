/**
 * BiH regions data — cantons, entities, and major cities.
 * Coordinates are approximate bounding polygons (simplified for dev).
 */
export interface RegionData {
  id: string;
  name: string;
  localName: string;
  entity: 'FBiH' | 'RS' | 'BD';
  canton?: string;
  centroid: { lat: number; lng: number };
  population: number;
}

export const BIH_REGIONS: RegionData[] = [
  {
    id: 'sarajevo',
    name: 'Sarajevo Canton',
    localName: 'Kanton Sarajevo',
    entity: 'FBiH',
    canton: 'Sarajevo',
    centroid: { lat: 43.8564, lng: 18.4131 },
    population: 413593,
  },
  {
    id: 'banja-luka',
    name: 'Banja Luka',
    localName: 'Banja Luka',
    entity: 'RS',
    centroid: { lat: 44.7722, lng: 17.191 },
    population: 185042,
  },
  {
    id: 'tuzla',
    name: 'Tuzla Canton',
    localName: 'Tuzlanski Kanton',
    entity: 'FBiH',
    canton: 'Tuzla',
    centroid: { lat: 44.5384, lng: 18.6734 },
    population: 445028,
  },
  {
    id: 'zenica',
    name: 'Zenica-Doboj Canton',
    localName: 'Zeničko-Dobojski Kanton',
    entity: 'FBiH',
    canton: 'Zenica-Doboj',
    centroid: { lat: 44.2031, lng: 17.9082 },
    population: 364433,
  },
  {
    id: 'mostar',
    name: 'Herzegovina-Neretva Canton',
    localName: 'Hercegovačko-Neretvanski Kanton',
    entity: 'FBiH',
    canton: 'Herzegovina-Neretva',
    centroid: { lat: 43.3438, lng: 17.8078 },
    population: 222007,
  },
  {
    id: 'doboj',
    name: 'Doboj',
    localName: 'Doboj',
    entity: 'RS',
    centroid: { lat: 44.7319, lng: 18.0873 },
    population: 40264,
  },
  {
    id: 'brcko',
    name: 'Brcko District',
    localName: 'Brčko Distrikt',
    entity: 'BD',
    centroid: { lat: 44.8693, lng: 18.8101 },
    population: 83516,
  },
  {
    id: 'livno',
    name: 'Canton 10 (Livno)',
    localName: 'Kanton 10 (Livanjski)',
    entity: 'FBiH',
    canton: 'Livno',
    centroid: { lat: 43.8206, lng: 17.0108 },
    population: 84854,
  },
  {
    id: 'trebinje',
    name: 'Trebinje',
    localName: 'Trebinje',
    entity: 'RS',
    centroid: { lat: 42.7126, lng: 18.3437 },
    population: 31433,
  },
  {
    id: 'bijeljina',
    name: 'Bijeljina',
    localName: 'Bijeljina',
    entity: 'RS',
    centroid: { lat: 44.7566, lng: 19.2157 },
    population: 108027,
  },
];
