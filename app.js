const DEMO_EMAIL = "demo@comanda.local";
const DEMO_ACCESS_CODE = "Demo@123";
const STATE_KEY = "comandaDemoState";
const SESSION_KEY = "comandaDemoSession";

const statusFlow = ["Recebido", "Em preparo", "Saiu para entrega", "Finalizado"];

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const dom = {
  loginView: document.querySelector("#loginView"),
  appView: document.querySelector("#appView"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginCode: document.querySelector("#loginCode"),
  loginMessage: document.querySelector("#loginMessage"),
  logoutBtn: document.querySelector("#logoutBtn"),
  resetDemoBtn: document.querySelector("#resetDemoBtn"),
  newOrderBtn: document.querySelector("#newOrderBtn"),
  viewTitle: document.querySelector("#viewTitle"),
  toast: document.querySelector("#toast"),
  navItems: document.querySelectorAll(".nav-item"),
  sections: document.querySelectorAll(".view-section"),
  metricsGrid: document.querySelector("#metricsGrid"),
  openOrdersBadge: document.querySelector("#openOrdersBadge"),
  dashboardOrders: document.querySelector("#dashboardOrders"),
  topProducts: document.querySelector("#topProducts"),
  ordersBoard: document.querySelector("#ordersBoard"),
  productForm: document.querySelector("#productForm"),
  catalogList: document.querySelector("#catalogList"),
  cashForm: document.querySelector("#cashForm"),
  cashSummary: document.querySelector("#cashSummary"),
  cashList: document.querySelector("#cashList"),
  driversList: document.querySelector("#driversList"),
  stockList: document.querySelector("#stockList"),
  reportsGrid: document.querySelector("#reportsGrid")
};

let state = loadState();
let activeView = "dashboard";

function createInitialState() {
  return {
    orders: [
      {
        id: "CMD-1001",
        customer: "Mesa Demo 04",
        item: "Combo smash + batata",
        status: "Recebido",
        total: 42.9,
        paid: false,
        channel: "Balcao",
        minutes: 4
      },
      {
        id: "CMD-1002",
        customer: "Cliente Exemplo",
        item: "Pizza media metade calabresa",
        status: "Em preparo",
        total: 58,
        paid: true,
        channel: "Delivery",
        minutes: 12
      },
      {
        id: "CMD-1003",
        customer: "Pedido Portfolio",
        item: "Acai 500ml + adicionais",
        status: "Saiu para entrega",
        total: 31.5,
        paid: true,
        channel: "Delivery",
        minutes: 21
      }
    ],
    products: [
      { id: "PRD-1", name: "Pizza media demo", category: "Pizzas", price: 58, active: true, sold: 18 },
      { id: "PRD-2", name: "Smash artesanal demo", category: "Hamburgueres", price: 32.9, active: true, sold: 26 },
      { id: "PRD-3", name: "Combo batata + bebida", category: "Combos", price: 18.5, active: true, sold: 14 },
      { id: "PRD-4", name: "Acai 500ml demo", category: "Sobremesas", price: 24, active: false, sold: 7 }
    ],
    cash: [
      { id: "MOV-1", type: "entrada", description: "Pedidos pagos", amount: 132.4 },
      { id: "MOV-2", type: "saida", description: "Compra de insumos fake", amount: 35 }
    ],
    drivers: [
      { id: "DRV-1", name: "Ana Demo", zone: "Centro", available: true, deliveries: 8 },
      { id: "DRV-2", name: "Bruno Demo", zone: "Bairros proximos", available: false, deliveries: 5 },
      { id: "DRV-3", name: "Carla Demo", zone: "Raio expandido", available: true, deliveries: 3 }
    ],
    stock: [
      { id: "STK-1", name: "Massa demo", unit: "un", quantity: 36, minimum: 12 },
      { id: "STK-2", name: "Queijo demo", unit: "kg", quantity: 8, minimum: 5 },
      { id: "STK-3", name: "Embalagem demo", unit: "un", quantity: 74, minimum: 30 }
    ]
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    return saved && saved.orders ? saved : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function isLoggedIn() {
  try {
    return Boolean(JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.email);
  } catch {
    return false;
  }
}

function setLoggedIn(value) {
  dom.loginView.classList.toggle("hidden", value);
  dom.appView.classList.toggle("hidden", !value);
  if (value) {
    render();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseAmount(value) {
  const normalized = String(value || "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 2800);
}

function viewLabel(view) {
  return {
    dashboard: "Dashboard",
    orders: "Pedidos",
    catalog: "Cardápio",
    cash: "Caixa",
    drivers: "Entregadores",
    stock: "Estoque",
    reports: "Relatórios"
  }[view];
}

function setView(view) {
  activeView = view;
  dom.viewTitle.textContent = viewLabel(view);
  dom.navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === view);
  });
  dom.sections.forEach((section) => {
    section.classList.toggle("is-active", section.id === view);
  });
}

function openOrders() {
  return state.orders.filter((order) => order.status !== "Finalizado");
}

function totalRevenue() {
  return state.orders
    .filter((order) => order.paid)
    .reduce((sum, order) => sum + order.total, 0);
}

function render() {
  renderDashboard();
  renderOrders();
  renderCatalog();
  renderCash();
  renderDrivers();
  renderStock();
  renderReports();
}

function renderDashboard() {
  const activeOrders = openOrders();
  const paidOrders = state.orders.filter((order) => order.paid).length;
  const stockAlerts = state.stock.filter((item) => item.quantity <= item.minimum).length;

  dom.metricsGrid.innerHTML = [
    metricCard("Pedidos abertos", activeOrders.length, "Em fila agora"),
    metricCard("Receita paga", money.format(totalRevenue()), `${paidOrders} pedido(s)`),
    metricCard("Ticket médio", money.format(totalRevenue() / Math.max(paidOrders, 1)), "Somente fake"),
    metricCard("Alertas estoque", stockAlerts, "Itens no mínimo")
  ].join("");

  dom.openOrdersBadge.textContent = `${activeOrders.length} aberto(s)`;
  dom.dashboardOrders.innerHTML = activeOrders
    .slice(0, 4)
    .map(
      (order) => `
        <div class="compact-row">
          <span>
            <strong>${escapeHtml(order.id)}</strong>
            <small>${escapeHtml(order.customer)} - ${escapeHtml(order.item)}</small>
          </span>
          <em>${escapeHtml(order.status)}</em>
        </div>
      `
    )
    .join("") || emptyState("Nenhum pedido aberto.");

  dom.topProducts.innerHTML = [...state.products]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4)
    .map(
      (product) => `
        <div class="compact-row">
          <span>
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.category)}</small>
          </span>
          <em>${product.sold} vendas</em>
        </div>
      `
    )
    .join("");
}

function metricCard(label, value, hint) {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </article>
  `;
}

function renderOrders() {
  dom.ordersBoard.innerHTML = statusFlow
    .map((status) => {
      const orders = state.orders.filter((order) => order.status === status);
      return `
        <article class="order-column">
          <div class="column-heading">
            <h4>${escapeHtml(status)}</h4>
            <span>${orders.length}</span>
          </div>
          <div class="order-stack">
            ${
              orders
                .map(
                  (order) => `
                    <article class="order-card">
                      <div class="order-card-top">
                        <strong>${escapeHtml(order.id)}</strong>
                        <span class="${order.paid ? "paid" : "pending"}">
                          ${order.paid ? "Pago" : "Pendente"}
                        </span>
                      </div>
                      <h5>${escapeHtml(order.customer)}</h5>
                      <p>${escapeHtml(order.item)}</p>
                      <div class="order-meta">
                        <span>${escapeHtml(order.channel)}</span>
                        <span>${order.minutes} min</span>
                        <strong>${money.format(order.total)}</strong>
                      </div>
                      <div class="card-actions">
                        <button data-action="advance-order" data-id="${order.id}" type="button">Avancar</button>
                        <button data-action="toggle-paid" data-id="${order.id}" type="button">Pagamento</button>
                        <button data-action="print-order" data-id="${order.id}" type="button">Imprimir</button>
                      </div>
                    </article>
                  `
                )
                .join("") || emptyState("Sem pedidos nesta etapa.")
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCatalog() {
  dom.catalogList.innerHTML = state.products
    .map(
      (product) => `
        <article class="data-row">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.category)} - ${money.format(product.price)}</small>
          </div>
          <span class="${product.active ? "status-chip" : "status-chip muted"}">
            ${product.active ? "Ativo" : "Oculto"}
          </span>
          <button data-action="toggle-product" data-id="${product.id}" type="button">
            ${product.active ? "Ocultar" : "Ativar"}
          </button>
        </article>
      `
    )
    .join("");
}

function renderCash() {
  const entries = state.cash
    .filter((movement) => movement.type === "entrada")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const exits = state.cash
    .filter((movement) => movement.type === "saida")
    .reduce((sum, movement) => sum + movement.amount, 0);

  dom.cashSummary.innerHTML = [
    metricCard("Entradas", money.format(entries), "Movimentos fake"),
    metricCard("Saídas", money.format(exits), "Movimentos fake"),
    metricCard("Saldo", money.format(entries - exits), "Calculado localmente")
  ].join("");

  dom.cashList.innerHTML = state.cash
    .map(
      (movement) => `
        <article class="data-row">
          <div>
            <strong>${escapeHtml(movement.description)}</strong>
            <small>${movement.type === "entrada" ? "Entrada" : "Saída"}</small>
          </div>
          <span class="${movement.type === "entrada" ? "status-chip" : "status-chip danger"}">
            ${money.format(movement.amount)}
          </span>
        </article>
      `
    )
    .join("");
}

function renderDrivers() {
  dom.driversList.innerHTML = state.drivers
    .map(
      (driver) => `
        <article class="data-row">
          <div>
            <strong>${escapeHtml(driver.name)}</strong>
            <small>${escapeHtml(driver.zone)} - ${driver.deliveries} entrega(s)</small>
          </div>
          <span class="${driver.available ? "status-chip" : "status-chip muted"}">
            ${driver.available ? "Disponivel" : "Em pausa"}
          </span>
          <button data-action="toggle-driver" data-id="${driver.id}" type="button">
            Alternar
          </button>
        </article>
      `
    )
    .join("");
}

function renderStock() {
  dom.stockList.innerHTML = state.stock
    .map(
      (item) => `
        <article class="data-row">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>Minimo: ${item.minimum} ${escapeHtml(item.unit)}</small>
          </div>
          <span class="${item.quantity <= item.minimum ? "status-chip danger" : "status-chip"}">
            ${item.quantity} ${escapeHtml(item.unit)}
          </span>
          <div class="stepper">
            <button data-action="stock-minus" data-id="${item.id}" type="button">-</button>
            <button data-action="stock-plus" data-id="${item.id}" type="button">+</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderReports() {
  const byStatus = statusFlow.map((status) => ({
    status,
    total: state.orders.filter((order) => order.status === status).length
  }));
  const maxStatus = Math.max(...byStatus.map((item) => item.total), 1);

  dom.reportsGrid.innerHTML = `
    <article class="panel">
      <div class="panel-heading">
        <h4>Pedidos por etapa</h4>
        <span class="status-chip muted">Local</span>
      </div>
      <div class="bar-list">
        ${byStatus
          .map(
            (item) => `
              <div class="bar-row">
                <span>${escapeHtml(item.status)}</span>
                <div><i style="width:${(item.total / maxStatus) * 100}%"></i></div>
                <strong>${item.total}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
    <article class="panel">
      <div class="panel-heading">
        <h4>Resumo financeiro</h4>
        <span class="status-chip muted">Demo</span>
      </div>
      <div class="compact-list">
        <div class="compact-row"><span><strong>Total pago</strong><small>Pedidos marcados como pagos</small></span><em>${money.format(totalRevenue())}</em></div>
        <div class="compact-row"><span><strong>Pedidos</strong><small>Todos os canais fake</small></span><em>${state.orders.length}</em></div>
        <div class="compact-row"><span><strong>Produtos ativos</strong><small>Cardápio demo</small></span><em>${state.products.filter((product) => product.active).length}</em></div>
      </div>
    </article>
  `;
}

function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function addDemoOrder() {
  const products = state.products.filter((product) => product.active);
  const product = products[Math.floor(Math.random() * products.length)] || state.products[0];
  const nextId = `CMD-${1000 + state.orders.length + 1}`;
  state.orders.unshift({
    id: nextId,
    customer: `Cliente Demo ${state.orders.length + 1}`,
    item: product.name,
    status: "Recebido",
    total: product.price,
    paid: false,
    channel: state.orders.length % 2 ? "Balcao" : "Delivery",
    minutes: 1
  });
  product.sold += 1;
  saveAndRender(`Pedido fake ${nextId} criado.`);
  setView("orders");
}

function advanceOrder(id) {
  const order = state.orders.find((item) => item.id === id);
  if (!order) return;
  const index = statusFlow.indexOf(order.status);
  order.status = statusFlow[Math.min(index + 1, statusFlow.length - 1)];
  saveAndRender(`Pedido ${id} movido para ${order.status}.`);
}

function togglePaid(id) {
  const order = state.orders.find((item) => item.id === id);
  if (!order) return;
  order.paid = !order.paid;
  saveAndRender(`Pagamento do pedido ${id} atualizado.`);
}

function simulatePrint(id) {
  showToast(`Impressão simulada na versão demo para o pedido ${id}.`);
}

function saveAndRender(message) {
  saveState();
  render();
  showToast(message);
}

function handleListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === "advance-order") advanceOrder(id);
  if (action === "toggle-paid") togglePaid(id);
  if (action === "print-order") simulatePrint(id);
  if (action === "toggle-product") {
    const product = state.products.find((item) => item.id === id);
    if (product) {
      product.active = !product.active;
      saveAndRender("Produto demo atualizado.");
    }
  }
  if (action === "toggle-driver") {
    const driver = state.drivers.find((item) => item.id === id);
    if (driver) {
      driver.available = !driver.available;
      saveAndRender("Entregador demo atualizado.");
    }
  }
  if (action === "stock-minus" || action === "stock-plus") {
    const item = state.stock.find((stockItem) => stockItem.id === id);
    if (item) {
      item.quantity = Math.max(0, item.quantity + (action === "stock-plus" ? 1 : -1));
      saveAndRender("Estoque demo atualizado.");
    }
  }
}

dom.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = dom.loginEmail.value.trim().toLowerCase();
  const accessCode = dom.loginCode.value;

  if (email !== DEMO_EMAIL || accessCode !== DEMO_ACCESS_CODE) {
    dom.loginMessage.textContent = "Use demo@comanda.local e Demo@123.";
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, signedAt: Date.now() }));
  dom.loginMessage.textContent = "";
  setLoggedIn(true);
  showToast("Painel demo carregado.");
});

dom.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  setLoggedIn(false);
});

dom.resetDemoBtn.addEventListener("click", () => {
  state = createInitialState();
  saveAndRender("Dados fake reiniciados.");
});

dom.newOrderBtn.addEventListener("click", addDemoOrder);

dom.navItems.forEach((item) => {
  item.addEventListener("click", () => setView(item.dataset.view));
});

dom.ordersBoard.addEventListener("click", handleListClick);
dom.catalogList.addEventListener("click", handleListClick);
dom.driversList.addEventListener("click", handleListClick);
dom.stockList.addEventListener("click", handleListClick);

dom.productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#productName").value.trim();
  const category = document.querySelector("#productCategory").value.trim() || "Geral";
  const price = parseAmount(document.querySelector("#productPrice").value);

  if (!name || price <= 0) {
    showToast("Informe nome e preço válidos.");
    return;
  }

  state.products.unshift({
    id: `PRD-${Date.now()}`,
    name,
    category,
    price,
    active: true,
    sold: 0
  });
  dom.productForm.reset();
  saveAndRender("Produto fake adicionado.");
});

dom.cashForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const type = document.querySelector("#cashType").value;
  const description = document.querySelector("#cashDescription").value.trim();
  const amount = parseAmount(document.querySelector("#cashAmount").value);

  if (!description || amount <= 0) {
    showToast("Informe descrição e valor válidos.");
    return;
  }

  state.cash.unshift({
    id: `MOV-${Date.now()}`,
    type,
    description,
    amount
  });
  dom.cashForm.reset();
  saveAndRender("Movimento fake registrado.");
});

setLoggedIn(isLoggedIn());
