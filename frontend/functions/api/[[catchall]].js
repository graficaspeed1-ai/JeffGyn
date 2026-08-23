export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = new URL(url.pathname + url.search, 'https://opengym-api.datomoliveira.workers.dev');

  // Encaminha a requisição completa (método, headers, cookies, body) para a API Worker
  const proxyReq = new Request(targetUrl, context.request);
  return fetch(proxyReq);
}
