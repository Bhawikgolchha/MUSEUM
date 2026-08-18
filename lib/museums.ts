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
  'ncr': { lat: 28.6139, lon: 77.2090 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'madras': { lat: 13.0827, lon: 80.2707 },
  'patna': { lat: 25.5941, lon: 85.1376 },
  'varanasi': { lat: 25.3176, lon: 82.9739 },
  'kashi': { lat: 25.3176, lon: 82.9739 },
  'sarnath': { lat: 25.3811, lon: 83.0227 },
  'kolkata': { lat: 22.5726, lon: 88.3639 },
  'calcutta': { lat: 22.5726, lon: 88.3639 },
  'mumbai': { lat: 18.9220, lon: 72.8347 },
  'bombay': { lat: 18.9220, lon: 72.8347 },
  'bengaluru': { lat: 12.9716, lon: 77.5946 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'hyderabad': { lat: 17.3850, lon: 78.4867 },
  'jaipur': { lat: 26.9124, lon: 75.7873 },
  'ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'thiruvananthapuram': { lat: 8.5241, lon: 76.9366 },
  'trivandrum': { lat: 8.5241, lon: 76.9366 },
  'pune': { lat: 18.5204, lon: 73.8567 },
  'udaipur': { lat: 24.5854, lon: 73.7125 },
  'shillong': { lat: 25.5788, lon: 91.8933 },
  'panaji': { lat: 15.4909, lon: 73.8278 },
  'goa': { lat: 15.4909, lon: 73.8278 },
  'lothal': { lat: 22.5222, lon: 72.2494 },
  'jammu': { lat: 32.7266, lon: 74.8570 },
  'bhopal': { lat: 23.2599, lon: 77.4126 },
  'bhubaneswar': { lat: 20.2961, lon: 85.8245 },
  'guwahati': { lat: 26.1445, lon: 91.7362 },
  'kochi': { lat: 9.9312, lon: 76.2673 },
  'cochin': { lat: 9.9312, lon: 76.2673 },
  'chandigarh': { lat: 30.7333, lon: 76.7794 },
  'shimla': { lat: 31.1048, lon: 77.1734 },
  'dehradun': { lat: 30.3165, lon: 78.0322 },
  'lucknow': { lat: 26.8467, lon: 80.9462 },
  'kanpur': { lat: 26.4499, lon: 80.3319 },
  'ranchi': { lat: 23.3441, lon: 85.3096 },
  'raipur': { lat: 21.2514, lon: 81.6296 },
  'surat': { lat: 21.1702, lon: 72.8311 },
  'jodhpur': { lat: 26.2389, lon: 73.0243 },
  'amritsar': { lat: 31.6340, lon: 74.8723 },
  'ludhiana': { lat: 30.9010, lon: 75.8573 },
  'agra': { lat: 27.1767, lon: 78.0081 },
  'madurai': { lat: 9.9252, lon: 78.1198 },
  'mysuru': { lat: 12.2958, lon: 76.6394 },
  'mysore': { lat: 12.2958, lon: 76.6394 },
};

export interface PostalPrefixCentroid {
  lat: number;
  lon: number;
  regionName: string;
  state: string;
}

/**
 * Postal circle prefix (3-digit and 2-digit) centroid mappings across Indian states and union territories.
 */
export const POSTAL_PREFIX_CENTROIDS: Record<string, PostalPrefixCentroid> = {
  // 3-digit specific state / UT / district overrides
  '403': { lat: 15.4989, lon: 73.8278, regionName: 'Goa (Panaji / Coastal)', state: 'Goa' },
  '194': { lat: 34.1526, lon: 77.5771, regionName: 'Jammu & Kashmir / Ladakh (Leh / Kargil)', state: 'Ladakh' },
  '737': { lat: 27.3389, lon: 88.6065, regionName: 'Sikkim (Gangtok / Himalayas)', state: 'Sikkim' },
  '744': { lat: 11.6234, lon: 92.7265, regionName: 'Andaman & Nicobar Islands (Port Blair)', state: 'Andaman and Nicobar Islands' },
  '791': { lat: 27.0844, lon: 93.6053, regionName: 'North East India (Arunachal Pradesh / Itanagar)', state: 'Arunachal Pradesh' },
  '795': { lat: 24.8170, lon: 93.9368, regionName: 'North East India (Manipur / Imphal)', state: 'Manipur' },
  '796': { lat: 23.7271, lon: 92.7176, regionName: 'North East India (Mizoram / Aizawl)', state: 'Mizoram' },
  '797': { lat: 25.6751, lon: 94.1086, regionName: 'North East India (Nagaland / Kohima)', state: 'Nagaland' },
  '798': { lat: 23.8315, lon: 91.2868, regionName: 'North East India (Tripura / Agartala)', state: 'Tripura' },
  '799': { lat: 23.8315, lon: 91.2868, regionName: 'North East India (Tripura / Agartala)', state: 'Tripura' },
  '208': { lat: 26.4499, lon: 80.3319, regionName: 'Uttar Pradesh (Kanpur / Central)', state: 'Uttar Pradesh' },

  // 2-digit postal circle prefixes
  '11': { lat: 28.6139, lon: 77.2090, regionName: 'Delhi (NCR)', state: 'Delhi' },
  '12': { lat: 28.4595, lon: 77.0266, regionName: 'Haryana (Gurugram / South)', state: 'Haryana' },
  '13': { lat: 30.3782, lon: 76.7767, regionName: 'Haryana (Ambala / North)', state: 'Haryana' },
  '14': { lat: 30.9010, lon: 75.8573, regionName: 'Punjab (Ludhiana / Central)', state: 'Punjab' },
  '16': { lat: 30.7333, lon: 76.7794, regionName: 'Chandigarh Tri-City', state: 'Chandigarh' },
  '17': { lat: 31.1048, lon: 77.1734, regionName: 'Himachal Pradesh (Shimla / Hills)', state: 'Himachal Pradesh' },
  '18': { lat: 32.7266, lon: 74.8570, regionName: 'Jammu & Kashmir (Jammu Region)', state: 'Jammu and Kashmir' },
  '19': { lat: 34.0837, lon: 74.7973, regionName: 'Jammu & Kashmir (Kashmir Valley)', state: 'Jammu and Kashmir' },
  '20': { lat: 27.8974, lon: 78.0880, regionName: 'Uttar Pradesh (Western / Aligarh)', state: 'Uttar Pradesh' },
  '21': { lat: 26.4499, lon: 80.3319, regionName: 'Uttar Pradesh (Kanpur / Prayagraj)', state: 'Uttar Pradesh' },
  '22': { lat: 25.3176, lon: 82.9739, regionName: 'Uttar Pradesh (Varanasi / Lucknow)', state: 'Uttar Pradesh' },
  '24': { lat: 30.3165, lon: 78.0322, regionName: 'Uttarakhand (Dehradun / Garhwal)', state: 'Uttarakhand' },
  '30': { lat: 26.9124, lon: 75.7873, regionName: 'Rajasthan (Jaipur / Central)', state: 'Rajasthan' },
  '31': { lat: 24.5854, lon: 73.7125, regionName: 'Rajasthan (Udaipur / Mewar)', state: 'Rajasthan' },
  '34': { lat: 26.2389, lon: 73.0243, regionName: 'Rajasthan (Jodhpur / Marwar)', state: 'Rajasthan' },
  '38': { lat: 23.0225, lon: 72.5714, regionName: 'Gujarat (Ahmedabad / Central)', state: 'Gujarat' },
  '39': { lat: 21.1702, lon: 72.8311, regionName: 'Gujarat (Surat / South)', state: 'Gujarat' },
  '40': { lat: 18.9220, lon: 72.8347, regionName: 'Maharashtra (Mumbai / Konkan Coast)', state: 'Maharashtra' },
  '41': { lat: 18.5204, lon: 73.8567, regionName: 'Maharashtra (Pune / Western Ghats)', state: 'Maharashtra' },
  '44': { lat: 21.1458, lon: 79.0882, regionName: 'Maharashtra (Nagpur / Vidarbha)', state: 'Maharashtra' },
  '46': { lat: 23.2599, lon: 77.4126, regionName: 'Madhya Pradesh (Bhopal / Malwa)', state: 'Madhya Pradesh' },
  '49': { lat: 21.2514, lon: 81.6296, regionName: 'Chhattisgarh (Raipur / Central)', state: 'Chhattisgarh' },
  '50': { lat: 17.3850, lon: 78.4867, regionName: 'Telangana (Hyderabad Region)', state: 'Telangana' },
  '52': { lat: 16.5062, lon: 80.6480, regionName: 'Andhra Pradesh (Vijayawada / Coastal)', state: 'Andhra Pradesh' },
  '56': { lat: 12.9716, lon: 77.5946, regionName: 'Karnataka (Bengaluru / South)', state: 'Karnataka' },
  '57': { lat: 12.9141, lon: 74.8560, regionName: 'Karnataka (Coastal / Hubballi)', state: 'Karnataka' },
  '60': { lat: 13.0827, lon: 80.2707, regionName: 'Tamil Nadu (Chennai / Northern)', state: 'Tamil Nadu' },
  '62': { lat: 9.9252, lon: 78.1198, regionName: 'Tamil Nadu (Madurai / Southern)', state: 'Tamil Nadu' },
  '68': { lat: 9.9312, lon: 76.2673, regionName: 'Kerala (Kochi / Central Kerala)', state: 'Kerala' },
  '69': { lat: 8.5241, lon: 76.9366, regionName: 'Kerala (Thiruvananthapuram / South)', state: 'Kerala' },
  '70': { lat: 22.5726, lon: 88.3639, regionName: 'West Bengal (Kolkata / Greater Kolkata)', state: 'West Bengal' },
  '75': { lat: 20.2961, lon: 85.8245, regionName: 'Odisha (Bhubaneswar / Coastal)', state: 'Odisha' },
  '78': { lat: 26.1445, lon: 91.7362, regionName: 'Assam (Guwahati / Brahmaputra Valley)', state: 'Assam' },
  '79': { lat: 25.5788, lon: 91.8933, regionName: 'North East India (Shillong / Meghalaya)', state: 'Meghalaya' },
  '80': { lat: 25.5941, lon: 85.1376, regionName: 'Bihar (Patna / Central Bihar)', state: 'Bihar' },
  '83': { lat: 23.3441, lon: 85.3096, regionName: 'Jharkhand (Ranchi / Chota Nagpur)', state: 'Jharkhand' },
};

/**
 * Resolves regional coordinates from a 6-digit Indian PIN code and calculates
 * the nearest authentic museum along with the Haversine distance in kilometers.
 */
export function findNearestMuseumForPincode(pincode: string): {
  nearestMuseum: MuseumWithDistance;
  distanceKm: number;
  searchedPin: string;
  regionName: string;
} | null {
  if (typeof pincode !== 'string') return null;
  const cleanPin = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  const allMuseums = getAllMuseums();
  if (allMuseums.length === 0) return null;

  // Check if any museum is situated directly in this PIN code
  const exactMatch = allMuseums.find((m) => m.pincode === cleanPin);
  if (exactMatch) {
    return {
      nearestMuseum: {
        ...exactMatch,
        distance_km: 0,
        isOpenToday: isMuseumOpenToday(exactMatch.opening_hours.closed_on),
      },
      distanceKm: 0,
      searchedPin: cleanPin,
      regionName: `${exactMatch.city}, ${exactMatch.state}`,
    };
  }

  // Resolve coordinates from postal prefix centroid (check 3-digit prefix then 2-digit prefix)
  const prefix3 = cleanPin.substring(0, 3);
  const prefix2 = cleanPin.substring(0, 2);
  let centroid = POSTAL_PREFIX_CENTROIDS[prefix3] || POSTAL_PREFIX_CENTROIDS[prefix2];

  // Fallback to zone centroid (first digit) if prefix is not explicitly mapped
  if (!centroid) {
    const zoneKey = Object.keys(POSTAL_PREFIX_CENTROIDS).find((k) => k.startsWith(cleanPin[0]));
    centroid = zoneKey ? POSTAL_PREFIX_CENTROIDS[zoneKey] : POSTAL_PREFIX_CENTROIDS['11'];
  }

  let minDistance = Infinity;
  let nearestMuseum = allMuseums[0];

  for (const museum of allMuseums) {
    const dist = calculateHaversineDistance(
      centroid.lat,
      centroid.lon,
      museum.coordinates.lat,
      museum.coordinates.lon
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestMuseum = museum;
    }
  }

  return {
    nearestMuseum: {
      ...nearestMuseum,
      distance_km: minDistance,
      isOpenToday: isMuseumOpenToday(nearestMuseum.opening_hours.closed_on),
    },
    distanceKm: minDistance,
    searchedPin: cleanPin,
    regionName: centroid.regionName,
  };
}

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
