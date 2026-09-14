const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');

const dbName = 'logichain_test_' + randomUUID().replaceAll('-', '');
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/' + dbName;
const { App } = require('../dist/app');
const { Database } = require('../dist/config/database');
const app = new App();
const database = new Database();
let server;

async function main() {
  server = app.express.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/ready';
  assert.equal((await fetch(url)).status, 503);
  await database.connect();
  assert.equal((await fetch(url)).status, 200);
  const indexes = await mongoose.connection.db.collection('items').indexes();
  assert.ok(indexes.some(index => index.unique && index.key.eventId === 1 && index.key.qrCode === 1));
  const [metrics] = await mongoose.connection.db.listCollections({ name: 'monitoringmetrics' }).toArray();
  assert.equal(metrics.options.timeseries.timeField, 'capturedAt');
  await database.disconnect();
  assert.equal((await fetch(url)).status, 503);
  await database.connect();
  assert.deepEqual(await mongoose.connection.db.collection('items').indexes(), indexes);
  assert.equal((await fetch(url)).status, 200);
  console.log('6 runtime checks passed: readiness, indexes, time series and repeat startup.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName && dbName.startsWith('logichain_test_')) {
    await mongoose.connection.dropDatabase();
  }
  await database.disconnect();
});
