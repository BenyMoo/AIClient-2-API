import logger from '../utils/logger.js';
import { getStorageAdapter } from './storage-adapter.js';

const DEFAULT_CONFIG = {
    REQUIRED_API_KEY: "123456",
    SERVER_PORT: 3000,
    HOST: '0.0.0.0',
    MODEL_PROVIDER: "gemini-cli-oauth",
    SYSTEM_PROMPT_FILE_PATH: null,
    SYSTEM_PROMPT_MODE: 'append',
    PROXY_URL: null,
    PROXY_ENABLED_PROVIDERS: [],
    PROMPT_LOG_BASE_NAME: "prompt_log",
    PROMPT_LOG_MODE: "none",
    REQUEST_MAX_RETRIES: 3,
    REQUEST_BASE_DELAY: 1000,
    CREDENTIAL_SWITCH_MAX_RETRIES: 5,
    CRON_NEAR_MINUTES: 15,
    CRON_REFRESH_TOKEN: false,
    LOGIN_EXPIRY: 3600,
    PROVIDER_POOLS_FILE_PATH: null,
    MAX_ERROR_COUNT: 10,
    providerFallbackChain: {},
    LOG_ENABLED: true,
    LOG_OUTPUT_MODE: "all",
    LOG_LEVEL: "info",
    LOG_DIR: "logs",
    LOG_INCLUDE_REQUEST_ID: true,
    LOG_INCLUDE_TIMESTAMP: true,
    LOG_MAX_FILE_SIZE: 10485760,
    LOG_MAX_FILES: 10
};

export async function loadConfig() {
    const storage = getStorageAdapter();
    if (!storage) {
        logger.warn('[CF Config] Storage adapter not available, using default config');
        return { ...DEFAULT_CONFIG };
    }

    try {
        const config = await storage.readFile('configs/config.json');
        if (config) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(config) };
        }
    } catch (error) {
        logger.error('[CF Config] Failed to load config:', error.message);
    }

    return { ...DEFAULT_CONFIG };
}

export async function saveConfig(config) {
    const storage = getStorageAdapter();
    if (!storage) {
        logger.error('[CF Config] Storage adapter not available');
        return false;
    }

    try {
        await storage.writeFile('configs/config.json', JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        logger.error('[CF Config] Failed to save config:', error.message);
        return false;
    }
}

export async function loadOAuthCredentials(provider) {
    const storage = getStorageAdapter();
    if (!storage) return null;

    try {
        const path = `configs/${provider}/oauth_creds.json`;
        const creds = await storage.readFile(path);
        return creds ? JSON.parse(creds) : null;
    } catch (error) {
        logger.error(`[CF Config] Failed to load OAuth credentials for ${provider}:`, error.message);
        return null;
    }
}

export async function saveOAuthCredentials(provider, credentials) {
    const storage = getStorageAdapter();
    if (!storage) return false;

    try {
        const path = `configs/${provider}/oauth_creds.json`;
        await storage.writeFile(path, JSON.stringify(credentials, null, 2));
        return true;
    } catch (error) {
        logger.error(`[CF Config] Failed to save OAuth credentials for ${provider}:`, error.message);
        return false;
    }
}

export async function loadProviderPools() {
    const storage = getStorageAdapter();
    if (!storage) return null;

    try {
        const pools = await storage.readFile('configs/provider_pools.json');
        return pools ? JSON.parse(pools) : null;
    } catch (error) {
        logger.error('[CF Config] Failed to load provider pools:', error.message);
        return null;
    }
}

export async function saveProviderPools(pools) {
    const storage = getStorageAdapter();
    if (!storage) return false;

    try {
        await storage.writeFile('configs/provider_pools.json', JSON.stringify(pools, null, 2));
        return true;
    } catch (error) {
        logger.error('[CF Config] Failed to save provider pools:', error.message);
        return false;
    }
}

export { DEFAULT_CONFIG };
