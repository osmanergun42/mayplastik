import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBlaY1DIt97bCTcv2XK_Zqqp2LgAEzvlYI",
  authDomain: "may-plastik-siparis.firebaseapp.com",
  projectId: "may-plastik-siparis",
  storageBucket: "may-plastik-siparis.appspot.com",
  messagingSenderId: "550900866963",
  appId: "1:550900866963:web:77af1c760ea1518dd39266"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allOrders = [];
let firestoreDocs = [];

// Siparişleri yükle
async function loadOrders() {
  const ordersTable = document.querySelector("#ordersTable tbody");
  ordersTable.innerHTML = "";
  firestoreDocs = [];

  const querySnapshot = await getDocs(collection(db, "orders"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    firestoreDocs.push({ id: docSnap.id, ...data });
  });

  firestoreDocs.forEach((order) => {
    const row = ordersTable.insertRow();
    row.insertCell(0).textContent = order.customerName;
    row.insertCell(1).textContent = order.product;
    row.insertCell(2).textContent = order.quantity;
    row.insertCell(3).textContent = parseFloat(order.totalWeight).toFixed(2);
    row.insertCell(4).textContent = order.date;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = order.id;
    row.insertCell(5).appendChild(checkbox);
  });
}

// Select2 aktif et ve Firestore'dan müşterileri ve ürünleri getir
async function loadCustomersAndProducts() {
  const customerSelect = $("#customerName");
  const productSelect = $("#productName");

  customerSelect.empty().append('<option value="">Hepsi</option>');
  productSelect.empty().append('<option value="">Hepsi</option>');

  const customersSnap = await getDocs(collection(db, "customers"));
  customersSnap.forEach((doc) => {
    const data = doc.data();
    customerSelect.append(new Option(data.name, data.name));
  });

  const productsSnap = await getDocs(collection(db, "products"));
  productsSnap.forEach((doc) => {
    const data = doc.data();
    productSelect.append(new Option(data.name, data.name));
  });

  // Select2 başlat
  $("#customerName").select2({ placeholder: "Müşteri seçin", allowClear: true });
  $("#productName").select2({ placeholder: "Ürün seçin", allowClear: true });
}

// Filtreleme işlemi
window.filterOrders = function () {
  const customerName = document.getElementById("customerName").value;
  const productName = document.getElementById("productName").value;
  const orderDate = document.getElementById("orderDate").value;

  const filtered = firestoreDocs.filter((order) => {
    return (
      (!customerName || order.customerName === customerName) &&
      (!productName || order.product === productName) &&
      (!orderDate || order.date === orderDate)
    );
  });

  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  filtered.forEach((order) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = order.customerName;
    row.insertCell(1).textContent = order.product;
    row.insertCell(2).textContent = order.quantity;
    row.insertCell(3).textContent = parseFloat(order.totalWeight).toFixed(2);
    row.insertCell(4).textContent = order.date;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = order.id;
    row.insertCell(5).appendChild(checkbox);
  });
};

window.openModal = function () {
  document.getElementById("deleteModal").style.display = "block";
};

window.closeModal = function () {
  document.getElementById("deleteModal").style.display = "none";
};

window.deleteSelectedOrders = async function () {
  const checkboxes = document.querySelectorAll("#ordersTable tbody input[type='checkbox']:checked");
  for (const checkbox of checkboxes) {
    await deleteDoc(doc(db, "orders", checkbox.value));
  }
  closeModal();
  await loadOrders();
};

window.copySelectedOrders = function () {
  const checkboxes = document.querySelectorAll("#ordersTable tbody input[type='checkbox']:checked");
  let text = "";

  checkboxes.forEach((checkbox) => {
    const order = firestoreDocs.find((o) => o.id === checkbox.value);
    if (order) {
      text += `${order.customerName}, ${order.product}, ${order.quantity}, ${parseFloat(order.totalWeight).toFixed(2)} kg, ${order.date}\n`;
    }
  });

  navigator.clipboard.writeText(text)
    .then(() => alert("Seçili siparişler kopyalandı."))
    .catch((err) => alert("Kopyalama başarısız oldu: " + err));
};



window.downloadSelectedOrdersAsPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const checkboxes = document.querySelectorAll("#ordersTable tbody input[type='checkbox']:checked");
    if (checkboxes.length === 0) {
        alert("Lütfen en az bir sipariş seçin.");
        return;
    }

    // Türkçe karakter düzeltici
    function fixTurkishChars(text) {
        return text
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
            .replace(/ü/g, 'u').replace(/Ü/g, 'U')
            .replace(/ö/g, 'o').replace(/Ö/g, 'O')
            .replace(/ç/g, 'c').replace(/Ç/g, 'C')
            .replace(/ı/g, 'i').replace(/İ/g, 'I');
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("MAY Plastik - Secili Siparisler", 20, 20);

    const rows = [];
    checkboxes.forEach(function (checkbox) {
        const order = firestoreDocs.find(o => o.id === checkbox.value);
        if (order) {
            rows.push([
                fixTurkishChars(order.customerName),
                fixTurkishChars(order.product),
                order.quantity.toString(),
                parseFloat(order.totalWeight).toFixed(2),
                order.date
            ]);
        }
    });

    doc.autoTable({
        head: [["Musteri", "Urun", "Miktar", "Agirlik (kg)", "Tarih"]],
        body: rows,
        startY: 30,
        styles: {
            font: "helvetica",
            fontSize: 12
        },
        headStyles: {
            fillColor: [68, 68, 68],
            textColor: 255
        }
    });

    doc.save("secili_siparisler.pdf");
};

window.onload = async () => {
  await loadCustomersAndProducts();
  await loadOrders();
};
