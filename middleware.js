export const config = {
  matcher: '/',
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname === 'ip.jcnino.dev') {
    url.pathname = '/ip';
    return fetch(url);
  }
}
