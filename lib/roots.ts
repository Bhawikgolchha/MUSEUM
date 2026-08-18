import { getAllMuseums, MuseumWithDistance } from './museums';
import { getAllArtifacts } from './artifacts';
import { Artifact } from './types';

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
    state: 'Rajasthan',
    era: 'Gurjara-Pratihara & Rajput Kingdoms',
    heritage: 'Maru-Gurjara & Fortified Arts',
    story: 'Your roots echo with architectural mastery, royal miniature ateliers, and monumental desert stone-masonry.',
    craft: 'Jali stone tracery, block printing, and enamelled Meenakari.',
    artifactId: 'art-004',
    museumId: 'mus-in-del-001',
  },
  '40': {
    state: 'Maharashtra (Mumbai / Konkan)',
    era: 'Satavahana, Vakataka & Maratha Empires',
    heritage: 'Western Ghats & Ajanta-Ellora Cave Craft',
    story: 'Your ancestors carved entire mountain temples from solid basalt and forged maritime trade routes across the Arabian Sea.',
    craft: 'Basalt rock architecture, Paithani silk, and Bidri metalwork.',
    artifactId: 'art-002',
    museumId: 'mus-in-mum-001',
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
    state: 'Kerala',
    era: 'Chera Dynasty & Spice Route Ports',
    heritage: 'Muziris & Malabar Coastline',
    story: 'Your ancestors navigated global spice trade winds, perfecting sacred wooden mural paintings and ancient metallurgical alloy crafting.',
    craft: 'Aranmula metal mirrors, Kathakali wooden headdress carving, and temple murals.',
    artifactId: 'art-002',
    museumId: 'mus-in-che-001',
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
    state: 'Odisha',
    era: 'Kalinga Empire (Konark & Puri)',
    heritage: 'Kalinga Sacred Masonry',
    story: 'Your ancestors carved stone so delicately that it earned the name "poetry in stone", from the Konark Sun Temple to the caves of Udayagiri.',
    craft: 'Pattachitra scroll painting, silver filigree, and stone filigree.',
    artifactId: 'art-004',
    museumId: 'mus-in-kol-001',
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

  const artifact = allArtifacts.find((a) => a.id === matched.artifactId) || allArtifacts[0];
  const museum = allMuseums.find((m) => m.id === matched.museumId) || allMuseums[0];

  return {
    regionName: `${matched.state} (PIN prefix ${prefix2}xxxx)`,
    state: matched.state,
    civilizationalEra: matched.era,
    dynasticHeritage: matched.heritage,
    culturalStory: matched.story,
    craftsTradition: matched.craft,
    highlightArtifacts: [artifact],
    nearbyMuseums: [museum as any],
  };
}
