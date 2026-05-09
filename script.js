// --- OTURUM KONTROLÜ (Giriş Yapılmış mı?) ---
function checkAuth() {
    const session = localStorage.getItem('isLoggedIn');
    const currentUser = localStorage.getItem('currentUser');
    
    // Eğer giriş sayfasındaysak ve oturum varsa dashboard'a at
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        if (session && currentUser) window.location.href = 'dashboard.html';
    } 
    // Eğer dashboarddaysak ve oturum yoksa giriş sayfasına at
    else if (window.location.pathname.includes('dashboard.html')) {
        if (!session || !currentUser) window.location.href = 'index.html';
    }
}

// --- KAYIT SİSTEMİ ---
function handleRegister() {
    const u = document.getElementById('r-user').value.trim();
    const p = document.getElementById('r-pass').value.trim();

    if (!u || !p) return alert("Alanları doldur kanka!");
    if (localStorage.getItem('user_' + u)) return alert("Bu kullanıcı zaten var!");

    const userData = {
        username: u,
        password: p,
        balance: 0,
        rank: 'OYUNCU',
        joinDate: new Date().toLocaleDateString()
    };

    localStorage.setItem('user_' + u, JSON.stringify(userData));
    alert("Kayıt başarılı! Şimdi giriş yapabilirsin.");
    switchAuth('login');
}

// --- GİRİŞ SİSTEMİ ---
function handleLogin() {
    const u = document.getElementById('l-user').value.trim();
    const p = document.getElementById('l-pass').value.trim();

    // Admin Kontrolü (Config'den çekilir)
    if (u === CONFIG.adminUser && p === CONFIG.adminPass) {
        const adminData = { username: u, balance: '∞', rank: 'KURUCU' };
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(adminData));
        window.location.href = 'dashboard.html';
        return;
    }

    const savedUser = localStorage.getItem('user_' + u);
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.password === p) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            alert("Şifre yanlış!");
        }
    } else {
        alert("Böyle bir oyuncu bulunamadı!");
    }
}

// --- SATIN ALMA & GERÇEK SİPARİŞ ---
function buy(itemName, price) {
    let user = JSON.parse(localStorage.getItem('currentUser'));
    if (user.balance !== '∞' && user.balance < price) {
        alert("Bakiye yetersiz! Discord'dan yükleme yapmalısın.");
        return;
    }

    if (user.balance !== '∞') user.balance -= price;
    
    // Veriyi güncelle
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.rank !== 'KURUCU') localStorage.setItem('user_' + user.username, JSON.stringify(user));

    // Siparişi Kaydet
    const order = {
        id: "#" + Math.floor(1000 + Math.random() * 9000),
        user: user.username,
        item: itemName,
        price: price,
        status: 'BEKLEMEDE',
        date: new Date().toLocaleString()
    };

    let allOrders = JSON.parse(localStorage.getItem('all_orders')) || [];
    allOrders.unshift(order);
    localStorage.setItem('all_orders', JSON.stringify(allOrders));

    alert("Sipariş alındı! Admin onayından sonra teslim edilecektir.");
    location.reload();
}

// --- ADMIN: BAKİYE EKLEME ---
function adminAddBalance() {
    const target = document.getElementById('target-user').value.trim();
    const amount = parseInt(document.getElementById('target-amt').value);
    
    const saved = localStorage.getItem('user_' + target);
    if (!saved) return alert("Oyuncu bulunamadı!");

    let data = JSON.parse(saved);
    data.balance += amount;
    localStorage.setItem('user_' + target, JSON.stringify(data));
    alert(`${target} oyuncusuna ${amount} TL eklendi!`);
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

checkAuth(); // Dosya yüklenince çalıştır
