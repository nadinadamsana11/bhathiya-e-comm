// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIGURATION START ---
const firebaseConfig = {
  apiKey: "AIzaSyDbiBOY0Zn2DiERJEG1Ri2DgTVll64xphA",
  authDomain: "bhathiya-e-comm-site-f2c07.firebaseapp.com",
  projectId: "bhathiya-e-comm-site-f2c07",
  storageBucket: "bhathiya-e-comm-site-f2c07.firebasestorage.app",
  messagingSenderId: "210770351495",
  appId: "1:210770351495:web:7c66576e2f689850876f22",
  measurementId: "G-4423Z2CVTJ"
};



// Replace with the shop owner's phone number (International format without +)
// Example: 94771234567
const WHATSAPP_PHONE = "94742751312"; 
// --- CONFIGURATION END ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCol = collection(db, "perfumes");

// State
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let modalQty = 1;
let currentProductForModal = null;

// DOM Elements
const grid = document.getElementById('productGrid');
const categoryFilter = document.getElementById('categoryFilter');
const modal = document.getElementById('productModal');

// Cart Elements
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');

// Search Elements
const navSearchInput = document.getElementById('navSearchInput');
const mobileSearchInput = document.getElementById('mobileSearchInput');

// 1. Fetch Products
async function fetchProducts() {
    try {
        const snapshot = await getDocs(productsCol);
        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        renderProducts(allProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        grid.innerHTML = `<div class="col-span-full text-center text-red-500">Failed to load products.</div>`;
    }
}

// 2. Render Products
function renderProducts(products) {
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-400">No perfumes found.</div>`;
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = "group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer";
        card.onclick = () => openModal(product.id); // Entire card opens modal
        
        card.innerHTML = `
            <div class="h-72 overflow-hidden relative bg-gray-100">
                <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transform group-hover:scale-110 transition duration-700">
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-900 rounded-full shadow-sm">${product.category}</div>
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span class="bg-white text-gray-900 px-6 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition duration-300">Quick View</span>
                </div>
            </div>
            <div class="p-5 text-center">
                <h3 class="text-gray-900 font-bold text-lg mb-1 truncate">${product.name}</h3>
                <p class="text-indigo-600 font-extrabold text-xl">LKR ${product.price}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Cart Logic
window.addToCart = (product, qty) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        // Requirement: Prevent duplicate and show alert
        showToast("This item is already in your cart!", "error");
        return;
    } else {
        cart.push({ ...product, qty: qty });
        saveCart();
        renderCart();
        toggleCart(true); // Open cart
        showToast("Added to cart successfully!", "success");
    }
};

window.confirmRemove = (id) => {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmBtn');
    
    modal.classList.remove('hidden');
    
    confirmBtn.onclick = () => {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        closeConfirm();
        showToast("Item removed.", "success");
    };
};

window.closeConfirm = () => {
    document.getElementById('confirmModal').classList.add('hidden');
};

window.updateQty = (id, change) => {
    const item = cart.find(item => item.id === id);
    if (item) {
        if (item.qty + change > 0) {
            item.qty += change;
            saveCart();
            renderCart();
        } else {
            confirmRemove(id);
        }
    }
};

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartCount');
    badge.innerText = count;
    badge.classList.toggle('hidden', count === 0);
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                <p>Your cart is empty.</p>
            </div>`;
        cartTotalEl.innerText = 'LKR 0';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const row = document.createElement('div');
        row.className = "flex gap-4 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm";
        row.innerHTML = `
            <img src="${item.imageUrl}" class="w-20 h-20 object-cover rounded-lg bg-gray-50">
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold text-gray-900 truncate">${item.name}</h4>
                <p class="text-xs text-gray-500 mb-2">${item.category}</p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center border border-gray-200 rounded-lg">
                        <button onclick="updateQty('${item.id}', -1)" class="px-2 py-1 text-gray-500 hover:bg-gray-50 text-xs">-</button>
                        <span class="text-xs font-bold px-2">${item.qty}</span>
                        <button onclick="updateQty('${item.id}', 1)" class="px-2 py-1 text-gray-500 hover:bg-gray-50 text-xs">+</button>
                    </div>
                    <p class="text-sm font-bold text-indigo-600">LKR ${itemTotal}</p>
                </div>
            </div>
            <button onclick="confirmRemove('${item.id}')" class="text-gray-400 hover:text-red-500 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        cartItemsContainer.appendChild(row);
    });

    cartTotalEl.innerText = `LKR ${total}`;
}

window.toggleCart = (forceOpen = null) => {
    const isOpen = !cartSidebar.classList.contains('translate-x-full');
    const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;

    if (shouldOpen) {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
        renderCart();
    } else {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
    }
};

window.checkout = () => {
    if (cart.length === 0) return showToast("Your cart is empty!", "error");

    let message = "Order Summary:\n";
    let total = 0;

    cart.forEach((item) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `- ${item.name} (x${item.qty}): LKR ${itemTotal}\n`;
    });

    message += `\n- Total: LKR ${total}`;
    
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

window.buyNow = (product, qty) => {
    const total = product.price * qty;
    const message = `Hi, I want to buy:\n\n- ${product.name} (x${qty})\n- Price: LKR ${total}`;
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

// 4. Filter Logic
function filterProducts() {
    const searchTerm = (navSearchInput.value || mobileSearchInput.value).toLowerCase();
    const category = categoryFilter.value;

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === "All" || p.category === category;
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

// Event Listeners for Filters
navSearchInput.addEventListener('input', filterProducts);
mobileSearchInput.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);

// 5. Modal Logic
window.openModal = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    currentProductForModal = product;
    modalQty = 1; // Reset qty
    document.getElementById('modalQtyDisplay').innerText = modalQty;

    document.getElementById('modalImg').src = product.imageUrl;
    document.getElementById('modalCategory').innerText = product.category;
    document.getElementById('modalName').innerText = product.name;
    document.getElementById('modalPrice').innerText = `LKR ${product.price}`;
    document.getElementById('modalDesc').innerText = product.description;
    
    const addToCartBtn = document.getElementById('modalAddToCart');
    addToCartBtn.onclick = () => { 
        addToCart(product, modalQty); 
        closeModal(); 
    };

    const buyNowBtn = document.getElementById('modalBuyNow');
    buyNowBtn.onclick = () => {
        buyNow(product, modalQty);
    };

    modal.classList.remove('hidden');
};

window.adjustModalQty = (change) => {
    if (modalQty + change >= 1) {
        modalQty += change;
        document.getElementById('modalQtyDisplay').innerText = modalQty;
    }
};

window.closeModal = () => {
    modal.classList.add('hidden');
};

// Close modal on outside click
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Toast Logic
window.showToast = (message, type = "success") => {
    const toast = document.getElementById('toast');
    const title = document.getElementById('toastTitle');
    const msg = document.getElementById('toastMessage');
    const icon = document.getElementById('toastIcon');

    toast.classList.remove('hidden');
    msg.innerText = message;

    if (type === "success") {
        title.innerText = "Success";
        title.className = "font-bold text-sm text-green-400";
        icon.innerHTML = `<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else {
        title.innerText = "Alert";
        title.className = "font-bold text-sm text-red-400";
        icon.innerHTML = `<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    }

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
};

// Initial Load
fetchProducts();
updateCartCount();

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
        navbar.classList.add('shadow-md', 'bg-white/90');
        navbar.classList.remove('glass');
    } else {
        navbar.classList.remove('shadow-md', 'bg-white/90');
        navbar.classList.add('glass');
    }
});
