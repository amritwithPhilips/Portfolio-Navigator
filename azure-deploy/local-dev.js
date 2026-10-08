/**
 * Local development server for testing cloud collaboration features.
 * Simulates the Azure Blob Storage API using a local JSON file.
 *
 * Usage:
 *   node azure-deploy/local-dev.js
 *
 * Opens: http://localhost:8810
 * API:   http://localhost:8810/api/scenarios
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 8810;
const DATA_DIR = join(__dirname, '.local-data');
const INDEX_FILE = join(DATA_DIR, '_index.json');
const MODELER = join(__dirname, '..', 'AOP 2027 Modeler', 'AOP2027-IT-Portfolio-Scenario-Modelling-v7.10.26-r1.html');

if (!existsSync(DATA_DIR)) {
  const { mkdirSync } = await import('fs');
  mkdirSync(DATA_DIR, { recursive: true });
}
if (!existsSync(INDEX_FILE)) writeFileSync(INDEX_FILE, '[]');

function readIndex() {
  return JSON.parse(readFileSync(INDEX_FILE, 'utf-8'));
}
function writeIndex(data) {
  writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(body));
  });
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (path === '/api/scenarios' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(readIndex()));
  }

  const match = path.match(/^\/api\/scenarios\/([a-zA-Z0-9_-]+)$/);
  if (match) {
    const id = match[1];
    const file = join(DATA_DIR, id + '.json');

    if (req.method === 'GET') {
      if (!existsSync(file)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not found' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(readFileSync(file, 'utf-8'));
    }

    if (req.method === 'PUT') {
      const body = JSON.parse(await readBody(req));
      writeFileSync(file, JSON.stringify(body.scenario));
      const index = readIndex();
      const entry = {
        id,
        name: body.scenario?.name || id,
        status: body.scenario?.status || 'Draft',
        revision: body.scenario?.revision || 0,
        savedAt: new Date().toISOString(),
        savedBy: body.savedBy || 'Anonymous',
        allocation: body.allocation || null,
      };
      const existing = index.findIndex(x => x.id === id);
      if (existing >= 0) index[existing] = entry;
      else index.unshift(entry);
      writeIndex(index);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, entry }));
    }

    if (req.method === 'DELETE') {
      if (existsSync(file)) {
        const { unlinkSync } = await import('fs');
        unlinkSync(file);
      }
      const index = readIndex().filter(x => x.id !== id);
      writeIndex(index);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    }
  }

  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(readFileSync(MODELER));
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\nAOP 2027 Navigator — Local Dev Server`);
  console.log(`  App:  http://localhost:${PORT}`);
  console.log(`  API:  http://localhost:${PORT}/api/scenarios`);
  console.log(`  Data: ${DATA_DIR}\n`);
});
