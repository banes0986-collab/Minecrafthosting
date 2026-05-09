// Kayıt ve Giriş Fonksiyonları
function switchAuth(type) {
    if(type === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-tab').classList.add('active');
        document.getElementById('register-tab').classList.remove('active');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('register-tab').classList.add('active');
    }
}

// Kayıt Olma
function handleRegister() {
    const user = document.getElementById('r-user').value;
    const pass = document.getElementById('r-pass').value;

    if(!user || !pass) return alert("Bilgileri doldur kanka!");

    // Tarayıcı hafızasına kaydet (Simüle veritabanı)
    const userData = { username: user, password: pass, balance: 0, rank: 'OYUNCU' };
    localStorage.setItem('user_' + user, JSON.stringify(userData));
    
    alert("Kayıt başarılı! Şimdi giriş yapabilirsin.");
    switchAuth('login');
}

// Giriş Yapma
function handleLogin() {
    const user = document.getElementById('l-user').value;
    const pass = document.getElementById('l-pass').value;

    // Özel admin hesabı kontrolü
    if(user === "triggerbabaa" && pass === "resul3163") {
        loginSuccess({username: "triggerbabaa", balance: 9999, rank: "KURUCU"});
        return;
    }

    const savedUser = localStorage.getItem('user_' + user);
    if(savedUser) {
        const data = JSON.parse(savedUser);
        if(data.password === pass) {
            loginSuccess(data);
        } else {
            alert("Şifre yanlış kanka!");
        }
    } else {
        alert("Böyle bir kullanıcı yok. Önce kayıt ol!");
    }
}

function loginSuccess(data) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('user-display').innerText = data.username;
    document.getElementById('welcome-name').innerText = data.username;
    document.getElementById('user-balance').innerText = data.balance + " TL";
    document.getElementById('user-rank').innerText = data.rank;
}

// Sayfa Değiştirme
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + pageId).classList.remove('hidden');
    
    document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function buyItem(name) {
    alert(name + " satın almak için bakiye yetersiz! Lütfen Discord üzerinden bakiye yükleyin.");
}

function logout() {
    location.reload();
}
