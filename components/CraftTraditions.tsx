'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  Award,
  Hammer,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Feather,
  Flame,
  CheckCircle2,
  Info,
  Compass,
  Palette,
  Scissors,
  Eye,
  Scroll,
} from 'lucide-react';
import ReadAloudButton from '@/components/ReadAloudButton';

export interface CraftTechniqueStep {
  stepNumber: number;
  title: string;
  summary: string;
  detail: string;
  tools: string[];
  precisionKey: string;
}

export interface CraftMaterial {
  name: string;
  description: string;
  source: string;
}

export interface MasterArtisanProfile {
  name: string;
  title: string;
  lineage: string;
  location: string;
  awards: string[];
  quote: string;
}

export interface GiTagInfo {
  registered: boolean;
  tagNumber: string;
  year: string;
  certifiedOrigin: string;
  crestLabel: string;
}

export interface RegionalCraftTradition {
  id: string;
  name: string;
  regionalOrigin: string;
  state: string;
  category: 'metallurgy' | 'textiles' | 'stone_wood' | 'painting_folk' | 'clay_pottery';
  dynasticPatronage: string;
  giTag: GiTagInfo;
  shortDescription: string;
  historicalSignificance: string;
  materials: CraftMaterial[];
  techniqueSteps: CraftTechniqueStep[];
  masterArtisan: MasterArtisanProfile;
  preservationStatus: 'thriving' | 'endangered_revival' | 'unesco_recognized';
}

export const CANONICAL_CRAFT_DATABASE: Record<string, RegionalCraftTradition[]> = {
  // Tamil Nadu (Chennai, Thanjavur, Kanchipuram)
  '60': [
    {
      id: 'craft-tn-01',
      name: 'Swamimalai Lost-Wax Bronze Casting',
      regionalOrigin: 'Swamimalai, Thanjavur District, Tamil Nadu',
      state: 'Tamil Nadu',
      category: 'metallurgy',
      dynasticPatronage: 'Chola Dynasty & Imperial Sthapati Guilds (9th–13th Century CE)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #1',
        year: '2008',
        certifiedOrigin: 'Swamimalai, Cauvery River Basin',
        crestLabel: 'Government of India GI Registered Heritage',
      },
      shortDescription:
        'Centuries-old cire-perdue (lost-wax) casting of sacred Hindu and cosmic deities, strictly governed by ancient Shilpa Shastra canonical proportions (Talamana system).',
      historicalSignificance:
        'Pioneered under Imperial Chola monarchs (Rajaraja I and Sembiyan Mahadevi), this technique created the world-renowned Chola Nataraja sculptures preserving metallurgical perfection for over a millennium.',
      materials: [
        { name: 'Panchaloha Alloy', description: 'Traditional sacred alloy of 5 metals: copper (80%), brass (15%), lead/tin (5%), with symbolic traces of silver and gold.', source: 'Cauvery delta artisanal smelters' },
        { name: 'Vandal Mud (Alluvial Clay)', description: 'Fine silt clay collected exclusively from Cauvery riverbanks, providing extreme heat resistance and ultra-fine mold fidelity.', source: 'Cauvery Riverbed, Thanjavur' },
        { name: 'Natural Beeswax & Dammar Gum', description: 'Blended pure forest beeswax and Kungiliyam tree resin for creating elastic, intricate hand-sculpted wax models.', source: 'Western Ghats forest reserves' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Wax Model Sculpting (Mezhugu Padam)',
          summary: 'Hand-sculpting the complete deity figure from heated beeswax and tree resin using bamboo spatulas.',
          detail: 'The master sculptor follows the exact Talamana proportional canon where 1 Tala equals 12 Angulas. Facial expressions, mudras, flowing drapery, and ornamental jewels are carved directly into the wax with warm brass tools.',
          tools: ['Bamboo Spatulas', 'Brass Carving Needles', 'Charcoal Brazier'],
          precisionKey: 'Talamana proportional ratio 1:9 for cosmic deities',
        },
        {
          stepNumber: 2,
          title: '3-Layer Silt Clay Molding (Karuvu)',
          summary: 'Enclosing the wax figure inside multiple layers of specialized Cauvery alluvial silt clays.',
          detail: 'First coat uses ultra-fine silt clay (Karuman) ground with charred cow dung. The second coat applies coarser sandy clay, and the outer layer reinforces the structure with paddy husk and wire binding to withstand 1,200°C molten metal pressure.',
          tools: ['Fine Muslin Cloth', 'Clay Grinding Mortar', 'Binding Wire Mesh'],
          precisionKey: 'Graduated particle size from 5 microns to 2mm',
        },
        {
          stepNumber: 3,
          title: 'Dewaxing & Molten Crucible Pour (Casting)',
          summary: 'Baking the mold to drain melted wax, followed by continuous pour of molten Panchaloha alloy.',
          detail: 'The hollow terracotta mold is heated in an underground pit kiln. As the wax drains through sprue holes, liquid Panchaloha at 1,150°C is poured in a continuous, unbroken stream to prevent air bubbles and internal porosity.',
          tools: ['Graphite Crucible', 'Pit Smelting Kiln', 'Long Tongs'],
          precisionKey: 'Continuous stream at 1,150°C without thermal shock',
        },
        {
          stepNumber: 4,
          title: 'Break-Out, Chiselling & Eye-Opening (Kanthirappu)',
          summary: 'Breaking the single-use mold, hand-chiselling details, and sacred consecration of the eyes.',
          detail: 'Once cooled naturally over 24 hours, the unique clay mold is broken. The solid bronze is hand-chiseled with tempered steel chisels, chased, polished with river sand and tamarind water, and completed with the ceremonial carving of the pupils.',
          tools: ['Tempered Steel Chisels (Uli)', 'Agate Burnishers', 'Tamarind Wash'],
          precisionKey: 'Micro-chiselling of facial features to 0.2mm precision',
        },
      ],
      masterArtisan: {
        name: 'Padma Shri Dr. R. Ravindran Sthapati',
        title: '34th Generation Hereditary Chola Sthapati',
        lineage: 'Direct ancestral lineage tracing back to the master builders of the Thanjavur Brihadisvara Temple (1010 CE).',
        location: 'Swamimalai, Thanjavur District, Tamil Nadu',
        awards: ['Padma Shri (National Honor)', 'National Master Craftsperson Award', 'UNESCO Shilpa Guru'],
        quote: 'Bronze casting is not mere metallurgy; it is the physical manifestation of cosmic geometry and divine stillness.',
      },
      preservationStatus: 'unesco_recognized',
    },
    {
      id: 'craft-tn-02',
      name: 'Kanchipuram Pure Gold-Zari Silk Weaving',
      regionalOrigin: 'Kanchipuram, Tamil Nadu',
      state: 'Tamil Nadu',
      category: 'textiles',
      dynasticPatronage: 'Pallava & Vijayanagara Dynasties (7th–16th Century CE)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #26',
        year: '2005',
        certifiedOrigin: 'Kanchipuram Temple Town, Tamil Nadu',
        crestLabel: 'Geographical Indications Registry of India',
      },
      shortDescription:
        'Heavyweight mulberry silk handloom sarees characterized by contrasting borders woven with pure silver wire electroplated with 24k gold, using the ancient 3-shuttle interlocking Korvai technique.',
      historicalSignificance:
        'Kanchipuram, the "Silk City", was the capital of the Pallavas. Weavers of the Saligar and Devanga communities settled around temples to weave ritual vestments for presiding deities.',
      materials: [
        { name: 'Pure Mulberry Silk (Murukku Pattu)', description: 'High-twist, 3-ply heavy silk yarn known for exceptional durability and deep lustre.', source: 'Kanchipuram & South Indian Sericulture' },
        { name: 'Pure Silver-Gold Zari', description: 'Certified 57% pure silver core wire electroplated with 0.5% pure 24k gold, wrapped over natural red silk core.', source: 'Surat & Kanchipuram Zari Units' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Silk Degumming & Natural Dyeing',
          summary: 'Boiling raw silk hanks in soapy water and dyeing in vibrant traditional hues.',
          detail: 'Silk threads undergo degumming to remove sericin, followed by manual dyeing in copper vats using vibrant traditional colors like Araku (lac red), Mayilkan (peacock green), and Muthu Kattam.',
          tools: ['Copper Dye Vats', 'Wooden Stirrers', 'Drying Racks'],
          precisionKey: 'Colorfastness tested against sun and salt-air exposure',
        },
        {
          stepNumber: 2,
          title: 'Warp Preparation & Reed Threading',
          summary: 'Stretching thousands of warp ends across wooden frames and threading through reeds.',
          detail: 'Over 4,800 individual silk warp ends are wound around bamboo drums, meticulously sized with rice starch paste, and threaded into steel reeds for uniform tension.',
          tools: ['Bamboo Warping Drum', 'Reed Hook', 'Starch Brush'],
          precisionKey: 'Tension calibration for 4,800+ warp ends',
        },
        {
          stepNumber: 3,
          title: 'Three-Shuttle Korvai Interlocking',
          summary: 'Two weavers operate three separate shuttles simultaneously to lock body and border.',
          detail: 'Unlike ordinary sarees, the body and border colors are entirely separate warp systems. The master weaver and assistant weave with three shuttles simultaneously, interlocking the wefts with a distinctive saw-tooth (Rekku) joint.',
          tools: ['Fly Shuttle Handloom', 'Pit Loom Harness', 'Pedal Treddles'],
          precisionKey: 'Interlocking 3 shuttles per pick with 0mm gap',
        },
        {
          stepNumber: 4,
          title: 'Jacquard Adai Zari Motif Integration',
          summary: 'Woven integration of temple gopuram, peacock (Mayil), and rudraksha motifs in pure gold zari.',
          detail: 'Traditional motifs drawn from Dravidian temple architecture are punched onto graph cards and lifted via the Adai harness, embedding shimmering metallic gold thread into the silk body.',
          tools: ['Adai String Harness', 'Zari Shuttles', 'Hand Loom Pickers'],
          precisionKey: 'Pure metallic density with zero floating threads on reverse',
        },
      ],
      masterArtisan: {
        name: 'Master Weaver V. Shanmugasundaram',
        title: 'Master Craftsman & National Merit Awardee',
        lineage: '8th-generation master weaver of the Kanchipuram Devanga hereditary weaving guild.',
        location: 'Kanchipuram Silk Cluster, Tamil Nadu',
        awards: ['National Award for Master Weavers', 'Tamil Nadu State Living Heritage Honor'],
        quote: 'A genuine Kanchipuram saree does not age; after fifty years, the silver zari only acquires the warm patina of an heirloom.',
      },
      preservationStatus: 'thriving',
    },
  ],

  // Rajasthan (Jaipur, Mewar, Marwar)
  '30': [
    {
      id: 'craft-rj-01',
      name: 'Jaipur Blue Pottery (Non-Clay Ceramic)',
      regionalOrigin: 'Jaipur, Rajasthan',
      state: 'Rajasthan',
      category: 'clay_pottery',
      dynasticPatronage: 'Kachwaha Rajput Kings & Maharaja Sawai Ram Singh II (19th Century CE)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #3',
        year: '2008',
        certifiedOrigin: 'Jaipur, Rajasthan',
        crestLabel: 'Government of India GI Certification',
      },
      shortDescription:
        'Turquoise and cobalt glazed ceramic ware crafted without clay, using a unique dough made from ground quartz stone, cullet glass, Fuller’s earth (Multani Mitti), and natural plant gum.',
      historicalSignificance:
        'Originating in Turko-Persian traditions and perfected in royal Jaipur ateliers during the 19th century, Jaipur Blue Pottery is celebrated globally for its delicate floral arabesques and luminous turquoise glaze.',
      materials: [
        { name: 'Ground Quartz Powder', description: 'Crushed white quartz stone (80%) forming the ceramic body matrix.', source: 'Aravalli Quartz Mines, Rajasthan' },
        { name: 'Cullet Glass Frit', description: 'Recycled and ground borosilicate glass providing vitrification strength.', source: 'Jaipur Recycled Glass Mills' },
        { name: 'Natural Mineral Pigments', description: 'Cobalt oxide for imperial blue, copper oxide for luminous turquoise, and iron oxide for warm ochre.', source: 'Artisanal Mineral Grinders' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Non-Clay Dough Preparation (Gundhai)',
          summary: 'Blending crushed quartz, glass frit, sajjimitti, and gum into an elastic ceramic dough.',
          detail: 'Unlike conventional earthenware, no plastic clay is used. Crushed quartz powder is mixed with glass powder, Multani Mitti, sodium carbonate, and Katira gum with water to form an elastic dough kneaded by foot.',
          tools: ['Stone Grinding Chakkis', 'Kneading Trough'],
          precisionKey: '80% quartz proportion to prevent shrinkage',
        },
        {
          stepNumber: 2,
          title: 'Open Mold Pressing & Base Turning',
          summary: 'Pressing flattened dough discs into open terracotta molds with ash release.',
          detail: 'The dough is rolled into flat circular pancakes, pressed firmly into open terracotta molds, and filled with wood ash or sieved sand to hold its form while drying in the sun.',
          tools: ['Terracotta Open Molds', 'Rolling Pin', 'Wooden Trimmers'],
          precisionKey: 'Uniform wall thickness of 4mm across circumference',
        },
        {
          stepNumber: 3,
          title: 'Freehand Mineral Painting (Likhaai)',
          summary: 'Hand-painting floral arabesques and Persian motifs with squirrel-hair brushes.',
          detail: 'The dry surface is coated with quartz slip, smoothed with sandpaper, and intricately painted freehand with cobalt oxide (dark blue) and copper oxide (turquoise) using brushes made from squirrel tail hair.',
          tools: ['Squirrel-Hair Brushes', 'Mineral Pigment Palettes', 'Centering Turntable'],
          precisionKey: 'Single-stroke continuous curvature on floral vines',
        },
        {
          stepNumber: 4,
          title: 'Single-Fire Vitrified Glaze (Bhatti Firing)',
          summary: 'Coating with a special glaze of glass, zinc oxide, and borax; single-fired at 850°C.',
          detail: 'Vessels are dipped in a transparent glaze slurry made of glass frit, potassium nitrate, and boric acid. They are loaded into traditional wood-fired kilns and fired once at 800–850°C for 6 hours.',
          tools: ['Muffled Updraft Kiln', 'Refractory Props', 'Pyrometric Cones'],
          precisionKey: 'Slow temperature ascent to prevent bubbling at 850°C',
        },
      ],
      masterArtisan: {
        name: 'Shri Kripal Singh Shekhawat (Legacy Guild)',
        title: 'Padma Shri Master of Blue Pottery Revival',
        lineage: 'Pioneering master who revived classical Jaipur pottery under the patronage of Maharani Gayatri Devi.',
        location: 'Kripal Kumbh Atelier, Jaipur, Rajasthan',
        awards: ['Padma Shri', 'National Master Craftsperson', 'Rajasthan Shilp Ratna'],
        quote: 'The soul of blue pottery is the desert sky: turquoise when calm, deep indigo when night descends over the dunes.',
      },
      preservationStatus: 'thriving',
    },
    {
      id: 'craft-rj-02',
      name: 'Kundan-Meenakari Enamel & 24k Gold Inlay',
      regionalOrigin: 'Jaipur (Johari Bazaar), Rajasthan',
      state: 'Rajasthan',
      category: 'metallurgy',
      dynasticPatronage: 'Raja Man Singh I of Amber & Mughal Imperial Court (16th Century CE)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #4',
        year: '2008',
        certifiedOrigin: 'Jaipur Royal Goldsmith Guilds',
        crestLabel: 'Government of India GI Tagged Mastercraft',
      },
      shortDescription:
        'Imperial jewelry craft combining reverse champlevé vitreous enamelling (Meenakari) with the front embedding of uncut gemstones using ultra-refined 24k gold foil (Kundan).',
      historicalSignificance:
        'Introduced to Amber by Raja Man Singh I who invited master enamellers from Lahore, creating an unbroken 400-year synthesis of Rajput chivalry and Mughal courtly opulence.',
      materials: [
        { name: '24k Pure Gold Foil (Kundan)', description: 'Hyper-refined 99.9% pure gold beaten to atomic thinness, self-welding under cold pressure without heat.', source: 'Jaipur Johari Guild' },
        { name: 'Vitreous Enamel Powders (Meena)', description: 'Pulverized colored glass rich in metallic oxides: cobalt, gold chloride, and iron.', source: 'Traditional Alchemists, Jaipur' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Ghaat Metal Framing',
          summary: 'Crafting the hollow gold framework with micro-depressions for stones and enamel.',
          detail: 'The Ghaat-kar goldsmith crafts the structural gold ornament, engraving hollow recesses (Khaka) on the reverse for enamelling and bezels on the obverse for gemstones.',
          tools: ['Jewelers Saw', 'Fine Engraving Burins', 'Anvil'],
          precisionKey: 'Wall thickness of 0.3mm to contain enamel',
        },
        {
          stepNumber: 2,
          title: 'Meenakari Enamelling (Champlevé Firing)',
          summary: 'Applying wet mineral enamel into engraved channels and firing sequentially.',
          detail: 'Colors are applied in order of melting points: first white (highest heat), followed by blues, greens, and lastly delicate ruby red. Each color is kiln-fired separately at 750–850°C.',
          tools: ['Muffled Electric/Charcoal Kiln', 'Enamel Agate Mortar', 'Applicator Stylus'],
          precisionKey: 'Sequential thermal firing from 850°C down to 720°C',
        },
        {
          stepNumber: 3,
          title: 'Jadai Gemstone Setting',
          summary: 'Placing polki uncut diamonds and emeralds into lac-filled bezels.',
          detail: 'The ornament is set into natural lac resin. Uncut Polki diamonds or rubies are positioned into the bezels with silver foil (Daak) placed beneath to amplify light refraction.',
          tools: ['Natural Lac Sticks', 'Brass Tweezers', 'Daak Silver Foil'],
          precisionKey: 'Reflective silver foil angle calibrated for light bounce',
        },
        {
          stepNumber: 4,
          title: 'Cold Kundan Gold Compression',
          summary: 'Compressing micro-thin 24k gold foils layer by layer around the stones.',
          detail: 'The Kundansaaz applies ribbons of pure 24k Kundan gold around the gem edges. Using steel burnishers, the gold is cold-compressed, welding molecularly without heat to seal the gems permanently.',
          tools: ['Agate Burnishers', 'Cold Pressure Needles (Kalam)'],
          precisionKey: 'Molecular cold-weld bond using pure 24k atomic plasticity',
        },
      ],
      masterArtisan: {
        name: 'Master Meenakar Inder Singh Kudrat',
        title: 'Presidential Awardee & National Master Enameller',
        lineage: 'Descendant of the original master enamellers invited from Lahore by Raja Man Singh in the 16th century.',
        location: 'Johari Bazaar Heritage Lane, Jaipur',
        awards: ['Padma Shri', 'National Master Craftsperson', 'UNESCO Seal of Excellence'],
        quote: 'Meenakari is painting with fire. While the world sees the diamonds on the front, only the wearer feels the secret poetry of enamel against the skin.',
      },
      preservationStatus: 'thriving',
    },
  ],

  // Bihar (Patna, Mithila, Nalanda)
  '80': [
    {
      id: 'craft-br-01',
      name: 'Madhubani (Mithila) Folk Painting',
      regionalOrigin: 'Mithila Region (Madhubani / Darbhanga), Bihar',
      state: 'Bihar',
      category: 'painting_folk',
      dynasticPatronage: 'Videha Kingdom (King Janaka) & Mithila Guilds (Ancient to Contemporary)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #6',
        year: '2007',
        certifiedOrigin: 'Mithila Region, Bihar',
        crestLabel: 'Government of India GI Tagged Folk Art',
      },
      shortDescription:
        'Ancient ritual folk art characterized by line drawings filled with vibrant natural pigments, depicting cosmic harmony, deities, flora, and fauna with double-line outlines and geometric hatching (Kachni & Bharni).',
      historicalSignificance:
        'Practiced for millennia by women of Mithila across five distinct stylistic branches (Bharni, Kachni, Tantrik, Godna, and Kohbar), chronicling Vedic cosmology, fertility blessings, and sacred nature.',
      materials: [
        { name: 'Natural Plant & Mineral Pigments', description: 'Lampblack soot for black, turmeric for yellow, kusum flowers for red, indigo for deep blue, and crushed rice paste for white.', source: 'Mithila flora and organic hearths' },
        { name: 'Bamboo Twigs & Cotton Swabs', description: 'Handmade styluses carved from dried bamboo stems wrapped in cotton fiber.', source: 'Local bamboo groves' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Handmade Canvas Sizing with Cow Dung Wash',
          summary: 'Treating handmade paper with a delicate wash of cow dung and multani mitti.',
          detail: 'Handmade cotton-rag paper is treated with a diluted natural wash of cow dung paste and water, which serves as a natural antiseptic, insect repellant, and gives a warm earthen ochre background tone.',
          tools: ['Cotton Sponge', 'Drying Screen'],
          precisionKey: 'Uniform earth wash with neutral pH balance',
        },
        {
          stepNumber: 2,
          title: 'Double-Line Contour Inscribing (Dohar Rekha)',
          summary: 'Inscribing bold black structural outlines using bamboo twigs dipped in lampblack.',
          detail: 'The artist sketches freehand without preliminary pencils. Characteristic double-lines are drawn using lampblack ink mixed with gum acacia, framing large fish-shaped eyes, pointed noses, and sacred cosmic elements.',
          tools: ['Carved Bamboo Nib (Kalam)', 'Lampblack Earthen Pot'],
          precisionKey: 'Unbroken fluid double-line contouring without rulers',
        },
        {
          stepNumber: 3,
          title: 'Kachni Hatching & Bharni Color Filling',
          summary: 'Filling enclosed fields with intricate parallel hatching lines and solid vegetable hues.',
          detail: 'In Kachni style, intricate parallel cross-hatching and dotting fill the spaces. In Bharni style, saturated blocks of vegetable colors (turmeric yellow, marigold orange, indigo blue) are applied with cotton swabs.',
          tools: ['Fine Bamboo Styluses', 'Cotton Swabs', 'Vegetable Ink Wells'],
          precisionKey: '1mm parallel line spacing across dense geometric patterns',
        },
        {
          stepNumber: 4,
          title: 'Sacred Symbolism & Kohbar Blessing',
          summary: 'Integrating sacred lotus (Kamal), bamboo grove (Bans), and fish (Matsya) motifs.',
          detail: 'Central matrimonial or mythological scenes are framed with auspicious floral borders, sun and moon deities, and fertility symbols representing the eternal cycle of creation and cosmic regeneration.',
          tools: ['Finishing Burnisher'],
          precisionKey: 'Zero empty negative space (Horror Vacui aesthetic)',
        },
      ],
      masterArtisan: {
        name: 'Padma Shri Smt. Mahasundari Devi (Heritage Lineage)',
        title: 'Legendary Pioneer of Mithila Folk Art',
        lineage: 'Pioneered the transition of Madhubani art from ephemeral mud walls (Kohbar Ghar) to archival canvas.',
        location: 'Ranti Village, Madhubani District, Bihar',
        awards: ['Padma Shri', 'National Award for Master Craftspersons', 'Tulsi Samman'],
        quote: 'Our brush is bamboo, our ink is the earth itself. Every line we draw is a prayer for harmony between human life and the cosmos.',
      },
      preservationStatus: 'unesco_recognized',
    },
  ],

  // Delhi / NCR / Uttar Pradesh
  '11': [
    {
      id: 'craft-dl-01',
      name: 'Zari-Zardozi Metallic Gold & Silver Embroidery',
      regionalOrigin: 'Old Delhi (Shahjahanabad) & Central UP',
      state: 'Delhi / Uttar Pradesh',
      category: 'textiles',
      dynasticPatronage: 'Delhi Sultanate & Mughal Imperial Karkhanas (13th–18th Century CE)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #11',
        year: '2013',
        certifiedOrigin: 'Delhi & Agra Guilds',
        crestLabel: 'Government of India GI Tagged Royal Embroidery',
      },
      shortDescription:
        'Lavish three-dimensional metallic embroidery executed on silk, velvet, and brocade grounds using gold and silver threads, micro-coiled wires (Salma), spangles (Sitara), and sequins.',
      historicalSignificance:
        'Nurtured in imperial Mughal workshops (Karkhanas) under Akbar and Shah Jahan, Zardozi adorned royal canopies, imperial tents, courtly robes (Farji), and ceremonial scabbards.',
      materials: [
        { name: 'Salma & Gijai Coiled Wires', description: 'Micro-coiled springy metallic wires in pure silver and gilded gold.', source: 'Old Delhi Zari Markets' },
        { name: 'Pure Silk Velvet Ground', description: 'Heavyweight mulberry silk velvet able to bear the weight of heavy metallic embroidery.', source: 'Traditional Handloom Mills' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Design Stencilling (Chaap)',
          summary: 'Perforating trace paper and rubbing chalk/kerosene mixture onto taut fabric.',
          detail: 'Architectural paisley and floral arabesque designs are drawn on butter paper, pin-pricked by hand, and transferred onto velvet stretched over a wooden frame (Adda) using chalk powder.',
          tools: ['Perforating Needles', 'Chalk Paste Sponge', 'Adda Wooden Frame'],
          precisionKey: 'Pin-prick density of 20 holes per linear inch',
        },
        {
          stepNumber: 2,
          title: 'Adda Wooden Frame Mounting',
          summary: 'Stretching heavy velvet with uniform multi-directional tension.',
          detail: 'The fabric ground is stitched to side cords and pulled taut across heavy wooden beams using iron ratchets to prevent puckering during dense metal stitching.',
          tools: ['Wooden Adda Beams', 'Tensioning Cords', 'Heavy Bodkins'],
          precisionKey: 'Drum-tight tension sustained over multi-week stitching',
        },
        {
          stepNumber: 3,
          title: 'Ari Needle Hook Stitching',
          summary: 'Stitching coiled gold wires from above while guiding thread from below.',
          detail: 'The master artisan uses a specialized awl-like hook needle (Ari). While holding the metallic wire on the top surface, the needle pierces through, catches the silk thread from underneath, and locks it with a micro-chain stitch.',
          tools: ['Ari Hook Needle', 'Micro Cutting Scissors', 'Bead Trays'],
          precisionKey: 'Uniform micro-chain stitches at 40 stitches per inch',
        },
        {
          stepNumber: 4,
          title: 'Relief Padding & Finishing (Katori / Sitara)',
          summary: 'Padding design elements with cotton cord for sculpted 3D relief effects.',
          detail: 'High-relief contours are underlaid with twisted cotton cords before being encased in gold wire, giving architectural dimension to canopies and imperial garments.',
          tools: ['Wooden Mallet', 'Embossing Burnisher'],
          precisionKey: 'Sculpted 3D relief elevation up to 8mm height',
        },
      ],
      masterArtisan: {
        name: 'Master Ustad Mohammad Naseem',
        title: 'National Master Craftsperson (Zardozi Guild)',
        lineage: '6th-generation royal court zardozi master of the Walled City of Delhi.',
        location: 'Ballimaran, Chandni Chowk, Old Delhi',
        awards: ['National Award for Master Craftsperson', 'Shilpa Guru Award'],
        quote: 'When the needle pierces the velvet, the gold thread must catch the light like stars over the Yamuna.',
      },
      preservationStatus: 'thriving',
    },
  ],

  // Maharashtra & Western India
  '40': [
    {
      id: 'craft-mh-01',
      name: 'Paithani Pure Silk & Tapestry Handloom Weaving',
      regionalOrigin: 'Paithan & Yeola, Maharashtra',
      state: 'Maharashtra',
      category: 'textiles',
      dynasticPatronage: 'Satavahana Dynasty & Maratha Peshwa Court (2nd Century BCE–18th Century CE)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #15',
        year: '2010',
        certifiedOrigin: 'Paithan & Yeola, Godavari Basin',
        crestLabel: 'Government of India GI Registered Heritage Weave',
      },
      shortDescription:
        'The "Queen of Silks", featuring interlocking tapestry weave borders and pallu woven with solid pure gold and silver zari, highlighted by vibrant multi-colored peacock (Mor-bangadi) and lotus motifs.',
      historicalSignificance:
        'Flourishing under the Satavahana Empire in ancient Pratishthana (modern Paithan) on the banks of the Godavari, Paithani sarees were traded to ancient Rome in exchange for gold and wine.',
      materials: [
        { name: 'Filature Mulberry Silk Yarn', description: 'Fine-denier pure silk yarn dyed in natural jewel tones.', source: 'Maharashtra Silk Board' },
        { name: 'Pure Silver-Gold Zari Weft', description: 'High-density metallic zari woven into solid golden tapestry grounds.', source: 'Surat & Yeola Zari Ateliers' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Manual Bobbin Warping (Kandee)',
          summary: 'Winding fine multi-colored silk threads onto bamboo bobbins (Kandees).',
          detail: 'Over 50 miniature wooden bobbins are wound with distinct colored silk yarns. Unlike jacquard weaving, each color motif in a Paithani is inserted manually by interlocking bobbins.',
          tools: ['Bamboo Kandees', 'Warping Reel'],
          precisionKey: 'Tension calibration for 60+ individual color bobbins',
        },
        {
          stepNumber: 2,
          title: 'Tapestry Weft Interlocking (Dhad)',
          summary: 'Interlocking warp and weft by hand without floating threads on the reverse.',
          detail: 'The weaver interlocks weft threads of different colors across the warp using a technique identical to ancient Persian tapestry. The reverse side is completely identical to the obverse.',
          tools: ['Heavy Wooden Handloom Pit', 'Comb Sley (Hatha)'],
          precisionKey: 'Zero reverse float threads; true double-faced tapestry',
        },
        {
          stepNumber: 3,
          title: 'Solid Gold Zari Pallu (Asawali / Mor-Bangadi)',
          summary: 'Weaving solid metallic gold ground adorned with intricate peacock rings.',
          detail: 'The grand pallu is woven with solid metallic zari, over which peacock medallions (Mor-bangadi), parrots (Muniya), and flowering vases (Asawali) are woven pixel by pixel.',
          tools: ['Point Paper Drafts', 'Bone Separators'],
          precisionKey: 'Up to 24 months of weaving for a single royal heirloom',
        },
        {
          stepNumber: 4,
          title: 'Natural River Water Finishing',
          summary: 'Polishing and setting the silk and gold drape on wooden rollers.',
          detail: 'The woven fabric is rolled under controlled tension on smooth teakwood rollers, yielding its signature supple, metallic drape and iridescent color shift (Dhoop-Chhaon).',
          tools: ['Teakwood Calendering Rollers'],
          precisionKey: 'Smooth mirror finish without breaking fragile gold threads',
        },
      ],
      masterArtisan: {
        name: 'Master Weaver Yashwantrao Shinde',
        title: 'Master Craftsman & National Award Winner',
        lineage: 'Hereditary weaver family serving the Peshwa courts in Yeola since 1780.',
        location: 'Yeola Paithani Cluster, Nashik, Maharashtra',
        awards: ['National Award for Handloom Weaving', 'Maharashtra State Pride Award'],
        quote: 'A true Paithani has no reverse side. Both sides speak the same golden truth.',
      },
      preservationStatus: 'thriving',
    },
  ],

  // Telangana & Hyderabad
  '50': [
    {
      id: 'craft-ts-01',
      name: 'Bidriware Pure Silver Inlay Metallurgy',
      regionalOrigin: 'Hyderabad / Bidar Border Region',
      state: 'Telangana',
      category: 'metallurgy',
      dynasticPatronage: 'Bahmani & Barid Shahi Sultanates, Asaf Jahi Nizams (14th–19th Century CE)',
      giTag: {
        registered: true,
        tagNumber: 'GI Application #18',
        year: '2006',
        certifiedOrigin: 'Deccan Plateau Metallurgical Guilds',
        crestLabel: 'Government of India GI Tagged Metallurgical Craft',
      },
      shortDescription:
        'A striking metallurgical art form where pure silver wire is hand-inlaid into a blackened non-ferrous zinc-copper alloy, darkened permanently using soil from historic fort ramparts.',
      historicalSignificance:
        'Originating in ancient Persia and flourishing in the Deccan Sultanates under royal patronage, Bidriware vessels, huqqa bases, and dagger hilts were prized diplomatic gifts across the Islamic and Asian courts.',
      materials: [
        { name: 'Zinc-Copper Alloy (16:1 ratio)', description: 'Melted cast alloy of 94% zinc and 6% copper offering high ductility for chiselling.', source: 'Deccan smelters' },
        { name: 'Pure 99.9% Silver Wire & Sheet (Tarkashi & Taihnishan)', description: 'Drawn pure silver wire hammered into micro-grooves.', source: 'Hyderabad bullion guild' },
        { name: 'Bidar Fort Rampart Soil', description: 'Specialized subterranean soil rich in potassium nitrate and ammonium chloride gathered from unexposed fort foundations.', source: 'Historic Bidar Fort' },
      ],
      techniqueSteps: [
        {
          stepNumber: 1,
          title: 'Sand-Clay Alloy Casting',
          summary: 'Casting the vessel body in a temporary sand mold with zinc-copper alloy.',
          detail: 'A mixture of soil, castor oil, and resin is packed around a master model. Molten zinc-copper alloy is poured to create the rough vessel body, which is turned on a lathe.',
          tools: ['Lathe Machine', 'Sand Mold Flasks', 'Melting Crucible'],
          precisionKey: 'Exact 16:1 zinc-to-copper alloy ratio for optimum chemical patina',
        },
        {
          stepNumber: 2,
          title: 'Copper Sulphate Blackening & Freehand Chiselling',
          summary: 'Temporary blackening with copper sulphate to sketch designs and chisel grooves.',
          detail: 'The raw alloy is dipped in temporary copper sulphate solution to turn it matte black. The artisan sketches intricate floral arabesques and chisels micro-V grooves with a tempered steel chisel.',
          tools: ['Tempered Steel Chisels (Kalam)', 'Miniature Hammer', 'Carving Vise'],
          precisionKey: 'Groove depth of 0.5mm with undercut sidewalls',
        },
        {
          stepNumber: 3,
          title: 'Pure Silver Wire & Sheet Inlaying (Tarkashi / Taihnishan)',
          summary: 'Hammering pure silver wires or sheets into the chiseled grooves.',
          detail: 'Pure silver wire (Tarkashi) or cut silver sheet (Taihnishan) is placed over the grooves and hammered firmly. The undercut sidewalls grip the silver permanently under cold pressure.',
          tools: ['Polished Steel Hammer', 'Silver Wire Spools', 'Agate Burnisher'],
          precisionKey: 'Flawless mechanical lock of silver into alloy under hammer blows',
        },
        {
          stepNumber: 4,
          title: 'Fort Soil Chemical Oxidation & Oil Buffing',
          summary: 'Boiling in specialized Bidar fort soil and sal-ammoniac solution for jet-black patina.',
          detail: 'The polished vessel is submerged in a boiling paste of Bidar fort soil and ammonium chloride. The zinc alloy turns velvety jet-black while the pure silver remains luminous white.',
          tools: ['Boiling Copper Vessel', 'Fort Soil Paste', 'Groundnut Oil Buffer'],
          precisionKey: 'Selective oxidation turning alloy jet-black without affecting pure silver',
        },
      ],
      masterArtisan: {
        name: 'Master Craftsman Ustad Shah Rasheed Ahmed Quadri',
        title: 'Padma Shri Awardee & National Master of Bidriware',
        lineage: 'Direct descendant of royal master craftsmen who served the Nizam of Hyderabad and Sultan of Bidar.',
        location: 'Hyderabad & Bidar Craft Cluster',
        awards: ['Padma Shri', 'National Master Craftsperson Award', 'UNESCO Seal of Excellence'],
        quote: 'The soil of the ancient fort gives the metal its midnight soul, while the silver reflects the eternal moon of the Deccan.',
      },
      preservationStatus: 'unesco_recognized',
    },
  ],
};

// Generic fallback craft for unmapped regions
const GENERIC_INDIAN_CRAFT_FALLBACK: RegionalCraftTradition = {
  id: 'craft-gen-01',
  name: 'Dokra Lost-Wax Bell Metal Casting',
  regionalOrigin: 'Tribal Belt (Central, Eastern & Southern India)',
  state: 'National Heritage Craft',
  category: 'metallurgy',
  dynasticPatronage: '4,000+ Years Unbroken Metallurgical Lineage from Harappan Epoch',
  giTag: {
    registered: true,
    tagNumber: 'GI Tagged Tribal Heritage',
    year: '2018',
    certifiedOrigin: 'Central & Eastern Tribal Belts',
    crestLabel: 'Government of India GI Certified Indigenous Art',
  },
  shortDescription:
    'Ancient non-ferrous lost-wax metal casting practiced for over 4,000 years, using coiled beeswax threads over clay cores to craft rustic, expressive figures and ritual vessels.',
  historicalSignificance:
    'Directly descended from the metallurgy of the iconic Indus Valley "Dancing Girl of Mohenjo-daro" (c. 2300 BCE), representing the oldest surviving metallurgical technique on Earth.',
  materials: [
    { name: 'Recycled Bell Metal / Brass', description: 'Alloy of copper and tin/zinc offering resonant tone and rustic golden-bronze patina.', source: 'Artisanal scrap & ingots' },
    { name: 'Natural Beeswax Threads', description: 'Beeswax extruded through wooden presses into uniform flexible threads.', source: 'Forest honey collectors' },
    { name: 'Clay & Rice Husk Mold Core', description: 'Porous core made of riverbed clay mixed with dried cow dung and rice husk.', source: 'Local alluvial soil' },
  ],
  techniqueSteps: [
    {
      stepNumber: 1,
      title: 'Clay Core Fabrication',
      summary: 'Shaping the rough inner core from river clay, sand, and rice husk.',
      detail: 'The clay core is roughly sculpted slightly smaller than the final piece and air-dried in the shade.',
      tools: ['Wooden Modeling Spatulas', 'Clay Sieve'],
      precisionKey: 'Core dried to 0% moisture to prevent internal steam explosions',
    },
    {
      stepNumber: 2,
      title: 'Beeswax Thread Coiling & Detailing',
      summary: 'Extruding flexible wax threads and wrapping the clay core in intricate spirals.',
      detail: 'Warm beeswax mixed with resin is extruded into thin threads. The artisan winds these threads around the clay core, shaping hair, ornaments, and facial features.',
      tools: ['Wooden Thread Extruder (Pichki)', 'Warm Water Bowl'],
      precisionKey: '1.5mm uniform wax thread diameter',
    },
    {
      stepNumber: 3,
      title: 'Secondary Clay Coating & Cup Funnel Attachment',
      summary: 'Applying fine clay coats and attaching an integral crucible cup with metal scrap.',
      detail: 'The wax-covered model is coated in fine mud slurry. A clay cup filled with raw metal scrap is sealed directly on top of the mold funnel.',
      tools: ['Clay Slurry Basin', 'Charcoal Bonding Paste'],
      precisionKey: 'Hermetically sealed crucible mold unit',
    },
    {
      stepNumber: 4,
      title: 'Inversion Smelting & Metal Pouring',
      summary: 'Heating in pit kiln and inverting the mold so molten metal flows into the hollow cavity.',
      detail: 'The unit is fired in an open pit kiln at 1,100°C. Once the metal melts in the top cup, the artisan flips the entire mold upside down, letting liquid bronze fill the space evacuated by the burned wax.',
      tools: ['Long Iron Tongs', 'Open Pit Kiln', 'Hand Bellows'],
      precisionKey: 'Instant 180° mold inversion at 1,100°C molten state',
    },
  ],
  masterArtisan: {
    name: 'Master Dokra Shilpkar Manik Karmakar',
    title: 'National Award Winner & Hereditary Metallurgical Master',
    lineage: 'Hereditary tribal metalsmith practicing the 4,000-year unbroken lost-wax lineage.',
    location: 'Bikna Dokra Village, West Bengal / Bastar Region',
    awards: ['National Award for Tribal Arts', 'Presidential Merit Honor'],
    quote: 'From Mohenjo-daro to today, our fire has never gone cold. In our hands, wax becomes immortal bronze.',
  },
  preservationStatus: 'unesco_recognized',
};

export interface CraftTraditionsProps {
  pincode: string;
  state?: string;
  regionEra?: string;
  className?: string;
}

export default function CraftTraditions({
  pincode,
  state,
  regionEra,
  className = '',
}: CraftTraditionsProps) {
  const cleanPin = (pincode || '').trim().replace(/\D/g, '');
  const prefix2 = cleanPin.substring(0, 2);

  // Resolve matching craft traditions based on 2-digit PIN prefix
  const craftList: RegionalCraftTradition[] = useMemo(() => {
    const matched = CANONICAL_CRAFT_DATABASE[prefix2];
    if (matched && matched.length > 0) {
      return matched;
    }

    // Secondary prefix fallbacks (e.g. 68/69 -> Kerala, 70/71/72 -> Bengal, 75/76/77 -> Odisha, etc.)
    const firstDigit = cleanPin.charAt(0);
    if (firstDigit === '6') {
      return CANONICAL_CRAFT_DATABASE['60'] || [GENERIC_INDIAN_CRAFT_FALLBACK];
    } else if (firstDigit === '3') {
      return CANONICAL_CRAFT_DATABASE['30'] || [GENERIC_INDIAN_CRAFT_FALLBACK];
    } else if (firstDigit === '8') {
      return CANONICAL_CRAFT_DATABASE['80'] || [GENERIC_INDIAN_CRAFT_FALLBACK];
    } else if (firstDigit === '1' || firstDigit === '2') {
      return CANONICAL_CRAFT_DATABASE['11'] || [GENERIC_INDIAN_CRAFT_FALLBACK];
    } else if (firstDigit === '4') {
      return CANONICAL_CRAFT_DATABASE['40'] || [GENERIC_INDIAN_CRAFT_FALLBACK];
    } else if (firstDigit === '5') {
      return CANONICAL_CRAFT_DATABASE['50'] || [GENERIC_INDIAN_CRAFT_FALLBACK];
    }

    return [GENERIC_INDIAN_CRAFT_FALLBACK];
  }, [cleanPin, prefix2]);

  const [selectedCraftIndex, setSelectedCraftIndex] = useState<number>(0);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Reset indices when pincode or craft list changes
  React.useEffect(() => {
    setSelectedCraftIndex(0);
    setActiveStepIndex(0);
  }, [cleanPin]);

  const activeCraft = craftList[selectedCraftIndex] || craftList[0] || GENERIC_INDIAN_CRAFT_FALLBACK;
  const activeStep = activeCraft.techniqueSteps[activeStepIndex] || activeCraft.techniqueSteps[0];

  const narrationText = useMemo(() => {
    return `Regional Craft Tradition: ${activeCraft.name}. Originating from ${activeCraft.regionalOrigin}, under the patronage of ${activeCraft.dynasticPatronage}. ${activeCraft.shortDescription} Master artisan ${activeCraft.masterArtisan.name}, a ${activeCraft.masterArtisan.title}, notes: "${activeCraft.masterArtisan.quote}".`;
  }, [activeCraft]);

  return (
    <section
      aria-label="Interactive Regional Craft Traditions"
      className={`rounded-3xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--paper-raised)] via-[var(--paper-raised)] to-[var(--accent-bronze-soft)]/20 shadow-md p-6 sm:p-8 space-y-7 transition-all duration-300 ${className}`}
    >
      {/* 1. Header with Badge & Read Aloud */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--rule)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-bronze-soft)] text-[var(--accent-bronze)] text-[11px] font-bold uppercase tracking-wider">
              <Hammer className="w-3.5 h-3.5" />
              <span>Living Mastercraft Traditions &amp; GI Heritage</span>
            </span>

            {activeCraft.giTag.registered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--verified)]/40 text-[11px] font-semibold text-[var(--verified)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{activeCraft.giTag.tagNumber} ({activeCraft.giTag.year})</span>
              </span>
            )}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight">
            {activeCraft.name}
          </h2>

          <p className="text-xs sm:text-sm text-[var(--ink-muted)] flex items-center gap-1.5 flex-wrap">
            <Compass className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
            <span>{activeCraft.regionalOrigin}</span>
            <span>·</span>
            <span className="font-medium text-[var(--ink)]">{activeCraft.dynasticPatronage}</span>
          </p>
        </div>

        {/* Audio read-aloud button for craft lineage */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ReadAloudButton textToRead={narrationText} />
        </div>
      </div>

      {/* 2. Multi-Craft Tabs (if region has multiple crafts) */}
      {craftList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] flex-shrink-0 mr-1">
            Regional Traditions:
          </span>
          {craftList.map((craft, idx) => (
            <button
              key={craft.id}
              type="button"
              onClick={() => {
                setSelectedCraftIndex(idx);
                setActiveStepIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all tactile-press ${
                selectedCraftIndex === idx
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-xs'
                  : 'bg-[var(--paper)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--rule)] hover:border-[var(--accent)]/40'
              }`}
            >
              {craft.name}
            </button>
          ))}
        </div>
      )}

      {/* 3. Craft Narrative & Historical Significance Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Narrative & Technique Walkthrough */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview text */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                Living Cultural Heritage
              </span>
              <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                Category: <span className="capitalize text-[var(--ink)]">{activeCraft.category.replace('_', ' ')}</span>
              </span>
            </div>
            <p className="text-sm sm:text-base text-[var(--ink)] leading-relaxed font-serif">
              &ldquo;{activeCraft.shortDescription}&rdquo;
            </p>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed pt-2 border-t border-[var(--rule)]/60">
              {activeCraft.historicalSignificance}
            </p>
          </div>

          {/* Interactive Step-by-Step Historical Technique Stepper */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--rule)]/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--ink)]">
                    Historical Technique Breakdown
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-[var(--ink-muted)]">
                    Stage {activeStepIndex + 1} of {activeCraft.techniqueSteps.length}
                  </span>
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] text-[var(--ink)] hover:bg-[var(--paper)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Previous technique step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={activeStepIndex === activeCraft.techniqueSteps.length - 1}
                  onClick={() => setActiveStepIndex((prev) => Math.min(activeCraft.techniqueSteps.length - 1, prev + 1))}
                  className="p-1.5 rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] text-[var(--ink)] hover:bg-[var(--paper)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Next technique step"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Selection Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activeCraft.techniqueSteps.map((step, sIdx) => (
                <button
                  key={step.stepNumber}
                  type="button"
                  onClick={() => setActiveStepIndex(sIdx)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    activeStepIndex === sIdx
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-2xs'
                      : 'bg-[var(--paper-raised)] border-[var(--rule)] text-[var(--ink-muted)] hover:border-[var(--accent)]/30 hover:text-[var(--ink)]'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    Step {step.stepNumber}
                  </div>
                  <div className="text-xs truncate font-medium">
                    {step.title.split('(')[0]}
                  </div>
                </button>
              ))}
            </div>

            {/* Active Step Content Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-0.5">
                    Step {activeStep.stepNumber} — Phase Execution
                  </span>
                  <h4 className="font-serif text-base font-semibold text-[var(--ink)]">
                    {activeStep.title}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-bold font-mono">
                  {activeStep.precisionKey}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-sans">
                {activeStep.detail}
              </p>

              {/* Tools Used Strip */}
              {activeStep.tools && activeStep.tools.length > 0 && (
                <div className="pt-2 border-t border-[var(--rule)]/60 flex items-center gap-2 flex-wrap text-xs text-[var(--ink-muted)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
                    Traditional Tools:
                  </span>
                  {activeStep.tools.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--rule)] text-[11px] font-medium text-[var(--ink)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Materials, Artisan Spotlight & GI Crest */}
        <div className="lg:col-span-5 space-y-6">
          {/* Authentic Raw Materials Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-4 shadow-2xs">
            <h3 className="font-serif text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[var(--accent)]" />
              <span>Authentic Raw Materials &amp; Sourcing</span>
            </h3>

            <div className="space-y-3">
              {activeCraft.materials.map((mat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[var(--ink)]">
                      {mat.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--accent)] font-medium">
                      {mat.source}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                    {mat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Living Master Artisan Profile Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--accent-bronze-soft)] text-[var(--accent-bronze)]">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--ink)]">
                    Living Master Artisan Spotlight
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-[var(--ink-muted)]">
                    Hereditary Guild Lineage
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <h4 className="font-serif text-base font-semibold text-[var(--ink)]">
                  {activeCraft.masterArtisan.name}
                </h4>
                <div className="text-xs text-[var(--accent-bronze)] font-medium">
                  {activeCraft.masterArtisan.title}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                  {activeCraft.masterArtisan.location}
                </div>
              </div>

              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {activeCraft.masterArtisan.lineage}
              </p>

              {/* Artisan quote */}
              <div className="p-3.5 rounded-xl bg-[var(--accent-bronze-soft)]/40 border border-[var(--accent-bronze)]/20 italic text-xs text-[var(--ink)] leading-relaxed font-serif">
                &ldquo;{activeCraft.masterArtisan.quote}&rdquo;
              </div>

              {/* Honors / Awards badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeCraft.masterArtisan.awards.map((award, aIdx) => (
                  <span
                    key={aIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--paper-raised)] border border-[var(--rule)] text-[10px] font-semibold text-[var(--ink)]"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[var(--verified)]" />
                    <span>{award}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Geographical Indication (GI) Certification Seal */}
          {activeCraft.giTag.registered && (
            <div className="p-4 rounded-2xl bg-[var(--verified-soft)]/60 border border-[var(--verified)]/30 flex items-start gap-3 text-xs text-[var(--ink)] shadow-2xs">
              <div className="p-2 rounded-xl bg-[var(--verified)] text-white flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--verified)]">
                  {activeCraft.giTag.crestLabel}
                </div>
                <div className="font-semibold text-xs text-[var(--ink)]">
                  {activeCraft.giTag.tagNumber} · Certified Origin: {activeCraft.giTag.certifiedOrigin}
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] leading-snug">
                  Protected under the Geographical Indications of Goods Act (1999) guaranteeing authenticity, generational technique preservation, and anti-counterfeiting verification.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
