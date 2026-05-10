import { factories } from '@strapi/strapi';
import { issueToken, verifyPassword } from '../../../utils/password';

const UID = 'api::license-seat.license-seat';

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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
    const deviceId = cleanString(body.deviceId);
    const appVersion = cleanString(body.appVersion);

    if (!username || !password || !deviceId) {
      fail(ctx, 400, 'Username, password, and device ID are required.');
      return;
    }

    const seat = await strapi.db.query(UID).findOne({
      where: { username },
    });

    if (!seat || seat.enabled === false || !seat.passwordHash || !verifyPassword(password, seat.passwordHash)) {
      fail(ctx, 401, 'Invalid username or password.');
      return;
    }

    const linkedDeviceId = cleanString(seat.deviceId);
    if (linkedDeviceId && linkedDeviceId !== deviceId) {
      fail(ctx, 409, 'This username is already linked to another Android device.');
      return;
    }

    const token = cleanString(seat.token) || issueToken();
    const firstActivation = !linkedDeviceId;

    await strapi.db.query(UID).update({
      where: { id: seat.id },
      data: {
        deviceId: linkedDeviceId || deviceId,
        token,
        lastSeenAt: new Date().toISOString(),
        lastAppVersion: appVersion || null,
      },
    });

    ctx.body = {
      ok: true,
      message: firstActivation ? 'Device linked successfully.' : 'Access active on this device.',
      token,
    };
  },
}));
