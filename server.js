const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Sitenin sunucuyla rahat konuşabilmesi için güvenlik ayarları
app.use(cors());
app.use(express.json());

const DB_FILE = './users.json';
let users = {};

// Sunucu açıldığında eski kayıtları dosyadan oku
if (fs.existsSync(DB_FILE)) {
    try {
        users = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        console.log("Veritabanı okuma hatası, yeni dosya oluşturuluyor.");
    }
}

// Özel Admin Hesabı (Şifre: 123456, Yetki: Kurucu)
if (!users["Admin"]) {
    users["Admin"] = { password: "123456", rank: "Kurucu" };
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 4));
}

// Verileri kalıcı olarak dosyaya kaydetme fonksiyonu
const saveToDB = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 4));
};

// --- API ROTASI: KAYIT OLMA ---
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Boş alan bırakma!" });
    }
    if (users[username]) {
        return res.status(400).json({ success: false, message: "Bu kullanıcı adı zaten alınmış!" });
    }

    // Yeni oyuncuyu kaydet
    users[username] = { password: password, rank: "Oyuncu" };
    saveToDB();

    console.log(`[KAYIT] Yeni oyuncu katıldı: ${username}`);
    res.json({ success: true, message: "Kayıt başarılı!", rank: "Oyuncu" });
});

// --- API ROTASI: GİRİŞ YAPMA ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (users[username] && users[username].password === password) {
        console.log(`[GİRİŞ] ${username} sisteme giriş yaptı.`);
        return res.json({ success: true, username: username, rank: users[username].rank });
    }

    res.status(400).json({ success: false, message: "Kullanıcı adı veya şifre yanlış!" });
});

// --- API ROTASI: ADMIN PANELİ (TÜM KULLANICILARI ÇEKME) ---
app.get('/api/admin/users', (req, res) => {
    const caller = req.headers['admin-user'];
    
    // Güvenlik Kontrolü: İstekte bulunan kişi gerçekten Admin mi?
    if (caller !== 'Admin') {
        return res.status(403).json({ success: false, message: "Yetkisiz Erişim!" });
    }

    // Şifreleri gizleyerek sadece kullanıcı adı ve rankları gönder
    let safeUsers = {};
    Object.keys(users).forEach(u => {
        safeUsers[u] = { rank: users[u].rank };
    });

    res.json({ success: true, users: safeUsers });
});

// --- API ROTASI: ADMIN PANELİ (RANK DEĞİŞTİRME) ---
app.post('/api/admin/changerank', (req, res) => {
    const caller = req.headers['admin-user'];
    const { targetUser, newRank } = req.body;

    if (caller !== 'Admin') {
        return res.status(403).json({ success: false, message: "Yetkisiz Erişim!" });
    }

    if (users[targetUser]) {
        users[targetUser].rank = newRank;
        saveToDB();
        console.log(`[YETKİ] ${targetUser} rütbesi ${newRank} olarak değiştirildi.`);
        return res.json({ success: true });
    }

    res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
});

// Sunucuyu Ateşle
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  LEGACY NETWORK SERVERI 3000 PORTUNDA AKTİF!`);
    console.log(`  Extreme Pembe & Yeşil Modu Arka Planı Hazır.`);
    console.log(`==================================================\n`);
});
