const DB = {
    vips: [
        {name: "VIP", price: "40 TL", icon: "fa-star"},
        {name: "VIP+", price: "55 TL", icon: "fa-crown"},
        {name: "LVIP", price: "70 TL", icon: "fa-shield"},
        {name: "LVIP+", price: "100 TL", icon: "fa-dragon"}
    ],
    kits: [
        {name: "Warden Kit", price: "20 TL", icon: "fa-gem"},
        {name: "Creeper Kit", price: "20 TL", icon: "fa-bomb"},
        {name: "Skeleton Kit", price: "20 TL", icon: "fa-bone"},
        {name: "Büyücü Kit", price: "1 TL", icon: "fa-wand-sparkles"}
    ],
    swords: [
        {name: "Özel Kılıç", price: "150 TL", icon: "fa-sword"},
        {name: "Piglin Kılıcı", price: "10 TL", icon: "fa-piggy-bank"}
    ]
};

function loadCat(cat, btn) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    DB[cat].forEach(item => {
        grid.innerHTML += `
            <div class="p-card animate__animated animate__fadeIn">
                <i class="fas ${item.icon} fa-4x" style="color:var(--primary)"></i>
                <h3 style="margin:25px 0; font-size:24px;">${item.name}</h3>
                <div style="font-size:30px; font-weight:900; color:#00ff88; margin-bottom:25px;">${item.price}</div>
                <button class="btn-primary" style="width:100%" onclick="openModal('${item.name}')">SATIN AL</button>
            </div>
        `;
    });
}

function openModal(name) {
    document.getElementById('modal-item-name').innerText = name;
    document.getElementById('orderModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function copyIP() {
    navigator.clipboard.writeText("89.47.113.47:25573");
    const txt = document.getElementById('ip-text');
    txt.innerText = "KOPYALANDI!";
    setTimeout(() => txt.innerText = "89.47.113.47:25573", 2000);
}

window.onload = () => {
    loadCat('vips');
    setTimeout(() => {
        document.getElementById('preloader').style.opacity = '0';
        setTimeout(() => document.getElementById('preloader').style.display = 'none', 800);
    }, 2000);
};
