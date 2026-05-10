import { factories } from '@strapi/strapi';

const UID = 'api::bridge-config.bridge-config';

export default factories.createCoreController(UID, ({ strapi }) => ({
  async current(ctx) {
    const config = await strapi.db.query(UID).findOne({
      select: ['serverHost', 'serverPort', 'serverName', 'enabled'],
      orderBy: { updatedAt: 'desc' },
    });

    if (!config || config.enabled === false) {
      ctx.body = {
        ok: false,
        message: 'No bridge config is enabled.',
      };
      return;
    }

    ctx.body = {
      ok: true,
      serverHost: config.serverHost,
      serverPort: config.serverPort,
      serverName: config.serverName,
    };
  },
}));
