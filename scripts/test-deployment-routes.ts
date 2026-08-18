import http from 'http';
import { spawn, ChildProcess } from 'child_process';

const PORT = 3012;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUrl(urlPath: string, options: RequestInit = {}): Promise<{ status: number; text: string }> {
  const res = await fetch(`${BASE_URL}${urlPath}`, options);
  const text = await res.text();
  return { status: res.status, text };
}

async function waitForServer(retries = 60): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status === 200) {
        return true;
      }
    } catch {
      // server not ready yet
    }
    await sleep(500);
  }
  return false;
}

async function runVerification() {
  console.log('--- Starting Next.js Production Server for Route Verification ---');
  
  let serverLogs = '';
  const isWin = process.platform === 'win32';
  const serverProc: ChildProcess = spawn(
    isWin ? 'cmd.exe' : 'npx',
    isWin ? ['/c', 'npx next start -p 3012'] : ['next', 'start', '-p', String(PORT)],
    {
      stdio: 'pipe',
      cwd: process.cwd(),
    }
  );

  serverProc.stdout?.on('data', (d) => {
    serverLogs += d.toString();
  });
  serverProc.stderr?.on('data', (d) => {
    serverLogs += d.toString();
  });

  const isReady = await waitForServer();
  if (!isReady) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(serverProc.pid), '/f', '/t']);
    } else {
      serverProc.kill('SIGTERM');
    }
    console.error('Server output:\n', serverLogs);
    throw new Error(`Server failed to start on port ${PORT} within timeout`);
  }

  console.log(`✓ Next.js server running on ${BASE_URL}\n`);

  let allPassed = true;

  const testCases = [
    {
      name: 'R1/R2 Root Page (/)',
      path: '/',
      expectedStatus: 200,
      expectedTextSnippet: 'Same facts. Re-voiced for whoever is reading.',
    },
    {
      name: 'Explore Page (/explore)',
      path: '/explore',
      expectedStatus: 200,
      expectedTextSnippet: 'Find Museums by Area',
    },
    {
      name: 'Roots Page (/roots)',
      path: '/roots',
      expectedStatus: 200,
      expectedTextSnippet: 'Connect to Your Roots',
    },
    {
      name: 'Artifact SSG (/artifact/art-001)',
      path: '/artifact/art-001',
      expectedStatus: 200,
      expectedTextSnippet: 'Dancing Girl of Mohenjo-daro',
    },
    {
      name: 'Artifact SSG (/artifact/art-002)',
      path: '/artifact/art-002',
      expectedStatus: 200,
      expectedTextSnippet: 'Chola Bronze Nataraja',
    },
    {
      name: 'Artifact SSG (/artifact/art-003)',
      path: '/artifact/art-003',
      expectedStatus: 200,
      expectedTextSnippet: 'Didarganj Yakshi',
    },
    {
      name: 'Artifact SSG (/artifact/art-004)',
      path: '/artifact/art-004',
      expectedStatus: 200,
      expectedTextSnippet: 'Lion Capital of Ashoka',
    },
    {
      name: 'Artifact SSG (/artifact/art-005)',
      path: '/artifact/art-005',
      expectedStatus: 200,
      expectedTextSnippet: 'Standing Buddha of Sarnath',
    },
    {
      name: 'Artifact SSG (/artifact/art-006)',
      path: '/artifact/art-006',
      expectedStatus: 200,
      expectedTextSnippet: 'Sultanganj Bronze Buddha',
    },
    {
      name: 'Non-existent Artifact (/artifact/art-999)',
      path: '/artifact/art-999',
      expectedStatus: 404,
      expectedTextSnippet: 'Object Not Found',
    },
    {
      name: 'Non-existent URL (/non-existent-page-test)',
      path: '/non-existent-page-test',
      expectedStatus: 404,
      expectedTextSnippet: 'Object Not Found',
    },
  ];

  for (const tc of testCases) {
    try {
      const res = await fetchUrl(tc.path);
      const statusOk = res.status === tc.expectedStatus;
      const snippetOk = res.text.includes(tc.expectedTextSnippet);

      if (statusOk && snippetOk) {
        console.log(`[PASS] ${tc.name} -> HTTP ${res.status} (Verified content match)`);
      } else {
        allPassed = false;
        console.error(`[FAIL] ${tc.name} -> HTTP ${res.status} (Expected ${tc.expectedStatus}), snippet match: ${snippetOk}`);
      }
    } catch (err) {
      allPassed = false;
      console.error(`[ERROR] ${tc.name} ->`, err);
    }
  }

  // Test API /api/muse
  try {
    const museRes = await fetchUrl('/api/muse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactId: 'art-001',
        persona: { audience: 'child', depth: 'quick', accessibility: false },
      }),
    });
    if (museRes.status === 200 && museRes.text.includes('"status":"ok"')) {
      console.log(`[PASS] API /api/muse POST -> HTTP 200 (Valid JSON variant returned)`);
    } else {
      allPassed = false;
      console.error(`[FAIL] API /api/muse -> HTTP ${museRes.status} (Body: ${museRes.text.substring(0, 100)})`);
    }
  } catch (err) {
    allPassed = false;
    console.error(`[ERROR] API /api/muse ->`, err);
  }

  // Test API /api/verify
  try {
    const verifyRes = await fetchUrl('/api/verify', {
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
          fidelity: { verdict: 'pass', covered: 6, total: 6, claims: [] },
        },
      }),
    });
    if (verifyRes.status === 200 && verifyRes.text.includes('"verdict"')) {
      console.log(`[PASS] API /api/verify POST -> HTTP 200 (Valid JSON fidelity report returned)`);
    } else {
      allPassed = false;
      console.error(`[FAIL] API /api/verify -> HTTP ${verifyRes.status} (Body: ${verifyRes.text.substring(0, 100)})`);
    }
  } catch (err) {
    allPassed = false;
    console.error(`[ERROR] API /api/verify ->`, err);
  }

  // Kill server process
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(serverProc.pid), '/f', '/t']);
  } else {
    serverProc.kill('SIGTERM');
  }

  console.log('\n----------------------------------------');
  if (allPassed) {
    console.log('✓ ALL DEPLOYMENT & ROUTING CHECKS PASSED!');
  } else {
    console.error('✗ SOME CHECKS FAILED');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
