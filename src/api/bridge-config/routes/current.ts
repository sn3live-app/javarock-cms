export default {
  routes: [
    {
      method: 'GET',
      path: '/bridge-config',
      handler: 'bridge-config.current',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
