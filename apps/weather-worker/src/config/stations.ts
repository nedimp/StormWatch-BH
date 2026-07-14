/**
 * BiH weather monitoring stations.
 * Combines real FHMZ/RHMZ official stations with synthetic API query points.
 */
export interface StationConfig {
  id: string;
  name: string;
  regionId: string;
  lat: number;
  lng: number;
}

export const BIH_STATIONS: StationConfig[] = [
  { id: 'station-sarajevo-bjelave', name: 'Sarajevo Bjelave', regionId: 'sarajevo', lat: 43.8564, lng: 18.4131 },
  { id: 'station-sarajevo-butmir', name: 'Sarajevo Butmir (Airport)', regionId: 'sarajevo', lat: 43.8245, lng: 18.3313 },
  { id: 'station-banja-luka', name: 'Banja Luka', regionId: 'banja-luka', lat: 44.7722, lng: 17.1910 },
  { id: 'station-tuzla', name: 'Tuzla', regionId: 'tuzla', lat: 44.5384, lng: 18.6734 },
  { id: 'station-mostar', name: 'Mostar', regionId: 'mostar', lat: 43.3438, lng: 17.8078 },
  { id: 'station-zenica', name: 'Zenica', regionId: 'zenica', lat: 44.2031, lng: 17.9082 },
  { id: 'station-brcko', name: 'Brcko', regionId: 'brcko', lat: 44.8693, lng: 18.8101 },
  { id: 'station-doboj', name: 'Doboj', regionId: 'doboj', lat: 44.7319, lng: 18.0873 },
  { id: 'station-trebinje', name: 'Trebinje', regionId: 'trebinje', lat: 42.7126, lng: 18.3437 },
  { id: 'station-bijeljina', name: 'Bijeljina', regionId: 'bijeljina', lat: 44.7566, lng: 19.2157 },
  { id: 'station-livno', name: 'Livno', regionId: 'livno', lat: 43.8206, lng: 17.0108 },
  { id: 'station-konjic', name: 'Konjic', regionId: 'mostar', lat: 43.6516, lng: 17.9666 },
  { id: 'station-vlasic', name: 'Vlasic (Mountain)', regionId: 'zenica', lat: 44.2731, lng: 17.5972 },
  { id: 'station-bjelasnica', name: 'Bjelasnica (Mountain)', regionId: 'sarajevo', lat: 43.7080, lng: 18.1440 },
];
