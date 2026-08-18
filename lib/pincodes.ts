import { Coordinates, Museum, calculateHaversineDistance, getAllMuseums } from '@/lib/museums';

export interface ResolvedPinLocation {
  coords: Coordinates;
  locationName: string;
  pincode: string;
  sourceTier: 'exact_pincode' | 'district_centroid' | 'postal_circle';
}

/**
 * Tier 1: Exact 6-digit PIN registry covering all authentic museums + major metro & city GPOs.
 */
export const EXACT_PIN_COORDINATES: Record<string, { coords: Coordinates; locationName: string }> = {
  // All 20+ authentic museums in dataset
  '110011': {
    coords: { lat: 28.6118, lon: 77.2193 },
    locationName: 'Central Secretariat / Janpath, New Delhi',
  },
  '600008': {
    coords: { lat: 13.0694, lon: 80.2569 },
    locationName: 'Egmore, Chennai, Tamil Nadu',
  },
  '800001': {
    coords: { lat: 25.6093, lon: 85.1235 },
    locationName: 'Kidwaipuri / Bailey Road, Patna, Bihar',
  },
  '221007': {
    coords: { lat: 25.3811, lon: 83.0227 },
    locationName: 'Sarnath, Varanasi, Uttar Pradesh',
  },
  '700016': {
    coords: { lat: 22.5579, lon: 88.3511 },
    locationName: 'Park Street, Kolkata, West Bengal',
  },
  '400023': {
    coords: { lat: 18.9268, lon: 72.8327 },
    locationName: 'Kala Ghoda, Fort, Mumbai, Maharashtra',
  },
  '560001': {
    coords: { lat: 12.9752, lon: 77.5963 },
    locationName: 'Kasturba Road / Cubbon Park, Bengaluru, Karnataka',
  },
  '500002': {
    coords: { lat: 17.3713, lon: 78.4804 },
    locationName: 'Darulshifa, Hyderabad, Telangana',
  },
  '302004': {
    coords: { lat: 26.9116, lon: 75.8195 },
    locationName: 'Ram Niwas Garden, Adarsh Nagar, Jaipur, Rajasthan',
  },
  '380004': {
    coords: { lat: 23.0573, lon: 72.5937 },
    locationName: 'Shahibaug, Ahmedabad, Gujarat',
  },
  '695033': {
    coords: { lat: 8.5089, lon: 76.9554 },
    locationName: 'Museum Compound, Thiruvananthapuram, Kerala',
  },
  '411002': {
    coords: { lat: 18.5113, lon: 73.8542 },
    locationName: 'Shukrawar Peth, Pune, Maharashtra',
  },
  '313001': {
    coords: { lat: 24.5764, lon: 73.6835 },
    locationName: 'City Palace Complex, Udaipur, Rajasthan',
  },
  '793008': {
    coords: { lat: 25.5947, lon: 91.8906 },
    locationName: 'Mawlai Phudmuri, Shillong, Meghalaya',
  },
  '403001': {
    coords: { lat: 15.4989, lon: 73.8278 },
    locationName: 'Adil Shah Palace, Panaji, Goa',
  },
  '382230': {
    coords: { lat: 22.5222, lon: 72.2494 },
    locationName: 'Saragwala, Lothal, Gujarat',
  },
  '180001': {
    coords: { lat: 32.7412, lon: 74.8717 },
    locationName: 'Mubarak Mandi, Jammu, Jammu and Kashmir',
  },
  '462013': {
    coords: { lat: 23.2312, lon: 77.3860 },
    locationName: 'Shamla Hills, Bhopal, Madhya Pradesh',
  },
  '751014': {
    coords: { lat: 20.2546, lon: 85.8390 },
    locationName: 'BJB Nagar, Bhubaneswar, Odisha',
  },
  '781001': {
    coords: { lat: 26.1866, lon: 91.7516 },
    locationName: 'Ambari / Dighalipukhuri, Guwahati, Assam',
  },
  '682301': {
    coords: { lat: 9.9529, lon: 76.3639 },
    locationName: 'Tripunithura, Kochi, Kerala',
  },

  // 14 Expanded Museum PINs across India (M2 additions)
  '160011': {
    coords: { lat: 30.7490, lon: 76.7865 },
    locationName: 'Sector 10, Chandigarh',
  },
  '143001': {
    coords: { lat: 31.6258, lon: 74.8765 },
    locationName: 'Town Hall / Katra Ahluwalia, Amritsar, Punjab',
  },
  '194101': {
    coords: { lat: 34.1359, lon: 77.5385 },
    locationName: 'Leh-Kargil Road / Leh Airport, Ladakh',
  },
  '171004': {
    coords: { lat: 31.1044, lon: 77.1511 },
    locationName: 'Chaura Maidan, Shimla, Himachal Pradesh',
  },
  '248006': {
    coords: { lat: 30.3427, lon: 77.9995 },
    locationName: 'Kaulagarh / FRI Campus, Dehradun, Uttarakhand',
  },
  '211002': {
    coords: { lat: 25.4549, lon: 81.8547 },
    locationName: 'Chandrashekhar Azad Park, Prayagraj, Uttar Pradesh',
  },
  '834009': {
    coords: { lat: 23.3857, lon: 85.3789 },
    locationName: 'Hotwar / Khelgaon, Ranchi, Jharkhand',
  },
  '492001': {
    coords: { lat: 21.2427, lon: 81.6376 },
    locationName: 'Civil Lines / Raj Bhavan, Raipur, Chhattisgarh',
  },
  '795001': {
    coords: { lat: 24.8077, lon: 93.9388 },
    locationName: 'Kangla Pat / Thangal Bazar, Imphal, Manipur',
  },
  '737102': {
    coords: { lat: 27.3160, lon: 88.6046 },
    locationName: 'Deorali, Gangtok, Sikkim',
  },
  '744102': {
    coords: { lat: 11.6711, lon: 92.7265 },
    locationName: 'Haddo / Delanipur, Port Blair, Andaman & Nicobar',
  },
  '462002': {
    coords: { lat: 23.2344, lon: 77.3878 },
    locationName: 'Shyamla Hills / TT Nagar, Bhopal, Madhya Pradesh',
  },
  '570001': {
    coords: { lat: 12.3051, lon: 76.6552 },
    locationName: 'Agrahara / Mysore Palace, Mysuru, Karnataka',
  },
  '520002': {
    coords: { lat: 16.5085, lon: 80.6334 },
    locationName: 'Buckinghampet / MG Road, Vijayawada, Andhra Pradesh',
  },

  // Key metro / city central postal hubs & GPOs
  '110001': {
    coords: { lat: 28.6328, lon: 77.2197 },
    locationName: 'Connaught Place / New Delhi GPO, Delhi',
  },
  '400001': {
    coords: { lat: 18.9401, lon: 72.8354 },
    locationName: 'Fort / Mumbai GPO, Maharashtra',
  },
  '600001': {
    coords: { lat: 13.0902, lon: 80.2870 },
    locationName: 'George Town / Chennai GPO, Tamil Nadu',
  },
  '700001': {
    coords: { lat: 22.5726, lon: 88.3512 },
    locationName: 'BBD Bagh / Kolkata GPO, West Bengal',
  },
  '500001': {
    coords: { lat: 17.3888, lon: 78.4738 },
    locationName: 'Abids / Hyderabad GPO, Telangana',
  },
  '221001': {
    coords: { lat: 25.3262, lon: 82.9863 },
    locationName: 'Varanasi Cantt / GPO, Uttar Pradesh',
  },
  '462001': {
    coords: { lat: 23.2599, lon: 77.4126 },
    locationName: 'Bhopal GPO / Old City, Madhya Pradesh',
  },
  '751001': {
    coords: { lat: 20.2961, lon: 85.8245 },
    locationName: 'Bhubaneswar GPO / Master Canteen, Odisha',
  },
  '682001': {
    coords: { lat: 9.9674, lon: 76.2425 },
    locationName: 'Fort Kochi / Kochi GPO, Kerala',
  },
};

/**
 * Tier 2: 3-digit sorting district centroid dictionary.
 * Maps 3-digit PIN prefixes to specific district centers across India.
 */
export const DISTRICT_PREFIX_COORDINATES: Record<string, { coords: Coordinates; locationName: string }> = {
  '110': { coords: { lat: 28.6139, lon: 77.2090 }, locationName: 'Delhi District, National Capital Region' },
  '121': { coords: { lat: 28.4089, lon: 77.3178 }, locationName: 'Faridabad District, Haryana' },
  '122': { coords: { lat: 28.4595, lon: 77.0266 }, locationName: 'Gurugram District, Haryana' },
  '131': { coords: { lat: 28.9931, lon: 77.0151 }, locationName: 'Sonipat District, Haryana' },
  '132': { coords: { lat: 29.6857, lon: 76.9905 }, locationName: 'Karnal District, Haryana' },
  '133': { coords: { lat: 30.3782, lon: 76.7767 }, locationName: 'Ambala District, Haryana' },
  '141': { coords: { lat: 30.9010, lon: 75.8573 }, locationName: 'Ludhiana District, Punjab' },
  '143': { coords: { lat: 31.6340, lon: 74.8723 }, locationName: 'Amritsar District, Punjab' },
  '144': { coords: { lat: 31.3260, lon: 75.5762 }, locationName: 'Jalandhar District, Punjab' },
  '151': { coords: { lat: 30.2110, lon: 74.9455 }, locationName: 'Bathinda District, Punjab' },
  '160': { coords: { lat: 30.7333, lon: 76.7794 }, locationName: 'Chandigarh Tri-City Area' },
  '171': { coords: { lat: 31.1048, lon: 77.1734 }, locationName: 'Shimla District, Himachal Pradesh' },
  '176': { coords: { lat: 32.2190, lon: 76.3234 }, locationName: 'Dharamshala / Kangra, Himachal Pradesh' },
  '180': { coords: { lat: 32.7266, lon: 74.8570 }, locationName: 'Jammu District, Jammu and Kashmir' },
  '190': { coords: { lat: 34.0837, lon: 74.7973 }, locationName: 'Srinagar District, Jammu and Kashmir' },
  '201': { coords: { lat: 28.6692, lon: 77.4538 }, locationName: 'Ghaziabad / Gautam Buddha Nagar, Uttar Pradesh' },
  '202': { coords: { lat: 27.8974, lon: 78.0880 }, locationName: 'Aligarh District, Uttar Pradesh' },
  '208': { coords: { lat: 26.4499, lon: 80.3319 }, locationName: 'Kanpur District, Uttar Pradesh' },
  '211': { coords: { lat: 25.4358, lon: 81.8463 }, locationName: 'Prayagraj (Allahabad) District, Uttar Pradesh' },
  '221': { coords: { lat: 25.3176, lon: 82.9739 }, locationName: 'Varanasi District, Uttar Pradesh' },
  '226': { coords: { lat: 26.8467, lon: 80.9462 }, locationName: 'Lucknow District, Uttar Pradesh' },
  '248': { coords: { lat: 30.3165, lon: 78.0322 }, locationName: 'Dehradun District, Uttarakhand' },
  '249': { coords: { lat: 29.9457, lon: 78.1642 }, locationName: 'Haridwar / Rishikesh, Uttarakhand' },
  '250': { coords: { lat: 28.9845, lon: 77.7064 }, locationName: 'Meerut District, Uttar Pradesh' },
  '273': { coords: { lat: 26.7606, lon: 83.3732 }, locationName: 'Gorakhpur District, Uttar Pradesh' },
  '281': { coords: { lat: 27.4924, lon: 77.6737 }, locationName: 'Mathura District, Uttar Pradesh' },
  '282': { coords: { lat: 27.1767, lon: 78.0081 }, locationName: 'Agra District, Uttar Pradesh' },
  '302': { coords: { lat: 26.9124, lon: 75.7873 }, locationName: 'Jaipur District, Rajasthan' },
  '305': { coords: { lat: 26.4499, lon: 74.6399 }, locationName: 'Ajmer District, Rajasthan' },
  '313': { coords: { lat: 24.5854, lon: 73.7125 }, locationName: 'Udaipur District, Rajasthan' },
  '324': { coords: { lat: 25.1761, lon: 75.8362 }, locationName: 'Kota District, Rajasthan' },
  '334': { coords: { lat: 28.0229, lon: 73.3119 }, locationName: 'Bikaner District, Rajasthan' },
  '342': { coords: { lat: 26.2389, lon: 73.0243 }, locationName: 'Jodhpur District, Rajasthan' },
  '360': { coords: { lat: 22.3039, lon: 70.8022 }, locationName: 'Rajkot District, Gujarat' },
  '370': { coords: { lat: 23.2420, lon: 69.6669 }, locationName: 'Bhuj / Kutch District, Gujarat' },
  '380': { coords: { lat: 23.0225, lon: 72.5714 }, locationName: 'Ahmedabad District, Gujarat' },
  '382': { coords: { lat: 23.2156, lon: 72.6369 }, locationName: 'Gandhinagar / Lothal Region, Gujarat' },
  '390': { coords: { lat: 22.3072, lon: 73.1812 }, locationName: 'Vadodara District, Gujarat' },
  '395': { coords: { lat: 21.1702, lon: 72.8311 }, locationName: 'Surat District, Gujarat' },
  '400': { coords: { lat: 18.9220, lon: 72.8347 }, locationName: 'Mumbai District, Maharashtra' },
  '403': { coords: { lat: 15.4909, lon: 73.8278 }, locationName: 'Goa State Region' },
  '411': { coords: { lat: 18.5204, lon: 73.8567 }, locationName: 'Pune District, Maharashtra' },
  '422': { coords: { lat: 19.9975, lon: 73.7898 }, locationName: 'Nashik District, Maharashtra' },
  '431': { coords: { lat: 19.8762, lon: 75.3433 }, locationName: 'Chhatrapati Sambhajinagar (Aurangabad), Maharashtra' },
  '440': { coords: { lat: 21.1458, lon: 79.0882 }, locationName: 'Nagpur District, Maharashtra' },
  '452': { coords: { lat: 22.7196, lon: 75.8577 }, locationName: 'Indore District, Madhya Pradesh' },
  '462': { coords: { lat: 23.2599, lon: 77.4126 }, locationName: 'Bhopal District, Madhya Pradesh' },
  '474': { coords: { lat: 26.2183, lon: 78.1828 }, locationName: 'Gwalior District, Madhya Pradesh' },
  '482': { coords: { lat: 23.1815, lon: 79.9864 }, locationName: 'Jabalpur District, Madhya Pradesh' },
  '492': { coords: { lat: 21.2514, lon: 81.6296 }, locationName: 'Raipur District, Chhattisgarh' },
  '500': { coords: { lat: 17.3850, lon: 78.4867 }, locationName: 'Hyderabad District, Telangana' },
  '517': { coords: { lat: 13.6288, lon: 79.4192 }, locationName: 'Tirupati District, Andhra Pradesh' },
  '520': { coords: { lat: 16.5062, lon: 80.6480 }, locationName: 'Vijayawada District, Andhra Pradesh' },
  '530': { coords: { lat: 17.6868, lon: 83.2185 }, locationName: 'Visakhapatnam District, Andhra Pradesh' },
  '560': { coords: { lat: 12.9716, lon: 77.5946 }, locationName: 'Bengaluru District, Karnataka' },
  '570': { coords: { lat: 12.2958, lon: 76.6394 }, locationName: 'Mysuru District, Karnataka' },
  '575': { coords: { lat: 12.9141, lon: 74.8560 }, locationName: 'Mangaluru / Coastal Karnataka' },
  '580': { coords: { lat: 15.3647, lon: 75.1240 }, locationName: 'Hubballi-Dharwad, Karnataka' },
  '600': { coords: { lat: 13.0827, lon: 80.2707 }, locationName: 'Chennai District, Tamil Nadu' },
  '625': { coords: { lat: 9.9252, lon: 78.1198 }, locationName: 'Madurai District, Tamil Nadu' },
  '641': { coords: { lat: 11.0168, lon: 76.9558 }, locationName: 'Coimbatore District, Tamil Nadu' },
  '673': { coords: { lat: 11.2588, lon: 75.7804 }, locationName: 'Kozhikode (Calicut) District, Kerala' },
  '682': { coords: { lat: 9.9312, lon: 76.2673 }, locationName: 'Kochi (Ernakulam) District, Kerala' },
  '695': { coords: { lat: 8.5241, lon: 76.9366 }, locationName: 'Thiruvananthapuram District, Kerala' },
  '700': { coords: { lat: 22.5726, lon: 88.3639 }, locationName: 'Kolkata District, West Bengal' },
  '711': { coords: { lat: 22.5958, lon: 88.2636 }, locationName: 'Howrah District, West Bengal' },
  '734': { coords: { lat: 26.7271, lon: 88.3953 }, locationName: 'Siliguri / Darjeeling Region, West Bengal' },
  '751': { coords: { lat: 20.2961, lon: 85.8245 }, locationName: 'Bhubaneswar District, Odisha' },
  '753': { coords: { lat: 20.4625, lon: 85.8830 }, locationName: 'Cuttack District, Odisha' },
  '781': { coords: { lat: 26.1445, lon: 91.7362 }, locationName: 'Guwahati / Kamrup District, Assam' },
  '793': { coords: { lat: 25.5788, lon: 91.8933 }, locationName: 'Shillong / East Khasi Hills, Meghalaya' },
  '795': { coords: { lat: 24.8170, lon: 93.9368 }, locationName: 'Imphal District, Manipur' },
  '796': { coords: { lat: 23.7307, lon: 92.7173 }, locationName: 'Aizawl District, Mizoram' },
  '797': { coords: { lat: 25.6751, lon: 94.1086 }, locationName: 'Kohima District, Nagaland' },
  '799': { coords: { lat: 23.8315, lon: 91.2868 }, locationName: 'Agartala District, Tripura' },
  '800': { coords: { lat: 25.5941, lon: 85.1376 }, locationName: 'Patna District, Bihar' },
  '823': { coords: { lat: 24.7914, lon: 85.0002 }, locationName: 'Gaya District, Bihar' },
  '834': { coords: { lat: 23.3441, lon: 85.3096 }, locationName: 'Ranchi District, Jharkhand' },
};

/**
 * Tier 3: 2-digit postal circle state/region centroids.
 * Fallback for arbitrary rural / unindexed PIN codes across all Indian postal circles.
 */
export const POSTAL_CIRCLE_COORDINATES: Record<string, { coords: Coordinates; locationName: string }> = {
  '11': { coords: { lat: 28.6139, lon: 77.2090 }, locationName: 'Delhi Postal Circle' },
  '12': { coords: { lat: 28.4595, lon: 77.0266 }, locationName: 'Haryana (South Circle)' },
  '13': { coords: { lat: 30.3782, lon: 76.7767 }, locationName: 'Haryana (North Circle)' },
  '14': { coords: { lat: 30.9010, lon: 75.8573 }, locationName: 'Punjab (Central Circle)' },
  '15': { coords: { lat: 30.2110, lon: 74.9455 }, locationName: 'Punjab (South Circle)' },
  '16': { coords: { lat: 30.7333, lon: 76.7794 }, locationName: 'Chandigarh Postal Circle' },
  '17': { coords: { lat: 31.1048, lon: 77.1734 }, locationName: 'Himachal Pradesh Postal Circle' },
  '18': { coords: { lat: 32.7266, lon: 74.8570 }, locationName: 'Jammu & Kashmir (Jammu Circle)' },
  '19': { coords: { lat: 34.0837, lon: 74.7973 }, locationName: 'Jammu & Kashmir (Kashmir Circle)' },
  '20': { coords: { lat: 27.8974, lon: 78.0880 }, locationName: 'Uttar Pradesh (Western Circle)' },
  '21': { coords: { lat: 26.4499, lon: 80.3319 }, locationName: 'Uttar Pradesh (Central Circle)' },
  '22': { coords: { lat: 25.3176, lon: 82.9739 }, locationName: 'Uttar Pradesh (Eastern Circle)' },
  '23': { coords: { lat: 25.1337, lon: 82.5644 }, locationName: 'Uttar Pradesh (South-East Circle)' },
  '24': { coords: { lat: 30.3165, lon: 78.0322 }, locationName: 'Uttarakhand Postal Circle' },
  '25': { coords: { lat: 28.9845, lon: 77.7064 }, locationName: 'Uttar Pradesh (Meerut Circle)' },
  '26': { coords: { lat: 28.3670, lon: 79.4304 }, locationName: 'Uttar Pradesh (Bareilly Circle)' },
  '27': { coords: { lat: 26.7606, lon: 83.3732 }, locationName: 'Uttar Pradesh (Gorakhpur Circle)' },
  '28': { coords: { lat: 27.1767, lon: 78.0081 }, locationName: 'Uttar Pradesh (Agra Circle)' },
  '30': { coords: { lat: 26.9124, lon: 75.7873 }, locationName: 'Rajasthan (Jaipur / Central Circle)' },
  '31': { coords: { lat: 24.5854, lon: 73.7125 }, locationName: 'Rajasthan (Udaipur / Mewar Circle)' },
  '32': { coords: { lat: 25.1761, lon: 75.8362 }, locationName: 'Rajasthan (Kota / Hadoti Circle)' },
  '33': { coords: { lat: 28.0229, lon: 73.3119 }, locationName: 'Rajasthan (Bikaner / North Circle)' },
  '34': { coords: { lat: 26.2389, lon: 73.0243 }, locationName: 'Rajasthan (Jodhpur / Marwar Circle)' },
  '36': { coords: { lat: 22.3039, lon: 70.8022 }, locationName: 'Gujarat (Saurashtra Circle)' },
  '37': { coords: { lat: 23.2420, lon: 69.6669 }, locationName: 'Gujarat (Kutch Circle)' },
  '38': { coords: { lat: 23.0225, lon: 72.5714 }, locationName: 'Gujarat (Ahmedabad Circle)' },
  '39': { coords: { lat: 21.1702, lon: 72.8311 }, locationName: 'Gujarat (South Circle)' },
  '40': { coords: { lat: 18.9220, lon: 72.8347 }, locationName: 'Maharashtra (Mumbai / Konkan Circle)' },
  '41': { coords: { lat: 18.5204, lon: 73.8567 }, locationName: 'Maharashtra (Pune / Western Circle)' },
  '42': { coords: { lat: 19.9975, lon: 73.7898 }, locationName: 'Maharashtra (Nashik Circle)' },
  '43': { coords: { lat: 19.8762, lon: 75.3433 }, locationName: 'Maharashtra (Marathwada Circle)' },
  '44': { coords: { lat: 21.1458, lon: 79.0882 }, locationName: 'Maharashtra (Vidarbha / Nagpur Circle)' },
  '45': { coords: { lat: 22.7196, lon: 75.8577 }, locationName: 'Madhya Pradesh (Indore Circle)' },
  '46': { coords: { lat: 23.2599, lon: 77.4126 }, locationName: 'Madhya Pradesh (Bhopal Circle)' },
  '47': { coords: { lat: 26.2183, lon: 78.1828 }, locationName: 'Madhya Pradesh (Gwalior Circle)' },
  '48': { coords: { lat: 23.1815, lon: 79.9864 }, locationName: 'Madhya Pradesh (Jabalpur Circle)' },
  '49': { coords: { lat: 21.2514, lon: 81.6296 }, locationName: 'Chhattisgarh Postal Circle' },
  '50': { coords: { lat: 17.3850, lon: 78.4867 }, locationName: 'Telangana Postal Circle' },
  '51': { coords: { lat: 13.6288, lon: 79.4192 }, locationName: 'Andhra Pradesh (Rayalaseema Circle)' },
  '52': { coords: { lat: 16.5062, lon: 80.6480 }, locationName: 'Andhra Pradesh (Coastal Circle)' },
  '53': { coords: { lat: 17.6868, lon: 83.2185 }, locationName: 'Andhra Pradesh (North Coastal Circle)' },
  '56': { coords: { lat: 12.9716, lon: 77.5946 }, locationName: 'Karnataka (Bengaluru Circle)' },
  '57': { coords: { lat: 12.9141, lon: 74.8560 }, locationName: 'Karnataka (Coastal / Mangaluru Circle)' },
  '58': { coords: { lat: 15.8497, lon: 74.4977 }, locationName: 'Karnataka (North Circle)' },
  '59': { coords: { lat: 12.2958, lon: 76.6394 }, locationName: 'Karnataka (Mysuru / South Circle)' },
  '60': { coords: { lat: 13.0827, lon: 80.2707 }, locationName: 'Tamil Nadu (Chennai Circle)' },
  '61': { coords: { lat: 10.7870, lon: 79.1378 }, locationName: 'Tamil Nadu (Central Circle)' },
  '62': { coords: { lat: 9.9252, lon: 78.1198 }, locationName: 'Tamil Nadu (Madurai / South Circle)' },
  '63': { coords: { lat: 11.6643, lon: 78.1460 }, locationName: 'Tamil Nadu (Salem Circle)' },
  '64': { coords: { lat: 11.0168, lon: 76.9558 }, locationName: 'Tamil Nadu (Coimbatore Circle)' },
  '67': { coords: { lat: 11.2588, lon: 75.7804 }, locationName: 'Kerala (Malabar / North Circle)' },
  '68': { coords: { lat: 9.9312, lon: 76.2673 }, locationName: 'Kerala (Kochi / Central Circle)' },
  '69': { coords: { lat: 8.5241, lon: 76.9366 }, locationName: 'Kerala (Thiruvananthapuram / South Circle)' },
  '70': { coords: { lat: 22.5726, lon: 88.3639 }, locationName: 'West Bengal (Kolkata Circle)' },
  '71': { coords: { lat: 22.5958, lon: 88.2636 }, locationName: 'West Bengal (Howrah Circle)' },
  '72': { coords: { lat: 22.4257, lon: 87.3199 }, locationName: 'West Bengal (South Circle)' },
  '73': { coords: { lat: 26.7271, lon: 88.3953 }, locationName: 'West Bengal (North / Sikkim Circle)' },
  '74': { coords: { lat: 23.4733, lon: 88.5565 }, locationName: 'West Bengal (Central Circle)' },
  '75': { coords: { lat: 20.2961, lon: 85.8245 }, locationName: 'Odisha (Bhubaneswar / Coastal Circle)' },
  '76': { coords: { lat: 19.3149, lon: 84.7941 }, locationName: 'Odisha (South Circle)' },
  '77': { coords: { lat: 22.2604, lon: 84.8536 }, locationName: 'Odisha (West / Sambalpur Circle)' },
  '78': { coords: { lat: 26.1445, lon: 91.7362 }, locationName: 'Assam Postal Circle' },
  '79': { coords: { lat: 25.5788, lon: 91.8933 }, locationName: 'North East Postal Circle (Shillong)' },
  '80': { coords: { lat: 25.5941, lon: 85.1376 }, locationName: 'Bihar (Patna / Central Circle)' },
  '81': { coords: { lat: 25.2425, lon: 86.9842 }, locationName: 'Bihar (Bhagalpur / East Circle)' },
  '82': { coords: { lat: 24.7914, lon: 85.0002 }, locationName: 'Bihar (Gaya / South Circle)' },
  '83': { coords: { lat: 23.3441, lon: 85.3096 }, locationName: 'Jharkhand Postal Circle' },
  '84': { coords: { lat: 26.1209, lon: 85.3647 }, locationName: 'Bihar (Muzaffarpur / North Circle)' },
  '85': { coords: { lat: 25.7771, lon: 87.4753 }, locationName: 'Bihar (Purnia / Kosi Circle)' },
};

/**
 * Resolves an Indian 6-digit PIN code to geographic coordinates and location metadata.
 * Implements a 3-tier resolution engine:
 * 1. Tier 1: Exact 6-digit PIN registry (all museums + metro hubs)
 * 2. Tier 2: 3-digit sorting district centroid
 * 3. Tier 3: 2-digit postal circle fallback
 *
 * Returns null if pincode is invalid (non-string, length != 6, leading zero, alpha/special chars).
 */
export function resolvePinToCoordinates(
  pincode: string
): { coords: Coordinates; locationName: string } | null {
  if (typeof pincode !== 'string') {
    return null;
  }

  const cleanPin = pincode.trim();

  // Validate strict 6-digit Indian PIN format: first digit 1-9 followed by 5 digits
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  // Tier 1: Exact 6-Digit PIN lookup
  const exact = EXACT_PIN_COORDINATES[cleanPin];
  if (exact) {
    return {
      coords: { ...exact.coords },
      locationName: exact.locationName,
    };
  }

  // Tier 2: 3-Digit Sorting District Prefix lookup
  const prefix3 = cleanPin.substring(0, 3);
  const district = DISTRICT_PREFIX_COORDINATES[prefix3];
  if (district) {
    return {
      coords: { ...district.coords },
      locationName: district.locationName,
    };
  }

  // Tier 3: 2-Digit Postal Circle Prefix lookup
  const prefix2 = cleanPin.substring(0, 2);
  const circle = POSTAL_CIRCLE_COORDINATES[prefix2];
  if (circle) {
    return {
      coords: { ...circle.coords },
      locationName: circle.locationName,
    };
  }

  // Zone fallback (first digit) if 2-digit prefix is unmapped
  const zoneFirstDigit = cleanPin[0];
  const matchingCircleKey = Object.keys(POSTAL_CIRCLE_COORDINATES).find((k) =>
    k.startsWith(zoneFirstDigit)
  );
  if (matchingCircleKey) {
    const fallbackCircle = POSTAL_CIRCLE_COORDINATES[matchingCircleKey];
    return {
      coords: { ...fallbackCircle.coords },
      locationName: fallbackCircle.locationName,
    };
  }

  return null;
}

/**
 * Calculates geodesic Haversine distance from given coordinates to all museums in the collection,
 * returning the closest authentic museum and distance in kilometers (rounded to 1 decimal place).
 */
export function findNearestMuseum(
  userCoords: Coordinates,
  allMuseums: Museum[]
): { nearestMuseum: Museum; distanceKm: number } {
  const museums = allMuseums && allMuseums.length > 0 ? allMuseums : getAllMuseums();

  if (!museums || museums.length === 0) {
    throw new Error('findNearestMuseum: No museums available for distance computation');
  }

  let nearestMuseum = museums[0];
  let minDistance = Infinity;

  for (const museum of museums) {
    const distance = calculateHaversineDistance(
      userCoords.lat,
      userCoords.lon,
      museum.coordinates.lat,
      museum.coordinates.lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestMuseum = museum;
    }
  }

  return {
    nearestMuseum,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}
