import { Trip } from '../types/index';

export const initialTrips: Trip[] = [
  {
    id: 'trip-mumbai-pune-2026',
    name: 'Mumbai & Pune',
    startDate: '2026-08-20',
    endDate: '2026-09-03',
    locations: ['Mumbai', 'Pune'],
    description: 'Intercity Transit & Stays - Official visit to client locations and stations (15 Days).'
  },
  {
    id: 'trip-local-work-2026',
    name: 'Local Operations (Gurgaon & Delhi)',
    startDate: '2026-09-11',
    endDate: '2026-10-13',
    locations: ['Gurgaon', 'Delhi NCR'],
    description: 'Post-trip local transit, courier/porter dispatches, and client meetings.'
  }
];
