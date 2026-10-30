// Cloudflare Worker: caches your Vercel site's static data and proxies supplier
// images from an allowlist. Uses the free Cache API (no KV needed).
// Deploy:  npx wrangler deploy cloudflare-worker.js --name omnistu-edge --compatibility-date 2024-11-01

const ORIGIN = 'https://omnistu-superstore.vercel.app';

// Only these image hosts can be proxied. Add hosts you have the right to use.
const IMAGE_HOSTS = ['cf.cjdropshipping.com', 'cc-west-usa.oss-us-west-1.aliyuncs.com', 'images.printify.com', 'images.unsplash.com'];

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fetch(new Request(ORIGIN + new URL(request.url).pathname, request));
    }
    const url = new URL(request.url);

    // /img?u=<encoded image url>  -> cached proxy for allowlisted hosts
    if (url.pathname === '/img') {
      const target = url.searchParams.get('u');
      let t;
      try {
        t = new URL(target);
      } catch {
        return new Response('Bad url', { status: 400 });
      }
      if (t.protocol !== 'https:' || !IMAGE_HOSTS.includes(t.hostname)) {
        return new Response('Host not allowed', { status: 403 });
      }
      return cached(request, ctx, () => fetch(t.toString(), { cf: { cacheEverything: true } }), 604800);
    }

    // Static catalog JSON: cache 1 hour at the edge, revalidate in the background.
    if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
      return cached(request, ctx, () => fetch(ORIGIN + url.pathname + url.search), 3600);
    }

    // Everything else goes straight to the origin (never cache carts, orders, APIs).
    return fetch(ORIGIN + url.pathname + url.search, {
      method: request.method,
      headers: request.headers,
    });
  },
};

async function cached(request, ctx, load, ttl) {
  const cache = caches.default;
  const key = new Request(request.url, { method: 'GET' });
  let res = await cache.match(key);
  if (res) return res;
  const origin = await load();
  if (!origin.ok) return origin;
  res = new Response(origin.body, origin);
  res.headers.set('Cache-Control', `public, max-age=${ttl}`);
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
