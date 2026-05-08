const items = {
    vips: [
        { n: "VIP", p: "40 TL" }, { n: "VIP+", p: "55 TL" }, 
        { n: "LVIP", p: "70 TL" }, { n: "LVIP+", p: "100 TL" }
    ],
    kits: [
        { n: "Warden Kit", p: "20 TL" }, { n: "Creeper Kit", p: "20 TL" },
        { n: "İskelet Kit", p: "20 TL" }, { n: "Ghast Kit", p: "2 TL" },
        { n: "Büyücü Kit", p: "1 TL" }, { n: "Kar Adam", p: "15 TL" },
        { n: "Piglin Kit", p: "20 TL" }, { n: "Full Netherite", p: "20 TL" }
    ],
    swords: [
        { n: "Piglin Kılıç", p: "10 TL" }, { n: "Shulker Kılıç", p: "5 TL" },
        { n: "Warden Kılıç", p: "10 TL" }, { n: "Creeper Kılıç", p: "10 TL" },
        { n: "Özel Kılıç", p: "150 TL" }
    ],
    crates: [
        { n: "Kit kasa", p: "10 TL" }, { n: "vip Kasa", p: "10 TL" }
    ]
};

function toggleSidebar() {
    const side = document.getElementById("sidebar");
    side.style.width = side.style.width === "300px" ? "0" : "300px";
}

function showSection(sectionId, category = null) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    if (category) {
        loadShop(category);
    }
    if(window.innerWidth < 768) toggleSidebar();
}

function loadShop(cat) {
    const grid = document.getElementById("shop-items");
    const title = document.getElementById("cat-title");
    title.innerText = cat.toUpperCase();
    grid.innerHTML = "";
    
    items[cat].forEach(item => {
        grid.innerHTML += `
            <div class="glass-card">
                <i class="fas fa-box-open fa-3x" style="color:#00d2ff; margin-bottom:15px;"></i>
                <h3>${item.n}</h3>
                <div style="font-size: 22px; color:#00ff88; margin: 15px 0;">${item.p}</div>
                <button class="btn-glow">SATIN AL</button>
            </div>
        `;
    });
}

function copyIP() {
    navigator.clipboard.writeText("89.47.113.47:25573");
    alert("IP Adresi Kopyalandı! Sunucuya Bekliyoruz.");
}
