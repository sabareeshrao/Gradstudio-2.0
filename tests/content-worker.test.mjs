import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from '../worker/src/index.js';

const manifest = {
  contract: 'gradstudio-content-deployment/v1',
  active_release_id: 'rel-222222222222-aaaaaaaaaaaa',
  source: { commit: '2222222222222222222222222222222222222222' },
  bundle_digest_sha256: 'a'.repeat(64),
  file_count: 8
};

function environment() {
  const files = new Map([
    ['/catalog/v1/active.json', { body: '{"contract":"gradstudio-content-catalog/v1"}', type: 'application/json' }],
    ['/deployment-manifest.json', { body: JSON.stringify(manifest), type: 'application/json' }],
    ['/releases/rel-222222222222-aaaaaaaaaaaa/content/simulations/sim-alpha/index.html', { body: '<!doctype html><main>Safe simulation</main>', type: 'text/html' }],
    ['/releases/rel-222222222222-aaaaaaaaaaaa/content/simulations/sim-alpha/app.js', { body: '0123456789', type: 'application/javascript' }],
    ['/schemas/catalog-v1.json', { body: '{}', type: 'application/json' }]
  ]);
  return {
    ENVIRONMENT: 'test',
    CONTENT_FRAME_ANCESTORS: 'https://staging.gradstudio.org https://staging.gradstudio.org javascript:bad',
    ASSETS: {
      async fetch(request) {
        const item = files.get(new URL(request.url).pathname);
        if (!item) return new Response('not found', { status: 404 });
        return new Response(request.method === 'HEAD' ? null : item.body, { headers: { 'Content-Type': item.type } });
      }
    }
  };
}

test('active catalog is public JSON and cannot be cached as immutable', async () => {
  const response = await handleRequest(new Request('https://content.example/catalog/v1/active.json'), environment());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-cache, max-age=0, must-revalidate');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('immutable simulation is sandboxed and frame ancestors are origin allowlisted', async () => {
  const response = await handleRequest(new Request('https://content.example/releases/rel-222222222222-aaaaaaaaaaaa/content/simulations/sim-alpha/index.html'), environment());
  const csp = response.headers.get('Content-Security-Policy');
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.match(csp, /sandbox allow-scripts allow-forms/);
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /frame-ancestors https:\/\/staging\.gradstudio\.org/);
  assert.equal(csp.includes('javascript:bad'), false);
  assert.equal(csp.includes('allow-same-origin'), false);
});

test('single byte ranges return 206 and invalid ranges return 416', async () => {
  const url = 'https://content.example/releases/rel-222222222222-aaaaaaaaaaaa/content/simulations/sim-alpha/app.js';
  const partial = await handleRequest(new Request(url, { headers: { Range: 'bytes=2-5' } }), environment());
  assert.equal(partial.status, 206);
  assert.equal(await partial.text(), '2345');
  assert.equal(partial.headers.get('Content-Range'), 'bytes 2-5/10');
  const invalid = await handleRequest(new Request(url, { headers: { Range: 'bytes=99-100' } }), environment());
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers.get('Content-Range'), 'bytes */10');
});

test('health reports immutable deployment provenance without exposing configuration', async () => {
  const response = await handleRequest(new Request('https://content.example/health/v1'), environment());
  const body = await response.json();
  assert.deepEqual(body, {
    status: 'ok',
    environment: 'test',
    contract: manifest.contract,
    active_release_id: manifest.active_release_id,
    source_commit: manifest.source.commit,
    bundle_digest_sha256: manifest.bundle_digest_sha256,
    file_count: manifest.file_count
  });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('unknown assets, unsupported methods, HEAD, and missing binding fail safely', async () => {
  const missing = await handleRequest(new Request('https://content.example/nope'), environment());
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'content_not_found', path: '/nope' });
  const post = await handleRequest(new Request('https://content.example/catalog/v1/active.json', { method: 'POST' }), environment());
  assert.equal(post.status, 405);
  const head = await handleRequest(new Request('https://content.example/nope', { method: 'HEAD' }), environment());
  assert.equal(await head.text(), '');
  const unavailable = await handleRequest(new Request('https://content.example/catalog/v1/active.json'), {});
  assert.equal(unavailable.status, 503);
});
