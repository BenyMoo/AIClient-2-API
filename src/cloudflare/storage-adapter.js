import logger from '../utils/logger.js';

export class CloudflareStorageAdapter {
    constructor(env) {
        this.kv = env?.CONFIG_KV || null;
        this.r2 = env?.STORAGE || null;
    }

    async readFile(path, encoding = 'utf8') {
        try {
            if (path.startsWith('configs/')) {
                const key = path.replace('configs/', 'config:');
                const value = await this.kv.get(key, { type: 'json' });
                return value ? JSON.stringify(value) : null;
            }
            if (path.startsWith('logs/')) {
                const key = path.replace('logs/', 'log:');
                const value = await this.kv.get(key);
                return value;
            }
            return null;
        } catch (error) {
            logger.error('[Storage] Read error:', path, error.message);
            return null;
        }
    }

    async writeFile(path, data, encoding = 'utf8') {
        try {
            if (path.startsWith('configs/')) {
                const key = path.replace('configs/', 'config:');
                const value = typeof data === 'string' ? JSON.parse(data) : data;
                await this.kv.put(key, JSON.stringify(value));
                return true;
            }
            if (path.startsWith('logs/')) {
                const key = path.replace('logs/', 'log:');
                await this.kv.put(key, data);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('[Storage] Write error:', path, error.message);
            return false;
        }
    }

    async exists(path) {
        try {
            if (path.startsWith('configs/')) {
                const key = path.replace('configs/', 'config:');
                const value = await this.kv.get(key);
                return value !== null;
            }
            if (path.startsWith('logs/')) {
                const key = path.replace('logs/', 'log:');
                const value = await this.kv.get(key);
                return value !== null;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async readdir(path) {
        try {
            const list = await this.kv.list({ prefix: path.replace(/\/$/, '') + ':' });
            return list.keys.map(k => k.name.split(':')[1]);
        } catch (error) {
            return [];
        }
    }

    async unlink(path) {
        try {
            if (path.startsWith('configs/')) {
                const key = path.replace('configs/', 'config:');
                await this.kv.delete(key);
                return true;
            }
            if (path.startsWith('logs/')) {
                const key = path.replace('logs/', 'log:');
                await this.kv.delete(key);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('[Storage] Delete error:', path, error.message);
            return false;
        }
    }

    async uploadFile(path, data) {
        try {
            if (this.r2) {
                const key = path.replace('configs/', '');
                await this.r2.put(key, data);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('[Storage] Upload error:', path, error.message);
            return false;
        }
    }

    async downloadFile(path) {
        try {
            if (this.r2) {
                const key = path.replace('configs/', '');
                const object = await this.r2.get(key);
                if (object) {
                    return await object.text();
                }
                return null;
            }
            return null;
        } catch (error) {
            logger.error('[Storage] Download error:', path, error.message);
            return null;
        }
    }
}

export function getStorageAdapter() {
    return globalThis.CF_STORAGE;
}
