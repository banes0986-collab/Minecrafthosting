const marketItems = {
    vips: [
        {name: "VIP Üyelik", price: "40 TL", desc: "Temel VIP avantajları."},
        {name: "VIP+ Üyelik", price: "55 TL", desc: "Gelişmiş kasa anahtarları."},
        {name: "LVIP Üyelik", price: "70 TL", desc: "Özel uçuş yetkisi."},
        {name: "LVIP+ Üyelik", price: "100 TL", desc: "Sınırsız güç paketleri."}
    ],
    kits: [
        {name: "Warden Kit", price: "20 TL", desc: "En güçlü zırh seti."},
        {name: "Skeleton Kit", price: "20 TL", desc: "Hızlı okçu yetenekleri."},
        {name: "Büyücü Kit", price: "1 TL", desc: "Başlangıç iksirleri."}
    ],
    swords: [
        {name: "Özel Kılıç", price: "150 TL", desc: "Tek vuruşta imha!"},
        {name: "Piglin Kılıcı", price: "10 TL", desc: "Altın zenginliği."}
    ]
};

function tab(cat) {
    const grid = document.getElementById('market-display');
    grid.innerHTML = '';
    
    // Aktif tab stilini güncelle
    document.querySelectorAll('.m-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    marketItems[cat].forEach(item => {
        grid.innerHTML += `
            <div class="product-card animate__animated animate__fadeIn">
                <i class="fas fa-box-open fa-3x" style="color:var(--primary)"></i>
                <h3 style="margin:20px 0">${item.name}</h3>
                <p style="color:#888; font-size:14px; margin-bottom:20px">${item.desc}</p>
                <div style="font-size:26px; font-weight:900; color:#00ff88; margin-bottom:20px;">${item.price}</div>
                <button class="btn btn-main" style="width:100%" onclick="openM('${item.name}')">SATIN AL</button>
            </div>
        `;
    });
}

function openM(n) {
    document.getElementById('p-name').innerText = "Seçilen: " + n;
    document.getElementById('buyModal').style.display = 'flex';
}

function closeM() { document.getElementById('buyModal').style.display = 'none'; }

function copyServerIP() {
    navigator.clipboard.writeText("89.47.113.47:25573");
    alert("LegacyNetwork IP Kopyalandı!");
}

// Preloader Kapatma
window.onload = () => {
    tab('vips');
    setTimeout(() => {
        document.getElementById('preloader').style.opacity = '0';
        setTimeout(() => document.getElementById('preloader').style.display = 'none', 500);
    }, 1500);
};
