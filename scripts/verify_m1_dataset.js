const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '../data/indian-museums.json'), 'utf8');
const museums = JSON.parse(raw);

console.log('Total museums in dataset:', museums.length);
if (museums.length !== 21) {
  console.error('FAIL: Expected 21 museums, got', museums.length);
  process.exit(1);
}

const pinRegex = /^[1-9][0-9]{5}$/;
const ids = new Set();
const pins = new Set();

museums.forEach((m, idx) => {
  if (!m.id) throw new Error('Museum ' + idx + ' missing id');
  if (ids.has(m.id)) throw new Error('Duplicate id: ' + m.id);
  ids.add(m.id);

  if (!m.name) throw new Error('Museum ' + m.id + ' missing name');
  if (!m.address) throw new Error('Museum ' + m.id + ' missing address');
  if (!m.city) throw new Error('Museum ' + m.id + ' missing city');
  if (!m.state) throw new Error('Museum ' + m.id + ' missing state');
  if (!m.pincode || !pinRegex.test(m.pincode)) throw new Error('Museum ' + m.id + ' invalid pincode: ' + m.pincode);
  pins.add(m.pincode);

  if (!m.coordinates || typeof m.coordinates.lat !== 'number' || typeof m.coordinates.lon !== 'number') {
    throw new Error('Museum ' + m.id + ' invalid coordinates');
  }
  if (m.coordinates.lat < 8.0 || m.coordinates.lat > 38.0 || m.coordinates.lon < 68.0 || m.coordinates.lon > 98.0) {
    throw new Error('Museum ' + m.id + ' coordinates out of India bounds: ' + JSON.stringify(m.coordinates));
  }

  if (!m.category) throw new Error('Museum ' + m.id + ' missing category');
  if (!m.governance) throw new Error('Museum ' + m.id + ' missing governance');
  if (!m.opening_hours || !m.opening_hours.schedule || !Array.isArray(m.opening_hours.closed_on) || !m.opening_hours.timings) {
    throw new Error('Museum ' + m.id + ' invalid opening_hours');
  }
  if (!m.entry_fee || typeof m.entry_fee.is_free !== 'boolean' || typeof m.entry_fee.domestic_inr !== 'number' || typeof m.entry_fee.foreign_inr !== 'number') {
    throw new Error('Museum ' + m.id + ' invalid entry_fee');
  }
  if (!Array.isArray(m.accessibility_features) || m.accessibility_features.length === 0) {
    throw new Error('Museum ' + m.id + ' missing accessibility_features');
  }
  if (!m.contact) throw new Error('Museum ' + m.id + ' missing contact');
  if (!m.thumbnail_url) throw new Error('Museum ' + m.id + ' missing thumbnail_url');
  if (!Array.isArray(m.gallery_urls) || m.gallery_urls.length === 0) throw new Error('Museum ' + m.id + ' missing gallery_urls');
  if (!m.description || m.description.length < 20) throw new Error('Museum ' + m.id + ' invalid description');
  if (typeof m.artifact_count_approx !== 'number' || m.artifact_count_approx <= 0) throw new Error('Museum ' + m.id + ' invalid artifact_count_approx');
  if (!m.source) throw new Error('Museum ' + m.id + ' missing source');
  if (!m.last_updated) throw new Error('Museum ' + m.id + ' missing last_updated');

  console.log('✓ [' + (idx + 1) + '/21] ' + m.id + ' | ' + m.name + ' (' + m.city + ', ' + m.state + ' - PIN: ' + m.pincode + ')');
});

console.log('\nSUCCESS: All 21 museums validated with strict schema adherence.');
