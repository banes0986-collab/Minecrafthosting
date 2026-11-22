// TAntiCrash site backend - bagimlilik yok. Calistir: node server.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000, DB = path.join(__dirname, 'data.json');

let db = { users: {}, servers: {}, attacks: {} };
try { db = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (e) {}
let timer;
const save = () => { clearTimeout(timer); timer = setTimeout(() => fs.writeFile(DB, JSON.stringify(db), () => {}), 500); };

const sessions = new Map(), clients = new Set(), tries = new Map();
setInterval(() => tries.clear(), 10 * 60 * 1000);

const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');
const send = (r, c, o) => { r.writeHead(c, { 'Content-Type': 'application/json' }); r.end(JSON.stringify(o)); };
const readBody = q => new Promise(res => {
  let b = '';
  q.on('data', d => { b += d; if (b.length > 65536) q.destroy(); });
  q.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res({}); } });
});
const sid = q => { const c = (q.headers.cookie || '').split(';').map(s => s.trim().split('=')).find(a => a[0] === 'sid'); return c && c[1]; };
const me = q => sessions.get(sid(q));
const login = (r, u) => {
  const t = crypto.randomBytes(24).toString('hex');
  sessions.set(t, u);
  r.setHeader('Set-Cookie', 'sid=' + t + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800');
};
const byKey = k => Object.keys(db.users).find(n => db.users[n].apiKey === k);
const num = v => Math.max(0, Math.floor(Number(v) || 0));
const str = (v, n) => String(v || '').slice(0, n);
const notify = u => clients.forEach(c => { if (c.user === u) c.res.write('data: update\n\n'); });
const ONLINE = 90 * 1000, LIVE = 15 * 1000, MAX = 3; // anahtar basina max sunucu
const slot = (owner, id) => {
  const k = owner + ':' + id;
  if (db.servers[k]) return k;
  return Object.values(db.servers).filter(s => s.owner === owner).length >= MAX ? null : k;
};

http.createServer(async (q, r) => {
  r.setHeader('X-Content-Type-Options', 'nosniff');
  r.setHeader('X-Frame-Options', 'DENY');
  const url = q.url.split('?')[0], ip = q.socket.remoteAddress;

  try {
    if (q.method === 'GET' && url === '/') {
      r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return r.end(fs.readFileSync(path.join(__dirname, 'public', 'index.html')));
    }

    if (url === '/api/public-stats') {
      const s = Object.values(db.servers), now = Date.now();
      return send(r, 200, {
        servers: s.length,
        online: s.filter(x => now - x.lastSeen < ONLINE).length,
        attacks: Object.keys(db.attacks).length
      });
    }

    if (url === '/api/register' && q.method === 'POST') {
      if ((tries.get(ip) || 0) > 30) return send(r, 429, { error: 'Cok fazla deneme' });
      tries.set(ip, (tries.get(ip) || 0) + 1);
      const b = await readBody(q), name = str(b.username, 20), pw = str(b.password, 100);
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) return send(r, 400, { error: 'Kullanici adi 3-20 harf/rakam/_ olmali' });
      if (pw.length < 8) return send(r, 400, { error: 'Sifre en az 8 karakter olmali' });
      if (db.users[name]) return send(r, 409, { error: 'Bu kullanici adi alinmis' });
      const salt = crypto.randomBytes(16).toString('hex');
      db.users[name] = { salt, hash: hash(pw, salt), apiKey: 'tac_' + crypto.randomBytes(16).toString('hex'), created: Date.now() };
      save(); login(r, name);
      return send(r, 200, { ok: true });
    }

    if (url === '/api/login' && q.method === 'POST') {
      if ((tries.get(ip) || 0) > 30) return send(r, 429, { error: 'Cok fazla deneme' });
      tries.set(ip, (tries.get(ip) || 0) + 1);
      const b = await readBody(q), u = db.users[str(b.username, 20)];
      if (!u || hash(str(b.password, 100), u.salt) !== u.hash) return send(r, 401, { error: 'Hatali kullanici adi veya sifre' });
      login(r, str(b.username, 20));
      return send(r, 200, { ok: true });
    }

    if (url === '/api/logout') {
      sessions.delete(sid(q));
      r.setHeader('Set-Cookie', 'sid=; Max-Age=0; Path=/');
      return send(r, 200, { ok: true });
    }

    if (url === '/api/me') {
      const n = me(q); if (!n) return send(r, 401, { error: 'giris gerekli' });
      const now = Date.now();
      const servers = Object.values(db.servers).filter(s => s.owner === n)
        .map(s => ({ id: s.id, name: s.name, version: s.version, online: s.players, up: now - s.lastSeen < ONLINE, totalBlocked: s.totalBlocked }));
      return send(r, 200, { username: n, apiKey: db.users[n].apiKey, servers, max: MAX });
    }

    if (url === '/api/attacks') {
      const n = me(q); if (!n) return send(r, 401, { error: 'giris gerekli' });
      const now = Date.now();
      const list = Object.values(db.attacks).filter(a => a.owner === n)
        .sort((x, y) => y.startedAt - x.startedAt).slice(0, 100)
        .map(a => Object.assign({}, a, { status: a.status === 'live' && now - a.lastUpdate > LIVE ? 'ended' : a.status }));
      return send(r, 200, list);
    }

    if (url === '/api/stream') {
      const n = me(q); if (!n) return send(r, 401, { error: 'giris gerekli' });
      r.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      const c = { res: r, user: n }; clients.add(c);
      q.on('close', () => clients.delete(c));
      return r.write('data: hello\n\n');
    }

    if (url === '/download') {
      if (!me(q)) { r.writeHead(302, { Location: '/' }); return r.end(); }
      const f = path.join(__dirname, 'plugins', 'TAntiCrash.jar');
      if (!fs.existsSync(f)) return send(r, 404, { error: 'Jar henuz yuklenmemis (site/plugins/TAntiCrash.jar)' });
      r.writeHead(200, { 'Content-Type': 'application/java-archive', 'Content-Disposition': 'attachment; filename="TAntiCrash.jar"' });
      return fs.createReadStream(f).pipe(r);
    }

    if (url === '/api/regen-key' && q.method === 'POST') {
      const n = me(q); if (!n) return send(r, 401, { error: 'giris gerekli' });
      db.users[n].apiKey = 'tac_' + crypto.randomBytes(16).toString('hex');
      save();
      return send(r, 200, { apiKey: db.users[n].apiKey });
    }

    if (url === '/api/server/remove' && q.method === 'POST') {
      const n = me(q); if (!n) return send(r, 401, { error: 'giris gerekli' });
      const b = await readBody(q);
      delete db.servers[n + ':' + str(b.id, 64)];
      save();
      return send(r, 200, { ok: true });
    }

    if (url === '/api/verify' && q.method === 'POST') {
      const owner = byKey(str(q.headers['x-api-key'], 80));
      if (!owner) return send(r, 401, { ok: false, error: 'gecersiz anahtar' });
      const b = await readBody(q), id = str(b.serverId, 64);
      if (!id) return send(r, 400, { ok: false, error: 'serverId yok' });
      const key = slot(owner, id);
      if (!key) return send(r, 403, { ok: false, error: 'sunucu limiti dolu' });
      const old = db.servers[key] || { players: 0, totalBlocked: 0 };
      db.servers[key] = Object.assign(old, { id, owner, name: str(b.serverName, 40), version: str(b.version, 60), lastSeen: Date.now() });
      save(); notify(owner);
      return send(r, 200, { ok: true });
    }

    if (url === '/api/report' && q.method === 'POST') {
      const owner = byKey(str(q.headers['x-api-key'], 80));
      if (!owner) return send(r, 401, { error: 'gecersiz anahtar' });
      const b = await readBody(q), sidv = str(b.serverId, 64);
      if (!sidv) return send(r, 400, { error: 'serverId yok' });
      const key = slot(owner, sidv), now = Date.now();
      if (!key) return send(r, 403, { error: 'sunucu limiti dolu' });
      db.servers[key] = {
        id: sidv, owner, name: str(b.serverName, 40), version: str(b.version, 60), players: num(b.online),
        totalBlocked: num(b.totalBlocked), lastSeen: now
      };
      if (/^attack_/.test(b.event) && b.attack) {
        const a = b.attack, k = key + ':' + num(a.id);
        db.attacks[k] = {
          owner, server: db.servers[key].name, type: str(a.type, 20), startedAt: num(a.startedAt),
          durationSec: num(a.durationSec), peakPerSec: num(a.peakPerSec), currentPerSec: num(a.currentPerSec),
          blocked: num(a.blocked), lastUpdate: now, status: b.event === 'attack_end' ? 'ended' : 'live',
          sources: (Array.isArray(a.sources) ? a.sources : []).slice(0, 10).map(s => ({ ip: str(s.ip, 45), country: str(s.country, 40) }))
        };
        const mine = Object.keys(db.attacks).filter(x => db.attacks[x].owner === owner)
          .sort((x, y) => db.attacks[y].startedAt - db.attacks[x].startedAt);
        mine.slice(200).forEach(x => delete db.attacks[x]);
      }
      save(); notify(owner);
      return send(r, 200, { ok: true });
    }

    send(r, 404, { error: 'bulunamadi' });
  } catch (e) { send(r, 500, { error: 'sunucu hatasi' }); }
}).listen(PORT, () => console.log('TAntiCrash site: http://localhost:' + PORT));

setInterval(() => clients.forEach(c => c.res.write(': ping\n\n')), 20000);
