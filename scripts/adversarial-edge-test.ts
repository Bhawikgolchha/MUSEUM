async function testLiveEdge() {
  const BASE_URL = 'https://museum-ebon-two.vercel.app';
  console.log(`=== ADVERSARIAL LIVE EDGE SUITE FOR ${BASE_URL} ===\n`);

  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<{ ok: boolean; msg: string }>) {
    try {
      const res = await fn();
      if (res.ok) {
        console.log(`[PASS] ${name} -> ${res.msg}`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} -> ${res.msg}`);
        failed++;
      }
    } catch (e: any) {
      console.error(`[ERROR] ${name} -> ${e.message}`);
      failed++;
    }
  }

  // 1. Root & Core Routes
  await check('Root Page GET /', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const text = await res.text();
    const is200 = res.status === 200;
    const hasHtml = text.includes('<!DOCTYPE html>') || text.includes('<html');
    const hasMuse = text.includes('Digital Muse') || text.includes('Same facts');
    return { ok: is200 && hasHtml && hasMuse, msg: `Status ${res.status}, Content-Type: ${res.headers.get('content-type')}, bytes: ${text.length}` };
  });

  await check('Explore Page GET /explore', async () => {
    const res = await fetch(`${BASE_URL}/explore`);
    const text = await res.text();
    return { ok: res.status === 200 && text.includes('Museum'), msg: `Status ${res.status}, bytes: ${text.length}` };
  });

  await check('Roots Page GET /roots', async () => {
    const res = await fetch(`${BASE_URL}/roots`);
    const text = await res.text();
    return { ok: res.status === 200 && text.includes('Roots'), msg: `Status ${res.status}, bytes: ${text.length}` };
  });

  await check('Add Page GET /add', async () => {
    const res = await fetch(`${BASE_URL}/add`);
    const text = await res.text();
    return { ok: res.status === 200 && text.includes('Add'), msg: `Status ${res.status}, bytes: ${text.length}` };
  });

  // 2. All 6 SSG Artifact pages
  for (let i = 1; i <= 6; i++) {
    const id = `art-00${i}`;
    await check(`SSG Artifact /artifact/${id}`, async () => {
      const res = await fetch(`${BASE_URL}/artifact/${id}`);
      const text = await res.text();
      return { ok: res.status === 200 && text.includes(id), msg: `Status 200, length ${text.length}` };
    });
  }

  // 3. Custom 404 Route handling (Edge check)
  await check('Custom 404 on invalid artifact /artifact/art-999', async () => {
    const res = await fetch(`${BASE_URL}/artifact/art-999`);
    const text = await res.text();
    const is404 = res.status === 404;
    const isCustom = text.includes('Object Not Found') && text.includes('Return to Collection');
    const isNotVercelGeneric = !text.includes('404: NOT_FOUND');
    return { ok: is404 && isCustom && isNotVercelGeneric, msg: `Status ${res.status} (Custom UI rendered: ${isCustom})` };
  });

  await check('Custom 404 on arbitrary random path /gibberish-path-12345', async () => {
    const res = await fetch(`${BASE_URL}/gibberish-path-12345`);
    const text = await res.text();
    const is404 = res.status === 404;
    const isCustom = text.includes('Object Not Found') && text.includes('Return to Collection');
    return { ok: is404 && isCustom, msg: `Status ${res.status} (Custom UI rendered: ${isCustom})` };
  });

  // 4. Static Images Assets
  const images = [
    '/images/dancing_girl.jpg',
    '/images/chola_nataraja.jpg',
    '/images/didarganj_yakshi.jpg',
    '/images/ashoka_lion_capital.jpg',
    '/images/sarnath_buddha.jpg',
    '/images/sultanganj_buddha.jpg'
  ];
  for (const img of images) {
    await check(`Static Image ${img}`, async () => {
      const res = await fetch(`${BASE_URL}${img}`);
      const ct = res.headers.get('content-type') || '';
      const cl = res.headers.get('content-length') || '';
      return { ok: res.status === 200 && ct.includes('image'), msg: `Status 200, ${ct}, ${cl} bytes` };
    });
  }

  // 5. API /api/muse Adversarial Probes
  await check('API /api/muse valid POST request', async () => {
    const res = await fetch(`${BASE_URL}/api/muse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifactId: 'art-001', persona: { audience: 'child', depth: 'quick', accessibility: false } })
    });
    const json: any = await res.json();
    return {
      ok: res.status === 200 && json.status === 'ok' && json.variant && json.variant.artifactId === 'art-001',
      msg: `Status 200, status: ${json.status}, sections: ${json.variant?.sections?.length}`
    };
  });

  await check('API /api/muse invalid artifactId graceful fallback', async () => {
    const res = await fetch(`${BASE_URL}/api/muse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifactId: 'art-unknown-999', persona: { audience: 'child', depth: 'quick', accessibility: false } })
    });
    const json: any = await res.json();
    return {
      ok: res.status === 200 && json.status === 'fallback' && json.reason.includes('not found'),
      msg: `Status 200, status: ${json.status}, reason: ${json.reason}`
    };
  });

  await check('API /api/muse missing body graceful fallback', async () => {
    const res = await fetch(`${BASE_URL}/api/muse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json: any = await res.json();
    return {
      ok: res.status === 200 && json.status === 'fallback' && json.reason.includes('Missing'),
      msg: `Status 200, status: ${json.status}, reason: ${json.reason}`
    };
  });

  await check('API /api/muse GET method rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/muse`, { method: 'GET' });
    return { ok: res.status === 405, msg: `Status ${res.status}` };
  });

  // 6. API /api/verify Adversarial Probes
  await check('API /api/verify valid POST request', async () => {
    const res = await fetch(`${BASE_URL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactId: 'art-001',
        variant: {
          artifactId: 'art-001',
          persona: { audience: 'adult', depth: 'standard', accessibility: false },
          attribution: 'Test',
          aiDisclosure: 'Test',
          tags: { tone: 'conversational', level: 'grade_9', tier: 'T1' },
          readingTimeSeconds: 60,
          sections: [{ heading: 'Overview', body: 'The Dancing Girl of Mohenjo-daro is an ancient bronze sculpture circa 2300-1750 BCE.' }],
          lookCloser: [],
          glossary: [],
          changelog: { operations: [], claimsCovered: [], claimsOmitted: [], hedgesPreserved: true },
          fidelity: { verdict: 'pass', covered: 6, total: 6, claims: [] }
        }
      })
    });
    const json: any = await res.json();
    return {
      ok: res.status === 200 && (json.verdict === 'pass' || json.verdict === 'warn'),
      msg: `Status 200, verdict: ${json.verdict}, covered: ${json.covered}/${json.total}`
    };
  });

  await check('API /api/verify missing variant payload graceful fallback', async () => {
    const res = await fetch(`${BASE_URL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifactId: 'art-001' })
    });
    const json: any = await res.json();
    return {
      ok: res.status === 200 && json.verdict === 'unverified',
      msg: `Status 200, verdict: ${json.verdict}`
    };
  });

  // 7. Check Next.js Static JS Chunks Hydration from Edge
  await check('Next.js Client Hydration Manifest /_next/static', async () => {
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootHtml = await rootRes.text();
    const scriptMatch = rootHtml.match(/src="(\/_next\/static\/[^"]+)"/);
    if (!scriptMatch) {
      return { ok: false, msg: 'Could not find any Next static script in root HTML' };
    }
    const scriptUrl = `${BASE_URL}${scriptMatch[1]}`;
    const scriptRes = await fetch(scriptUrl);
    return { ok: scriptRes.status === 200, msg: `Script ${scriptMatch[1]} returned HTTP ${scriptRes.status} (${scriptRes.headers.get('content-type')})` };
  });

  console.log('\n========================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

testLiveEdge().catch((err) => {
  console.error(err);
  process.exit(1);
});
