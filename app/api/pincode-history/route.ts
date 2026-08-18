/**
 * API Route: /api/pincode-history
 * 
 * Milestone 1 (M1) - Backend Historical Brief API
 * 
 * Features:
 * 1. Strict regex validation for 6-digit Indian PIN codes (/^[1-9][0-9]{5}$/).
 * 2. Multi-tiered geographic & administrative hierarchy resolution (exact, district, postal circle).
 * 3. OpenRouter AI synthesis (openrouter/free model) grounded in authentic cultural & museum data.
 * 4. High-fidelity deterministic offline synthesis fallback for offline/rate-limit resilience.
 * 5. High-speed in-memory LRU caching (<10ms repeat responses, satisfying SLA <=20ms).
 */

import { NextResponse } from 'next/server';
import {
  EXACT_PIN_COORDINATES,
  DISTRICT_PREFIX_COORDINATES,
  POSTAL_CIRCLE_COORDINATES,
  resolvePinToCoordinates,
} from '@/lib/pincodes';
import { POSTAL_CIRCLE_MAP } from '@/lib/roots';
import { callOpenRouter, OpenRouterMessage } from '@/lib/openrouter';
import museumsData from '@/data/indian-museums.json';

// ==========================================
// 1. Types & Interfaces
// ==========================================

export interface HistoricalBrief {
  ancient_foundations: string;
  living_culture_crafts: string;
  famous_lore_landmarks: string;
  summary_one_liner: string;
}

export interface PincodeHistoryResponse {
  status: 'success';
  pincode: string;
  location_name: string;
  state: string;
  district: string;
  postal_circle: string;
  historical_brief: HistoricalBrief;
  key_dynasties: string[];
  traditional_crafts: string[];
  notable_monuments: string[];
  cached: boolean;
  source: 'openrouter_ai' | 'deterministic_offline_synthesis';
}

export interface PincodeHistoryErrorResponse {
  status: 'error';
  error: string;
  message: string;
}

// ==========================================
// 2. High-Speed In-Memory LRU Cache (<10ms SLA)
// ==========================================

interface CacheEntry {
  data: Omit<PincodeHistoryResponse, 'cached'>;
  expiresAt: number;
}

class PincodeHistoryLRUCache {
  private capacity: number;
  private defaultTtlMs: number;
  private cache: Map<string, CacheEntry>;

  constructor(capacity = 5000, defaultTtlMs = 24 * 60 * 60 * 1000) {
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
  }

  get(key: string): Omit<PincodeHistoryResponse, 'cached'> | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    // Refresh LRU access order
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: Omit<PincodeHistoryResponse, 'cached'>, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton cache instance across API invocations
const globalHistoryCache = new PincodeHistoryLRUCache(5000, 24 * 60 * 60 * 1000);

// ==========================================
// 3. Cultural Encyclopedia & Postal Circle Metadata
// ==========================================

interface PostalCircleDetails {
  circleName: string;
  state: string;
  defaultDistrict: string;
  ancientFoundations: string;
  livingCultureCrafts: string;
  famousLoreLandmarks: string;
  summaryOneLiner: string;
  dynasties: string[];
  crafts: string[];
  monuments: string[];
}

const REGIONAL_CULTURAL_DIRECTORY: Record<string, PostalCircleDetails> = {
  '11': {
    circleName: 'Delhi Postal Circle',
    state: 'Delhi',
    defaultDistrict: 'Central Delhi',
    ancientFoundations:
      'Delhi stands upon the ancient civilizational crossroads of Indraprastha, mentioned in the Mahabharata, and has served as the imperial seat for Tomara Rajputs, Chauhans, Delhi Sultanates, and the Mughal Empire for over a millennium.',
    livingCultureCrafts:
      'The walled lanes of Shahjahanabad preserve living mastercrafts including Zari-Zardozi metallic embroidery, Kundan Meenakari enamel jewelry, parchment lamp crafting, and delicate ivory-inlay heritage.',
    famousLoreLandmarks:
      'Home to iconic UNESCO World Heritage treasures including the monumental Red Fort, Humayun’s Tomb, Qutub Minar, Chandni Chowk, and the National Museum of India housing 5,000 years of subcontinent art.',
    summaryOneLiner:
      'The historic heart of northern India, where ancient epics and royal courtly splendour meet living artisanal mastery.',
    dynasties: ['Tomaras', 'Chauhans', 'Delhi Sultanate', 'Mughal Empire', 'Sur Empire'],
    crafts: ['Zari & Zardozi Embroidery', 'Kundan Meenakari Jewelry', 'Bone & Wood Inlay', 'Calligraphic Parchment'],
    monuments: ['Red Fort', 'Humayun’s Tomb', 'Qutub Minar', 'National Museum', 'Purana Qila'],
  },
  '12': {
    circleName: 'Haryana (South Circle)',
    state: 'Haryana',
    defaultDistrict: 'Gurugram / Faridabad',
    ancientFoundations:
      'Southern Haryana encompasses ancient Saraswati riverbed horizons and Rakhigarhi-era urban settlements, flourishing during the Vedic Kuru kingdom and early medieval Rajput epochs.',
    livingCultureCrafts:
      'Traditional artisans excel in vibrant Phulkari geometric embroidery, Surajkund terracotta pottery, hand-beaten brassware, and woven dhurries.',
    famousLoreLandmarks:
      'Anchored by the 10th-century sun reservoir of Surajkund, Sheetla Mata shrine, Badkhal Lake, and proximity to prehistoric Aravalli ridge rock shelters.',
    summaryOneLiner:
      'An ancient Vedic heartland blending Harappan antiquity with vibrant rustic textile and pottery traditions.',
    dynasties: ['Kuru Kingdom', 'Tomaras', 'Harshavardhana Dynasty', 'Mughals'],
    crafts: ['Phulkari Embroidery', 'Terracotta Pottery', 'Brass Metallurgy', 'Panipat Handloom Weaving'],
    monuments: ['Surajkund Sun Reservoir', 'Rakhigarhi Archaeological Site', 'Sheetla Mata Temple', 'Badkhal Heritage Enclave'],
  },
  '13': {
    circleName: 'Haryana (North Circle)',
    state: 'Haryana',
    defaultDistrict: 'Ambala / Kurukshetra',
    ancientFoundations:
      'Northern Haryana is the sacred cradle of the Mahabharata and the Sapta Sindhu plains, where Emperor Harshavardhana established Thanesar as his imperial capital.',
    livingCultureCrafts:
      'Celebrated for traditional wood carving, brass icon casting, Moonj reed basketry, and handloom durries.',
    famousLoreLandmarks:
      'Encompasses the sacred Brahma Sarovar, Jyotisar where the Gita was discourse-born, Thanesar Sheikh Chilli’s Tomb, and Ambala Cantt architectural heritage.',
    summaryOneLiner:
      'The sacred philosophical cradle of northern India, rooted in epic lore and time-honored craft guilds.',
    dynasties: ['Vardhana Dynasty (Harshavardhana)', 'Kuru Kingdom', 'Maratha Confederacy', 'Sikh Misls'],
    crafts: ['Wood Inlay Craft', 'Brass Idol Casting', 'Moonj Basketry', 'Handloom Rugs'],
    monuments: ['Brahma Sarovar', 'Jyotisar Tirtha', 'Sheikh Chilli Tomb Thanesar', 'Kurukshetra Panorama Complex'],
  },
  '14': {
    circleName: 'Punjab (Central Circle)',
    state: 'Punjab',
    defaultDistrict: 'Amritsar / Ludhiana',
    ancientFoundations:
      'Central Punjab is the fertile core of the Sapta Sindhu, shaped by the Sikh Gurus, the legendary Sikh Empire under Maharaja Ranjit Singh, and the ancient trade artery of the Grand Trunk Road.',
    livingCultureCrafts:
      'World-famed for exquisite silk-on-khaddar Phulkari and Bagh embroidery, handcrafted Punjabi Juttis, Ludhiana jacquard textiles, and hand-beaten copper-brass utensils of Jandiala Guru (UNESCO Intangible Cultural Heritage).',
    famousLoreLandmarks:
      'Home to Sri Harmandir Sahib (The Golden Temple), the sacred Jallianwala Bagh, Gobindgarh Fort, Ram Bagh Palace, and the Partition Museum.',
    summaryOneLiner:
      'A land of supreme spiritual devotion, heroic dynastic heritage, and vibrant folk textile artistry.',
    dynasties: ['Sikh Empire', 'Kushan Empire', 'Ghaznavid / Delhi Sultanate', 'Mughals'],
    crafts: ['Phulkari & Bagh Embroidery', 'Jandiala Guru Brasscraft (UNESCO)', 'Punjabi Jutti', 'Wood & Ivory Inlay'],
    monuments: ['Sri Harmandir Sahib (Golden Temple)', 'Gobindgarh Fort', 'Jallianwala Bagh', 'Partition Museum'],
  },
  '15': {
    circleName: 'Punjab (South Circle)',
    state: 'Punjab',
    defaultDistrict: 'Bathinda / Patiala',
    ancientFoundations:
      'Southern Punjab holds ancient fortifications dating to the 6th century CE, including the impregnable Bathinda Fort where Empress Razia Sultana was held, and the royal princely state of Patiala.',
    livingCultureCrafts:
      'Renowned for Patiala Shahi turbans, Parandi hair tassels, royal Zari work, and intricate leather Mojaris.',
    famousLoreLandmarks:
      'Features Qila Mubarak in Bathinda (India’s oldest surviving fort), Sheesh Mahal in Patiala, and the sprawling Qila Androon palace complex.',
    summaryOneLiner:
      'A majestic realm of princely forts, royal patronage, and colorful Punjabi folk embellishments.',
    dynasties: ['Phulkian Dynasty', 'Bhati Rajputs', 'Sikh Misls', 'Mughals'],
    crafts: ['Patiala Parandi', 'Royal Zari Embroidery', 'Leather Mojari Footwear', 'Brass Utensil Craft'],
    monuments: ['Qila Mubarak Bathinda', 'Sheesh Mahal Patiala', 'Qila Androon', 'Bahadurgarh Fort'],
  },
  '16': {
    circleName: 'Chandigarh Postal Circle',
    state: 'Chandigarh',
    defaultDistrict: 'Chandigarh Tri-City',
    ancientFoundations:
      'Chandigarh bridges ancient Harappan settlements discovered along the Shivalik foothills with 20th-century modernist utopian urban architecture planned by Le Corbusier.',
    livingCultureCrafts:
      'Modern sculpture, Rock Garden mosaic artistry created from industrial ceramics, Punjabi Phulkari, and terracotta garden craft.',
    famousLoreLandmarks:
      'The UNESCO-listed Capitol Complex, Nek Chand’s fantasy Rock Garden, Sukhna Lake, and Government Museum and Art Gallery housing master Gandharan Buddhist sculptures.',
    summaryOneLiner:
      'A visionary synthesis of ancient Shivalik archaeological roots and world-renowned modernist architecture.',
    dynasties: ['Indus Valley Civilizations', 'Sikh Confederacies', 'Modern Republic'],
    crafts: ['Mosaic Sculpture Art', 'Gandharan Stone Replication', 'Phulkari Weaving', 'Terracotta Garden Ware'],
    monuments: ['Capitol Complex (UNESCO)', 'Nek Chand Rock Garden', 'Government Museum & Art Gallery', 'Sukhna Lake'],
  },
  '17': {
    circleName: 'Himachal Pradesh Postal Circle',
    state: 'Himachal Pradesh',
    defaultDistrict: 'Shimla / Kangra / Kullu',
    ancientFoundations:
      'The Devbhumi of Himachal encompasses ancient Trigarta kingdom roots, ancient cedar-wood pagoda shrines, and medieval royal hill states nurtured under Katoch and Kullu rulers.',
    livingCultureCrafts:
      'Celebrated for lyrical Kangra and Basohli Pahari miniature paintings, geometric Kullu and Kinnauri shawls, Chamba Rumal double-sided silk embroidery (GI tagged), and wood-slate architectural craftsmanship.',
    famousLoreLandmarks:
      'Home to the historic Kangra Fort, 8th-century Baijnath Shiva Temple, Hadimba Pagoda Temple in Manali, Viceregal Lodge in Shimla, and Tabo Monastery.',
    summaryOneLiner:
      'A sacred Himalayan kingdom of ancient cedar shrines, delicate Pahari miniature art, and world-famed woolen weaves.',
    dynasties: ['Katoch Dynasty of Kangra', 'Kullu Rajas', 'Chamba Dynasty', 'Gorkha Empire'],
    crafts: ['Kangra Pahari Miniature Painting', 'Chamba Rumal (GI)', 'Kullu & Kinnauri Shawls', 'Pahari Wood Carving'],
    monuments: ['Kangra Fort', 'Baijnath Temple', 'Hadimba Temple Manali', 'Viceregal Lodge Shimla', 'Himachal State Museum'],
  },
  '18': {
    circleName: 'Jammu & Kashmir (Jammu Circle)',
    state: 'Jammu and Kashmir',
    defaultDistrict: 'Jammu / Udhampur',
    ancientFoundations:
      'The City of Temples along the Tawi river was governed by the royal Dogra dynasty and ancient Dev rulers, acting as the gateway between Punjab plains and the Pir Panjal mountains.',
    livingCultureCrafts:
      'World-famous for vibrant Basohli miniature paintings, fine Pashmina spinning, walnut wood relief carvings, and Dogra calico block prints.',
    famousLoreLandmarks:
      'Anchored by the grand Mubarak Mandi Palace Complex, Bahu Fort with its sacred Kali shrine, Vaishno Devi shrine in Trikuta Hills, and the Dogra Art Museum.',
    summaryOneLiner:
      'A regal frontier of Dogra palace architecture, sacred mountain shrines, and brilliant Basohli miniature arts.',
    dynasties: ['Dogra Dynasty', 'Dev Dynasty', 'Kushan Empire', 'Mughal Empire'],
    crafts: ['Basohli Miniature Painting', 'Walnut Wood Carving', 'Pashmina Spinning', 'Calico Hand-Block Printing'],
    monuments: ['Mubarak Mandi Palace Complex', 'Bahu Fort', 'Dogra Art Museum', 'Raghunath Temple Complex'],
  },
  '19': {
    circleName: 'Jammu & Kashmir (Kashmir & Ladakh Circle)',
    state: 'Jammu and Kashmir',
    defaultDistrict: 'Srinagar / Leh',
    ancientFoundations:
      'The legendary valley of Kashmir and the high trans-Himalayan plateau of Ladakh represent centuries of Buddhist monastic learning under the Namgyal dynasty and exquisite Persian-Kashmiri courtly refinement.',
    livingCultureCrafts:
      'Mastery of hand-knotted silk carpets, delicate Kani and Pashmina shawls, Papier-mâché lacquerware, Khatamband ceiling woodwork, and copper repoussé Samovars.',
    famousLoreLandmarks:
      'Mughal Terraced Gardens (Shalimar, Nishat), Dal Lake, Shankaracharya Temple, Martand Sun Temple ruins, Hemis Gompa, and Leh Royal Palace.',
    summaryOneLiner:
      'A breathtaking valley of poetic gardens, Silk Route monastic heritage, and peerless Persian-Himalayan crafts.',
    dynasties: ['Karkota Dynasty', 'Utpala Dynasty', 'Shah Mir Dynasty', 'Namgyal Dynasty of Ladakh'],
    crafts: ['Pashmina & Kani Shawl Weaving', 'Kashmiri Papier-Mâché', 'Walnut Wood Carving', 'Silk Carpet Weaving'],
    monuments: ['Shalimar Bagh', 'Martand Sun Temple', 'Shankaracharya Temple', 'Leh Palace', 'Hemis Monastery'],
  },
  '20': {
    circleName: 'Uttar Pradesh (Western Circle)',
    state: 'Uttar Pradesh',
    defaultDistrict: 'Aligarh / Moradabad',
    ancientFoundations:
      'Western Uttar Pradesh spans the fertile Ganga-Yamuna doab, where ancient Panchala Mahajanapada kingdoms flourished and later transformed into major artisanal guilds under Mughal and Rohilla rulers.',
    livingCultureCrafts:
      'Known globally as the Brass City (Moradabad) for electroplated brass icons, Aligarh lock metalcraft, Khurja studio pottery, and Sambhal bone inlay.',
    famousLoreLandmarks:
      'Aligarh Fort, Moradabad Jama Masjid, Khurja Ceramic Pottery centers, and ancient Harappan doab archaeological sites.',
    summaryOneLiner:
      'A powerhouse of traditional north Indian metallurgy, master ceramics, and historic Doab trade craft.',
    dynasties: ['Panchala Kingdom', 'Gupta Empire', 'Rohillas', 'Mughals'],
    crafts: ['Moradabad Brass Engraving', 'Khurja Ceramic Pottery', 'Aligarh Metal Metallurgy', 'Bone Artifact Inlay'],
    monuments: ['Aligarh Fort', 'Moradabad Jama Masjid', 'Khurja Ceramic Enclave', 'Hastinapur Archaeological Site'],
  },
  '21': {
    circleName: 'Uttar Pradesh (Central Circle)',
    state: 'Uttar Pradesh',
    defaultDistrict: 'Prayagraj / Kanpur',
    ancientFoundations:
      'Centuries of civilizational convergence at the sacred Triveni Sangam in Prayagraj, where Emperor Ashoka erected his famous pillar and the Guptas presided over classical Sanskrit literature and arts.',
    livingCultureCrafts:
      'Traditional Moonj wild grass basketry, fine Zardozi gold-thread embroidery, Chikan needlecraft, and Kanpur saddlery leatherwork.',
    famousLoreLandmarks:
      'The sacred Triveni Sangam, Allahabad Fort with the Ashoka Pillar, Anand Bhavan, Bharhut archaeological galleries, and Bithoor sacred riverfront.',
    summaryOneLiner:
      'The sacred confluence of Indias holy rivers, classical Gupta literature, and timeless textile heritage.',
    dynasties: ['Mauryan Empire', 'Gupta Empire', 'Harshavardhana Dynasty', 'Mughal Empire'],
    crafts: ['Moonj Grass Weaving', 'Zardozi Embroidery', 'Leather Saddlery', 'Stone Masonry'],
    monuments: ['Triveni Sangam', 'Allahabad Fort & Ashoka Pillar', 'Anand Bhavan', 'Allahabad Museum'],
  },
  '22': {
    circleName: 'Uttar Pradesh (Eastern Circle)',
    state: 'Uttar Pradesh',
    defaultDistrict: 'Varanasi / Sarnath',
    ancientFoundations:
      'Kashi (Varanasi) is recognized as one of the oldest continuously inhabited cities on Earth, where Lord Buddha delivered his first sermon at Sarnath, establishing the Wheel of Dharma in the 6th century BCE.',
    livingCultureCrafts:
      'World-famous Banarasi silk brocades and Kinkhab weaving, Gulabi Meenakari pink enamel jewelry, wooden lacquer toys, and Sarnath stone-carving traditions.',
    famousLoreLandmarks:
      'Kashi Vishwanath Temple, the 84 sacred Ghats along the holy Ganges, Sarnath Dhamek Stupa, and the Sarnath Archaeological Museum housing the Ashoka Lion Capital (National Emblem of India).',
    summaryOneLiner:
      'The spiritual, philosophical, and sculptural beacon of Indian civilization and sacred Buddhist enlightenment.',
    dynasties: ['Kashi Mahajanapada', 'Mauryan Empire', 'Gupta Empire', 'Gahadavala Dynasty'],
    crafts: ['Banarasi Silk Brocades (GI)', 'Gulabi Meenakari Enamel', 'Varanasi Wooden Lacquerware', 'Stone Sculpting'],
    monuments: ['Dhamek Stupa Sarnath', 'Kashi Vishwanath Temple', 'Sarnath Archaeological Museum', 'Dashashwamedh Ghat'],
  },
  '23': {
    circleName: 'Uttar Pradesh (South-East Circle)',
    state: 'Uttar Pradesh',
    defaultDistrict: 'Mirzapur / Sonbhadra',
    ancientFoundations:
      'South-Eastern UP holds ancient sandstone quarries of Chunar that furnished stone for Ashokan pillars and Mauryan monuments across ancient India.',
    livingCultureCrafts:
      'Celebrated for GI-tagged Mirzapur handmade wool carpets, brass repoussé vessels, and Chunar glazed pottery.',
    famousLoreLandmarks:
      'Chunar Fort overlooking the Ganges, Vindhyavasini Devi temple, prehistoric cave paintings of Sonbhadra, and Vijaygarh Fort.',
    summaryOneLiner:
      'The ancient quarry of imperial Mauryan stone masters and legendary handmade carpet weavers.',
    dynasties: ['Mauryan Empire', 'Guptas', 'Chandela Dynasty', 'Mughals'],
    crafts: ['Mirzapur Handmade Carpets (GI)', 'Chunar Glazed Pottery', 'Brass Utensil Forging', 'Sandstone Carving'],
    monuments: ['Chunar Fort', 'Vindhyavasini Temple', 'Sonbhadra Prehistoric Cave Shelters', 'Vijaygarh Fort'],
  },
  '24': {
    circleName: 'Uttarakhand Postal Circle',
    state: 'Uttarakhand',
    defaultDistrict: 'Dehradun / Haridwar',
    ancientFoundations:
      'The sacred Himalayan state of Uttarakhand encompasses the ancient Katyuri and Garhwal kingdoms, the sacred Char Dham pilgrimage trails, and pristine forest monastic hermitages.',
    livingCultureCrafts:
      'Aipan ritual geometrical floor art, Ringal hill bamboo weaving, Pahari temple wood carvings, and Garhwali copper/brassware.',
    famousLoreLandmarks:
      'Har Ki Pauri in Haridwar, Badrinath and Kedarnath shrines, Jageshwar rock temple complex, and the Forest Research Institute (FRI) in Dehradun.',
    summaryOneLiner:
      'The sacred Himalayan adobe of gods, ancient Vedic riverfronts, and intricate Aipan folk arts.',
    dynasties: ['Katyuri Dynasty', 'Garhwal Kingdom (Panwar)', 'Chand Dynasty of Kumaon'],
    crafts: ['Aipan Ritual Art (GI)', 'Ringal Bamboo Weaving', 'Pahari Architectural Woodcraft', 'Handmade Woolens'],
    monuments: ['Har Ki Pauri Haridwar', 'Kedarnath Temple', 'Jageshwar Temple Complex', 'Forest Research Institute Museum'],
  },
  '25': {
    circleName: 'Uttar Pradesh (Meerut Circle)',
    state: 'Uttar Pradesh',
    defaultDistrict: 'Meerut / Mathura',
    ancientFoundations:
      'Mathura and the Braj region formed the capital of the Surasena Mahajanapada and the epic center of the Kushan Empire, giving birth to the iconic Mathura School of Art in spotted red sandstone.',
    livingCultureCrafts:
      'Spotted red sandstone divine sculptures, Sanjhi paper stenciling, Braj temple brass bells, and Meerut handcrafted musical instruments.',
    famousLoreLandmarks:
      'Krishna Janmabhoomi Complex, Mathura Government Museum, Kusum Sarovar, Govardhan Hill, and ancient Hastinapur.',
    summaryOneLiner:
      'The epic heart of Krishna lore and the legendary Kushan-Gupta red sandstone sculptural renaissance.',
    dynasties: ['Surasenas', 'Kushan Empire', 'Gupta Empire', 'Gurjara-Pratiharas'],
    crafts: ['Mathura Red Sandstone Carving', 'Sanjhi Paper Stencil Art', 'Brass Deity Casting', 'Musical Instruments'],
    monuments: ['Government Museum Mathura', 'Krishna Janmasthan', 'Kusum Sarovar', 'Hastinapur Archaeological Site'],
  },
  '28': {
    circleName: 'Uttar Pradesh (Agra Circle)',
    state: 'Uttar Pradesh',
    defaultDistrict: 'Agra / Firozabad',
    ancientFoundations:
      'Agra served as the imperial capital of the Mughal Empire at its architectural zenith under Emperors Akbar, Jahangir, and Shah Jahan.',
    livingCultureCrafts:
      'Pietra Dura (Parchin Kari) marble semi-precious stone inlay, Zari Zardozi velvet embroidery, and Firozabad mouth-blown glassware.',
    famousLoreLandmarks:
      'The Taj Mahal (UNESCO World Wonder), Agra Fort, Fatehpur Sikri, Itmad-ud-Daulah, and Sikandra Akbar’s Tomb.',
    summaryOneLiner:
      'An imperial realm of sublime white marble architecture, royal Persian inlay, and luminous glass craft.',
    dynasties: ['Mughal Empire', 'Lodhi Dynasty', 'Sur Empire'],
    crafts: ['Parchin Kari (Marble Inlay)', 'Zari Zardozi Embroidery', 'Firozabad Glassware', 'Leather Goods'],
    monuments: ['Taj Mahal (UNESCO)', 'Agra Fort (UNESCO)', 'Fatehpur Sikri (UNESCO)', 'Itmad-ud-Daulah'],
  },
  '30': {
    circleName: 'Rajasthan (Jaipur / Central Circle)',
    state: 'Rajasthan',
    defaultDistrict: 'Jaipur / Amber',
    ancientFoundations:
      'Founded by Maharaja Sawai Jai Singh II in 1727 according to Vastu Shastra, the Pink City of Jaipur was ruled by Kachwaha Rajputs with rich architectural and astronomical heritage.',
    livingCultureCrafts:
      'Jaipur Blue Pottery, royal Kundan-Meenakari jewelry, Sanganeri and Bagru hand-block printing, and marble deity carving.',
    famousLoreLandmarks:
      'Amber Fort, Hawa Mahal, City Palace Jaipur, Jantar Mantar (UNESCO astronomical observatory), and the Albert Hall Museum.',
    summaryOneLiner:
      'A magnificent desert kingdom of pink sandstone palaces, astronomical genius, and vibrant royal ateliers.',
    dynasties: ['Kachwaha Rajputs of Amber/Jaipur', 'Gurjara-Pratihara Dynasty', 'Mughals (alliances)'],
    crafts: ['Jaipur Blue Pottery (GI)', 'Kundan Meenakari Jewelry', 'Sanganeri Block Printing', 'Marble Stone Carving'],
    monuments: ['Amber Fort & Palace', 'Hawa Mahal', 'Jantar Mantar Jaipur (UNESCO)', 'Albert Hall Museum'],
  },
  '31': {
    circleName: 'Rajasthan (Udaipur / Mewar Circle)',
    state: 'Rajasthan',
    defaultDistrict: 'Udaipur / Chittorgarh',
    ancientFoundations:
      'Mewar represents the heroic and unbroken Sisodia Rajput sovereignty, centered around the majestic fortresses of Chittorgarh, Kumbhalgarh, and the lake city of Udaipur.',
    livingCultureCrafts:
      'Exquisite Mewar miniature manuscript paintings, Thewa gold-on-glass jewelry, silver filigree, and wooden puppet (Kathputli) craft.',
    famousLoreLandmarks:
      'City Palace on Lake Pichola, Kumbhalgarh Fort (world’s second longest continuous wall), Chittorgarh Fort, and Jag Mandir.',
    summaryOneLiner:
      'The heroic heart of Mewar chivalry, fairytale lake palaces, and intricate gold-on-glass Thewa artistry.',
    dynasties: ['Sisodia Rajputs of Mewar', 'Guhila Dynasty'],
    crafts: ['Mewar Miniature Painting', 'Thewa Gold Jewelry (GI)', 'Kathputli Puppetry', 'Silver Filigree Work'],
    monuments: ['City Palace Udaipur', 'Kumbhalgarh Fort (UNESCO)', 'Chittorgarh Fort (UNESCO)', 'Jag Mandir'],
  },
  '34': {
    circleName: 'Rajasthan (Jodhpur / Marwar Circle)',
    state: 'Rajasthan',
    defaultDistrict: 'Jodhpur / Jaisalmer',
    ancientFoundations:
      'The Sun City of Jodhpur and the Golden City of Jaisalmer reflect the formidable Rathore and Bhati Rajput kingdoms thriving along historic Thar Desert camel trade routes.',
    livingCultureCrafts:
      'Tie-and-dye Bandhani textiles, Jodhpur camel leather Mojaris, Jaisalmer yellow sandstone jali tracery, and bone inlay furniture.',
    famousLoreLandmarks:
      'Mehrangarh Fort soaring above the blue city, Umaid Bhawan Palace, Jaswant Thada, and Jaisalmer Sonar Qila.',
    summaryOneLiner:
      'An awe-inspiring desert fortress bastion of golden sandstone, vibrant Bandhani silks, and heroic Thar lore.',
    dynasties: ['Rathores of Marwar', 'Bhati Rajputs of Jaisalmer'],
    crafts: ['Bandhani / Leheriya Textiles', 'Jodhpur Leather Craft', 'Sandstone Jali Tracery', 'Camel Bone Inlay'],
    monuments: ['Mehrangarh Fort', 'Umaid Bhawan Palace', 'Jaisalmer Fort (Sonar Qila)', 'Jaswant Thada'],
  },
  '38': {
    circleName: 'Gujarat (Ahmedabad Circle)',
    state: 'Gujarat',
    defaultDistrict: 'Ahmedabad / Gandhinagar',
    ancientFoundations:
      'Spans over 4,500 years from the ancient Harappan tidal dockyard at Lothal to the Solanki architectural golden age and the 15th-century Ahmedabad Sultanate.',
    livingCultureCrafts:
      'Patola double-ikat silk weaving, Mata ni Pachedi ritual textile painting (GI), Ashavali brocades, and vibrant Rogan/Ajrakh prints.',
    famousLoreLandmarks:
      'Historic City of Ahmedabad (UNESCO), Lothal Harappan Port, Adalaj Stepwell, Sidi Saiyyed Mosque with its stone lattice tree, and Calico Museum of Textiles.',
    summaryOneLiner:
      'A millennium of maritime merchant prestige, Harappan dockyards, and world-renowned textile mastercrafts.',
    dynasties: ['Harappan Civilizations', 'Solanki (Chaulukya) Dynasty', 'Gujarat Sultanate', 'Mughals'],
    crafts: ['Patan Patola Weaving (GI)', 'Mata ni Pachedi Textile Art', 'Ashavali Silk Brocades', 'Woodblock Printing'],
    monuments: ['Historic City of Ahmedabad (UNESCO)', 'Lothal Archaeological Site', 'Adalaj Stepwell', 'Calico Museum'],
  },
  '40': {
    circleName: 'Maharashtra (Mumbai / Konkan Circle)',
    state: 'Maharashtra',
    defaultDistrict: 'Mumbai / Thane',
    ancientFoundations:
      'From 2nd-century BCE rock-cut Buddhist and Shaivite cave monasteries on basalt islands to Portuguese settlements and the rise of the Maratha maritime empire.',
    livingCultureCrafts:
      'Warli indigenous tribal painting, Paithani silk handloom weaving, Koli traditional maritime crafts, and colonial-era stone architecture restoration.',
    famousLoreLandmarks:
      'Elephanta Caves (UNESCO), Gateway of India, Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (CSMVS), Kanheri Caves, and Victorian Gothic ensembles.',
    summaryOneLiner:
      'A dynamic coastal metropolis rooted in ancient basalt rock-hewn caves, tribal art, and maritime Maratha valor.',
    dynasties: ['Satavahana Dynasty', 'Silhara Dynasty', 'Maratha Empire', 'British Raj'],
    crafts: ['Warli Tribal Painting (GI)', 'Paithani Silk Sarees', 'Copper Repoussé', 'Koli Fishing Craft'],
    monuments: ['Elephanta Caves (UNESCO)', 'CSMVS Museum Mumbai', 'Gateway of India', 'Kanheri Caves'],
  },
  '41': {
    circleName: 'Maharashtra (Pune / Western Circle)',
    state: 'Maharashtra',
    defaultDistrict: 'Pune / Satara',
    ancientFoundations:
      'The cultural capital of Maharashtra and the historic capital of the Maratha Empire under the Peshwas and Chhatrapati Shivaji Maharaj.',
    livingCultureCrafts:
      'Tambat hammered copper craft, Puneri Pagadi turbans, Paithani silk borders, and Kolhapuri leather chappals.',
    famousLoreLandmarks:
      'Shaniwar Wada palace, Sinhagad Fort, Aga Khan Palace, Raja Dinkar Kelkar Museum, and ancient Karla-Bhaja rock-cut Buddhist caves.',
    summaryOneLiner:
      'The intellectual and martial heart of Maharashtra, celebrated for Maratha fortress architecture and hammered copper crafts.',
    dynasties: ['Rashtrakutas', 'Yadavas of Devagiri', 'Maratha Empire', 'Peshwa Regency'],
    crafts: ['Tambat Copperware (GI)', 'Puneri Pagadi', 'Kolhapuri Leathercraft', 'Paithani Weaving'],
    monuments: ['Shaniwar Wada', 'Raja Dinkar Kelkar Museum', 'Sinhagad Fort', 'Karla & Bhaja Caves'],
  },
  '46': {
    circleName: 'Madhya Pradesh (Bhopal Circle)',
    state: 'Madhya Pradesh',
    defaultDistrict: 'Bhopal / Raisen',
    ancientFoundations:
      'Centuries of human civilizational history from 10,000-year-old Paleolithic cave art at Bhimbetka to the great Mauryan Buddhist stupas of Sanchi and the Paramara kingdom of Raja Bhoj.',
    livingCultureCrafts:
      'Gond tribal painting with intricate dot-and-line motifs, delicate Chanderi silk-cotton handloom weaving, Bell metal casting, and Zari-Zardozi purse work.',
    famousLoreLandmarks:
      'Sanchi Stupa (UNESCO), Rock Shelters of Bhimbetka (UNESCO), Bhojeshwar Shiva Temple, Taj-ul-Masajid, and Indira Gandhi Rashtriya Manav Sangrahalaya.',
    summaryOneLiner:
      'The prehistoric and spiritual heart of India, uniting UNESCO rock art, Buddhist stupas, and vibrant Gond tribal arts.',
    dynasties: ['Mauryan Empire', 'Sunga Dynasty', 'Paramara Dynasty (Raja Bhoj)', 'Bhopal Begums'],
    crafts: ['Gond Tribal Painting', 'Chanderi Weaving (GI)', 'Bhopali Zari Work', 'Bell Metal Craft'],
    monuments: ['Sanchi Stupa Complex (UNESCO)', 'Bhimbetka Caves (UNESCO)', 'Bhojpur Temple', 'Tribal Museum Bhopal'],
  },
  '50': {
    circleName: 'Telangana Postal Circle',
    state: 'Telangana',
    defaultDistrict: 'Hyderabad / Warangal',
    ancientFoundations:
      'The Deccan plateau was fortified by the Kakatiya dynasty with magnificent star-shaped stone temples and diamond mines, later flourishing under the Golconda Sultanate and Asaf Jahi Nizams.',
    livingCultureCrafts:
      'Bidriware silver inlay on blackened zinc alloy, Telia Rumal double-ikat weaving, Nirmal lacquer toy painting, and Pembarthi sheet-metal brass craft.',
    famousLoreLandmarks:
      'Charminar, Golconda Fort, Ramappa Temple (UNESCO), Qutb Shahi Tombs, Salar Jung Museum, and Thousand Pillar Temple in Warangal.',
    summaryOneLiner:
      'A resplendent Deccan civilization of Kakatiya stone poetry, Nizami courtly elegance, and lustrous Bidriware metalcraft.',
    dynasties: ['Satavahanas', 'Kakatiya Dynasty', 'Qutb Shahi Dynasty of Golconda', 'Asaf Jahi Nizams of Hyderabad'],
    crafts: ['Bidriware Silver Inlay (GI)', 'Telia Rumal Ikat (GI)', 'Nirmal Toy & Plate Art', 'Pembarthi Metal Craft'],
    monuments: ['Charminar', 'Golconda Fort', 'Ramappa Temple (UNESCO)', 'Salar Jung Museum', 'Qutb Shahi Tombs'],
  },
  '56': {
    circleName: 'Karnataka (Bengaluru Circle)',
    state: 'Karnataka',
    defaultDistrict: 'Bengaluru / Kolar',
    ancientFoundations:
      'Governed successively by the Western Gangas, Cholas, Hoysalas, and Vijayanagara Empire, before Kempegowda founded modern Bengaluru in 1537.',
    livingCultureCrafts:
      'Channapatna ivory-wood lacquer toys (GI), Mysore pure mulberry silk weaving, Sandalwood carving, and bronze idol casting.',
    famousLoreLandmarks:
      'Bangalore Palace, Tipu Sultan’s Summer Palace, Government Museum Bengaluru (est. 1865), Bull Temple, and Someshwara Temple.',
    summaryOneLiner:
      'A cosmopolitan Deccan crossroads bridging ancient temple dynasties with historic sandalwood and lacquer toy artistry.',
    dynasties: ['Western Gangas', 'Hoysala Empire', 'Vijayanagara Empire', 'Wadiyar Dynasty', 'Hyder Ali & Tipu Sultan'],
    crafts: ['Channapatna Wooden Toys (GI)', 'Mysore Silk Weaving', 'Sandalwood Inlay', 'Bronze Idol Casting'],
    monuments: ['Bangalore Palace', 'Government Museum Bengaluru', 'Tipu Sultan Summer Palace', 'Someshwara Temple'],
  },
  '57': {
    circleName: 'Karnataka (Coastal / Mysuru Circle)',
    state: 'Karnataka',
    defaultDistrict: 'Mysuru / Hassan',
    ancientFoundations:
      'The cultural heart of southern Karnataka, home to the glorious Hoysala soapstone temple architectures at Belur and Halebidu and the royal Wadiyar dynasty of Mysuru.',
    livingCultureCrafts:
      'Mysore rosewood inlay, Ganjifa traditional playing card painting, Mysore sandalwood oil and soap carving, and bronze casting.',
    famousLoreLandmarks:
      'Mysore Palace (Amba Vilas), Hoysaleswara Temple Halebidu (UNESCO), Chennakeshava Temple Belur (UNESCO), and Chamundeshwari Temple.',
    summaryOneLiner:
      'A royal kingdom of breathtaking Hoysala filigree stone temples and regal Mysore palace craftsmanship.',
    dynasties: ['Kadamba Dynasty', 'Hoysala Empire', 'Vijayanagara Empire', 'Wadiyars of Mysore'],
    crafts: ['Mysore Rosewood Inlay (GI)', 'Ganjifa Card Painting', 'Sandalwood Sculpture', 'Mysore Silk'],
    monuments: ['Mysore Palace', 'Belur & Halebidu Hoysala Temples (UNESCO)', 'Somanathapura Temple', 'Chamundi Hill Shrine'],
  },
  '60': {
    circleName: 'Tamil Nadu (Chennai Circle)',
    state: 'Tamil Nadu',
    defaultDistrict: 'Chennai / Kanchipuram',
    ancientFoundations:
      'The northern coastal belt of Tamil country was the imperial domain of the Pallavas, who pioneered Dravidian rock-cut monolithic temple architectures at Mamallapuram in the 7th century CE.',
    livingCultureCrafts:
      'Kanchipuram heavyweight pure gold-zari silk sarees, Swamimalai lost-wax bronze idol casting, Tanjore glass paintings, and stone sculpting.',
    famousLoreLandmarks:
      'Group of Monuments at Mahabalipuram (UNESCO), Kapaleeshwarar Temple in Mylapore, Fort St. George, and Government Museum Chennai (Egmore).',
    summaryOneLiner:
      'The classical Dravidian gateway of Pallava monolithic granite shore temples and world-renowned Kanchipuram silks.',
    dynasties: ['Pallava Dynasty', 'Chola Empire', 'Vijayanagara Empire', 'Nayaks of Madurai'],
    crafts: ['Kanchipuram Silk Sarees (GI)', 'Swamimalai Bronze Casting (GI)', 'Tanjore Painting', 'Granite Stone Sculpture'],
    monuments: ['Group of Monuments at Mahabalipuram (UNESCO)', 'Government Museum Chennai (Egmore)', 'Kapaleeshwarar Temple', 'Shore Temple'],
  },
  '68': {
    circleName: 'Kerala (Kochi / Central Circle)',
    state: 'Kerala',
    defaultDistrict: 'Ernakulam / Kochi',
    ancientFoundations:
      'The ancient maritime port of Muziris connected the Malabar coast with Phoenician, Roman, Arab, and Chinese merchants over two millennia ago, later blooming under the Kingdom of Cochin.',
    livingCultureCrafts:
      'Aranmula metallic mirrors (secret metallurgical alloy), Kathakali wooden mask carvings, temple fresco mural painting, and coir handicraft.',
    famousLoreLandmarks:
      'Mattancherry Dutch Palace with its Ramayana murals, Jewish Synagogue in Jew Town, Chinese Fishing Nets, and Hill Palace Museum Tripunithura.',
    summaryOneLiner:
      'A legendary Spice Route port of ancient global maritime trade, vibrant Kathakali lore, and sacred temple murals.',
    dynasties: ['Chera Dynasty', 'Kingdom of Cochin', 'Zamorins of Calicut', 'Travancore Kingdom'],
    crafts: ['Aranmula Metal Mirror (GI)', 'Kathakali Mask Carving', 'Kerala Temple Murals', 'Bell Metal Casting'],
    monuments: ['Mattancherry Dutch Palace', 'Hill Palace Museum Tripunithura', 'Paradesi Synagogue', 'Fort Kochi Heritage Quarter'],
  },
  '69': {
    circleName: 'Kerala (Thiruvananthapuram / South Circle)',
    state: 'Kerala',
    defaultDistrict: 'Thiruvananthapuram',
    ancientFoundations:
      'The royal seat of the Travancore Kingdom, immortalized by King Marthanda Varma who defeated the Dutch East India Company at the Battle of Colachel in 1741.',
    livingCultureCrafts:
      'Balaramapuram fine gold-bordered cotton handlooms, ivory and rosewood carving, Aranmula mirrors, and screwpine weaving.',
    famousLoreLandmarks:
      'Padmanabhaswamy Temple (the world’s wealthiest sacred shrine), Napier Museum, Padmanabhapuram Palace, and Kuthira Malika.',
    summaryOneLiner:
      'A regal realm of Travancore palace heritage, majestic wooden architecture, and sacred Padmanabhaswamy traditions.',
    dynasties: ['Venad Dynasty', 'Travancore Royal Dynasty', 'Ay Dynasty'],
    crafts: ['Balaramapuram Handlooms (GI)', 'Rosewood & Coconut Carving', 'Bronze Lamp Casting', 'Nettur Petti Craft'],
    monuments: ['Sree Padmanabhaswamy Temple', 'Napier Museum & Art Gallery', 'Padmanabhapuram Palace', 'Kuthira Malika'],
  },
  '70': {
    circleName: 'West Bengal (Kolkata Circle)',
    state: 'West Bengal',
    defaultDistrict: 'Kolkata',
    ancientFoundations:
      'Kolkata and the lower Gangetic delta represent the cultural capital of the Bengal Renaissance, deeply linked with the ancient Pala-Sena black basalt sculpting epochs.',
    livingCultureCrafts:
      'Dokra lost-wax bronze casting, Baluchari and Jamdani silk weaving, Kalighat folk painting, terracotta pottery, and Sholapith white sponge-wood art.',
    famousLoreLandmarks:
      'Indian Museum Kolkata (India’s oldest and largest museum, founded 1814), Victoria Memorial Hall, Dakshineswar Kali Temple, Marble Palace, and Howrah Bridge.',
    summaryOneLiner:
      'The cradle of the Bengal Renaissance, housing India’s grandest museum repositories, Pala bronzes, and Kalighat folk arts.',
    dynasties: ['Pala Empire', 'Sena Dynasty', 'Nawabs of Bengal', 'British Imperial Capital'],
    crafts: ['Dokra Metal Casting (GI)', 'Baluchari Silk Sarees (GI)', 'Kalighat Folk Painting', 'Sholapith Craft'],
    monuments: ['Indian Museum Kolkata', 'Victoria Memorial Hall', 'Dakshineswar Temple', 'Marble Palace'],
  },
  '75': {
    circleName: 'Odisha (Bhubaneswar / Coastal Circle)',
    state: 'Odisha',
    defaultDistrict: 'Bhubaneswar / Puri / Cuttack',
    ancientFoundations:
      'The ancient maritime Kalinga Empire, whose maritime Sadhabas sailed to Bali, Java, and Sumatra; it was the site of the Kalinga War in 261 BCE that transformed Emperor Ashoka into a patron of Buddhism.',
    livingCultureCrafts:
      'Pattachitra palm-leaf and cloth scroll painting, Cuttack Tarakasi silver filigree, Pipili applique work, and stone sculpture.',
    famousLoreLandmarks:
      'Konark Sun Temple (UNESCO), Jagannath Temple in Puri, Lingaraj Temple in Bhubaneswar, Udayagiri-Khandagiri rock-cut caves, and Odisha State Museum.',
    summaryOneLiner:
      'A poetic coastal empire celebrated for Kalinga stone temple architecture, sacred Pattachitra scrolls, and fine silver filigree.',
    dynasties: ['Mahameghavahana (King Kharavela)', 'Eastern Ganga Dynasty', 'Gajapati Kingdom', 'Bhauma-Kara Dynasty'],
    crafts: ['Pattachitra Scroll Painting (GI)', 'Cuttack Tarakasi Silver Filigree', 'Pipili Applique Craft', 'Stone Sculpting'],
    monuments: ['Konark Sun Temple (UNESCO)', 'Jagannath Temple Puri', 'Lingaraj Temple', 'Odisha State Museum'],
  },
  '78': {
    circleName: 'Assam Postal Circle',
    state: 'Assam',
    defaultDistrict: 'Guwahati / Kamrup',
    ancientFoundations:
      'The ancient kingdom of Kamarupa on the sacred Brahmaputra river, mentioned in the Mahabharata and Allahabad Pillar inscription, later unified under 600 years of sovereign Ahom rule.',
    livingCultureCrafts:
      'Muga Golden Silk weaving (unique to Assam), Sarthebari bell metal brassware, Asharikandi terracotta craft, and bamboo-cane artisanal woodwork.',
    famousLoreLandmarks:
      'Kamakhya Temple on Nilachal Hill, Assam State Museum, Sivasagar Shiva Dol, Rang Ghar royal amphitheatre, and Kaziranga heritage.',
    summaryOneLiner:
      'The mighty Brahmaputra river kingdom of ancient Kamarupa, sovereign Ahom dynasties, and shimmering Muga golden silk.',
    dynasties: ['Varman Dynasty (Kamarupa)', 'Mlechchha Dynasty', 'Pala Dynasty of Kamarupa', 'Ahom Dynasty'],
    crafts: ['Muga Golden Silk (GI)', 'Sarthebari Bell Metal (GI)', 'Bamboo & Cane Furniture', 'Assamese Terracotta'],
    monuments: ['Kamakhya Temple', 'Assam State Museum', 'Rang Ghar Sivasagar', 'Umananda Island Temple'],
  },
  '79': {
    circleName: 'North East Postal Circle (Shillong / Seven Sisters)',
    state: 'Meghalaya & North East',
    defaultDistrict: 'Shillong / East Khasi Hills',
    ancientFoundations:
      'The mist-cloaked plateau of the Khasi, Garo, and Jaintia tribal clans, renowned for matrilineal traditions, sacred biodiversity groves, and the ancient Manipuri and Tripuri royal kingdoms.',
    livingCultureCrafts:
      'Living root bridge bio-engineering, exquisite cane and bamboo basketry, tribal loin-loom shawls, and Manipuri Kauna reed mats.',
    famousLoreLandmarks:
      'Living Root Bridges of Cherrapunji/Nongriat, Don Bosco Museum of Indigenous Cultures, Ujjayanta Palace in Agartala, and Kangla Fort.',
    summaryOneLiner:
      'An ecological and indigenous marvel of living root bridges, sacred forest groves, and exquisite cane-bamboo craft.',
    dynasties: ['Khasi Syiems', 'Manikya Dynasty of Tripura', 'Ningthouja Dynasty of Manipur', 'Jaintia Kings'],
    crafts: ['Cane & Bamboo Weaving', 'Tribal Handloom Shawls', 'Manipuri Kauna Grass Craft', 'Wood Carving'],
    monuments: ['Living Root Bridges (Nongriat)', 'Don Bosco Museum Shillong', 'Kangla Fort Imphal', 'Ujjayanta Palace'],
  },
  '80': {
    circleName: 'Bihar (Patna / Central Circle)',
    state: 'Bihar',
    defaultDistrict: 'Patna / Nalanda / Gaya',
    ancientFoundations:
      'The ancient kingdom of Magadha and the imperial capital of Pataliputra, home to Emperor Ashoka, Chandragupta Maurya, Lord Buddha, Lord Mahavira, and Nalanda Mahavihara—the worlds ancient international university.',
    livingCultureCrafts:
      'Madhubani (Mithila) folk painting, mirror-finish Mauryan stone carving, Tikuli glass-painting art, and Sikki golden grass weaving.',
    famousLoreLandmarks:
      'Nalanda Mahavihara Ruins (UNESCO), Mahabodhi Temple at Bodh Gaya (UNESCO), Bihar Museum, Patna Museum housing the Didarganj Yakshi, and the ancient Kumhrar Mauryan hall.',
    summaryOneLiner:
      'The imperial cradle of Indian civilization, international Nalanda scholarship, and timeless Madhubani folk painting.',
    dynasties: ['Haryanka & Nanda Dynasties', 'Mauryan Empire', 'Gupta Empire', 'Pala Empire'],
    crafts: ['Madhubani Painting (GI)', 'Sikki Golden Grass Craft (GI)', 'Tikuli Art', 'Stone Carving'],
    monuments: ['Nalanda Mahavihara (UNESCO)', 'Mahabodhi Temple Complex (UNESCO)', 'Bihar Museum', 'Didarganj Yakshi Gallery'],
  },
  '83': {
    circleName: 'Jharkhand Postal Circle',
    state: 'Jharkhand',
    defaultDistrict: 'Ranchi / Chota Nagpur',
    ancientFoundations:
      'The mineral-rich forested heartland of Chota Nagpur, home to the ancient Santhal, Munda, and Oraon tribal cultures, ancient iron metallurgy, and the medieval Nagvanshi kings.',
    livingCultureCrafts:
      'Sohrai and Khovar tribal mural art (GI tagged ritual wall painting), Dokra brass craft, Pyatkar scroll painting, and bamboo work.',
    famousLoreLandmarks:
      'Jagannath Temple Ranchi, Maluti Terracotta Temple Village, State Museum Ranchi (Hotwar), and Baidyanath Jyotirlinga Temple.',
    summaryOneLiner:
      'An ancient plateau of prehistoric iron metallurgy, sacred sal groves, and GI-tagged Sohrai-Khovar ritual wall arts.',
    dynasties: ['Nagvanshi Dynasty', 'Chero Kingdom of Palamu', 'Santhal & Munda Tribal Confedracies'],
    crafts: ['Sohrai & Khovar Painting (GI)', 'Tribal Dokra Metalcraft', 'Pyatkar Scroll Art', 'Bamboo Craft'],
    monuments: ['State Museum Ranchi (Hotwar)', 'Jagannath Temple Ranchi', 'Maluti Terracotta Temples', 'Baidyanath Temple'],
  },
};

// Generic pan-Indian fallback for unmapped circles
const GENERAL_FALLBACK: PostalCircleDetails = {
  circleName: 'National Postal Circle',
  state: 'India',
  defaultDistrict: 'Regional Heritage Zone',
  ancientFoundations:
    'This region forms an integral part of the civilizational fabric of India, shaped by centuries of dynastic patronage, trade routes, and philosophical traditions that flourished across the subcontinent.',
  livingCultureCrafts:
    'Local mastercraft traditions preserve centuries of generational expertise in handloom weaving, metallic forging, clay pottery, and indigenous folk artistry.',
  famousLoreLandmarks:
    'Surrounded by historic temples, regional forts, sacred water tanks, and proximity to major state museums and archaeological repositories.',
  summaryOneLiner:
    'A cherished cultural landscape steeped in ancient dynastic heritage and authentic Indian artisanal traditions.',
  dynasties: ['Mauryan Empire', 'Gupta Empire', 'Regional Royal Houses', 'Mughal Empire'],
  crafts: ['Handloom Textile Weaving', 'Traditional Metalcraft', 'Terracotta Pottery', 'Folk Artistry'],
  monuments: ['Regional Heritage Fort', 'Ancient Temple Complex', 'Archaeological Museum', 'Historic Stepwell'],
};

// ==========================================
// 4. Hierarchy Resolution Helper
// ==========================================

interface LocationHierarchy {
  location_name: string;
  state: string;
  district: string;
  postal_circle: string;
  coords: { lat: number; lon: number };
  nearbyMuseums: Array<{ name: string; city: string; state: string; description: string }>;
}

function resolveLocationHierarchy(pincode: string): LocationHierarchy {
  const cleanPin = pincode.trim();
  const prefix3 = cleanPin.substring(0, 3);
  const prefix2 = cleanPin.substring(0, 2);

  // 1. Coordinates & Location Name Resolution
  const resolved = resolvePinToCoordinates(cleanPin);
  const exact = EXACT_PIN_COORDINATES[cleanPin];
  const districtPref = DISTRICT_PREFIX_COORDINATES[prefix3];
  const circlePref = POSTAL_CIRCLE_COORDINATES[prefix2];

  let rawLocationName = 'Indian Postal Region';
  let coords = { lat: 28.6139, lon: 77.209 }; // Default Delhi

  if (exact) {
    rawLocationName = exact.locationName;
    coords = { lat: exact.coords.lat, lon: exact.coords.lon };
  } else if (districtPref) {
    rawLocationName = districtPref.locationName;
    coords = { lat: districtPref.coords.lat, lon: districtPref.coords.lon };
  } else if (circlePref) {
    rawLocationName = circlePref.locationName;
    coords = { lat: circlePref.coords.lat, lon: circlePref.coords.lon };
  } else if (resolved) {
    rawLocationName = resolved.locationName;
    coords = { lat: resolved.coords.lat, lon: resolved.coords.lon };
  }

  // 2. State, District & Postal Circle Extraction
  const regionalMeta = REGIONAL_CULTURAL_DIRECTORY[prefix2] || GENERAL_FALLBACK;
  const rootsMap = POSTAL_CIRCLE_MAP[prefix2];

  let state = regionalMeta.state;
  let district = regionalMeta.defaultDistrict;
  const postalCircle = regionalMeta.circleName;

  // Parse location name parts if available
  const parts = rawLocationName.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    state = parts[parts.length - 1];
    district = parts[parts.length - 2];
  } else if (parts.length === 2) {
    state = parts[1];
    district = parts[0];
  } else if (parts.length === 1 && !rawLocationName.includes('Postal')) {
    district = parts[0];
  }

  // Clean state name if it has parenthetical notes
  if (rootsMap && (!state || state === 'India')) {
    state = rootsMap.state;
  }

  // Clean district name of suffixes
  district = district.replace(/ (District|Circle|Region|Area|State)$/i, '').trim();

  // Find museums in the same state or city from dataset
  const allMuseums = museumsData as Array<{
    name: string;
    city: string;
    state: string;
    description: string;
    pincode: string;
  }>;
  const matchingMuseums = allMuseums
    .filter(
      (m) =>
        m.pincode === cleanPin ||
        m.city.toLowerCase() === district.toLowerCase() ||
        m.state.toLowerCase() === state.toLowerCase()
    )
    .slice(0, 3)
    .map((m) => ({
      name: m.name,
      city: m.city,
      state: m.state,
      description: m.description,
    }));

  return {
    location_name: rawLocationName,
    state,
    district,
    postal_circle: postalCircle,
    coords,
    nearbyMuseums: matchingMuseums,
  };
}

// ==========================================
// 5. Deterministic Offline Synthesis Fallback
// ==========================================

function generateDeterministicHistoricalBrief(
  pincode: string,
  hierarchy: LocationHierarchy
): Omit<PincodeHistoryResponse, 'cached'> {
  const prefix2 = pincode.substring(0, 2);
  const regional = REGIONAL_CULTURAL_DIRECTORY[prefix2] || GENERAL_FALLBACK;
  const rootsEntry = POSTAL_CIRCLE_MAP[prefix2];

  const ancientFoundations = rootsEntry
    ? `${regional.ancientFoundations} Tracing its civilizational horizon to the ${rootsEntry.era}, the soil of ${hierarchy.district} stands as a testament to ${rootsEntry.heritage}.`
    : regional.ancientFoundations;

  const livingCrafts = rootsEntry
    ? `${regional.livingCultureCrafts} Living mastercrafts encompass ${rootsEntry.craft}.`
    : regional.livingCultureCrafts;

  const famousLandmarks =
    hierarchy.nearbyMuseums.length > 0
      ? `${regional.famousLoreLandmarks} Nearby cultural anchors include ${hierarchy.nearbyMuseums.map((m) => m.name).join(' and ')}.`
      : regional.famousLoreLandmarks;

  const summary = rootsEntry ? rootsEntry.story : regional.summaryOneLiner;

  // Augment monuments with any exact museum matches
  const notableMonuments = [...regional.monuments];
  for (const m of hierarchy.nearbyMuseums) {
    if (!notableMonuments.includes(m.name)) {
      notableMonuments.unshift(m.name);
    }
  }

  return {
    status: 'success',
    pincode,
    location_name: hierarchy.location_name,
    state: hierarchy.state,
    district: hierarchy.district,
    postal_circle: hierarchy.postal_circle,
    historical_brief: {
      ancient_foundations: ancientFoundations,
      living_culture_crafts: livingCrafts,
      famous_lore_landmarks: famousLandmarks,
      summary_one_liner: summary,
    },
    key_dynasties: regional.dynasties.slice(0, 5),
    traditional_crafts: regional.crafts.slice(0, 5),
    notable_monuments: notableMonuments.slice(0, 5),
    source: 'deterministic_offline_synthesis',
  };
}

// ==========================================
// 6. OpenRouter AI Grounded Synthesis Pipeline
// ==========================================

async function generateOpenRouterHistoricalBrief(
  pincode: string,
  hierarchy: LocationHierarchy
): Promise<Omit<PincodeHistoryResponse, 'cached'> | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  const prefix2 = pincode.substring(0, 2);
  const regional = REGIONAL_CULTURAL_DIRECTORY[prefix2] || GENERAL_FALLBACK;
  const rootsEntry = POSTAL_CIRCLE_MAP[prefix2];

  const museumsContext =
    hierarchy.nearbyMuseums.length > 0
      ? `Prominent local museums & repositories: ${hierarchy.nearbyMuseums.map((m) => `${m.name} in ${m.city} (${m.description})`).join('; ')}.`
      : '';

  const systemPrompt = `You are an elite cultural historian, archaeologist, and museum curator specializing in Indian heritage.
Your objective is to provide a factually grounded, authentic, and evocative 3-part cultural and historical brief for an Indian postal PIN code.
You MUST output ONLY a valid JSON object matching the exact specified schema. Do not output markdown code fences or conversational text.`;

  const userPrompt = `Synthesize a structured cultural and historical brief for Indian Postal PIN code ${pincode}.

Grounding Context:
- Locality / Area: ${hierarchy.location_name}
- District: ${hierarchy.district}
- State: ${hierarchy.state}
- Postal Circle: ${hierarchy.postal_circle}
- Civilizational Era / Anchor: ${rootsEntry ? rootsEntry.era : 'Ancient to Classical Indian epochs'}
- Known Dynastic Legacy: ${regional.dynasties.join(', ')}
- Known Traditional Arts & Crafts: ${regional.crafts.join(', ')}
- Known Iconic Monuments: ${regional.monuments.join(', ')}
${museumsContext}

Required JSON Schema:
{
  "historical_brief": {
    "ancient_foundations": "A rich 2-3 sentence narrative of ancient origins, founding dynasties, civilizational foundations, and archaeological roots for this locality and region.",
    "living_culture_crafts": "A rich 2-3 sentence narrative of traditional artisanal crafts, living heritage, handloom/metal traditions, and folk culture.",
    "famous_lore_landmarks": "A rich 2-3 sentence narrative of sacred and historic landmarks, iconic monuments, folklore, and cultural prominence.",
    "summary_one_liner": "A crisp, poetic one-sentence summary capturing the civilizational soul of the region."
  },
  "key_dynasties": ["Dynasty 1", "Dynasty 2", "Dynasty 3"],
  "traditional_crafts": ["Craft 1", "Craft 2", "Craft 3"],
  "notable_monuments": ["Monument 1", "Monument 2", "Monument 3"]
}`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const candidateModels = [
    process.env.OPENROUTER_MODEL || 'openrouter/free',
    'openrouter/auto',
    'google/gemini-2.0-flash-exp:free',
  ];

  for (const model of candidateModels) {
    try {
      const rawContent = await callOpenRouter(messages, {
        model,
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      });

      // Parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          continue;
        }
      }

      // Schema Validation
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.historical_brief ||
        typeof parsed.historical_brief.ancient_foundations !== 'string' ||
        typeof parsed.historical_brief.living_culture_crafts !== 'string' ||
        typeof parsed.historical_brief.famous_lore_landmarks !== 'string' ||
        typeof parsed.historical_brief.summary_one_liner !== 'string'
      ) {
        continue;
      }

      const dynasties =
        Array.isArray(parsed.key_dynasties) && parsed.key_dynasties.length > 0
          ? parsed.key_dynasties.map(String).slice(0, 6)
          : regional.dynasties;

      const crafts =
        Array.isArray(parsed.traditional_crafts) && parsed.traditional_crafts.length > 0
          ? parsed.traditional_crafts.map(String).slice(0, 6)
          : regional.crafts;

      const monuments =
        Array.isArray(parsed.notable_monuments) && parsed.notable_monuments.length > 0
          ? parsed.notable_monuments.map(String).slice(0, 6)
          : regional.monuments;

      return {
        status: 'success',
        pincode,
        location_name: hierarchy.location_name,
        state: hierarchy.state,
        district: hierarchy.district,
        postal_circle: hierarchy.postal_circle,
        historical_brief: {
          ancient_foundations: parsed.historical_brief.ancient_foundations.trim(),
          living_culture_crafts: parsed.historical_brief.living_culture_crafts.trim(),
          famous_lore_landmarks: parsed.historical_brief.famous_lore_landmarks.trim(),
          summary_one_liner: parsed.historical_brief.summary_one_liner.trim(),
        },
        key_dynasties: dynasties,
        traditional_crafts: crafts,
        notable_monuments: monuments,
        source: 'openrouter_ai',
      };
    } catch {
      // Continue to next candidate model or fallback
      continue;
    }
  }

  return null;
}

// ==========================================
// 7. Core Request Handler
// ==========================================

async function handlePincodeHistory(rawPincode: unknown): Promise<NextResponse> {
  // 1. Strict Validation: Input presence & 6-digit Indian PIN format (/^[1-9][0-9]{5}$/)
  if (rawPincode === undefined || rawPincode === null || rawPincode === '') {
    return NextResponse.json(
      {
        status: 'error',
        error: 'INVALID_PINCODE_FORMAT',
        message: 'PIN code must be a valid 6-digit Indian postal code (/^[1-9][0-9]{5}$/)',
      } as PincodeHistoryErrorResponse,
      { status: 400 }
    );
  }

  const pincodeStr = typeof rawPincode === 'number' ? String(rawPincode) : String(rawPincode).trim();

  // Strict regex test
  if (!/^[1-9][0-9]{5}$/.test(pincodeStr)) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'INVALID_PINCODE_FORMAT',
        message: 'PIN code must be a valid 6-digit Indian postal code (/^[1-9][0-9]{5}$/)',
      } as PincodeHistoryErrorResponse,
      { status: 400 }
    );
  }

  // 2. In-Memory Cache Lookup (<10ms SLA)
  const cachedData = globalHistoryCache.get(pincodeStr);
  if (cachedData) {
    return NextResponse.json(
      {
        ...cachedData,
        cached: true,
      } as PincodeHistoryResponse,
      { status: 200 }
    );
  }

  // 3. Resolve Geographic & Cultural Hierarchy
  const hierarchy = resolveLocationHierarchy(pincodeStr);

  // 4. Attempt OpenRouter AI Generation with deterministic fallback
  let result: Omit<PincodeHistoryResponse, 'cached'> | null = null;
  try {
    result = await generateOpenRouterHistoricalBrief(pincodeStr, hierarchy);
  } catch {
    result = null;
  }

  // If OpenRouter was unavailable, threw 429/error, or returned malformed JSON:
  if (!result) {
    result = generateDeterministicHistoricalBrief(pincodeStr, hierarchy);
  }

  // 5. Save to In-Memory Cache
  globalHistoryCache.set(pincodeStr, result);

  // 6. Return Response
  return NextResponse.json(
    {
      ...result,
      cached: false,
    } as PincodeHistoryResponse,
    { status: 200 }
  );
}

// ==========================================
// 8. Exported HTTP Handlers
// ==========================================

/**
 * GET /api/pincode-history?pincode=110001
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode');
  return handlePincodeHistory(pincode);
}

/**
 * POST /api/pincode-history
 * Body: { "pincode": "110001" }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const pincode = body?.pincode;
    return handlePincodeHistory(pincode);
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        error: 'INVALID_PINCODE_FORMAT',
        message: 'PIN code must be a valid 6-digit Indian postal code (/^[1-9][0-9]{5}$/)',
      } as PincodeHistoryErrorResponse,
      { status: 400 }
    );
  }
}
