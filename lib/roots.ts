import {
  getAllMuseums,
  MuseumWithDistance,
  calculateHaversineDistance,
  isMuseumOpenToday,
  Coordinates,
} from './museums';
import { getAllArtifacts } from './artifacts';
import { Artifact } from './types';
import { resolvePinToCoordinates } from './pincodes';

export interface RootConnection {
  regionName: string;
  state: string;
  civilizationalEra: string;
  dynasticHeritage: string;
  culturalStory: string;
  craftsTradition: string;
  highlightArtifacts: Artifact[];
  nearbyMuseums: MuseumWithDistance[];
}

export const POSTAL_CIRCLE_MAP: Record<
  string,
  {
    state: string;
    era: string;
    heritage: string;
    story: string;
    craft: string;
    artifactId: string;
    museumId: string;
  }
> = {
  '11': {
    state: 'Delhi (NCR)',
    era: 'Indus-Saraswati to Sultanate & Mughal Epochs',
    heritage: 'Indus Valley & Imperial Crossroads',
    story: 'Your region sits at the ancient crossroads of the northern plains, where millennia of metallurgy, sculpture, and civilizational exchange converged.',
    craft: 'Lost-wax bronze casting, sandstone carving, and courtly miniature manuscripts.',
    artifactId: 'art-001',
    museumId: 'mus-in-del-001',
  },
  '12': {
    state: 'Haryana',
    era: 'Rakhigarhi & Harappan Civilizations',
    heritage: 'Indus-Saraswati Valley',
    story: 'Your roots trace back to the vast planned cities of Rakhigarhi and the earliest metallurgical artisans of the subcontinent.',
    craft: 'Terracotta, bronze casting, and carnelian bead masonry.',
    artifactId: 'art-001',
    museumId: 'mus-in-del-001',
  },
  '14': {
    state: 'Punjab',
    era: 'Vedic to Gandharan Transitions',
    heritage: 'Sapta Sindhu Horizon',
    story: 'Your land is the fertile cradle of early hymns, ancient universities, and monumental sculptural synthesis.',
    craft: 'Wood inlay, brass forging, and textile weaves.',
    artifactId: 'art-001',
    museumId: 'mus-in-del-001',
  },
  '18': {
    state: 'Jammu and Kashmir',
    era: 'Dogra, Kushan & Himalayan Artistic Heritage',
    heritage: 'Pahari Miniature & Trans-Himalayan Epoch',
    story: 'Your heritage bridges the ancient trade passes with the exquisite Basohli and Kangra Pahari miniature painting traditions nurtured in royal Dogra palaces.',
    craft: 'Pahari miniature painting, Pashmina weaving, and walnut wood carving.',
    artifactId: 'art-004',
    museumId: 'mus-in-jam-001',
  },
  '20': {
    state: 'Uttar Pradesh (Central)',
    era: 'Gupta & Mauryan Classical Age',
    heritage: 'Ganga-Yamuna Doab',
    story: 'Your ancestral soil gave birth to the golden age of classical Indian aesthetics, philosophical councils, and the Sarnath Lion Capital.',
    craft: 'Polished Chunar sandstone masonry and Zardozi metal embroidery.',
    artifactId: 'art-004',
    museumId: 'mus-in-sar-001',
  },
  '22': {
    state: 'Uttar Pradesh (Varanasi / Sarnath)',
    era: 'Kashi & Sarnath Gupta Golden Age',
    heritage: 'Sacred Heart of Indic Philosophy',
    story: 'From the sacred Deer Park of Sarnath to ancient Kashi, your roots represent unbroken philosophical discourse, master stone carving, and silk brocades.',
    craft: 'Sarnath wet-drapery stone sculpture and Banarasi handloom.',
    artifactId: 'art-005',
    museumId: 'mus-in-sar-001',
  },
  '25': {
    state: 'Uttar Pradesh (Western)',
    era: 'Mathura & Kushan Sculptural Epoch',
    heritage: 'Kushan-Gupta Sculptural School',
    story: 'Your region was the world hub of red-spotted sandstone sculpture that defined divine iconography across Asia.',
    craft: 'Spotted sandstone carving and brass craftsmanship.',
    artifactId: 'art-004',
    museumId: 'mus-in-del-001',
  },
  '30': {
    state: 'Rajasthan (Jaipur / Dhundhar)',
    era: 'Gurjara-Pratihara & Rajput Kingdoms',
    heritage: 'Maru-Gurjara & Fortified Arts',
    story: 'Your roots echo with architectural mastery, royal miniature ateliers, and monumental desert stone-masonry.',
    craft: 'Jali stone tracery, block printing, and enamelled Meenakari.',
    artifactId: 'art-004',
    museumId: 'mus-in-jai-001',
  },
  '31': {
    state: 'Rajasthan (Mewar / Udaipur)',
    era: 'Sisodia Rajputs & Mewar Kingdom',
    heritage: 'Lake Citadel & Miniature Ateliers',
    story: 'Your ancestral region represents centuries of Mewar royal patronage, architectural majesty on Lake Pichola, and vivid Sisodia miniature manuscript painting.',
    craft: 'Mewar miniature painting, silver filigree, and royal weaponry inlay.',
    artifactId: 'art-004',
    museumId: 'mus-in-uda-001',
  },
  '38': {
    state: 'Gujarat (Ahmedabad / Lothal)',
    era: 'Harappan Maritime & Solanki Dynasties',
    heritage: 'Lothal Tidal Dockyard & Gujarati Handloom',
    story: 'Your roots trace to the world’s earliest tidal dockyard at Lothal and millennia of vibrant textile trade including Patola silks and Pichhwai hangings.',
    craft: 'Patola double-ikat weaving, Rogan art, and Harappan carnelian beadwork.',
    artifactId: 'art-001',
    museumId: 'mus-in-ahm-001',
  },
  '40': {
    state: 'Maharashtra & Goa (Mumbai / Konkan / Panaji)',
    era: 'Satavahana, Kadamba & Maratha Empires',
    heritage: 'Western Ghats, Arabian Coast & Cave Craft',
    story: 'Your ancestors carved entire mountain temples from solid basalt and forged maritime trade routes across the Arabian Sea.',
    craft: 'Basalt rock architecture, Paithani silk, and Bidri metalwork.',
    artifactId: 'art-002',
    museumId: 'mus-in-mum-001',
  },
  '41': {
    state: 'Maharashtra (Pune / Desh)',
    era: 'Maratha Empire & Peshwa Period',
    heritage: 'Deccan Fortresses & Maratha Craftsmanship',
    story: 'Your heritage represents the heart of the Maratha confederacy, traditional wada architecture, Mastani Mahal artistry, and exquisite regional metalcraft.',
    craft: 'Tambat brassware, Paithani textiles, and carved teakwood architecture.',
    artifactId: 'art-002',
    museumId: 'mus-in-pun-001',
  },
  '46': {
    state: 'Madhya Pradesh (Bhopal / Malwa)',
    era: 'Bhimbetka Prehistoric to Paramara Epoch',
    heritage: 'Heartland of Indian Anthropology & Rock Art',
    story: 'Your soil holds 10,000-year-old rock art shelters and deep anthropological traditions uniting India’s tribal and classical heritage.',
    craft: 'Gond tribal painting, Chanderi weaving, and bell-metal casting.',
    artifactId: 'art-003',
    museumId: 'mus-in-bho-001',
  },
  '50': {
    state: 'Telangana & Hyderabad',
    era: 'Kakatiya & Deccan Sultanates',
    heritage: 'Deccan Diamond & Metallurgical Heart',
    story: 'Your heritage blends high Kakatiya stone lace architecture with royal Nizami courtly arts, weaponry, and Bidri silver inlay.',
    craft: 'Telia Rumal, Dokra lost-wax casting, and filigree jewelry.',
    artifactId: 'art-002',
    museumId: 'mus-in-hyd-001',
  },
  '56': {
    state: 'Karnataka (Bengaluru / Mysore)',
    era: 'Chalukya, Hoysala & Vijayanagara Dynasties',
    heritage: 'Deccan Architectural Zenith',
    story: 'Your ancestral region created the pinnacle of soapstone temple carving, lost-wax bronzes, and Vijayanagara cosmopolitan engineering.',
    craft: 'Sandalwood carving, Mysore silk, and Channapatna lacquer craft.',
    artifactId: 'art-002',
    museumId: 'mus-in-blr-001',
  },
  '60': {
    state: 'Tamil Nadu (Chennai / Thanjavur)',
    era: 'Chola, Pallava & Pandya Classical Golden Age',
    heritage: 'Dravidian Classical Zenith',
    story: 'Your heritage represents the world-renowned bronze casting tradition of the Cholas and monumental granite gopuram architecture celebrating cosmic harmony.',
    craft: 'Cire-perdue bronze iconography, Kanchipuram silk, and Tanjore paintings.',
    artifactId: 'art-002',
    museumId: 'mus-in-che-001',
  },
  '68': {
    state: 'Kerala (Malabar / Kochi)',
    era: 'Chera Dynasty & Spice Route Ports',
    heritage: 'Muziris & Malabar Coastline',
    story: 'Your ancestors navigated global spice trade winds, perfecting sacred wooden mural paintings and ancient metallurgical alloy crafting.',
    craft: 'Aranmula metal mirrors, Kathakali wooden headdress carving, and temple murals.',
    artifactId: 'art-002',
    museumId: 'mus-in-koc-001',
  },
  '69': {
    state: 'Kerala (Thiruvananthapuram / Travancore)',
    era: 'Travancore Kingdom & Venad Dynasty',
    heritage: 'Indo-Saracenic Wooden Heritage',
    story: 'Your ancestral region harmonized indigenous Kerala gabled wooden architecture with classical Travancore bronze and ivory carving traditions.',
    craft: 'Temple wooden carving, Aranmula mirrors, and mural frescoes.',
    artifactId: 'art-002',
    museumId: 'mus-in-trv-001',
  },
  '70': {
    state: 'West Bengal (Kolkata)',
    era: 'Pala-Sena Empire & Bengal Renaissance',
    heritage: 'Pala Buddhist Art & Terracotta Temples',
    story: 'Your roots gave the world the monumental Pala black basalt and bronze sculpting tradition that radiated Buddhist wisdom across Tibet and Southeast Asia.',
    craft: 'Terracotta temple tiles, Baluchari weaves, and Dokra bronze casting.',
    artifactId: 'art-006',
    museumId: 'mus-in-kol-001',
  },
  '75': {
    state: 'Odisha (Bhubaneswar / Kalinga)',
    era: 'Kalinga Empire (Konark, Puri & Bhubaneswar)',
    heritage: 'Kalinga Sacred Masonry & Palm-Leaf Repositories',
    story: 'Your ancestors carved stone so delicately that it earned the name "poetry in stone", from the Konark Sun Temple to ancient illustrated Palm Leaf Manuscripts.',
    craft: 'Pattachitra scroll painting, palm-leaf engraving, and silver filigree.',
    artifactId: 'art-004',
    museumId: 'mus-in-bhu-001',
  },
  '78': {
    state: 'Assam (Guwahati / Brahmaputra Valley)',
    era: 'Kamarupa Kingdom & Ahom Dynasty',
    heritage: 'Kamarupa Stone & Ahom Metallurgical Arts',
    story: 'Your roots span the ancient Kamarupa kingdom on the mighty Brahmaputra and six centuries of sovereign Ahom temple building and royal metallurgy.',
    craft: 'Muga silk weaving, bell metal crafts, and terracotta sculpture.',
    artifactId: 'art-001',
    museumId: 'mus-in-guw-001',
  },
  '79': {
    state: 'Meghalaya & North East (Shillong)',
    era: 'Khasi, Garo & Jaintia Indigenous Traditions',
    heritage: 'Eight Sister States Tribal Civilizations',
    story: 'Your ancestral soil preserves the rich traditions, sacred groves, living root bridges, and vibrant indigenous material cultures of North East India.',
    craft: 'Cane and bamboo craftsmanship, tribal handloom weaves, and bead ornaments.',
    artifactId: 'art-001',
    museumId: 'mus-in-shl-001',
  },
  '16': {
    state: 'Chandigarh Tri-City',
    era: 'Gandhara & Modernist Heritage',
    heritage: 'Indus Valley to Modernist Crossroads',
    story: 'Your region unites ancient Gandharan Buddhist sculptures with iconic modern architectural heritage and vibrant Punjabi craft culture.',
    craft: 'Gandharan stone carving, Phulkari embroidery, and architectural design.',
    artifactId: 'art-004',
    museumId: 'mus-in-chd-001',
  },
  '17': {
    state: 'Himachal Pradesh (Shimla / Hills)',
    era: 'Pahari Kingdoms & Himalayan Devbhumi',
    heritage: 'Pahari Miniature & Himalayan Temple Arts',
    story: 'Your roots lie in the sacred valleys of Himachal, where royal hill courts fostered delicate Kangra paintings and intricate wooden pagoda temple architectures.',
    craft: 'Kangra miniature painting, Kullu shawls, and Chamba Rumal embroidery.',
    artifactId: 'art-004',
    museumId: 'mus-in-shi-001',
  },
  '19': {
    state: 'Ladakh & Kashmir (Leh / Kargil)',
    era: 'Silk Route Passes & Trans-Himalayan Buddhist Kingdoms',
    heritage: 'High Mountain Heritage & Vajrayana Lineage',
    story: 'Your ancestral mountains formed the legendary artery of Silk Route trade, preserving millennium-old Buddhist monastery murals, thangkas, and high-altitude courage.',
    craft: 'Pashmina spinning, Thangka painting, and Ladakhi repoussé metalwork.',
    artifactId: 'art-004',
    museumId: 'mus-in-leh-001',
  },
  '21': {
    state: 'Uttar Pradesh (Prayagraj / Central)',
    era: 'Gupta Classical Golden Age & Triveni Sangam',
    heritage: 'Vedic-Classical Convergence',
    story: 'Your soil lies at the sacred confluence of holy rivers, flourishing during the Gupta and Mauryan epochs with Bharhut terracotta and classical Sanskrit literature.',
    craft: 'Bharhut terracotta, Moonj basketry, and stone masonry.',
    artifactId: 'art-004',
    museumId: 'mus-in-pry-001',
  },
  '24': {
    state: 'Uttarakhand (Dehradun / Garhwal)',
    era: 'Katyuri & Garhwal Himalayan Kingdoms',
    heritage: 'Garhwal Pahari School & Sacred Himalayan Forests',
    story: 'Your roots arise from the sacred Garhwal and Kumaon Himalayas, where forest wisdom and mountain court painters created exquisite natural landscapes.',
    craft: 'Aipan ritual folk art, Ringal bamboo craft, and Pahari wood carving.',
    artifactId: 'art-004',
    museumId: 'mus-in-deh-001',
  },
  '49': {
    state: 'Chhattisgarh (Raipur / Bastar)',
    era: 'Dakshina Kosala, Sirpur & Tribal Bastar Heritage',
    heritage: 'Dokra Lost-Wax Heartland & Sirpur Buddhist Horizon',
    story: 'Your land is the ancient heart of Dokra lost-wax bronze casting and magnificent 7th-century Sirpur brick and stone monastic complexes.',
    craft: 'Bastar Bell Metal (Dokra), wrought iron craft, and Kosa silk weaving.',
    artifactId: 'art-001',
    museumId: 'mus-in-rai-001',
  },
  '52': {
    state: 'Andhra Pradesh (Vijayawada / Amaravati)',
    era: 'Satavahana, Ikshvaku & Eastern Chalukya Epochs',
    heritage: 'Amaravati Stupa & Krishna River Civilizations',
    story: 'Your heritage gave birth to the magnificent Amaravati School of Art along the Krishna River, radiating limestone Buddhist mastery across South Asia.',
    craft: 'Kalamkari hand-painted textiles, Kondapalli wooden toys, and brass casting.',
    artifactId: 'art-004',
    museumId: 'mus-in-vij-001',
  },
  '57': {
    state: 'Karnataka (Mysuru / Coastal)',
    era: 'Wadiyar Dynasty & Hoysala Architecture',
    heritage: 'Karnataka Royal & Maritime Zenith',
    story: 'Your ancestors built the soaring ivory and teak palaces of Mysuru and the filigree soapstone temples of the Deccan plateau.',
    craft: 'Mysore rosewood inlay, sandalwood carving, and Mysore silk.',
    artifactId: 'art-002',
    museumId: 'mus-in-mys-001',
  },
  '73': {
    state: 'Sikkim & North Bengal (Gangtok)',
    era: 'Namgyal Dynasty & Vajrayana Buddhist Tradition',
    heritage: 'Himalayan Kingdom & Silk Passes',
    story: 'Your soil is guarded by Kangchenjunga, where centuries of sacred Buddhist learning, silk thangkas, and gilded monastic metallurgy thrive.',
    craft: 'Thangka painting, Lepcha wood carving, and carpet weaving.',
    artifactId: 'art-005',
    museumId: 'mus-in-gan-001',
  },
  '74': {
    state: 'Andaman & Nicobar Islands (Port Blair)',
    era: 'Indigenous Maritime & Island Civilizations',
    heritage: 'Bay of Bengal Oceanic Heritage',
    story: 'Your islands represent millennia of harmonious indigenous ecological wisdom and historic maritime crossroads of the Indian Ocean.',
    craft: 'Shell craft, cane and bamboo craft, and coconut shell carvings.',
    artifactId: 'art-001',
    museumId: 'mus-in-pbl-001',
  },
  '83': {
    state: 'Jharkhand (Ranchi / Chota Nagpur)',
    era: 'Santhal, Munda & Ancient Metallurgical Traditions',
    heritage: 'Chota Nagpur Tribal Civilizations',
    story: 'Your roots run deep into the mineral-rich soils of Chota Nagpur, home to ancient iron smelters, prehistoric Sohrai cave murals, and vibrant tribal lore.',
    craft: 'Sohrai and Kohbar wall art, Dokra metalcraft, and bamboo weaves.',
    artifactId: 'art-001',
    museumId: 'mus-in-ran-001',
  },
  '80': {
    state: 'Bihar (Patna / Nalanda / Gaya)',
    era: 'Mauryan Empire, Nalanda University & Magadha',
    heritage: 'The Cradle of Empires & Great Universities',
    story: 'Your soil is the ancient homeland of Emperor Ashoka, Chandragupta, the Nalanda International University, and the Didarganj Yakshi.',
    craft: 'Mirror-finish Mauryan Chunar stone polish, Madhubani folk art, and Sikki grass weaving.',
    artifactId: 'art-003',
    museumId: 'mus-in-pat-001',
  },
};

export function resolveRootsByPincode(pincode: string): RootConnection {
  const cleanPin = (pincode || '').trim().replace(/\D/g, '');
  const prefix2 = cleanPin.substring(0, 2);

  const matched = POSTAL_CIRCLE_MAP[prefix2] || POSTAL_CIRCLE_MAP['11'];

  const allArtifacts = getAllArtifacts();
  const allMuseums = getAllMuseums();

  // Resolve user coordinates from PIN
  const resolved = cleanPin.length === 6 ? resolvePinToCoordinates(cleanPin) : null;
  const userCoords: Coordinates = resolved
    ? resolved.coords
    : { lat: 28.6139, lon: 77.2090 }; // default Delhi center

  // Calculate live Haversine distance to all museums and sort by proximity
  const museumsWithDistance: MuseumWithDistance[] = allMuseums.map((m) => {
    const dist = calculateHaversineDistance(
      userCoords.lat,
      userCoords.lon,
      m.coordinates.lat,
      m.coordinates.lon
    );
    return {
      ...m,
      distance_km: dist,
      isOpenToday: isMuseumOpenToday(m.opening_hours.closed_on),
    };
  });

  museumsWithDistance.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

  const artifact = allArtifacts.find((a) => a.id === matched.artifactId) || allArtifacts[0];

  // Pick primary museum (either the matched one with computed distance or the closest)
  const matchedMuseum = museumsWithDistance.find((m) => m.id === matched.museumId);
  const primaryNearby: MuseumWithDistance[] = matchedMuseum ? [matchedMuseum] : [];
  for (const m of museumsWithDistance) {
    if (primaryNearby.length >= 3) break;
    if (!primaryNearby.some((existing) => existing.id === m.id)) {
      primaryNearby.push(m);
    }
  }

  const regionName = resolved
    ? `${resolved.locationName} (${cleanPin})`
    : `${matched.state} (PIN prefix ${prefix2}xxxx)`;

  return {
    regionName,
    state: matched.state,
    civilizationalEra: matched.era,
    dynasticHeritage: matched.heritage,
    culturalStory: matched.story,
    craftsTradition: matched.craft,
    highlightArtifacts: [artifact],
    nearbyMuseums: primaryNearby,
  };
}
