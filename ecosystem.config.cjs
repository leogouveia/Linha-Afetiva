module.exports = {
  apps: [
    {
      name: "linha-afetiva",
      script: ".next/standalone/server.js",
      // Pinned so `./data/linha-afetiva.db` always resolves relative to the project
      // root, regardless of the directory `pm2 start` is invoked from.
      cwd: __dirname,
      env: { NODE_ENV: "production", PORT: 3000, HOSTNAME: "127.0.0.1" },
    },
  ],
};
