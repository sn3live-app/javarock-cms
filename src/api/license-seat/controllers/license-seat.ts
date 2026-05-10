import { factories } from '@strapi/strapi';
import { hashDeviceId, isServerHashedDeviceId } from '../../../utils/device-id';
import { hashPassword, issueToken, verifyPassword } from '../../../utils/password';

const UID = 'api::license-seat.license-seat';

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanDeviceId(value: unknown): string {
  const cleaned = cleanString(value);
  return cleaned === 'unknown' ? '' : cleaned;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanDeviceId(item))
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function fail(ctx, status: number, message: string) {
  ctx.status = status;
  ctx.body = { ok: false, message };
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  async activate(ctx) {
    const body = ctx.request.body ?? {};
    const username = cleanString(body.username);
    const password = typeof body.password === 'string' ? body.password : '';
    const deviceId = cleanDeviceId(body.deviceId);
    const deviceIds = cleanStringArray(body.deviceIds);
    const legacyDeviceId = cleanString(body.legacyDeviceId);
    const appVersion = cleanString(body.appVersion);
    const submittedDeviceIds = uniqueStrings([deviceId, ...deviceIds]);
    const submittedDeviceIdHashes = uniqueStrings(submittedDeviceIds.map(hashDeviceId));
    const deviceIdsForMatching = uniqueStrings([
      ...submittedDeviceIdHashes,
      ...submittedDeviceIds,
      legacyDeviceId,
    ]);

    if (!username || !password || submittedDeviceIds.length === 0) {
      fail(ctx, 400, 'Username, password, and device ID are required.');
      return;
    }

    const seat = await strapi.db.query(UID).findOne({
      select: ['id', 'username', 'setPassword', 'passwordHash', 'deviceId', 'deviceIds', 'enabled', 'token'],
      where: { username },
    });

    if (!seat) {
      fail(ctx, 401, 'No license seat found for this username.');
      return;
    }

    if (seat.enabled === false) {
      fail(ctx, 403, 'This username is disabled.');
      return;
    }

    const storedHash = cleanString(seat.passwordHash);
    const storedSetPassword = typeof seat.setPassword === 'string' ? seat.setPassword : '';
    const passwordMatchesHash = Boolean(storedHash && verifyPassword(password, storedHash));
    const passwordMatchesPlaintext = Boolean(!storedHash && storedSetPassword === password);

    if (!passwordMatchesHash && !passwordMatchesPlaintext) {
      const message = storedHash || storedSetPassword
        ? 'Password is incorrect for this username.'
        : 'No password is saved for this username. Enter a password in setPassword and save.';
      fail(ctx, 401, message);
      return;
    }

    const linkedDeviceId = cleanString(seat.deviceId);
    const storedDeviceIdsForMatching = uniqueStrings([linkedDeviceId, ...cleanStringArray(seat.deviceIds)]);
    const storedDeviceIdsForStorage = storedDeviceIdsForMatching.filter(isServerHashedDeviceId);
    const firstActivation = storedDeviceIdsForMatching.length === 0;
    const deviceMatches = storedDeviceIdsForMatching.some((storedDeviceId) =>
      deviceIdsForMatching.includes(storedDeviceId)
    );
    if (!firstActivation && !deviceMatches) {
      fail(ctx, 409, 'This username is already linked to another Android device.');
      return;
    }

    const token = cleanString(seat.token) || issueToken();
    const deviceIdToStore = hashDeviceId(deviceId || submittedDeviceIds[0]);
    const deviceUpgraded = !firstActivation && !storedDeviceIdsForStorage.includes(deviceIdToStore);
    const mergedDeviceIds = uniqueStrings([...storedDeviceIdsForStorage, ...submittedDeviceIdHashes]);

    await strapi.db.query(UID).update({
      where: { id: seat.id },
      data: {
        deviceId: deviceIdToStore,
        deviceIds: mergedDeviceIds,
        setPassword: null,
        passwordHash: storedHash || hashPassword(password),
        token,
        lastSeenAt: new Date().toISOString(),
        lastAppVersion: appVersion || null,
      },
    });

    ctx.body = {
      ok: true,
      message: firstActivation
        ? 'Device linked successfully.'
        : deviceUpgraded
          ? 'Device link upgraded successfully.'
          : 'Access active on this device.',
      token,
    };
  },
}));
