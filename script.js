const shop = {
    vips: [{n:"VIP", p:"40 TL"}, {n:"VIP+", p:"55 TL"}, {n:"LVIP", p:"70 TL"}, {n:"LVIP+", p:"100 TL"}],
    kits: [{n:"Warden Kit", p:"20 TL"}, {n:"Creeper Kit", p:"20 TL"}, {n:"İskelet Kit", p:"20 TL"}, {n:"Ghast Kit", p:"2 TL"}, {n:"Büyücü Kit", p:"1 TL"}, {n:"Piglin Kit", p:"20 TL"}],
    swords: [{n:"Piglin Kılıç", p:"10 TL"}, {n:"Shulker Kılıç", p:"5 TL"}, {n:"Özel Kılıç", p:"150 TL"}]
};

function showPage(p) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(p).classList.add('active');
    if(p === 'market') filter('vips');
}

function filter(cat) {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = '';
    shop[cat].forEach(item => {
        grid.innerHTML += `
            <div class="item-card">
                <i class="fas fa-box-open fa-3x" style="color:var(--primary)"></i>
                <h3 style="margin:15px 0">${item.n}</h3>
                <p style="font-size:24px; color:#00ff88; font-weight:800">${item.p}</p>
                <button class="glow-button" onclick="openModal('${item.n}')">SATIN AL</button>
            </div>
        `;
    });
}

function openModal(name) {
    document.getElementById('selected-item').innerText = "Ürün: " + name;
    document.getElementById('buyModal').style.display = 'block';
}

function closeModal() { document.getElementById('buyModal').style.display = 'none'; }

function copyIP() {
    navigator.clipboard.writeText("89.47.113.47:25573");
    alert("IP Kopyalandı! Oyuna giriş yapabilirsin.");
}
