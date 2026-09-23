export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname === '/dashboard' || url.pathname === '/dashboard/') {
    const dashboardUrl = new URL('/dashboard/index.html', url);
    return context.env.ASSETS.fetch(new Request(dashboardUrl, context.request));
  }
  return context.next();
}
