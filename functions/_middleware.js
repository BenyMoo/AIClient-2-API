export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/') || 
        url.pathname.startsWith('/v1/') || 
        url.pathname.startsWith('/v1beta/') ||
        url.pathname.startsWith('/ollama/') ||
        url.pathname === '/health') {
        
        const workerUrl = env.WORKER_URL || 'https://your-worker.workers.dev';
        const apiUrl = new URL(url.pathname + url.search, workerUrl);
        
        const apiRequest = new Request(apiUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body
        });
        
        return fetch(apiRequest);
    }
    
    return context.next();
}
