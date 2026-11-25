const ACTIVE_CATALOG_PATH = "/catalog/v1/active.json";
const DEPLOYMENT_MANIFEST_PATH = "/deployment-manifest.json";
const MAX_HEALTH_MANIFEST_BYTES = 256 * 1024;

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};

export async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS" && isPublicJsonPath(url.pathname)) {
    return withCommonHeaders(new Response(null, { status: 204, headers: corsHeaders() }));
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    return json({ error: "method_not_allowed" }, 405, { Allow: "GET, HEAD, OPTIONS" });
  }
  if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return json({ error: "assets_binding_unavailable" }, 503, {}, request.method === "HEAD");
  }

  if (url.pathname === "/health/v1") return healthResponse(request, env);

  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status === 404) return json({ error: "content_not_found", path: url.pathname }, 404, {}, request.method === "HEAD");

  const ranged = request.method === "GET" ? await applySingleRange(request, assetResponse) : assetResponse;
  return secureAssetResponse(ranged, url.pathname, env, request.method === "HEAD");
}

async function healthResponse(request, env) {
  const manifestRequest = new Request(new URL(DEPLOYMENT_MANIFEST_PATH, request.url), { method: "GET" });
  const response = await env.ASSETS.fetch(manifestRequest);
  if (!response.ok) return json({ status: "unavailable", error: "deployment_manifest_missing" }, 503);

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_HEALTH_MANIFEST_BYTES) {
    return json({ status: "unavailable", error: "deployment_manifest_oversized" }, 503);
  }

  try {
    const manifest = JSON.parse(new TextDecoder().decode(bytes));
    const body = {
      status: "ok",
      environment: env.ENVIRONMENT || "unknown",
      contract: manifest.contract,
      active_release_id: manifest.active_release_id,
      source_commit: manifest.source?.commit,
      bundle_digest_sha256: manifest.bundle_digest_sha256,
      file_count: manifest.file_count
    };
    return json(body, 200, { "Cache-Control": "no-store" }, request.method === "HEAD");
  } catch {
    return json({ status: "unavailable", error: "deployment_manifest_invalid" }, 503);
  }
}

async function applySingleRange(request, response) {
  const range = request.headers.get("Range");
  if (!range || response.status !== 200 || !response.body) return response;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */*" } });

  const buffer = await response.arrayBuffer();
  const size = buffer.byteLength;
  let start;
  let end;
  if (!match[1] && match[2]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return rangeNotSatisfiable(size);
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
    return rangeNotSatisfiable(size);
  }
  end = Math.min(end, size - 1);
  const headers = new Headers(response.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(buffer.slice(start, end + 1), { status: 206, headers });
}

function rangeNotSatisfiable(size) {
  return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" } });
}

function secureAssetResponse(response, pathname, env, headOnly) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), clipboard-read=(), clipboard-write=()");
  headers.set("Accept-Ranges", "bytes");

  if (pathname === ACTIVE_CATALOG_PATH || pathname === DEPLOYMENT_MANIFEST_PATH) {
    headers.set("Cache-Control", "no-cache, max-age=0, must-revalidate");
  } else if (pathname.startsWith("/releases/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (pathname.startsWith("/schemas/")) {
    headers.set("Cache-Control", "public, max-age=3600, must-revalidate");
  } else {
    headers.set("Cache-Control", "public, max-age=300, must-revalidate");
  }

  const contentType = headers.get("Content-Type") || "";
  if (contentType.includes("text/html")) headers.set("Content-Security-Policy", simulationCsp(env.CONTENT_FRAME_ANCESTORS));
  if (isPublicJsonPath(pathname)) for (const [name, value] of Object.entries(corsHeaders())) headers.set(name, value);

  return withCommonHeaders(new Response(headOnly ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  }));
}

function simulationCsp(value) {
  const ancestors = parseFrameAncestors(value);
  const frameAncestors = ancestors.length ? ancestors.join(" ") : "'none'";
  return [
    "sandbox allow-scripts allow-forms",
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self' blob:",
    "connect-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${frameAncestors}`
  ].join("; ");
}

function parseFrameAncestors(value = "") {
  const output = [];
  for (const candidate of value.split(/\s+/).filter(Boolean)) {
    try {
      const url = new URL(candidate);
      const localhost = ["localhost", "127.0.0.1"].includes(url.hostname);
      if ((url.protocol === "https:" || (url.protocol === "http:" && localhost)) && url.origin === candidate) output.push(candidate);
    } catch {
      // Invalid origins are omitted so framing fails closed.
    }
  }
  return [...new Set(output)].sort();
}

function isPublicJsonPath(pathname) {
  return pathname === ACTIVE_CATALOG_PATH || pathname === DEPLOYMENT_MANIFEST_PATH || pathname.endsWith(".json") || pathname === "/health/v1";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Range",
    "Access-Control-Max-Age": "86400"
  };
}

function json(value, status = 200, headers = {}, headOnly = false) {
  return withCommonHeaders(new Response(headOnly ? null : JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(), ...headers }
  }));
}

function withCommonHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
