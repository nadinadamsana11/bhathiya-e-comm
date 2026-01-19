// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIGURATION START ---
  const firebaseConfig = {
    apiKey: "AIzaSyAZdxVqfbBUzPX1GAUFaCxD-Apkjr3nRPo",
    authDomain: "bhathiya-e-comm-site.firebaseapp.com",
    projectId: "bhathiya-e-comm-site",
    storageBucket: "bhathiya-e-comm-site.firebasestorage.app",
    messagingSenderId: "908525960551",
    appId: "1:908525960551:web:b1c7716fe172426ddf43c2",
    measurementId: "G-7XBCYHGQK6"
  };

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/bhathiya-e-comm-site/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "bhathiya-e-comm-site";
// --- CONFIGURATION END ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCol = collection(db, "products");

// DOM Elements
const productForm = document.getElementById('productForm');
const submitBtn = document.getElementById('submitBtn');
const tableBody = document.getElementById('productTableBody');

// 1. Handle Form Submit
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = document.getElementById('imageFile').files[0];
    if (!file) return alert("Please select an image");

    // UI Loading State
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Uploading Image...";
    submitBtn.disabled = true;

    try {
        // A. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (!data.secure_url) throw new Error("Image upload failed");

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

        alert("Product Added Successfully!");
        productForm.reset();
        loadProducts(); // Refresh table

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});

// 2. Load Products for Table
async function loadProducts() {
    tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>';
    const snapshot = await getDocs(productsCol);
    tableBody.innerHTML = '';

    snapshot.forEach(docSnap => {
        const product = docSnap.data();
        const row = `
            <tr class="hover:bg-gray-700">
                <td class="px-4 py-3">
                    <img src="${product.imageUrl}" class="w-12 h-12 object-cover rounded border border-gray-600">
                </td>
                <td class="px-4 py-3 font-medium text-white">${product.name}</td>
                <td class="px-4 py-3 text-gold">${product.price}</td>
                <td class="px-4 py-3">
                    <button onclick="deleteProduct('${docSnap.id}')" class="text-red-400 hover:text-red-200 text-sm underline">Delete</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// 3. Delete Product
window.deleteProduct = async (id) => {
    if(confirm("Are you sure you want to delete this product?")) {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    }
};

// Initial Load
loadProducts();
