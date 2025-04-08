import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
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

const customerSelect = document.getElementById("customerFilter");
const dateInput = document.getElementById("dateFilter");

let allOrders = [];

async function fetchOrders() {
  const snapshot = await getDocs(collection(db, "orders"));
  allOrders = [];
  snapshot.forEach(doc => allOrders.push(doc.data()));
  populateCustomerFilter();
  drawCharts();
}

function populateCustomerFilter() {
  const customers = [...new Set(allOrders.map(order => order.customerName))];
  customerSelect.innerHTML = `<option value="">Tüm Müşteriler</option>`;
  customers.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    customerSelect.appendChild(opt);
  });
}

let ordersChart, weightChart;

function drawCharts() {
  const selectedCustomer = customerSelect.value;
  const selectedDate = dateInput.value;

  const filteredOrders = allOrders.filter(order => {
    const customerMatch = !selectedCustomer || order.customerName === selectedCustomer;
    const dateMatch = !selectedDate || order.date === selectedDate;
    return customerMatch && dateMatch;
  });

  // Müşteriye Göre Sipariş Sayısı
  const customerCounts = {};
  filteredOrders.forEach(order => {
    customerCounts[order.customerName] = (customerCounts[order.customerName] || 0) + 1;
  });

  const customerLabels = Object.keys(customerCounts);
  const customerData = Object.values(customerCounts);

  // Ürüne Göre Toplam Adet ve Ağırlık
  const productDataMap = {};
  filteredOrders.forEach(order => {
    const quantity = parseInt(order.quantity);
    const weight = parseFloat(order.totalWeight);

    if (!productDataMap[order.product]) {
      productDataMap[order.product] = { adet: 0, kilo: 0 };
    }

    productDataMap[order.product].adet += quantity;
    productDataMap[order.product].kilo += weight;
  });

  const productLabels = Object.keys(productDataMap).map(
    name => `${name} (${productDataMap[name].adet} adet)`
  );
  const productData = Object.values(productDataMap).map(p => p.kilo);

  // Önceki grafikler varsa yok et
  if (ordersChart) ordersChart.destroy();
  if (weightChart) weightChart.destroy();

  const ordersCtx = document.getElementById("ordersChart").getContext("2d");
  ordersChart = new Chart(ordersCtx, {
    type: "bar",
    data: {
      labels: customerLabels,
      datasets: [{
        label: "Sipariş Sayısı",
        data: customerData,
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Müşteriye Göre Sipariş Sayısı"
        },
        tooltip: {
          callbacks: {
            label: context => ` ${context.parsed.y} sipariş`
          }
        }
      }
    }
  });

  const weightCtx = document.getElementById("weightChart").getContext("2d");
  weightChart = new Chart(weightCtx, {
    type: "pie",
    data: {
      labels: productLabels,
      datasets: [{
        label: "Toplam Ağırlık (kg)",
        data: productData,
        backgroundColor: ["#36A2EB", "#FFCE56", "#FF6384", "#4BC0C0"]
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Ürüne Göre Toplam Ağırlık Dağılımı (adet/kg)"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed;
              return `${label} - ${value.toFixed(2)} kg`;
            }
          }
        }
      }
    }
  });
}
document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("customerFilter").value = "";
    document.getElementById("dateFilter").value = "";
    drawCharts(); // filtre temizlenince tüm veriler tekrar çizilir
  });
  
// Filtreler değiştiğinde grafikleri yenile
customerSelect.addEventListener("change", drawCharts);
dateInput.addEventListener("change", drawCharts);

// İlk veri yüklemesi
fetchOrders();
