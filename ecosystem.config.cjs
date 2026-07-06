module.exports = {
  apps: [
    {
      name: "linha-afetiva",
      script: ".next/standalone/server.js",
      env: { NODE_ENV: "production", PORT: 3000, HOSTNAME: "127.0.0.1" },
    },
  ],
};
