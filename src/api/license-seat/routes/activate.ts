export default {
  routes: [
    {
      method: 'POST',
      path: '/activate',
      handler: 'license-seat.activate',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
