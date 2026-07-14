import { Activity, Zap, Bell, Clock, Shield, Map as MapIcon } from 'lucide-react';
import type { ElementType } from 'react';

export interface Feature {
  Icon: ElementType;
  color: string;
  title: string;
  desc: string;
}

/** Landing page feature highlights. */
export const FEATURES: Feature[] = [
  {
    Icon: Zap,
    color: '#818cf8',
    title: 'Automatska detekcija',
    desc: 'Prag vrijednosti za grmljavinu, jak vjetar, obilne padavine i ekstremnu vrućinu primjenjen na svaku stanicu.',
  },
  {
    Icon: MapIcon,
    color: '#34d399',
    title: '14 stanica u BiH',
    desc: 'Kontinuirano praćenje u Sarajevu, Banja Luci, Tuzli, Mostaru, Zenici, Brčkom i 8 ostalih tačaka.',
  },
  {
    Icon: Bell,
    color: '#f97316',
    title: 'Email upozorenja',
    desc: 'Pretplatite se i odmah primite email čim se izda upozorenje — bez potrebe da pratite stranicu.',
  },
  {
    Icon: Clock,
    color: '#60a5fa',
    title: 'Ažuriranje svakih 15 min',
    desc: 'Open-Meteo API pruža meteorološke podatke visoke rezolucije bez naknade, bez ograničenja.',
  },
  {
    Icon: Shield,
    color: '#a78bfa',
    title: 'WebSocket notifikacije',
    desc: 'Real-time push uzbune u pretraživač čim se stanje promijeni — bez ručnog osvježavanja.',
  },
  {
    Icon: Activity,
    color: '#fb7185',
    title: 'REST + Swagger API',
    desc: 'Sve uzbune i mjerenja dostupni putem REST API-ja, Swagger dokumentacija uključena.',
  },
];

/** Severity legend items for the landing page. */
export const SEVERITY_LEGEND = [
  { level: 'NISKO', key: 'LOW', desc: 'Praćenje, bez neposredne opasnosti' },
  { level: 'SREDNJE', key: 'MEDIUM', desc: 'Opreznost, moguće smetnje' },
  { level: 'VISOKO', key: 'HIGH', desc: 'Reagujte, opasnost po imovinu' },
  { level: 'KRITIČNO', key: 'CRITICAL', desc: 'Hitno djelovanje, opasnost po život' },
] as const;
