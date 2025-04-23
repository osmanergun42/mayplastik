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

// Filtre elementleri
const customerSelect = document.getElementById("customerFilter");
const dateInput = document.getElementById("dateFilter");
const productSelect = document.getElementById("productFilter");

let allOrders = [];

async function fetchOrders() {
  const snapshot = await getDocs(collection(db, "orders"));
  allOrders = [];
  snapshot.forEach(doc => allOrders.push(doc.data()));
  populateCustomerFilter();
  populateProductFilter();
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

  // Select2 uygula
  $(customerSelect).select2({
    placeholder: "Müşteri Seçiniz",
    allowClear: true,
    width: 'resolve'
  });
}

function populateProductFilter() {
  const products = [...new Set(allOrders.map(order => order.product))];
  productSelect.innerHTML = `<option value="">Tüm Ürünler</option>`;
  products.forEach(prod => {
    const opt = document.createElement("option");
    opt.value = prod;
    opt.textContent = prod;
    productSelect.appendChild(opt);
  });

  $(productSelect).select2({
    placeholder: "Ürün Seçiniz",
    allowClear: true,
    width: 'resolve'
  });
}

let ordersChart, weightChart;

function drawCharts() {
  const selectedCustomer = customerSelect.value;
  const selectedDate = dateInput.value;
  const selectedProduct = productSelect.value;

  const ordersCanvas = document.getElementById("ordersChart");
  const weightCanvas = document.getElementById("weightChart");

  if (!ordersCanvas || !weightCanvas) {
    console.warn("Canvas bulunamadı.");
    return;
  }

  const ordersCtx = ordersCanvas.getContext("2d");
  const weightCtx = weightCanvas.getContext("2d");

  const filteredOrders = allOrders.filter(order => {
    const customerMatch = !selectedCustomer || order.customerName === selectedCustomer;
    const dateMatch = !selectedDate || order.date === selectedDate;
    const productMatch = !selectedProduct || order.product === selectedProduct;
    return customerMatch && dateMatch && productMatch;
  });

  if (ordersChart) ordersChart.destroy();
  if (weightChart) weightChart.destroy();

  // Müşteriye göre sipariş sayısı
  const customerCounts = {};
  filteredOrders.forEach(order => {
    customerCounts[order.customerName] = (customerCounts[order.customerName] || 0) + 1;
  });

  const customerLabels = Object.keys(customerCounts);
  const customerData = Object.values(customerCounts);

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
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 5
        }
      },
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

  // Ürüne göre toplam ağırlık
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
              const value = context.parsed;
              return `${context.label} - ${value.toFixed(2)} kg`;
            }
          }
        }
      }
    }
  });
}

// 🔄 Tüm filtreleri CANLI hale getir
$(customerSelect).on("change", drawCharts);
$(productSelect).on("change", drawCharts);
dateInput.addEventListener("change", drawCharts);

// 🔁 Filtreleri sıfırla
document.getElementById("resetFilters").addEventListener("click", () => {
  $(customerSelect).val("").trigger("change");
  $(productSelect).val("").trigger("change");
  dateInput.value = "";
  drawCharts();
});

// 🚀 Veri yükle
fetchOrders();
