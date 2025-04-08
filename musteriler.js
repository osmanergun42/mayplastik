import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

let customers = [];

async function loadCustomers() {
  const dropdown = document.getElementById("customerDropdown");
  dropdown.innerHTML = `<option value="">Müşteri Seçin</option>`;
  customers = [];

  try {
    const snapshot = await getDocs(collection(db, "customers"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = data.name;
      dropdown.appendChild(option);
      customers.push({ id: docSnap.id, name: data.name });
    });
  } catch (error) {
    console.error("Müşteriler yüklenirken hata oluştu:", error);
  }
}

window.showCustomerOrders = async function () {
  const dropdown = document.getElementById("customerDropdown");
  const customerId = dropdown.value;
  const customerName = dropdown.options[dropdown.selectedIndex].text;

  if (!customerId) {
    alert("Lütfen bir müşteri seçin.");
    return;
  }

  try {
    const q = query(collection(db, "orders"), where("customerName", "==", customerName));
    const snapshot = await getDocs(q);
    const orders = [];

    snapshot.forEach((docSnap) => {
      orders.push(docSnap.data());
    });

    const ordersTable = document.getElementById("ordersTable");
    const tbody = ordersTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (orders.length === 0) {
      alert("Bu müşteri için sipariş bulunamadı.");
      ordersTable.style.display = "none";
      document.getElementById("dateRangeForm").style.display = "none";
      return;
    }

    orders.forEach((order) => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = order.product;
      row.insertCell(1).textContent = order.quantity;
      row.insertCell(2).textContent = parseFloat(order.totalWeight).toFixed(2);
      row.insertCell(3).textContent = order.date;
    });

    ordersTable.style.display = "";
    document.getElementById("dateRangeForm").style.display = "";
  } catch (error) {
    console.error("Siparişler getirilirken hata:", error);
  }
};

window.deleteCustomer = async function () {
  const dropdown = document.getElementById("customerDropdown");
  const customerId = dropdown.value;
  const customerName = dropdown.options[dropdown.selectedIndex].text;

  if (!customerId) {
    alert("Lütfen silmek için bir müşteri seçin.");
    return;
  }

  const confirmDelete = confirm(`"${customerName}" isimli müşteriyi silmek istediğinize emin misiniz?`);
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "customers", customerId));

    const q = query(collection(db, "orders"), where("customerName", "==", customerName));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "orders", docSnap.id));
    }

    alert(`"${customerName}" başarıyla silindi.`);
    await loadCustomers();
    document.getElementById("ordersTable").style.display = "none";
    document.getElementById("dateRangeForm").style.display = "none";
  } catch (error) {
    console.error("Müşteri silinirken hata:", error);
  }
};

window.downloadOrders = async function () {
  const dropdown = document.getElementById("customerDropdown");
  const customerName = dropdown.options[dropdown.selectedIndex].text;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!customerName || !startDate || !endDate) {
    alert("Lütfen müşteri ve tarih aralığını seçin.");
    return;
  }

  try {
    const q = query(collection(db, "orders"), where("customerName", "==", customerName));
    const snapshot = await getDocs(q);

    const orders = [];
    snapshot.forEach((docSnap) => {
      const order = docSnap.data();
      if (order.date >= startDate && order.date <= endDate) {
        orders.push(order);
      }
    });

    if (orders.length === 0) {
      alert("Bu tarih aralığında kayıtlı sipariş yok.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws_data = [["Ürün", "Miktar", "Toplam Ağırlık (kg)", "Kayıt Tarihi"]];
    orders.forEach((order) => {
      ws_data.push([
        order.product,
        order.quantity,
        parseFloat(order.totalWeight).toFixed(2),
        order.date
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Siparişler");
    XLSX.writeFile(wb, `${customerName}_siparisler_${startDate}_to_${endDate}.xlsx`);
  } catch (error) {
    console.error("Excel dosyası oluşturulurken hata:", error);
  }
};

window.onload = async () => {
  await loadCustomers();
};
