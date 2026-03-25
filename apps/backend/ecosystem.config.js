module.exports = {
  apps: [
    {
      name: 'scorely-backend',
      script: 'dist/server.js',
      cwd: '/home/ubuntu/scorely/apps/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
    },
  ],
}
