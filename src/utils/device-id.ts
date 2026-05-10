import { createHmac } from 'crypto';

const SERVER_DEVICE_ID_PREFIX = 'did';
const FALLBACK_SECRET = 'javarock-device-id-hash-v1';

function getDeviceIdSecret(): string {
  return (
    process.env.DEVICE_ID_HASH_SECRET ||
    process.env.APP_KEYS ||
    process.env.JWT_SECRET ||
    process.env.API_TOKEN_SALT ||
    FALLBACK_SECRET
  ).trim();
}

export function hashDeviceId(deviceId: string): string {
  const normalized = deviceId.trim();
  if (!normalized) {
    return '';
  }

  const digest = createHmac('sha256', getDeviceIdSecret())
    .update(normalized)
    .digest('base64url');

  return `${SERVER_DEVICE_ID_PREFIX}-${digest}`;
}

export function isServerHashedDeviceId(value: string): boolean {
  return /^did-[A-Za-z0-9_-]{43}$/.test(value);
}
