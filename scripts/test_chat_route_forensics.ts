import { NextRequest } from 'next/server';
import { POST } from '../app/api/museum-chat/route';

async function runRouteForensicTests() {
  console.log('Testing /api/museum-chat route handler directly...\n');

  // Test 1: Valid query for National Museum New Delhi
  const req1 = new NextRequest('http://localhost:3000/api/museum-chat', {
    method: 'POST',
    body: JSON.stringify({
      museumId: 'mus-in-del-001',
      question: 'What are the opening timings and weekly holidays?'
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log('Test 1 (Timings Query): Status =', res1.status, '| Response Status =', data1.status);
  console.log('Reply preview:', data1.reply.substring(0, 100));
  if (res1.status !== 200 || !data1.reply.includes('10:00') || !data1.reply.includes('Monday')) {
    throw new Error('Test 1 Failed: Timings query did not return expected grounded data');
  }

  // Test 2: Fee query for Government Museum Chennai
  const req2 = new NextRequest('http://localhost:3000/api/museum-chat', {
    method: 'POST',
    body: JSON.stringify({
      museumId: 'mus-in-che-001',
      question: 'How much are the entry tickets for Indians and foreigners?'
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log('Test 2 (Fees Query): Status =', res2.status, '| Domestic = ₹15, Foreign = ₹250');
  console.log('Reply preview:', data2.reply.substring(0, 100));
  if (res2.status !== 200 || !data2.reply.includes('15') || !data2.reply.includes('250')) {
    throw new Error('Test 2 Failed: Fee query did not return grounded fees');
  }

  // Test 3: Missing museumId -> 400 Bad Request
  const req3 = new NextRequest('http://localhost:3000/api/museum-chat', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Hello'
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res3 = await POST(req3);
  console.log('Test 3 (Missing museumId): Status =', res3.status);
  if (res3.status !== 400) {
    throw new Error(`Test 3 Failed: Expected 400, got ${res3.status}`);
  }

  // Test 4: Unknown museumId -> 404 Not Found
  const req4 = new NextRequest('http://localhost:3000/api/museum-chat', {
    method: 'POST',
    body: JSON.stringify({
      museumId: 'non-existent-museum-id',
      question: 'Hello'
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res4 = await POST(req4);
  console.log('Test 4 (Unknown museumId): Status =', res4.status);
  if (res4.status !== 404) {
    throw new Error(`Test 4 Failed: Expected 404, got ${res4.status}`);
  }

  // Test 5: Empty question -> 400 Bad Request
  const req5 = new NextRequest('http://localhost:3000/api/museum-chat', {
    method: 'POST',
    body: JSON.stringify({
      museumId: 'mus-in-del-001',
      question: '   '
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const res5 = await POST(req5);
  console.log('Test 5 (Empty question): Status =', res5.status);
  if (res5.status !== 400) {
    throw new Error(`Test 5 Failed: Expected 400, got ${res5.status}`);
  }

  console.log('\nALL API ROUTE FORENSIC CHECKS PASSED.');
}

runRouteForensicTests().catch(err => {
  console.error('API Route Forensic Test Failed:', err);
  process.exit(1);
});
