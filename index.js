// Firebase SDK modülleri
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Firebase config (senin projen)
const firebaseConfig = {
  apiKey: "AIzaSyBlaY1DIt97bCTcv2XK_Zqqp2LgAEzvlYI",
  authDomain: "may-plastik-siparis.firebaseapp.com",
  projectId: "may-plastik-siparis",
  storageBucket: "may-plastik-siparis.appspot.com",
  messagingSenderId: "550900866963",
  appId: "1:550900866963:web:77af1c760ea1518dd39266"
};

// Firebase başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔽 Müşterileri Firestore'dan yükle
async function loadCustomers() {
  const customerDropdown = document.getElementById("customerName");
  customerDropdown.innerHTML = "";

  const snapshot = await getDocs(collection(db, "customers"));
  snapshot.forEach((doc) => {
    const customer = doc.data();
    const option = document.createElement("option");
    option.value = customer.name;
    option.textContent = customer.name;
    customerDropdown.appendChild(option);
  });
}

// 🔽 Ürünleri Firestore'dan yükle
async function loadProducts() {
  const productDropdown = document.getElementById("product");
  productDropdown.innerHTML = "";

  const snapshot = await getDocs(collection(db, "products"));
  snapshot.forEach((doc) => {
    const product = doc.data();
    const option = document.createElement("option");
    option.value = product.name;
    option.textContent = `${product.name} (${product.size})`;
    option.setAttribute("data-weight", product.weight);
    productDropdown.appendChild(option);
  });
}

async function loadOrders() {
  const ordersTable = document.getElementById("ordersTable").getElementsByTagName("tbody")[0];
  ordersTable.innerHTML = "";

  const snapshot = await getDocs(collection(db, "orders"));
  const orders = [];

  snapshot.forEach((doc) => {
    const order = doc.data();
    orders.push(order);
  });

  // 📌 1. Siparişleri tarihe göre azalan sırala
  orders.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 📌 2. En son 10 tanesini al
  const latest10Orders = orders.slice(0, 10);

  // 📌 3. Tabloya yaz
  latest10Orders.forEach(order => {
    addOrderToTable(order);
  });
}


// 🧾 Siparişi tabloya yaz
function addOrderToTable(order) {
  const table = document.getElementById("ordersTable").getElementsByTagName("tbody")[0];
  const newRow = table.insertRow();

  newRow.insertCell(0).textContent = order.customerName;
  newRow.insertCell(1).textContent = order.product;
  newRow.insertCell(2).textContent = order.quantity;
  newRow.insertCell(3).textContent = parseFloat(order.totalWeight).toFixed(2);
  newRow.insertCell(4).textContent = order.date;
}

// ✅ Sipariş ekleme
document.getElementById("orderForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const customerName = document.getElementById("customerName").value;
  const productElement = document.getElementById("product");
  const product = productElement.value;
  const quantity = parseInt(document.getElementById("quantity").value);
  const orderDate = document.getElementById("orderDate").value;

  const weight = parseFloat(productElement.options[productElement.selectedIndex].getAttribute("data-weight"));
  const totalWeight = quantity * weight;

  const newOrder = {
    customerName,
    product,
    quantity,
    totalWeight,
    date: orderDate
  };

  try {
    await addDoc(collection(db, "orders"), newOrder);
    alert("Sipariş başarıyla kaydedildi ✅");
    document.getElementById("orderForm").reset();
    loadOrders(); // Tabloyu güncelle
  } catch (error) {
    console.error("Sipariş eklenemedi ❌", error);
  }
});

// Sayfa yüklendiğinde çalıştır
window.onload = function () {
  loadProducts();     // Firestore'dan ürün
  loadCustomers();    // Firestore'dan müşteri
  loadOrders();       // Firestore'dan sipariş
};
