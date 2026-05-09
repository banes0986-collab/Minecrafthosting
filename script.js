// Sayfa koruması
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (window.location.pathname.includes('dashboard.html') && !user) {
        window.location.href = 'index.html';
    }
}

// Kayıt ve Giriş
function handleRegister() {
    const u = document.getElementById('r-user').value.trim();
    const p = document.getElementById('r-pass').value.trim();
    if(!u || !p) return alert("Doldur kanka!");
    
    const userData = { username: u, balance: 0, rank: 'OYUNCU' };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    alert("Hoş geldin! Dashboard'a gidiyorsun...");
    window.location.href = 'dashboard.html';
}

function handleLogin() {
    const u = document.getElementById('l-user').value.trim();
    const p = document.getElementById('l-pass').value.trim();
    if(u === "triggerbabaa" && p === "resul3163") {
        localStorage.setItem('currentUser', JSON.stringify({username:u, rank:'KURUCU', balance:'∞'}));
        window.location.href = 'dashboard.html';
    } else {
        alert("Normal giriş için önce kayıt ol!");
    }
}

// Satın Alma (Discord'a Bildirim Atar)
function buy(itemName, price) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(!user) return alert("Önce giriş yap!");

    const onay = confirm(`${itemName} almak istiyor musun? (${price} TL)`);
    if(onay) {
        fetch(CONFIG.discordWebhook, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                embeds: [{
                    title: "🛒 YENİ SİPARİŞ!",
                    description: `**Oyuncu:** ${user.username}\n**Ürün:** ${itemName}\n**Fiyat:** ${price} TL`,
                    color: 15844367
                }]
            })
        });
        alert("Sipariş Discord'a iletildi! Yetkililer sana ulaşacak.");
    }
}

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
checkAuth();
