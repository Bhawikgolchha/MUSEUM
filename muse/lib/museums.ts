import museumsData from '@/data/indian-museums.json';

export interface Coordinates {
  lat: number;
  lon: number;
}

export type MuseumCategory =
  | 'all'
  | 'archaeology'
  | 'art_sculpture'
  | 'science_technology'
  | 'natural_history'
  | 'maritime_military'
  | 'textiles_crafts'
  | 'memorial_historic'
  | 'multidisciplinary';

export interface Museum {
  id: string;
  name: string;
  vernacular_names?: Record<string, string | undefined>;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: Coordinates;
  category: string;
  governance: string;
  opening_hours: {
    schedule: string;
    closed_on: string[];
    timings: string;
  };
  entry_fee: {
    is_free: boolean;
    domestic_inr: number;
    foreign_inr: number;
  };
  accessibility_features: string[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  thumbnail_url: string;
  gallery_urls: string[];
  description: string;
  artifact_count_approx: number;
  muse_collection_id?: string;
  featured_artifacts?: string[];
  source: string;
  last_updated: string;
}

export interface MuseumWithDistance extends Museum {
  distance_km?: number;
  isOpenToday?: boolean;
}

export interface MuseumSearchParams {
  query?: string;
  center?: Coordinates;
  radiusKm?: number;
  category?: string;
  openTodayOnly?: boolean;
  accessibilityOnly?: boolean;
  freeOnly?: boolean;
}

export function getAllMuseums(): Museum[] {
  return museumsData as unknown as Museum[];
}

export function getMuseumById(id: string): Museum | undefined {
  return (museumsData as unknown as Museum[]).find((m) => m.id === id);
}

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Checks if a museum is open today based on day of week
 */
export function isMuseumOpenToday(closedOn: string[]): boolean {
  if (!closedOn || closedOn.length === 0) return true;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  return !closedOn.some((d) => d.toLowerCase() === todayName.toLowerCase());
}

/**
 * Coordinates lookup dictionary for Indian cities and landmarks
 */
export const KNOWN_INDIAN_LOCATIONS: Record<string, Coordinates> = {
  'delhi': { lat: 28.6139, lon: 77.2090 },
  'new delhi': { lat: 28.6139, lon: 77.2090 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'patna': { lat: 25.5941, lon: 85.1376 },
  'varanasi': { lat: 25.3176, lon: 82.9739 },
  'sarnath': { lat: 25.3811, lon: 83.0227 },
  'kolkata': { lat: 22.5726, lon: 88.3639 },
  'mumbai': { lat: 18.9220, lon: 72.8347 },
  'bengaluru': { lat: 12.9716, lon: 77.5946 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'hyderabad': { lat: 17.3850, lon: 78.4867 },
  'jaipur': { lat: 26.9124, lon: 75.7873 },
  'ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'bhopal': { lat: 23.2599, lon: 77.4126 },
  'kochi': { lat: 9.9312, lon: 76.2673 },
};

/**
 * Filter, distance compute, and rank museums based on search criteria
 */
export function searchMuseums(params: MuseumSearchParams): {
  results: MuseumWithDistance[];
  resolvedCenter: Coordinates | null;
  total: number;
} {
  const all = getAllMuseums();
  const q = (params.query || '').trim().toLowerCase();

  let center = params.center || null;

  // If query matches a known city/landmark, resolve center
  if (!center && q) {
    for (const [key, coords] of Object.entries(KNOWN_INDIAN_LOCATIONS)) {
      if (q.includes(key)) {
        center = coords;
        break;
      }
    }
  }

  // Filter and compute distances
  const processed: MuseumWithDistance[] = all.map((m) => {
    let dist: number | undefined;
    if (center) {
      dist = calculateHaversineDistance(center.lat, center.lon, m.coordinates.lat, m.coordinates.lon);
    }
    const openToday = isMuseumOpenToday(m.opening_hours.closed_on);
    return {
      ...m,
      distance_km: dist,
      isOpenToday: openToday,
    };
  });

  const radius = params.radiusKm ?? (center ? 50 : 2000);

  const filtered = processed.filter((m) => {
    // 1. Text match filter if query given
    if (q) {
      const matchText = `${m.name} ${m.city} ${m.state} ${m.pincode} ${m.description} ${m.category}`.toLowerCase();
      const directMatch = matchText.includes(q);
      // If we resolved center from query, allow items within radius even if name doesn't contain the city string verbatim
      if (!directMatch && center && m.distance_km !== undefined && m.distance_km > radius) {
        return false;
      }
      if (!directMatch && !center) {
        return false;
      }
    }

    // 2. Radius boundary filter
    if (center && m.distance_km !== undefined && m.distance_km > radius) {
      return false;
    }

    // 3. Category filter
    if (params.category && params.category !== 'all' && m.category !== params.category) {
      return false;
    }

    // 4. Open today filter
    if (params.openTodayOnly && !m.isOpenToday) {
      return false;
    }

    // 5. Accessibility filter
    if (params.accessibilityOnly && (!m.accessibility_features || m.accessibility_features.length === 0)) {
      return false;
    }

    // 6. Free entry filter
    if (params.freeOnly && !m.entry_fee.is_free) {
      return false;
    }

    return true;
  });

  // Sort by composite ranking: Proximity first if center given, then featured, then name
  filtered.sort((a, b) => {
    if (a.distance_km !== undefined && b.distance_km !== undefined) {
      return a.distance_km - b.distance_km;
    }
    if (a.featured_artifacts && !b.featured_artifacts) return -1;
    if (!a.featured_artifacts && b.featured_artifacts) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    results: filtered,
    resolvedCenter: center,
    total: filtered.length,
  };
}
