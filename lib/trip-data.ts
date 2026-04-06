export interface TripEvent {
  id: string;
  date: string;
  time?: string;
  endTime?: string;
  title: string;
  description: string;
  location: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'flight' | 'conference' | 'work' | 'drive' | 'milestone';
  icon: string;
  details?: string[];
}

export interface TripLocation {
  id: string;
  name: string;
  shortName: string;
  coordinates: [number, number];
  emoji: string;
}

export const tripLocations: TripLocation[] = [
  { id: 'van', name: 'Vancouver, Washington', shortName: 'PDX', coordinates: [-122.6587, 45.6387], emoji: '🏠' },
  { id: 'sea', name: 'Seattle, Washington', shortName: 'SEA', coordinates: [-122.3088, 47.4502], emoji: '☕' },
  { id: 'tul', name: 'Tulsa, Oklahoma', shortName: 'TUL', coordinates: [-95.8881, 36.1983], emoji: '🤠' },
  { id: 'lnk', name: 'Lincoln, Nebraska', shortName: 'LNK', coordinates: [-96.6852, 40.8507], emoji: '🌽' },
  { id: 'roca', name: 'Roca, Nebraska', shortName: 'ROCA', coordinates: [-96.6653, 40.6481], emoji: '📦' },
  { id: 'oma', name: 'Omaha, Nebraska', shortName: 'OMA', coordinates: [-95.8940, 41.3032], emoji: '🥩' },
];

export const tripEvents: TripEvent[] = [
  // Sunday April 12 - Travel Day
  {
    id: 'flight-out-1',
    date: '2026-04-12',
    time: '7:18 AM',
    title: 'Blast Off! ✈️',
    description: 'Dad leaves from PDX on Alaska Airlines Flight AS 2048',
    location: 'Portland International Airport (PDX)',
    coordinates: [-122.5975, 45.5886],
    type: 'flight',
    icon: '🛫',
    details: [
      'Flight AS 2048 to Seattle',
      'Layover in Seattle: 1h 47m',
      'Then Flight AS 2350 to Tulsa'
    ]
  },
  {
    id: 'flight-out-2',
    date: '2026-04-12',
    time: '4:03 PM',
    title: 'Landing in Tulsa!',
    description: 'Dad arrives in Tulsa, Oklahoma',
    location: 'Tulsa International Airport (TUL)',
    coordinates: [-95.8881, 36.1983],
    type: 'flight',
    icon: '🛬',
  },
  {
    id: 'hotel-checkin-tulsa',
    date: '2026-04-12',
    time: '5:00 PM',
    title: 'Hotel Check-in in Tulsa 🏨',
    description: 'Holiday Inn Express & Suites Tulsa Downtown by IHG',
    location: 'Holiday Inn Express & Suites, Tulsa',
    coordinates: [-95.8881, 36.1416],
    type: 'milestone',
    icon: '🔑',
    details: [
      'Address: 310 E Archer St, Tulsa, OK 74120',
      'Phone: (918) 728-2444',
      'Rest before the welcome reception'
    ]
  },
  {
    id: 'welcome-reception',
    date: '2026-04-12',
    time: '6:30 PM',
    endTime: '9:00 PM',
    title: 'Welcome Party! 🎉',
    description: 'Main Street Now Conference Welcome Reception',
    location: 'Tulsa, Oklahoma',
    coordinates: [-95.9928, 36.1540],
    type: 'conference',
    icon: '🥳',
    details: ['Meeting other downtown enthusiasts', 'Networking & snacks']
  },
  // Monday April 13 - Conference Day 1
  {
    id: 'conf-day-1',
    date: '2026-04-13',
    time: '10:00 AM',
    endTime: '12:00 PM',
    title: 'Conference Day 1',
    description: 'Opening Plenary at the Tulsa Theater',
    location: 'Tulsa Theater, Tulsa',
    coordinates: [-95.9898, 36.1554],
    type: 'conference',
    icon: '🎭',
    details: [
      'Theme: "Main Street at the Crossroads: Building Durable Futures"',
      'Opening ceremonies & keynote speakers',
      '100+ education sessions available'
    ]
  },
  // Tuesday April 14 - Conference Day 2
  {
    id: 'conf-day-2',
    date: '2026-04-14',
    time: '9:00 AM',
    endTime: '10:00 AM',
    title: 'Conference Day 2',
    description: 'The Durability of Main Street: Lessons, Momentum, and the Road Ahead',
    location: 'Arvest Convention Center, Tulsa',
    coordinates: [-95.9928, 36.1540],
    type: 'conference',
    icon: '📚',
    details: [
      'Main session at Arvest Convention Center',
      'Mobile workshops around Tulsa',
      'Visiting 4 nationally designated Main Street districts'
    ]
  },
  // Wednesday April 15 - Conference Day 3 + Drive
  {
    id: 'conf-day-3',
    date: '2026-04-15',
    time: '9:00 AM',
    endTime: '10:00 AM',
    title: 'Conference Day 3',
    description: 'Main Street Matters: The State of Economic Development',
    location: 'Arvest Convention Center, Tulsa',
    coordinates: [-95.9928, 36.1540],
    type: 'conference',
    icon: '💼',
    details: [
      'Final day of sessions',
      'Closing Celebration: 4:15 PM - 5:30 PM'
    ]
  },
  {
    id: 'drive-to-lincoln',
    date: '2026-04-15',
    time: '4:00 PM',
    title: 'Road Trip! 🚗',
    description: 'Driving from Tulsa to Lincoln, Nebraska (~6 hours)',
    location: 'Tulsa → Lincoln',
    coordinates: [-96.0, 38.5],
    type: 'drive',
    icon: '🚙',
    details: [
      'Distance: ~350 miles',
      'Estimated drive time: 5-6 hours',
      'Scenic drive through Kansas!'
    ]
  },
  // Arrive Lincoln (night of April 15)
  {
    id: 'arrive-lincoln',
    date: '2026-04-15',
    time: '10:00 PM',
    title: 'Arrive in Lincoln! 🌙',
    description: 'Arrived in Lincoln after the 5-6 hour drive from Tulsa',
    location: 'Lincoln, Nebraska',
    coordinates: [-96.6852, 40.8507],
    type: 'milestone',
    icon: '🛣️',
    details: [
      'Safe arrival after scenic drive',
      'Time to rest up for the big day ahead!'
    ]
  },
  {
    id: 'hotel-checkin-lincoln',
    date: '2026-04-15',
    time: '10:30 PM',
    title: 'Hotel Check-in in Lincoln 🏨',
    description: 'Hyatt Place Lincoln / Downtown - Haymarket',
    location: 'Hyatt Place Lincoln, Downtown Haymarket',
    coordinates: [-96.6777, 40.8243],
    type: 'milestone',
    icon: '🔑',
    details: [
      'Address: 600 Q Street, Lincoln, Nebraska, 68508',
      'Get some sleep before the big warehouse days!'
    ]
  },
  {
    id: 'packing-day',
    date: '2026-04-16',
    time: 'All Day',
    title: 'Packing Day 📦',
    description: 'All hands at the warehouse boxing up shipping orders',
    location: 'Roca, Nebraska Warehouse',
    coordinates: [-96.6653, 40.6481],
    type: 'work',
    icon: '📦',
    details: [
      'Labels printed, tape guns loaded',
      'Everything staged and ready to ship',
      '~180 orders to pack for shipping'
    ]
  },
  {
    id: 'pickup-night-1',
    date: '2026-04-16',
    time: '5:00 PM',
    endTime: '8:00 PM',
    title: 'Pickup Night! 🌙',
    description: 'Opening night - smaller evening session for first wave of customers',
    location: 'Roca, Nebraska Warehouse',
    coordinates: [-96.6653, 40.6481],
    type: 'work',
    icon: '🌟',
    details: ['Soft launch for local customers', 'First pickups of the event!']
  },
  // Friday April 17 - The Big Day
  {
    id: 'big-day',
    date: '2026-04-17',
    time: '10:00 AM',
    endTime: '8:00 PM',
    title: 'THE BIG DAY! 🎊',
    description: 'Full send! Highest-volume day - customers rolling through all day',
    location: 'Roca, Nebraska Warehouse',
    coordinates: [-96.6653, 40.6481],
    type: 'work',
    icon: '🔥',
    details: [
      '10 hours of pickups!',
      'Busiest day of the event',
      'Lots of happy customers!'
    ]
  },
  // Saturday April 18 - Final Pickup Day
  {
    id: 'final-pickup',
    date: '2026-04-18',
    time: '10:00 AM',
    endTime: '7:00 PM',
    title: 'Final Pickup Day',
    description: 'Last day of the main event - wrap up remaining pickups',
    location: 'Roca, Nebraska Warehouse',
    coordinates: [-96.6653, 40.6481],
    type: 'work',
    icon: '✅',
    details: [
      'Catch any stragglers',
      '~200 total in-person pickups completed!',
      '379 customers total served'
    ]
  },
  // Sunday April 19 - Return Home
  {
    id: 'flight-home-1',
    date: '2026-04-19',
    time: '2:17 PM',
    title: 'Heading Home! ✈️',
    description: 'Dad leaves Omaha on Alaska Airlines Flight AS 312',
    location: 'Eppley Airfield (OMA)',
    coordinates: [-95.8940, 41.3032],
    type: 'flight',
    icon: '🛫',
    details: [
      'Flight AS 312 to Seattle',
      'Layover in Seattle: 3h 29m',
      'Then Flight AS 2007 to Portland'
    ]
  },
  {
    id: 'flight-home-2',
    date: '2026-04-19',
    time: '8:25 PM',
    title: 'DAD IS HOME! 🏠',
    description: 'Dad arrives back at PDX - time for hugs!',
    location: 'Portland International Airport (PDX)',
    coordinates: [-122.5975, 45.5886],
    type: 'milestone',
    icon: '🎉',
    details: ['8 days of adventure complete!', 'Time for hugs!']
  },
];

export const tripStats = {
  totalDays: 8,
  totalMiles: 3200,
  cities: 5,
  conferences: 1,
  customersServed: 379,
  flights: 4,
};

export function getEventsByDate(date: string): TripEvent[] {
  return tripEvents.filter(event => event.date === date);
}

export function getTripProgress(): number {
  const now = new Date();
  const start = new Date('2026-04-12T07:18:00');
  const end = new Date('2026-04-19T20:25:00');

  if (now < start) return 0;
  if (now > end) return 100;

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.round((elapsed / total) * 100);
}

function parseEventTime(time: string): { hours: number; minutes: number } | null {
  if (!time || time === 'All Day') return null;

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

export function getCurrentEvent(): TripEvent | null {
  const now = new Date();

  for (let i = tripEvents.length - 1; i >= 0; i--) {
    const event = tripEvents[i];
    const parsed = event.time ? parseEventTime(event.time) : null;

    let eventDate: Date;
    if (parsed) {
      eventDate = new Date(`${event.date}T${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}:00`);
    } else {
      eventDate = new Date(`${event.date}T00:00:00`);
    }

    if (now >= eventDate) {
      return event;
    }
  }
  return tripEvents[0];
}
