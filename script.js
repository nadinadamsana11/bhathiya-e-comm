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
const WHATSAPP_PHONE = "94771234567"; 
// --- CONFIGURATION END ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCol = collection(db, "products");

// State
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const grid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const modal = document.getElementById('productModal');

// Cart Elements
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');

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
        card.className = "group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col";
        
        card.innerHTML = `
            <div class="h-64 overflow-hidden relative bg-gray-50">
                <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-500">
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800 rounded-sm shadow-sm">${product.category}</div>
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <button onclick="openModal('${product.id}')" class="bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-gray-100 transform translate-y-4 group-hover:translate-y-0 transition duration-300">View</button>
                </div>
            </div>
            <div class="p-5 flex flex-col flex-1">
                <h3 class="text-gray-900 font-semibold text-lg mb-1 truncate">${product.name}</h3>
                <p class="text-indigo-600 font-bold text-xl mb-4">LKR ${product.price}</p>
                <button onclick="addToCart('${product.id}')" class="mt-auto w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition active:scale-95">
                    Add to Cart
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Cart Logic
window.addToCart = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    renderCart();
    toggleCart(true); // Open cart
};

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
};

window.updateQty = (id, change) => {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            renderCart();
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
        cartItemsContainer.innerHTML = '<div class="text-center text-gray-400 mt-10">Your cart is empty.</div>';
        cartTotalEl.innerText = 'LKR 0';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const row = document.createElement('div');
        row.className = "flex gap-4 items-center bg-white p-2 rounded-lg border border-gray-100";
        row.innerHTML = `
            <img src="${item.imageUrl}" class="w-16 h-16 object-cover rounded-md">
            <div class="flex-1">
                <h4 class="text-sm font-semibold text-gray-800 line-clamp-1">${item.name}</h4>
                <p class="text-xs text-gray-500">LKR ${item.price}</p>
                <div class="flex items-center gap-3 mt-2">
                    <button onclick="updateQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200">-</button>
                    <span class="text-sm font-medium">${item.qty}</span>
                    <button onclick="updateQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200">+</button>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm font-bold text-indigo-600">LKR ${itemTotal}</p>
                <button onclick="removeFromCart('${item.id}')" class="text-xs text-red-400 hover:text-red-600 mt-1 underline">Remove</button>
            </div>
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
    if (cart.length === 0) return alert("Your cart is empty!");

    let message = "Hi, I'd like to place an order:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `${index + 1}. ${item.name} (x${item.qty}) - LKR ${itemTotal}\n`;
    });

    message += `\n*Total Amount: LKR ${total}*`;
    
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

// 4. Filter Logic
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === "All" || p.category === category;
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

// Event Listeners for Filters
searchInput.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);

// 5. Modal Logic
window.openModal = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalImg').src = product.imageUrl;
    document.getElementById('modalCategory').innerText = product.category;
    document.getElementById('modalName').innerText = product.name;
    document.getElementById('modalPrice').innerText = `LKR ${product.price}`;
    document.getElementById('modalDesc').innerText = product.description;
    
    const addToCartBtn = document.getElementById('modalAddToCart');
    addToCartBtn.onclick = () => { addToCart(product.id); closeModal(); };

    modal.classList.remove('hidden');
};

window.closeModal = () => {
    modal.classList.add('hidden');
};

// Close modal on outside click
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Initial Load
fetchProducts();
updateCartCount();

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    // Since we changed the navbar to be white by default for the new design, 
    // we just add a stronger shadow on scroll
    if (window.scrollY > 10) {
        navbar.classList.add('shadow-md');
    } else {
        navbar.classList.remove('shadow-md');
    }
});
