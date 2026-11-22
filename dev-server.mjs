import http from 'node:http';
import { spawn } from 'node:child_process';
import { handler as authHandler } from './netlify/functions/auth.js';
import { handler as settingsHandler } from './netlify/functions/settings.js';
import { handler as redditHandler } from './netlify/functions/reddit.js';
import { handler as aiHandler } from './netlify/functions/ai.js';

const routes = {
  '/api/auth': authHandler,
  '/api/settings': settingsHandler,
  '/api/reddit': redditHandler,
  '/api/ai': aiHandler,
};

const apiServer = http.createServer(async (req, res) => {
  const urlPath = (req.url || '').split('?')[0];
  const fn = routes[urlPath];
  if (!fn) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  const result = await fn({
    httpMethod: req.method,
    headers: req.headers,
    body,
  });

  res.writeHead(result.statusCode || 200, result.headers || {});
  res.end(result.body || '');
});

apiServer.listen(8888, () => {
  console.log('API server listening on http://localhost:8888');
});

const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });
vite.on('exit', (code) => {
  apiServer.close();
  process.exit(code || 0);
});
