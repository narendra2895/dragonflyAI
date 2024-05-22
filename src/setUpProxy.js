const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/pipeline', // This should match the beginning of the API URL path
    createProxyMiddleware({
      target: 'https://dev.api.dragonflyai.co', // The endpoint you want to reach
      changeOrigin: true,
      pathRewrite: {'^/pipeline' : '/pipeline'},
    })
  );
};
