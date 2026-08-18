/**
 * Mock Geocoding Provider Factory
 * Simulates OpenStreetMap Nominatim and National Postal Directory API responses
 * with rich failure injection (429, 500, socket abort, malformed payloads).
 */

import { MockHandler, registerMockHandler } from './fetch_interceptor';

export interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  importance?: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface PostalOfficeRecord {
  Name: string;
  Description?: string;
  BranchType?: string;
  DeliveryStatus?: string;
  Circle?: string;
  District: string;
  Division?: string;
  Region?: string;
  State: string;
  Country?: string;
  Pincode: string;
}

export interface PostalApiResponse {
  Message?: string;
  Status: 'Success' | 'Error';
  PostOffice?: PostalOfficeRecord[] | null;
}

export interface GeocoderMockState {
  nominatimCallCount: number;
  postalApiCallCount: number;
  customNominatimResponses: Map<string, NominatimPlace[] | { status: number; body?: string | object }>;
  customPostalResponses: Map<string, PostalApiResponse[] | { status: number; body?: string | object }>;
  simulateNominatim429Count: number;
  simulateNominatim500Count: number;
  simulateNominatimTimeout: boolean;
  simulateNominatimMalformedJson: boolean;
  simulateNominatimNullIsland: boolean;
  simulatePostal500Count: number;
}

const state: GeocoderMockState = {
  nominatimCallCount: 0,
  postalApiCallCount: 0,
  customNominatimResponses: new Map(),
  customPostalResponses: new Map(),
  simulateNominatim429Count: 0,
  simulateNominatim500Count: 0,
  simulateNominatimTimeout: false,
  simulateNominatimMalformedJson: false,
  simulateNominatimNullIsland: false,
  simulatePostal500Count: 0,
};

// Authoritative default external fallback records for unindexed PINs
const DEFAULT_NOMINATIM_MAP: Record<string, NominatimPlace[]> = {
  '176219': [
    {
      place_id: 101,
      lat: '32.2190',
      lon: '76.3234',
      display_name: 'Dharamshala H.O, Kangra, Himachal Pradesh, 176219, India',
      address: {
        city: 'Dharamshala',
        county: 'Kangra',
        state: 'Himachal Pradesh',
        postcode: '176219',
        country: 'India',
        country_code: 'in',
      },
    },
  ],
  '841301': [
    {
      place_id: 102,
      lat: '25.7796',
      lon: '84.7499',
      display_name: 'Chapra Head Post Office, Saran, Bihar, 841301, India',
      address: {
        city: 'Chapra',
        county: 'Saran',
        state: 'Bihar',
        postcode: '841301',
        country: 'India',
        country_code: 'in',
      },
    },
  ],
  '560001': [
    {
      place_id: 103,
      lat: '12.9752',
      lon: '77.5963',
      display_name: 'Bengaluru GPO, Bengaluru Urban, Karnataka, 560001, India',
      address: {
        suburb: 'Cubbon Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postcode: '560001',
        country: 'India',
      },
    },
    {
      place_id: 104,
      lat: '12.9780',
      lon: '77.6000',
      display_name: 'Tasker Town, Bengaluru Urban, Karnataka, 560001, India',
      address: {
        suburb: 'Tasker Town',
        city: 'Bengaluru',
        state: 'Karnataka',
        postcode: '560001',
        country: 'India',
      },
    },
    {
      place_id: 105,
      lat: '12.9716',
      lon: '77.6050',
      display_name: 'Richmond Town, Bengaluru Urban, Karnataka, 560001, India',
      address: {
        suburb: 'Richmond Town',
        city: 'Bengaluru',
        state: 'Karnataka',
        postcode: '560001',
        country: 'India',
      },
    },
  ],
};

const DEFAULT_POSTAL_MAP: Record<string, PostalApiResponse[]> = {
  '841301': [
    {
      Status: 'Success',
      PostOffice: [
        {
          Name: 'Chapra H.O',
          District: 'Saran',
          State: 'Bihar',
          Pincode: '841301',
          Circle: 'Bihar Circle',
        },
      ],
    },
  ],
  '176219': [
    {
      Status: 'Success',
      PostOffice: [
        {
          Name: 'Dharamshala Cantt S.O',
          District: 'Kangra',
          State: 'Himachal Pradesh',
          Pincode: '176219',
          Circle: 'Himachal Pradesh Circle',
        },
      ],
    },
  ],
  '560001': [
    {
      Status: 'Success',
      PostOffice: [
        { Name: 'Bangalore G.P.O.', District: 'Bangalore', State: 'Karnataka', Pincode: '560001' },
        { Name: 'Tasker Town S.O', District: 'Bangalore', State: 'Karnataka', Pincode: '560001' },
        { Name: 'Richmond Town S.O', District: 'Bangalore', State: 'Karnataka', Pincode: '560001' },
      ],
    },
  ],
};

/**
 * Creates the geocoder HTTP request interceptor handler.
 */
export function createGeocoderMockHandler(): MockHandler {
  return (url: string) => {
    // 1. Check for OpenStreetMap Nominatim
    if (url.includes('nominatim.openstreetmap.org') || url.includes('nominatim')) {
      state.nominatimCallCount++;

      if (state.simulateNominatimTimeout) {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      }

      if (state.simulateNominatim429Count > 0) {
        state.simulateNominatim429Count--;
        return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '1' },
        });
      }

      if (state.simulateNominatim500Count > 0) {
        state.simulateNominatim500Count--;
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (state.simulateNominatimMalformedJson) {
        return new Response('<html><body><h1>502 Bad Gateway</h1></body></html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      if (state.simulateNominatimNullIsland) {
        return new Response(
          JSON.stringify([
            {
              place_id: 99999,
              lat: '0.0000',
              lon: '0.0000',
              display_name: 'Null Island Buoy',
              address: { country: 'International Waters', postcode: '000000' },
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Extract postal code from query params
      const urlObj = new URL(url.startsWith('http') ? url : 'http://localhost');
      const q = urlObj.searchParams.get('postalcode') || urlObj.searchParams.get('q') || '';
      const pinMatch = q.match(/\b([1-9][0-9]{5})\b/);
      const pin = pinMatch ? pinMatch[1] : q.trim();

      if (state.customNominatimResponses.has(pin)) {
        const resp = state.customNominatimResponses.get(pin)!;
        if ('status' in resp) {
          const bodyStr = typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body ?? {});
          return new Response(bodyStr, { status: resp.status, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(resp), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (DEFAULT_NOMINATIM_MAP[pin]) {
        return new Response(JSON.stringify(DEFAULT_NOMINATIM_MAP[pin]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Unmatched default -> empty results
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Check for National Postal Directory API (api.postalpincode.in)
    if (url.includes('api.postalpincode.in') || url.includes('postalpincode')) {
      state.postalApiCallCount++;

      if (state.simulatePostal500Count > 0) {
        state.simulatePostal500Count--;
        return new Response(JSON.stringify({ Status: 'Error', Message: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const match = url.match(/\/pincode\/([0-9a-zA-Z]+)/);
      const pin = match ? match[1] : '';

      if (state.customPostalResponses.has(pin)) {
        const resp = state.customPostalResponses.get(pin)!;
        if ('status' in resp) {
          const bodyStr = typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body ?? {});
          return new Response(bodyStr, { status: resp.status, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(resp), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (DEFAULT_POSTAL_MAP[pin]) {
        return new Response(JSON.stringify(DEFAULT_POSTAL_MAP[pin]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Default not found
      return new Response(
        JSON.stringify([
          {
            Status: 'Error',
            Message: 'No records found',
            PostOffice: null,
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return null;
  };
}

/**
 * Resets geocoder mock state and registered responses.
 */
export function resetGeocoderMock() {
  state.nominatimCallCount = 0;
  state.postalApiCallCount = 0;
  state.customNominatimResponses.clear();
  state.customPostalResponses.clear();
  state.simulateNominatim429Count = 0;
  state.simulateNominatim500Count = 0;
  state.simulateNominatimTimeout = false;
  state.simulateNominatimMalformedJson = false;
  state.simulateNominatimNullIsland = false;
  state.simulatePostal500Count = 0;
}

/**
 * Registers custom Nominatim response for a PIN.
 */
export function mockNominatimResponse(
  pincode: string,
  response: NominatimPlace[] | { status: number; body?: string | object }
) {
  state.customNominatimResponses.set(pincode, response);
}

/**
 * Registers custom Postal API response for a PIN.
 */
export function mockPostalApiResponse(
  pincode: string,
  response: PostalApiResponse[] | { status: number; body?: string | object }
) {
  state.customPostalResponses.set(pincode, response);
}

/**
 * Sets simulation flags for failure modes.
 */
export function setGeocoderSimulationFlags(flags: Partial<{
  simulateNominatim429Count: number;
  simulateNominatim500Count: number;
  simulateNominatimTimeout: boolean;
  simulateNominatimMalformedJson: boolean;
  simulateNominatimNullIsland: boolean;
  simulatePostal500Count: number;
}>) {
  Object.assign(state, flags);
}

export function getNominatimCallCount(): number {
  return state.nominatimCallCount;
}

export function getPostalApiCallCount(): number {
  return state.postalApiCallCount;
}
