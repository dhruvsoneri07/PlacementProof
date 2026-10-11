// Comprehensive assert-based test for Express MPA routes & Forensic API
const http = require('http');
const assert = require('assert');

process.env.PORT = '3099';
const { app, serverInstance, generateNoticeHash } = require('./server.js');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try { parsed = JSON.parse(body); } catch (_) { }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  await new Promise(r => setTimeout(r, 250));

  console.log('1. Testing Page Routes (Multi-Page Architecture)...');
  const resHome = await request({ host: 'localhost', port: 3099, path: '/', method: 'GET' });
  assert.strictEqual(resHome.status, 200);
  assert.ok(typeof resHome.body === 'string' && resHome.body.includes('placementProof'));

  const resCheck = await request({ host: 'localhost', port: 3099, path: '/check', method: 'GET' });
  assert.strictEqual(resCheck.status, 200);
  assert.ok(typeof resCheck.body === 'string' && resCheck.body.includes('Notice Checker'));

  const resBoard = await request({ host: 'localhost', port: 3099, path: '/board', method: 'GET' });
  assert.strictEqual(resBoard.status, 200);
  assert.ok(typeof resBoard.body === 'string' && resBoard.body.includes('Approved Board'));

  const resPortal = await request({ host: 'localhost', port: 3099, path: '/portal', method: 'GET' });
  assert.strictEqual(resPortal.status, 200);
  assert.ok(typeof resPortal.body === 'string' && resPortal.body.includes('Officer Portal'));

  console.log('2. Testing Security Headers (Helmet)...');
  assert.ok(resHome.headers['x-content-type-options'] === 'nosniff');
  assert.ok(resHome.headers['content-security-policy']);

  console.log('3. Testing GET /api/notices...');
  const resGet = await request({ host: 'localhost', port: 3099, path: '/api/notices', method: 'GET' });
  assert.strictEqual(resGet.status, 200);
  assert.ok(Array.isArray(resGet.body.notices));
  const initialCount = resGet.body.notices.length;

  console.log('4. Testing POST /api/notices (with SHA-256 generation)...');
  const testPayload = {
    title: 'Cyber Security Analyst',
    company: 'Alpha Defense Labs',
    domain: 'alphadefense.in',
    contact: 'careers@alphadefense.in',
    type: 'Job',
    fee: 0,
    status: 'approved'
  };
  const resPost = await request({
    host: 'localhost',
    port: 3099,
    path: '/api/notices',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, testPayload);
  assert.strictEqual(resPost.status, 201);
  assert.ok(resPost.body.notice.hash, 'SHA-256 hash must be generated');
  const createdNotice = resPost.body.notice;

  console.log('5. Testing POST /api/verify (Genuine Record Match)...');
  const resVerifyMatch = await request({
    host: 'localhost',
    port: 3099,
    path: '/api/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    noticeId: createdNotice.id,
    domain: createdNotice.domain,
    contact: createdNotice.contact,
    fee: 0
  });
  assert.strictEqual(resVerifyMatch.status, 200);
  assert.strictEqual(resVerifyMatch.body.state, 'match');
  assert.strictEqual(resVerifyMatch.body.cryptography.integrityVerified, true);

  console.log('6. Testing POST /api/verify (Tampered Fee Scam)...');
  const resVerifyTamper = await request({
    host: 'localhost',
    port: 3099,
    path: '/api/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    noticeId: createdNotice.id,
    domain: createdNotice.domain,
    contact: createdNotice.contact,
    fee: 1499
  });
  assert.strictEqual(resVerifyTamper.status, 200);
  assert.strictEqual(resVerifyTamper.body.state, 'different');
  assert.strictEqual(resVerifyTamper.body.cryptography.integrityVerified, false);
  assert.ok(resVerifyTamper.body.phishingFlags.length > 0);

  console.log('7. Testing GET /api/audit-logs (Verifying threat logging)...');
  const resLogs = await request({ host: 'localhost', port: 3099, path: '/api/audit-logs', method: 'GET' });
  assert.strictEqual(resLogs.status, 200);
  assert.ok(Array.isArray(resLogs.body.logs));
  assert.ok(resLogs.body.logs.length >= 2);

  console.log('8. Cleaning up test record...');
  const resDel = await request({
    host: 'localhost',
    port: 3099,
    path: `/api/notices/${encodeURIComponent(createdNotice.id)}`,
    method: 'DELETE'
  });
  assert.strictEqual(resDel.status, 200);

  console.log('\n✓ All Express MPA routes, Security Middlewares, Cryptographic Hashing, and Threat Verification tests PASSED!');
  if (serverInstance) serverInstance.close();
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n✗ Test failed:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
