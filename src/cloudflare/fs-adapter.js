import * as fs from 'fs';
import { getStorageAdapter } from '../cloudflare/storage-adapter.js';

export function readFile(path, encoding = 'utf8') {
    const storage = getStorageAdapter();
    if (storage) {
        return storage.readFile(path, encoding);
    }
    return fs.readFileSync(path, encoding);
}

export function writeFile(path, data, encoding = 'utf8') {
    const storage = getStorageAdapter();
    if (storage) {
        return storage.writeFile(path, data, encoding);
    }
    return fs.writeFileSync(path, data, encoding);
}

export function exists(path) {
    const storage = getStorageAdapter();
    if (storage) {
        return storage.exists(path);
    }
    return fs.existsSync(path);
}

export function readdir(path) {
    const storage = getStorageAdapter();
    if (storage) {
        return storage.readdir(path);
    }
    return fs.readdirSync(path);
}

export function unlink(path) {
    const storage = getStorageAdapter();
    if (storage) {
        return storage.unlink(path);
    }
    return fs.unlinkSync(path);
}

export async function uploadFile(path, data) {
    const storage = getStorageAdapter();
    if (storage) {
        return storage.uploadFile(path, data);
    }
    return false;
}

export async function downloadFile(path) {
    const storage = getStorageAdapter();
    if (storage) {
        return storage.downloadFile(path);
    }
    return null;
}
