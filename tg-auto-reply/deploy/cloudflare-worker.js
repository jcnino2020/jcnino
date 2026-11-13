/**
 * Cloudflare Worker (Free Tier: 100,000 requests/day)
 * Route: jcnino.dev/tg* and www.jcnino.dev/tg*
 *
 * Keeps jcnino.dev on Vercel completely untouched while routing /tg*
 * to the Oracle Cloud Always Free VM via a Cloudflare Tunnel subdomain
 * (e.g. https://tg-origin.jcnino.dev) protected by Cloudflare Access.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/tg")) {
      return fetch(request);
    }

    const originUrl = new URL(request.url);
    originUrl.hostname = "tg-origin.jcnino.dev";

    const upstreamRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    return fetch(upstreamRequest);
  },
};
