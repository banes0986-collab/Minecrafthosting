// --- KAYIT SİSTEMİ (Dashboard'a Otomatik Atan Versiyon) ---
function handleRegister() {
    const u = document.getElementById('r-user').value.trim();
    const p = document.getElementById('r-pass').value.trim();

    if (!u || !p) return alert("Alanları doldur kanka!");
    if (localStorage.getItem('user_' + u)) return alert("Bu kullanıcı zaten var!");

    // Yeni oyuncu verisi
    const userData = {
        username: u,
        password: p,
        balance: 0,
        rank: 'OYUNCU',
        joinDate: new Date().toLocaleDateString()
    };

    // Veritabanına (Local) kaydet
    localStorage.setItem('user_' + u, JSON.stringify(userData));

    // OTOMATİK GİRİŞ YAPTIR (Burası kritik!)
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(userData));

    alert("Hesabın oluşturuldu! Hoş geldin, Dashboard'a aktarılıyorsun...");
    
    // Direkt dashboard'a fırlat
    window.location.href = 'dashboard.html';
}

// --- OTURUM KONTROLÜ (Sayfa Geçişlerini Denetler) ---
function checkAuth() {
    const session = localStorage.getItem('isLoggedIn');
    const path = window.location.pathname;

    // Eğer giriş sayfasındaysan ve oturumun varsa Dashboard'a at
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        if (session === 'true') {
            window.location.href = 'dashboard.html';
        }
    } 
    // Eğer Dashboard'daysan ve oturumun YOKSA Giriş sayfasına at
    else if (path.includes('dashboard.html')) {
        if (session !== 'true') {
            window.location.href = 'index.html';
        }
    }
}

// Sayfa yüklendiği an kontrol et
checkAuth();
