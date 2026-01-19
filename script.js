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
        card.className = "group bg-white border border-gray-100 hover:shadow-xl transition-all duration-300";
        
        card.innerHTML = `
            <div class="h-80 overflow-hidden relative bg-gray-50">
                <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transform group-hover:scale-110 transition duration-700">
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-charcoal">${product.category}</div>
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button onclick="openModal('${product.id}')" class="bg-white text-charcoal px-6 py-3 text-xs uppercase tracking-widest hover:bg-charcoal hover:text-white transition transform translate-y-4 group-hover:translate-y-0 duration-300">Quick View</button>
                </div>
            </div>
            <div class="p-6 text-center">
                <h3 class="font-serif text-xl text-charcoal mb-2">${product.name}</h3>
                <p class="font-serif text-gold font-bold text-lg mb-4">LKR ${product.price}</p>
                <a href="${generateWhatsappLink(product)}" target="_blank" class="inline-block w-full border border-charcoal text-charcoal py-3 text-xs uppercase tracking-widest hover:bg-charcoal hover:text-white transition duration-300">Buy on WhatsApp</a>
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

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.remove('bg-transparent', 'text-white', 'py-6');
        navbar.classList.add('bg-white', 'text-charcoal', 'shadow-md', 'py-3');
    } else {
        navbar.classList.add('bg-transparent', 'text-white', 'py-6');
        navbar.classList.remove('bg-white', 'text-charcoal', 'shadow-md', 'py-3');
    }
});
