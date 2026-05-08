const items = [
    { name: "VIP", price: "40 TL", type: "vips" },
    { name: "VIP+", price: "55 TL", type: "vips" },
    { name: "LVIP", price: "70 TL", type: "vips" },
    { name: "LVIP+", price: "100 TL", type: "vips" },
    { name: "Warden Kit", price: "20 TL", type: "kits" },
    { name: "Creeper Kit", price: "20 TL", type: "kits" },
    { name: "Büyücü Kit", price: "1 TL", type: "kits" },
    { name: "Kar Adam Kit", price: "15 TL", type: "kits" },
    { name: "Özel Kılıç", price: "150 TL", type: "swords" },
    { name: "Shulker Kılıç", price: "5 TL", type: "swords" },
    { name: "Warden Kasa", price: "10 TL", type: "crates" }
];

function toggleMenu() {
    const panel = document.getElementById("side-panel");
    panel.style.width = panel.style.width === "250px" ? "0" : "250px";
}

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function filterShop(category) {
    const shopGrid = document.getElementById("shop-items");
    shopGrid.innerHTML = "";
    
    const filtered = items.filter(i => i.type === category);
    filtered.forEach(item => {
        shopGrid.innerHTML += `
            <div class="card">
                <i class="fas fa-shopping-basket fa-3x"></i>
                <h3>${item.name}</h3>
                <p class="price">${item.price}</p>
                <button class="btn-buy" onclick="alert('Ödeme sistemine yönlendiriliyor...')">Satın Al</button>
            </div>
        `;
    });
    toggleMenu();
    showSection('shop');
}

// Başlangıçta tüm ürünleri göster
window.onload = () => filterShop('vips');
