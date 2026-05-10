import { factories } from '@strapi/strapi';
import { hashPassword, issueToken, verifyPassword } from '../../../utils/password';

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
      select: ['id', 'username', 'password', 'passwordHash', 'deviceId', 'enabled', 'token'],
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
    const storedPassword = typeof seat.password === 'string' ? seat.password : '';
    const passwordMatchesHash = storedHash && verifyPassword(password, storedHash);
    const passwordMatchesPlaintext = !storedHash && storedPassword && storedPassword === password;

    if (!passwordMatchesHash && !passwordMatchesPlaintext) {
      const message = storedHash || storedPassword
        ? 'Password is incorrect for this username.'
        : 'No password is saved for this username. Re-enter the password in Strapi and save.';
      fail(ctx, 401, message);
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
        password: null,
        passwordHash: storedHash || hashPassword(password),
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
