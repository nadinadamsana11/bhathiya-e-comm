// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, orderBy, limit, startAfter, endBefore, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dsmmtfcjd/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "bhathiya_preset";
// --- CONFIGURATION END ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const productsCol = collection(db, "products");

// State
let allAdminProducts = [];
let deleteTargetId = null;
let editTargetId = null;
let currentPage = 1;
let lastVisible = null;
let firstVisible = null;

// DOM Elements
const productForm = document.getElementById('productForm');
const submitBtn = document.getElementById('submitBtn');
const tableBody = document.getElementById('productTableBody');

// Auth DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const dashboardContent = document.getElementById('dashboardContent');
const logoutBtn = document.getElementById('logoutBtn');

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = "success") {
    const toast = document.getElementById('adminToast');
    const content = document.getElementById('adminToastContent');
    const title = document.getElementById('adminToastTitle');
    const msg = document.getElementById('adminToastMessage');
    const icon = document.getElementById('adminToastIcon');

    toast.classList.remove('hidden');
    // Trigger reflow
    void toast.offsetWidth;
    content.classList.remove('translate-y-10', 'opacity-0');

    msg.innerText = message;

    if (type === "success") {
        content.classList.remove('border-red-500');
        content.classList.add('border-gold');
        title.innerText = "Success";
        title.className = "font-bold text-sm text-gold";
        icon.innerHTML = `<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else {
        content.classList.remove('border-gold');
        content.classList.add('border-red-500');
        title.innerText = "Error";
        title.className = "font-bold text-sm text-red-500";
        icon.innerHTML = `<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    }

    setTimeout(() => {
        content.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// --- AUTHENTICATION LOGIC ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginOverlay.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        loadProducts(); // Load products only when logged in
    } else {
        // User is signed out
        loginOverlay.classList.remove('hidden');
        dashboardContent.classList.add('hidden');
        tableBody.innerHTML = '';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginError.classList.add('hidden');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle showing the dashboard
    } catch (error) {
        console.error("Login failed:", error.message);
        loginError.innerText = "Invalid credentials. Please try again.";
        loginError.classList.remove('hidden');
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // onAuthStateChanged will handle showing the login screen
    } catch (error) {
        console.error("Sign out failed:", error);
        showToast("Failed to log out.", "error");
    }
});


// --- PRODUCT MANAGEMENT LOGIC ---

// 1. Handle Form Submit
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) return showToast("You must be logged in to add products.", "error");
    
    const file = document.getElementById('imageFile').files[0];
    if (!file) return showToast("Please select an image", "error");

    // UI Loading State
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Uploading Image...";
    submitBtn.disabled = true;

    try {
        // A. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        console.log("Starting Cloudinary upload...");
        const res = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Cloudinary HTTP Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Cloudinary response:", data);

        if (!data.secure_url) {
            console.error("Cloudinary Error:", data);
            throw new Error(data.error?.message || "Image upload failed");
        }

        submitBtn.innerText = "Saving to Database...";

        // B. Save to Firestore
        await addDoc(productsCol, {
            name: document.getElementById('name').value,
            price: Number(document.getElementById('price').value),
            category: document.getElementById('category').value,
            description: document.getElementById('description').value,
            imageUrl: data.secure_url,
            createdAt: new Date()
        });

        showToast("Product Added Successfully!");
        productForm.reset();
        closeAddModal(); // Close the new modal
        loadProducts(); // Refresh table

    } catch (error) {
        console.error(error);
        showToast("Error: " + error.message, "error");
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});

// 2. Load Products (Pagination & Cards)
async function loadProducts(direction = 'first') {
    if (!auth.currentUser) return;

    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-4xl text-gold"></i></div>';

    try {
        let q;
        const baseRef = collection(db, "products");
        
        // Pagination Logic
        if (direction === 'next' && lastVisible) {
            q = query(baseRef, orderBy("createdAt", "desc"), startAfter(lastVisible), limit(10));
            currentPage++;
        } else if (direction === 'prev' && firstVisible && currentPage > 1) {
            q = query(baseRef, orderBy("createdAt", "desc"), endBefore(firstVisible), limitToLast(10));
            currentPage--;
        } else {
            q = query(baseRef, orderBy("createdAt", "desc"), limit(10));
            currentPage = 1;
        }

        const snapshot = await getDocs(q);
        allAdminProducts = []; // Reset local cache
        grid.innerHTML = '';

        if (snapshot.empty) {
            grid.innerHTML = '<div class="col-span-full text-center text-gray-500">No products found.</div>';
            return;
        }

        // Update Cursors
        firstVisible = snapshot.docs[0];
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        
        // Update UI Controls
        document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('prevPageBtn').classList.toggle('opacity-50', currentPage === 1);

        snapshot.forEach(docSnap => {
            const product = docSnap.data();
            allAdminProducts.push({ id: docSnap.id, ...product }); // Store for edit
            
            // Create Card
            const card = document.createElement('div');
            card.className = "bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden hover:border-gold transition-all cursor-pointer group relative";
            card.onclick = () => openViewModal(docSnap.id);

            card.innerHTML = `
                <div class="relative h-48 overflow-hidden">
                    <img src="${product.imageUrl}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    <div class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-bold">${product.category}</div>
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-white text-lg truncate mb-1">${product.name}</h3>
                    <div class="flex justify-between items-center">
                        <p class="text-gold font-medium">LKR ${product.price}</p>
                        <span class="text-gray-500 text-xs"><i class="fas fa-eye"></i> View</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading products:", error);
        if (error.code === 'permission-denied') {
            grid.innerHTML = '<div class="col-span-full text-center text-red-500">Permission Denied: You must be logged in.</div>';
        } else {
            grid.innerHTML = `<div class="col-span-full text-center text-red-500">Error: ${error.message}</div>`;
        }
    }
}

// Expose pagination to window
window.changePage = (direction) => loadProducts(direction);

// 3. Delete Logic
window.openDeleteModal = (id) => {
    deleteTargetId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
};

window.closeDeleteModal = () => {
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.add('hidden');
};

window.confirmDeleteAction = async () => {
    if (!auth.currentUser) return showToast("You must be logged in.", "error");
    if (!deleteTargetId) return;

    try {
        await deleteDoc(doc(db, "products", deleteTargetId));
        showToast("Product deleted successfully.");
        loadProducts();
        closeDeleteModal();
        closeViewModal(); // Also close view modal if open
    } catch (error) {
        console.error("Error deleting product:", error);
        showToast("Failed to delete: " + error.message, "error");
    }
};

// 4. Edit Logic
window.openEditModal = (id) => {
    const product = allAdminProducts.find(p => p.id === id);
    if (!product) return;

    editTargetId = id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editCategory').value = product.category;
    document.getElementById('editDescription').value = product.description;
    document.getElementById('editModal').classList.remove('hidden');
    // We can keep View Modal open behind it, or close it. Let's keep it for context or close it.
};

window.closeEditModal = () => {
    editTargetId = null;
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editForm').reset();
};

const editForm = document.getElementById('editForm');
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return showToast("You must be logged in.", "error");
    if (!editTargetId) return;

    const submitBtn = document.getElementById('editSubmitBtn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Updating...";
    submitBtn.disabled = true;

    try {
        const updateData = {
            name: document.getElementById('editName').value,
            price: Number(document.getElementById('editPrice').value),
            category: document.getElementById('editCategory').value,
            description: document.getElementById('editDescription').value,
        };

        // Handle Image Update if new file selected
        const file = document.getElementById('editImageFile').files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Image upload failed");
            
            const data = await res.json();
            if (data.secure_url) {
                updateData.imageUrl = data.secure_url;
            }
        }

        await updateDoc(doc(db, "products", editTargetId), updateData);
        
        showToast("Product updated successfully!");
        loadProducts();
        closeEditModal();
        closeViewModal(); // Close view modal to force refresh next time

    } catch (error) {
        console.error("Update failed:", error);
        showToast("Update failed: " + error.message, "error");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

// 5. View Modal Logic
window.openViewModal = (id) => {
    const product = allAdminProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('viewImage').src = product.imageUrl;
    document.getElementById('viewCategory').innerText = product.category;
    document.getElementById('viewName').innerText = product.name;
    document.getElementById('viewPrice').innerText = `LKR ${product.price}`;
    document.getElementById('viewDescription').innerText = product.description;
    
    // Format Date
    const date = product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : 'N/A';
    document.getElementById('viewDate').innerText = date;

    // Setup Buttons
    document.getElementById('viewEditBtn').onclick = () => openEditModal(id);
    document.getElementById('viewDeleteBtn').onclick = () => openDeleteModal(id);

    document.getElementById('viewModal').classList.remove('hidden');
};

window.closeViewModal = () => {
    document.getElementById('viewModal').classList.add('hidden');
};

// 6. Add Modal Logic
window.openAddModal = () => document.getElementById('addProductModal').classList.remove('hidden');
window.closeAddModal = () => document.getElementById('addProductModal').classList.add('hidden');

// Initial Load is now handled by onAuthStateChanged
