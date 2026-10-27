import { afterEach, describe, expect, it, vi } from 'vitest';

// A fake ESP32 on Web Serial: replays chunks the way a real port splits them (mid-line).
function fakeSerial(chunks: string[]) {
  const enc = new TextEncoder();
  let ctrl: ReadableStreamDefaultController<Uint8Array>;
  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      ctrl = c;
      chunks.forEach((s) => c.enqueue(enc.encode(s)));
    },
  });
  const port = { open: vi.fn(async () => {}), close: vi.fn(async () => {}), readable, getInfo: () => ({ usbVendorId: 0x10c4 }) };
  const serial = Object.assign(new EventTarget(), { requestPort: vi.fn(async () => port) });
  return { serial, port, end: () => ctrl.close() };
}

const tick = () => new Promise((r) => setTimeout(r, 20));

describe('benchSensorStore (Web Serial link to the bench ESP32)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('reads lines, drops a cut-off first line, forwards to the backend and disconnects cleanly', async () => {
    const fake = fakeSerial(['.0\r\n57,WAR', 'NING,4.0\r\n# no echo\r\n80,DANGER,2.4\r\n']);
    vi.stubGlobal('navigator', { serial: fake.serial });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: 'ACCEPTED', phase: 'WARNING' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const store = await import('../services/benchSensorStore');

    await store.connect();
    await tick();
    const s = store.getState();
    expect(s.status).toBe('live');
    expect(s.portLabel).toBe('USB cable');
    expect(s.count).toBe(2); // ".0" fragment dropped, "# no echo" not a reading
    expect(s.reading).toMatchObject({ pct: 80, level: 'DANGER' });
    expect(s.lines).toEqual(['57,WARNING,4.0', '# no echo', '80,DANGER,2.4']);

    // Forwarded at most once a second: the first reading only, unsigned, as fw-bench-01
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ device_id: 'fw-bench-01', distance_cm: 4 });
    expect(store.getState().server).toMatchObject({ ok: true, text: 'ACCEPTED', phase: 'WARNING' });

    await store.disconnect();
    expect(fake.port.close).toHaveBeenCalled();
    expect(store.getState().status).toBe('idle');
  });

  it('explains a busy port instead of failing silently', async () => {
    const fake = fakeSerial([]);
    fake.port.open = vi.fn(async () => { throw Object.assign(new Error('Failed to open serial port.'), { name: 'NetworkError' }); });
    vi.stubGlobal('navigator', { serial: fake.serial });
    const store = await import('../services/benchSensorStore');
    await store.connect();
    expect(store.getState().status).toBe('error');
    expect(store.getState().message).toMatch(/Close any other app/);
  });

  it('says when the backend is down', async () => {
    const fake = fakeSerial(['x\n57,WARNING,4.0\n']);
    vi.stubGlobal('navigator', { serial: fake.serial });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const store = await import('../services/benchSensorStore');
    await store.connect();
    await tick();
    expect(store.getState().status).toBe('live');
    expect(store.getState().server).toMatchObject({ ok: false });
    expect(store.getState().server?.text).toMatch(/not reachable/);
    await store.disconnect();
  });

  it('holds the level steady while the water sits on a threshold', async () => {
    // 2.2/2.3 cm of water straddles ADVISORY (2.25 cm): the raw level flips every reading
    const flicker = Array.from({ length: 6 }, (_, i) => (i % 2 ? '33,SAFE,5.7\n' : '31,SAFE,5.8\n')).join('');
    const fake = fakeSerial(['x\n31,SAFE,5.8\n' + flicker + '33,SAFE,5.7\n33,SAFE,5.7\n33,SAFE,5.7\n']);
    vi.stubGlobal('navigator', { serial: fake.serial });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
    const store = await import('../services/benchSensorStore');
    const levels: (string | null)[] = [];
    store.subscribe(() => levels.push(store.getState().level));
    await store.connect();
    await tick();
    const changes = levels.filter((l, i) => l && l !== levels[i - 1]);
    expect(changes).toEqual(['NORMAL', 'ADVISORY']); // up at once, then no flip back while it jitters
    await store.disconnect();
  });

  it('shows a rise on the very next reading, and a fall only after three agree', async () => {
    const fake = fakeSerial(['x\n0,SAFE,8.0\n80,DANGER,2.4\n0,SAFE,8.0\n0,SAFE,8.0\n0,SAFE,8.0\n']);
    vi.stubGlobal('navigator', { serial: fake.serial });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
    const store = await import('../services/benchSensorStore');
    const levels: (string | null)[] = [];
    let seen = 0; // one entry per reading (the backend reply notifies too)
    store.subscribe(() => {
      const s = store.getState();
      if (s.count > seen) { seen = s.count; levels.push(s.level); }
    });
    await store.connect();
    await tick();
    expect(levels).toEqual(['NORMAL', 'DANGER', 'DANGER', 'DANGER', 'NORMAL']);
    await store.disconnect();
  });
});
