import { Request } from "express"
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

export const BuildFingerPrint = (req: Request): string => {
    const userAgent = req.headers['user-agent'] || '';
    const { device, os, browser } = UAParser(userAgent);

    const ip =
        req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown';

    // Build a consistent string from all signals
    const raw = [
        ip,
        browser.name || '',
        browser.version || '',
        os.name || '',
        os.version || '',
        device.type || 'desktop',  // mobile | tablet | desktop
        device.vendor || '',
        device.model || '',
    ].join(':');

    // Hash it — don't expose raw IP/device in Redis key
    const fingerprint = crypto
        .createHash('sha256')
        .update(raw)
        .digest('hex');

    return fingerprint;
}