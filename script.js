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

// DOM Elements
const grid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const modal = document.getElementById('productModal');

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
        card.className = "bg-white rounded-lg shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 overflow-hidden group";
        
        card.innerHTML = `
            <div class="h-64 overflow-hidden relative">
                <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-500">
                <div class="absolute top-2 right-2 bg-white px-2 py-1 text-xs font-bold uppercase tracking-wide">${product.category}</div>
            </div>
            <div class="p-6">
                <h3 class="text-lg font-bold mb-1">${product.name}</h3>
                <p class="text-gold font-bold mb-4">LKR ${product.price}</p>
                <div class="flex gap-2">
                    <button onclick="openModal('${product.id}')" class="flex-1 border border-gray-300 py-2 rounded text-sm hover:bg-gray-50 transition">View Details</button>
                    <a href="${generateWhatsappLink(product)}" target="_blank" class="flex-1 bg-gray-900 text-white py-2 rounded text-center text-sm hover:bg-gray-800 transition">Buy</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Helper: Generate WhatsApp Link
function generateWhatsappLink(product) {
    const message = `Hi, I am interested in buying ${product.name} priced at ${product.price}.`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

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
    document.getElementById('modalWhatsapp').href = generateWhatsappLink(product);

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
