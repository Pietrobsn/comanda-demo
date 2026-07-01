const DEMO_EMAIL = "demo@comanda.local";
const DEMO_ACCESS_CODE = "Demo@123";
const STATE_KEY = "comandaDemoState";
const SESSION_KEY = "comandaDemoSession";

const statusFlow = ["Recebido", "Em preparo", "Saiu para entrega", "Finalizado"];
const demoCustomerNames = ["Mesa 04", "Pedido Balcão", "Cliente Retirada", "Mesa 07", "Retirada Balcão"];

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
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewDescription: document.querySelector("#viewDescription"),
  mobileNavSelect: document.querySelector("#mobileNavSelect"),
  toast: document.querySelector("#toast"),
  navItems: document.querySelectorAll(".nav-item"),
  sections: document.querySelectorAll(".view-section"),
  metricsGrid: document.querySelector("#metricsGrid"),
  openOrdersBadge: document.querySelector("#openOrdersBadge"),
  dashboardOrders: document.querySelector("#dashboardOrders"),
  topProducts: document.querySelector("#topProducts"),
  ordersBoard: document.querySelector("#ordersBoard"),
  ordersList: document.querySelector("#ordersList"),
  orderStatusSummary: document.querySelector("#orderStatusSummary"),
  orderSearch: document.querySelector("#orderSearch"),
  statusFilter: document.querySelector("#statusFilter"),
  paymentFilter: document.querySelector("#paymentFilter"),
  orderViewButtons: document.querySelectorAll("[data-orders-view]"),
  showProductFormBtn: document.querySelector("#showProductFormBtn"),
  cancelProductBtn: document.querySelector("#cancelProductBtn"),
  productForm: document.querySelector("#productForm"),
  catalogList: document.querySelector("#catalogList"),
  categoryList: document.querySelector("#categoryList"),
  categoryCount: document.querySelector("#categoryCount"),
  productCount: document.querySelector("#productCount"),
  catalogSelectedTitle: document.querySelector("#catalogSelectedTitle"),
  cashForm: document.querySelector("#cashForm"),
  cashSummary: document.querySelector("#cashSummary"),
  cashList: document.querySelector("#cashList"),
  driversList: document.querySelector("#driversList"),
  stockCounters: document.querySelector("#stockCounters"),
  stockList: document.querySelector("#stockList"),
  reportsGrid: document.querySelector("#reportsGrid")
};

let state = loadState();
let activeView = "dashboard";
let ordersView = "board";
let selectedCategory = "all";

function createInitialState() {
  return {
    orders: [
      { id: "CMD-1001", customer: "Mesa 04", item: "Combo smash + batata", status: "Recebido", total: 42.9, paid: false, channel: "Balcão", minutes: 4 },
      { id: "CMD-1002", customer: "Pedido Balcão", item: "Pizza média metade calabresa", status: "Em preparo", total: 58, paid: true, channel: "Balcão", minutes: 12 },
      { id: "CMD-1003", customer: "Cliente Retirada", item: "Açaí 500ml + adicionais", status: "Saiu para entrega", total: 31.5, paid: true, channel: "Delivery", minutes: 21 },
      { id: "CMD-0998", customer: "Mesa 02", item: "Smash duplo + refrigerante", status: "Finalizado", total: 47.9, paid: true, channel: "Balcão", minutes: 34 }
    ],
    products: [
      { id: "PRD-1", name: "Pizza média da casa", category: "Pizzas", price: 58, active: true, sold: 18 },
      { id: "PRD-2", name: "Smash artesanal", category: "Hambúrgueres", price: 32.9, active: true, sold: 26 },
      { id: "PRD-3", name: "Combo batata + bebida", category: "Combos", price: 18.5, active: true, sold: 14 },
      { id: "PRD-4", name: "Açaí 500ml", category: "Sobremesas", price: 24, active: false, sold: 7 },
      { id: "PRD-5", name: "Refrigerante lata", category: "Bebidas", price: 7, active: true, sold: 31 }
    ],
    cash: [
      { id: "MOV-1", type: "entrada", description: "Pedidos pagos", amount: 180.3, time: "19:42" },
      { id: "MOV-2", type: "saida", description: "Reposição de insumos", amount: 35, time: "18:15" },
      { id: "MOV-3", type: "entrada", description: "Venda no balcao", amount: 47.9, time: "17:58" }
    ],
    drivers: [
      { id: "DRV-1", name: "Ana Entrega", zone: "Centro", available: true, deliveries: 8 },
      { id: "DRV-2", name: "Bruno Rota", zone: "Bairros próximos", available: false, deliveries: 5 },
      { id: "DRV-3", name: "Carla Express", zone: "Raio expandido", available: true, deliveries: 3 }
    ],
    stock: [
      { id: "STK-1", name: "Massa artesanal", unit: "un", quantity: 36, minimum: 12 },
      { id: "STK-2", name: "Queijo mussarela", unit: "kg", quantity: 8, minimum: 5 },
      { id: "STK-3", name: "Embalagem delivery", unit: "un", quantity: 74, minimum: 30 },
      { id: "STK-4", name: "Molho da casa", unit: "L", quantity: 4, minimum: 6 }
    ]
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    return saved?.orders && saved?.products ? saved : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function isLoggedIn() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.email === DEMO_EMAIL;
  } catch {
    return false;
  }
}

function setLoggedIn(value) {
  dom.loginView.classList.toggle("hidden", value);
  dom.appView.classList.toggle("hidden", !value);
  if (value) {
    render();
    setView(activeView);
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

function currentTime() {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 2600);
}

function viewMeta(view) {
  return {
    dashboard: { eyebrow: "Resumo de hoje", title: "Visão geral", description: "Sua operação demonstrativa em um relance." },
    orders: { eyebrow: "Operação em tempo real", title: "Gestão de pedidos", description: "Acompanhe comandas do recebimento até a finalização." },
    catalog: { eyebrow: "Catálogo da loja", title: "Produtos", description: "Organize itens, categorias, preços e disponibilidade." },
    cash: { eyebrow: "Operação", title: "Caixa", description: "Entradas, saídas e saldo demonstrativo do dia." },
    drivers: { eyebrow: "Delivery", title: "Entregadores", description: "Disponibilidade e entregas da equipe externa." },
    stock: { eyebrow: "Operação", title: "Estoque", description: "Controle local dos insumos da demonstração." },
    reports: { eyebrow: "Finanças", title: "Relatórios", description: "Indicadores calculados a partir dos dados locais." }
  }[view];
}

function setView(view) {
  const meta = viewMeta(view);
  if (!meta) return;
  activeView = view;
  dom.viewEyebrow.textContent = meta.eyebrow;
  dom.viewTitle.textContent = meta.title;
  dom.viewDescription.textContent = meta.description;
  dom.mobileNavSelect.value = view;
  dom.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  dom.sections.forEach((section) => section.classList.toggle("is-active", section.id === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openOrders() {
  return state.orders.filter((order) => order.status !== "Finalizado");
}

function totalRevenue() {
  return state.orders.filter((order) => order.paid).reduce((sum, order) => sum + order.total, 0);
}

function metricCard(icon, tone, label, value, hint) {
  return `
    <article class="metric-card">
      <span class="metric-icon ${tone}"><svg><use href="#${icon}"></use></svg></span>
      <div class="metric-copy"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></div>
    </article>
  `;
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
  const deliveryOrders = activeOrders.filter((order) => order.channel === "Delivery").length;
  const stockAlerts = state.stock.filter((item) => item.quantity <= item.minimum).length;

  dom.metricsGrid.innerHTML = [
    metricCard("i-receipt", "", "Pedidos hoje", state.orders.length, `${activeOrders.length} em andamento`),
    metricCard("i-card", "green", "Recebido (pago)", money.format(totalRevenue()), `${paidOrders} pedidos pagos`),
    metricCard("i-truck", "blue", "Em rota", deliveryOrders, "Pedidos delivery"),
    metricCard("i-clock", "amber", "Alertas de estoque", stockAlerts, "Itens no mínimo")
  ].join("");

  dom.openOrdersBadge.textContent = `${activeOrders.length} ativos`;
  dom.dashboardOrders.innerHTML = activeOrders
    .slice(0, 5)
    .map((order) => `
      <div class="compact-row">
        <span><strong>${escapeHtml(order.customer)}</strong><small>${escapeHtml(order.id)} - ${escapeHtml(order.item)}</small></span>
        <em>${escapeHtml(order.status)}</em>
      </div>
    `)
    .join("") || emptyState("Nenhum pedido em andamento.");

  dom.topProducts.innerHTML = [...state.products]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4)
    .map((product) => `
      <div class="compact-row">
        <span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)}</small></span>
        <em>${product.sold} vendas</em>
      </div>
    `)
    .join("");
}

function filteredOrders() {
  const search = dom.orderSearch.value.trim().toLocaleLowerCase("pt-BR");
  const status = dom.statusFilter.value;
  const payment = dom.paymentFilter.value;
  return state.orders.filter((order) => {
    const matchesSearch = !search || `${order.id} ${order.customer} ${order.item}`.toLocaleLowerCase("pt-BR").includes(search);
    const matchesStatus = status === "all" || order.status === status;
    const matchesPayment = payment === "all" || (payment === "paid" ? order.paid : !order.paid);
    return matchesSearch && matchesStatus && matchesPayment;
  });
}

function renderOrders() {
  const visibleOrders = filteredOrders();
  dom.orderStatusSummary.innerHTML = statusFlow
    .map((status) => {
      const count = state.orders.filter((order) => order.status === status).length;
      return `<button class="status-filter-chip" data-status-chip="${escapeHtml(status)}" type="button">${escapeHtml(status)} <strong>${count}</strong></button>`;
    })
    .join("");

  dom.ordersBoard.innerHTML = statusFlow
    .map((status) => {
      const orders = visibleOrders.filter((order) => order.status === status);
      return `
        <article class="order-column status-${statusClass(status)}">
          <div class="column-heading"><h3>${escapeHtml(status)}</h3><span>${orders.length}</span></div>
          <div class="order-stack">
            ${orders.map(renderOrderCard).join("") || emptyState("Sem pedidos nesta etapa.")}
          </div>
        </article>
      `;
    })
    .join("");

  dom.ordersList.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th>Pagamento</th><th>Canal</th><th>Total</th><th>Ações</th></tr></thead>
      <tbody>
        ${visibleOrders.map((order) => `
          <tr>
            <td data-label="Pedido"><strong>${escapeHtml(order.id)}</strong><small>${escapeHtml(order.item)}</small></td>
            <td data-label="Cliente">${escapeHtml(order.customer)}</td>
            <td data-label="Status"><span class="badge">${escapeHtml(order.status)}</span></td>
            <td data-label="Pagamento"><span class="${order.paid ? "badge green" : "badge amber"}">${order.paid ? "Pago" : "Pendente"}</span></td>
            <td data-label="Canal">${escapeHtml(order.channel)}</td>
            <td data-label="Total"><strong>${money.format(order.total)}</strong></td>
            <td data-label="Ações"><button class="row-action" data-action="advance-order" data-id="${order.id}" type="button">Avançar</button></td>
          </tr>
        `).join("") || `<tr><td colspan="7">${emptyState("Nenhum pedido encontrado.")}</td></tr>`}
      </tbody>
    </table>
  `;

  dom.ordersBoard.classList.toggle("hidden", ordersView !== "board");
  dom.ordersList.classList.toggle("hidden", ordersView !== "list");
  dom.orderViewButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.ordersView === ordersView));
}

function renderOrderCard(order) {
  return `
    <article class="order-card">
      <div class="order-card-top"><strong>${escapeHtml(order.id)} - ${order.minutes} min</strong><span class="${order.paid ? "paid" : "pending"}">${order.paid ? "Pago" : "Pendente"}</span></div>
      <h4>${escapeHtml(order.customer)}</h4>
      <p>${escapeHtml(order.item)}</p>
      <div class="order-meta"><span>${escapeHtml(order.channel)}</span><strong>${money.format(order.total)}</strong></div>
      <div class="card-actions">
        <button data-action="advance-order" data-id="${order.id}" type="button">Avançar</button>
        <button data-action="toggle-paid" data-id="${order.id}" type="button">Pagamento</button>
        <button data-action="print-order" data-id="${order.id}" type="button">Imprimir</button>
      </div>
    </article>
  `;
}

function statusClass(status) {
  return status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replaceAll(" ", "-");
}

function renderCatalog() {
  const categories = [...new Set(state.products.map((product) => product.category))].sort();
  dom.categoryCount.textContent = `${categories.length} categorias`;
  dom.categoryList.innerHTML = ["all", ...categories]
    .map((category) => {
      const label = category === "all" ? "Todos os produtos" : category;
      const count = category === "all" ? state.products.length : state.products.filter((product) => product.category === category).length;
      return `<button class="category-button ${selectedCategory === category ? "is-active" : ""}" data-category="${escapeHtml(category)}" type="button"><span>${escapeHtml(label)}</span><span>${count}</span></button>`;
    })
    .join("");

  const products = selectedCategory === "all" ? state.products : state.products.filter((product) => product.category === selectedCategory);
  dom.catalogSelectedTitle.textContent = selectedCategory === "all" ? "Todos os produtos" : selectedCategory;
  dom.productCount.textContent = `${products.length} itens`;
  dom.catalogList.innerHTML = products
    .map((product) => `
      <article class="product-row">
        <span class="product-thumb"><svg><use href="#i-store"></use></svg></span>
        <div class="product-copy"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} - ${product.sold} vendas</small></div>
        <span class="product-price">${money.format(product.price)}</span>
        <span class="${product.active ? "badge green" : "badge"}">${product.active ? "Ativo" : "Inativo"}</span>
        <button class="row-action" data-action="toggle-product" data-id="${product.id}" type="button">${product.active ? "Desativar" : "Ativar"}</button>
      </article>
    `)
    .join("") || emptyState("Nenhum produto nesta categoria.");
}

function renderCash() {
  const entries = state.cash.filter((movement) => movement.type === "entrada").reduce((sum, movement) => sum + movement.amount, 0);
  const exits = state.cash.filter((movement) => movement.type === "saida").reduce((sum, movement) => sum + movement.amount, 0);
  dom.cashSummary.innerHTML = [
    metricCard("i-plus", "green", "Entradas", money.format(entries), "Movimentos do dia"),
    metricCard("i-card", "amber", "Saídas", money.format(exits), "Retiradas locais"),
    metricCard("i-chart", "blue", "Saldo atual", money.format(entries - exits), "Caixa demonstrativo")
  ].join("");
  dom.cashList.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Horário</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead>
      <tbody>${state.cash.map((movement) => `
        <tr><td data-label="Horário">${escapeHtml(movement.time || "--:--")}</td><td data-label="Descrição"><strong>${escapeHtml(movement.description)}</strong></td><td data-label="Tipo"><span class="${movement.type === "entrada" ? "badge green" : "badge amber"}">${movement.type === "entrada" ? "Entrada" : "Saída"}</span></td><td data-label="Valor"><strong>${movement.type === "entrada" ? "+" : "-"} ${money.format(movement.amount)}</strong></td></tr>
      `).join("")}</tbody>
    </table>
  `;
}

function renderDrivers() {
  dom.driversList.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Entregador</th><th>Area principal</th><th>Entregas hoje</th><th>Status</th><th>Acao</th></tr></thead>
      <tbody>${state.drivers.map((driver) => `
        <tr>
          <td data-label="Entregador"><strong>${escapeHtml(driver.name)}</strong><small>${escapeHtml(driver.id)}</small></td>
          <td data-label="Area principal">${escapeHtml(driver.zone)}</td>
          <td data-label="Entregas hoje">${driver.deliveries}</td>
          <td data-label="Status"><span class="${driver.available ? "badge green" : "badge"}">${driver.available ? "Disponível" : "Em rota"}</span></td>
          <td data-label="Acao"><button class="row-action" data-action="toggle-driver" data-id="${driver.id}" type="button">Alterar status</button></td>
        </tr>
      `).join("")}</tbody>
    </table>
  `;
}

function renderStock() {
  const regular = state.stock.filter((item) => item.quantity > item.minimum).length;
  const low = state.stock.filter((item) => item.quantity <= item.minimum && item.quantity > 0).length;
  const empty = state.stock.filter((item) => item.quantity <= 0).length;
  dom.stockCounters.innerHTML = `
    <div class="stock-counter"><span>Itens cadastrados</span><strong>${state.stock.length}</strong></div>
    <div class="stock-counter"><span>Estoque regular</span><strong>${regular}</strong></div>
    <div class="stock-counter warning"><span>Estoque baixo</span><strong>${low}</strong></div>
    <div class="stock-counter"><span>Sem estoque</span><strong>${empty}</strong></div>
  `;
  dom.stockList.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Insumo</th><th>Unidade</th><th>Estoque mínimo</th><th>Quantidade atual</th><th>Ajuste</th></tr></thead>
      <tbody>${state.stock.map((item) => `
        <tr>
          <td data-label="Insumo"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)}</small></td>
          <td data-label="Unidade">${escapeHtml(item.unit)}</td>
          <td data-label="Estoque mínimo">${item.minimum}</td>
          <td data-label="Quantidade atual"><span class="${item.quantity <= item.minimum ? "badge amber" : "badge green"}">${item.quantity} ${escapeHtml(item.unit)}</span></td>
          <td data-label="Ajuste"><span class="stepper"><button data-action="stock-minus" data-id="${item.id}" type="button">-</button><button data-action="stock-plus" data-id="${item.id}" type="button">+</button></span></td>
        </tr>
      `).join("")}</tbody>
    </table>
  `;
}

function renderReports() {
  const byStatus = statusFlow.map((status) => ({ label: status, value: state.orders.filter((order) => order.status === status).length }));
  const maxStatus = Math.max(...byStatus.map((item) => item.value), 1);
  const byCategory = [...new Set(state.products.map((product) => product.category))]
    .map((category) => ({ label: category, value: state.products.filter((product) => product.category === category).reduce((sum, product) => sum + product.sold, 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const maxCategory = Math.max(...byCategory.map((item) => item.value), 1);
  dom.reportsGrid.innerHTML = `
    <article class="report-panel"><span class="eyebrow">Pedidos</span><h2>Distribuição por status</h2>${barList(byStatus, maxStatus)}</article>
    <article class="report-panel"><span class="eyebrow">Cardápio</span><h2>Vendas por categoria</h2>${barList(byCategory, maxCategory)}</article>
  `;
}

function barList(items, max) {
  return `<div class="bar-list">${items.map((item) => `<div class="bar-row"><span>${escapeHtml(item.label)}</span><div class="bar-track"><i style="width:${Math.max(8, (item.value / max) * 100)}%"></i></div><strong>${item.value}</strong></div>`).join("")}</div>`;
}

function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function saveAndRender(message) {
  saveState();
  render();
  showToast(message);
}

function createDemoOrder() {
  const nextNumber = Math.max(...state.orders.map((order) => Number(order.id.replace("CMD-", "")) || 0), 1000) + 1;
  const customer = demoCustomerNames[state.orders.length % demoCustomerNames.length];
  const product = state.products[state.orders.length % state.products.length];
  const order = {
    id: `CMD-${nextNumber}`,
    customer,
    item: product.name,
    status: "Recebido",
    total: product.price,
    paid: false,
    channel: state.orders.length % 2 ? "Balcão" : "Delivery",
    minutes: 1
  };
  state.orders.unshift(order);
  saveAndRender(`Pedido demo ${order.id} criado.`);
  setView("orders");
}

function handleAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "advance-order") {
    const order = state.orders.find((item) => item.id === id);
    if (!order) return;
    const index = statusFlow.indexOf(order.status);
    order.status = statusFlow[Math.min(index + 1, statusFlow.length - 1)];
    saveAndRender(`${order.id} avancou para ${order.status}.`);
  }
  if (action === "toggle-paid") {
    const order = state.orders.find((item) => item.id === id);
    if (!order) return;
    order.paid = !order.paid;
    saveAndRender(`${order.id}: pagamento ${order.paid ? "confirmado" : "marcado como pendente"}.`);
  }
  if (action === "print-order") {
    showToast(`Impressão simulada para o pedido ${id}.`);
  }
  if (action === "toggle-product") {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    product.active = !product.active;
    saveAndRender(`${product.name}: ${product.active ? "ativo" : "inativo"}.`);
  }
  if (action === "toggle-driver") {
    const driver = state.drivers.find((item) => item.id === id);
    if (!driver) return;
    driver.available = !driver.available;
    saveAndRender(`Status de ${driver.name} atualizado.`);
  }
  if (action === "stock-minus" || action === "stock-plus") {
    const item = state.stock.find((stockItem) => stockItem.id === id);
    if (!item) return;
    item.quantity = Math.max(0, item.quantity + (action === "stock-plus" ? 1 : -1));
    saveAndRender(`Estoque de ${item.name} atualizado.`);
  }
}

dom.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = dom.loginEmail.value.trim();
  const accessCode = dom.loginCode.value;
  if (email !== DEMO_EMAIL || accessCode !== DEMO_ACCESS_CODE) {
    dom.loginMessage.textContent = "Use as credenciais demonstrativas exibidas acima.";
    return;
  }
  dom.loginMessage.textContent = "";
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, signedAt: Date.now() }));
  setLoggedIn(true);
  showToast("Bem-vindo ao Comanda Demo.");
});

dom.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  setLoggedIn(false);
});

dom.resetDemoBtn.addEventListener("click", () => {
  state = createInitialState();
  selectedCategory = "all";
  saveAndRender("Dados demonstrativos reiniciados.");
});

dom.newOrderBtn.addEventListener("click", createDemoOrder);
dom.navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
dom.mobileNavSelect.addEventListener("change", () => setView(dom.mobileNavSelect.value));
document.querySelectorAll("[data-shortcut]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.shortcut)));

dom.orderSearch.addEventListener("input", renderOrders);
dom.statusFilter.addEventListener("change", renderOrders);
dom.paymentFilter.addEventListener("change", renderOrders);
dom.orderViewButtons.forEach((button) => button.addEventListener("click", () => {
  ordersView = button.dataset.ordersView;
  renderOrders();
}));
dom.orderStatusSummary.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status-chip]");
  if (!button) return;
  dom.statusFilter.value = button.dataset.statusChip;
  renderOrders();
});

dom.showProductFormBtn.addEventListener("click", () => dom.productForm.classList.toggle("hidden"));
dom.cancelProductBtn.addEventListener("click", () => {
  dom.productForm.reset();
  dom.productForm.classList.add("hidden");
});
dom.categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  selectedCategory = button.dataset.category;
  renderCatalog();
});

dom.productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#productName").value.trim();
  const category = document.querySelector("#productCategory").value.trim() || "Geral";
  const price = parseAmount(document.querySelector("#productPrice").value);
  if (!name || price <= 0) {
    showToast("Informe nome e preço válidos.");
    return;
  }
  state.products.unshift({ id: `PRD-${Date.now()}`, name, category, price, active: true, sold: 0 });
  selectedCategory = "all";
  dom.productForm.reset();
  dom.productForm.classList.add("hidden");
  saveAndRender("Produto demonstrativo adicionado.");
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
  state.cash.unshift({ id: `MOV-${Date.now()}`, type, description, amount, time: currentTime() });
  dom.cashForm.reset();
  saveAndRender("Movimento demonstrativo registrado.");
});

dom.ordersBoard.addEventListener("click", handleAction);
dom.ordersList.addEventListener("click", handleAction);
dom.catalogList.addEventListener("click", handleAction);
dom.driversList.addEventListener("click", handleAction);
dom.stockList.addEventListener("click", handleAction);

setLoggedIn(isLoggedIn());
