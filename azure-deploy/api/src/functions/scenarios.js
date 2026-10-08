import { app } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';

const CONTAINER = 'scenarios';
const INDEX_BLOB = '_index.json';

function getClient() {
  const conn = process.env.AzureWebJobsStorage || process.env.STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error('Storage connection string not configured');
  return BlobServiceClient.fromConnectionString(conn);
}

async function ensureContainer(client) {
  const container = client.getContainerClient(CONTAINER);
  await container.createIfNotExists();
  return container;
}

async function readBlob(container, name) {
  try {
    const blob = container.getBlockBlobClient(name);
    const buf = await blob.downloadToBuffer();
    return JSON.parse(buf.toString('utf-8'));
  } catch (e) {
    if (e.statusCode === 404) return null;
    throw e;
  }
}

async function writeBlob(container, name, data) {
  const blob = container.getBlockBlobClient(name);
  const content = JSON.stringify(data);
  await blob.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
}

app.http('listScenarios', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'scenarios',
  handler: async () => {
    const container = await ensureContainer(getClient());
    const index = await readBlob(container, INDEX_BLOB) || [];
    return { jsonBody: index };
  },
});

app.http('getScenario', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'scenarios/{id}',
  handler: async (req) => {
    const id = req.params.id;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return { status: 400, jsonBody: { error: 'Invalid scenario ID' } };
    }
    const container = await ensureContainer(getClient());
    const data = await readBlob(container, id + '.json');
    if (!data) return { status: 404, jsonBody: { error: 'Scenario not found' } };
    return { jsonBody: data };
  },
});

app.http('putScenario', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'scenarios/{id}',
  handler: async (req) => {
    const id = req.params.id;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return { status: 400, jsonBody: { error: 'Invalid scenario ID' } };
    }
    const body = await req.json();
    if (!body || !body.scenario) {
      return { status: 400, jsonBody: { error: 'Request body must include scenario' } };
    }
    const container = await ensureContainer(getClient());

    await writeBlob(container, id + '.json', body.scenario);

    const index = await readBlob(container, INDEX_BLOB) || [];
    const entry = {
      id,
      name: body.scenario.name || id,
      status: body.scenario.status || 'Draft',
      revision: body.scenario.revision || 0,
      savedAt: new Date().toISOString(),
      savedBy: body.savedBy || 'Anonymous',
      allocation: body.allocation || null,
    };
    const existing = index.findIndex(x => x.id === id);
    if (existing >= 0) index[existing] = entry;
    else index.unshift(entry);
    await writeBlob(container, INDEX_BLOB, index);

    return { status: 200, jsonBody: { ok: true, entry } };
  },
});

app.http('deleteScenario', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'scenarios/{id}',
  handler: async (req) => {
    const id = req.params.id;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return { status: 400, jsonBody: { error: 'Invalid scenario ID' } };
    }
    const container = await ensureContainer(getClient());
    try {
      await container.getBlockBlobClient(id + '.json').deleteIfExists();
    } catch (_) { /* ignore */ }
    const index = await readBlob(container, INDEX_BLOB) || [];
    const filtered = index.filter(x => x.id !== id);
    await writeBlob(container, INDEX_BLOB, filtered);
    return { jsonBody: { ok: true } };
  },
});
