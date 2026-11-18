#!/usr/bin/env node

const REQUESTS = 10;

function parseUrl(input) {
  try {
    const url = new URL(input);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url;
  } catch {}
  return null;
}

async function measure(url) {
  const start = performance.now();
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  let bytes = 0;
  for await (const chunk of response.body) bytes += chunk.length;

  return { bytes, ms: performance.now() - start };
}

const formatMb = (bytes) => `${(bytes / 1e6).toFixed(2)} MB`;
const formatMs = (ms) => `${ms.toFixed(0)} ms`;
const toMbps = (bytes, ms) => (bytes * 8) / (ms / 1000) / 1e6;

const url = parseUrl(process.argv[2]);

if (!url) {
  console.error('Usage: node speedtest.js <http(s)://url>');
  process.exit(1);
}

console.log(`Target: ${url.href}\n`);

let totalBytes = 0;
let totalMs = 0;

try {
  for (let i = 1; i <= REQUESTS; i++) {
    const { bytes, ms } = await measure(url);
    totalBytes += bytes;
    totalMs += ms;
    console.log(
      `#${String(i).padStart(2)}  ${formatMb(bytes).padStart(10)}  ${formatMs(ms).padStart(8)}  ${toMbps(bytes, ms).toFixed(2).padStart(8)} Mbit/s`,
    );
  }
} catch (error) {
  console.error(`\nRequest failed: ${error.message}`);
  process.exit(1);
}

console.log(`
Requests:        ${REQUESTS}
Downloaded:      ${formatMb(totalBytes)}
Average time:    ${formatMs(totalMs / REQUESTS)}
Download speed:  ${toMbps(totalBytes, totalMs).toFixed(2)} Mbit/s`);
