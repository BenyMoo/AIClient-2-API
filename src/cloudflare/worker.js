import { createRequestHandler } from '../handlers/request-handler.js';
import { loadConfig } from './config-adapter.js';
import { initApiService } from '../services/service-manager.js';
import { initializeUIManagement } from '../services/ui-manager.js';
import { initializeAPIManagement } from '../services/api-manager.js';
import { getProviderPoolManager } from '../services/service-manager.js';
import { discoverPlugins, getPluginManager } from '../core/plugin-manager.js';
import { CloudflareStorageAdapter } from './storage-adapter.js';
import { adaptRequest, createResponseAdapter, adaptResponse } from './request-adapter.js';

let requestHandler = null;
let initialized = false;

async function initializeWorker(env) {
    if (initialized) return;
    
    console.log('[Cloudflare Worker] Initializing...');
    
    globalThis.CF_ENV = env;
    globalThis.CF_STORAGE = new CloudflareStorageAdapter(env);
    
    const config = await loadConfig();
    globalThis.CONFIG = config;
    
    await discoverPlugins();
    const pluginManager = getPluginManager();
    await pluginManager.initAll(config);
    
    const services = await initApiService(config, true);
    initializeUIManagement(config);
    initializeAPIManagement(services);
    
    requestHandler = createRequestHandler(config, getProviderPoolManager());
    
    initialized = true;
    console.log('[Cloudflare Worker] Initialized successfully');
}

export default {
    async fetch(request, env, ctx) {
        try {
            await initializeWorker(env);
            
            const req = adaptRequest(request);
            const res = createResponseAdapter();
            
            await requestHandler(req, res);
            
            if (!res.isEnded()) {
                return new Response('Not Found', { status: 404 });
            }
            
            return adaptResponse(res);
            
        } catch (error) {
            console.error('[Cloudflare Worker] Error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    },
    
    async scheduled(event, env, ctx) {
        console.log('[Cloudflare Worker] Scheduled task triggered');
        ctx.waitUntil(refreshTokens(env));
    }
};

async function refreshTokens(env) {
    console.log('[Cloudflare Worker] Refreshing tokens...');
}
