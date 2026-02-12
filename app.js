const LEGACY_STORAGE_KEY = "portfolio_tracker_v1";

const productForm = document.getElementById("product-form");
const investmentForm = document.getElementById("investment-form");
const productTypeSelect = document.getElementById("product-type");
const customTypeWrap = document.getElementById("custom-type-wrap");
const customTypeInput = document.getElementById("custom-type");
const investmentProductSelect = document.getElementById("investment-product");
const detailProductSelect = document.getElementById("detail-product-select");
const productsBody = document.getElementById("products-body");
const typesBody = document.getElementById("types-body");
const detailForm = document.getElementById("detail-form");
const detailStats = document.getElementById("detail-stats");
const detailInvestmentsBody = document.getElementById("detail-investments-body");
const detailNameInput = document.getElementById("detail-name");
const detailTypeSelect = document.getElementById("detail-type");
const detailCustomTypeWrap = document.getElementById("detail-custom-type-wrap");
const detailCustomTypeInput = document.getElementById("detail-custom-type");
const detailExtraInfoInput = document.getElementById("detail-extra-info");
const detailPlatformInput = document.getElementById("detail-platform");
const detailHorizonSelect = document.getElementById("detail-horizon-label");
const detailExpectedDueDateInput = document.getElementById("detail-expected-due-date");
const detailCurrentValueInput = document.getElementById("detail-current-value");
const kpiInvested = document.getElementById("kpi-invested");
const kpiCurrent = document.getElementById("kpi-current");
const kpiBenefit = document.getElementById("kpi-benefit");
const chartByProduct = document.getElementById("chart-by-product");
const chartByType = document.getElementById("chart-by-type");
const chartByPlatform = document.getElementById("chart-by-platform");
const chartFixedVariable = document.getElementById("chart-fixed-variable");
const chartByHorizon = document.getElementById("chart-by-horizon");
const screenNavButtons = document.querySelectorAll(".screen-nav-btn");
const screenManage = document.getElementById("screen-manage");
const screenDashboard = document.getElementById("screen-dashboard");
const screenDetails = document.getElementById("screen-details");
const defaultDate = document.getElementById("investment-date");

const state = { products: [] };
let selectedDetailProductId = "";
const FIXED_PRODUCT_TYPES = new Set(["Bank Deposit", "Remunerated Account"]);
const PRODUCT_TYPE_OPTIONS = [
  "Bank Deposit",
  "Remunerated Account",
  "Investment Fund",
  "ETF",
  "Roboadvisor",
  "Gold",
  "Crowdfunding",
  "Crowdlending",
  "Stock",
  "Other",
];

defaultDate.valueAsDate = new Date();

productTypeSelect.addEventListener("change", () => {
  const isOther = productTypeSelect.value === "Other";
  customTypeWrap.classList.toggle("hidden", !isOther);
  customTypeInput.required = isOther;
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const name = String(formData.get("name")).trim();
  const extraInfo = String(formData.get("extraInfo") || "").trim();
  const platform = String(formData.get("platform") || "").trim();
  const chosenType = String(formData.get("type"));
  const customType = String(formData.get("customType") || "").trim();
  const type = chosenType === "Other" ? customType : chosenType;
  const horizonLabel = String(formData.get("horizonLabel") || "").trim();
  const expectedDueDate = String(formData.get("expectedDueDate") || "").trim();
  const currentValue = parseCurrency(formData.get("currentValue"));
  const initialInvestment = parseCurrency(formData.get("initialInvestment"));
  const initialDate = String(formData.get("initialDate") || "");

  if (!name || !type || initialInvestment <= 0) {
    return;
  }

  const payload = {
    name,
    extraInfo,
    platform,
    expectedDueDate,
    horizonLabel,
    type,
    currentValue,
  };

  try {
    const created = await apiRequest("/api/products", {
      method: "POST",
      body: payload,
    });

    await apiRequest(`/api/products/${created.id}/investments`, {
      method: "POST",
      body: {
        amount: initialInvestment,
        date: initialDate || todayISO(),
      },
    });

    await loadFromServer();
    render();
  } catch (error) {
    handleError(error);
    return;
  }

  productForm.reset();
  document.getElementById("product-current-value").value = "0";
  productTypeSelect.value = "Bank Deposit";
  customTypeWrap.classList.add("hidden");
  customTypeInput.required = false;
});

investmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(investmentForm);
  const productId = String(formData.get("productId"));
  const amount = parseCurrency(formData.get("amount"));
  const date = String(formData.get("date"));

  if (!productId || amount <= 0 || !date) {
    return;
  }

  try {
    await apiRequest(`/api/products/${productId}/investments`, {
      method: "POST",
      body: { amount, date },
    });
    await loadFromServer();
    render();
    investmentForm.reset();
    defaultDate.valueAsDate = new Date();
  } catch (error) {
    handleError(error);
  }
});

detailTypeSelect.addEventListener("change", () => {
  const isOther = detailTypeSelect.value === "Other";
  detailCustomTypeWrap.classList.toggle("hidden", !isOther);
  detailCustomTypeInput.required = isOther;
});

detailForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedDetailProductId) {
    return;
  }

  const chosenType = String(detailTypeSelect.value || "");
  const customType = String(detailCustomTypeInput.value || "").trim();
  const type = chosenType === "Other" ? customType : chosenType;
  const payload = {
    type,
    extraInfo: String(detailExtraInfoInput.value || "").trim(),
    platform: String(detailPlatformInput.value || "").trim(),
    horizonLabel: String(detailHorizonSelect.value || "").trim(),
    expectedDueDate: String(detailExpectedDueDateInput.value || "").trim(),
    currentValue: Math.max(0, parseCurrency(detailCurrentValueInput.value)),
  };

  if (!payload.type) {
    return;
  }

  try {
    await apiRequest(`/api/products/${selectedDetailProductId}`, {
      method: "PATCH",
      body: payload,
    });
    await loadFromServer();
    render();
  } catch (error) {
    handleError(error);
  }
});

detailProductSelect.addEventListener("change", () => {
  selectedDetailProductId = detailProductSelect.value;
  renderProductDetails();
});

screenNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.screenTarget;
    activateScreen(target);
  });
});

function render() {
  renderProductOptions();
  renderProductsTable();
  renderTypesTable();
  renderKpis();
  renderCharts();
  renderProductDetails();
}

function activateScreen(screen) {
  screenManage.classList.toggle("active", screen === "manage");
  screenDashboard.classList.toggle("active", screen === "dashboard");
  screenDetails.classList.toggle("active", screen === "details");
  screenNavButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screenTarget === screen);
  });
}

function renderProductOptions() {
  fillProductSelect(investmentProductSelect, "Select a product", "No products yet");
  fillProductSelect(detailProductSelect, "Select a product", "No products yet");

  if (!state.products.length) {
    selectedDetailProductId = "";
    return;
  }

  const exists = state.products.some((product) => product.id === selectedDetailProductId);
  if (!exists) {
    selectedDetailProductId = state.products[0].id;
  }
  detailProductSelect.value = selectedDetailProductId;
}

function renderProductsTable() {
  productsBody.innerHTML = "";

  if (!state.products.length) {
    productsBody.innerHTML =
      '<tr><td colspan="8">No products added yet.</td></tr>';
    return;
  }

  state.products.forEach((product) => {
    const invested = totalInvested(product);
    const benefit = product.currentValue - invested;
    const row = document.createElement("tr");
    const dueLabel = formatDueStatus(product.expectedDueDate);
    const infoHtml = product.extraInfo
      ? `<div class="product-extra">${escapeHTML(product.extraInfo)}</div>`
      : "";
    row.innerHTML = `
      <td>
        ${escapeHTML(product.name)}
        ${infoHtml}
      </td>
      <td>${escapeHTML(product.type)}</td>
      <td>${product.platform ? escapeHTML(product.platform) : '<span class="muted">-</span>'}</td>
      <td>${formatMoney(invested)}</td>
      <td>${formatMoney(product.currentValue)}</td>
      <td class="${benefit >= 0 ? "positive" : "negative"}">${formatMoney(benefit)}</td>
      <td>${product.horizonLabel ? escapeHTML(product.horizonLabel) : '<span class="muted">-</span>'}</td>
      <td>${dueLabel}</td>
    `;
    productsBody.appendChild(row);
  });
}

function renderTypesTable() {
  typesBody.innerHTML = "";
  const groups = new Map();

  state.products.forEach((product) => {
    const invested = totalInvested(product);
    const current = product.currentValue;
    const existing = groups.get(product.type) || {
      invested: 0,
      current: 0,
    };

    existing.invested += invested;
    existing.current += current;
    groups.set(product.type, existing);
  });

  if (!groups.size) {
    typesBody.innerHTML = '<tr><td colspan="4">No data yet.</td></tr>';
    return;
  }

  [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, values]) => {
      const benefit = values.current - values.invested;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHTML(type)}</td>
        <td>${formatMoney(values.invested)}</td>
        <td>${formatMoney(values.current)}</td>
        <td class="${benefit >= 0 ? "positive" : "negative"}">${formatMoney(benefit)}</td>
      `;
      typesBody.appendChild(row);
    });
}

function renderProductDetails() {
  if (!state.products.length || !selectedDetailProductId) {
    detailStats.innerHTML = '<p class="muted">Add a product to see details.</p>';
    detailInvestmentsBody.innerHTML =
      '<tr><td colspan="2" class="muted">No investment history yet.</td></tr>';
    return;
  }

  const product = state.products.find((item) => item.id === selectedDetailProductId);
  if (!product) {
    detailStats.innerHTML = '<p class="muted">Select a valid product.</p>';
    detailInvestmentsBody.innerHTML =
      '<tr><td colspan="2" class="muted">No investment history yet.</td></tr>';
    return;
  }

  detailNameInput.value = product.name;
  detailExtraInfoInput.value = product.extraInfo || "";
  detailPlatformInput.value = product.platform || "";
  detailHorizonSelect.value = product.horizonLabel || "";
  detailExpectedDueDateInput.value = product.expectedDueDate || "";
  detailCurrentValueInput.value = product.currentValue.toFixed(2);

  if (PRODUCT_TYPE_OPTIONS.includes(product.type) && product.type !== "Other") {
    detailTypeSelect.value = product.type;
    detailCustomTypeInput.value = "";
    detailCustomTypeWrap.classList.add("hidden");
    detailCustomTypeInput.required = false;
  } else {
    detailTypeSelect.value = "Other";
    detailCustomTypeInput.value = product.type || "";
    detailCustomTypeWrap.classList.remove("hidden");
    detailCustomTypeInput.required = true;
  }

  const investments = [...product.investments].sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );
  const operations = investments.length;
  const invested = totalInvested(product);
  const averageAmount = operations > 0 ? invested / operations : 0;
  const weightedAvgDate = operations > 0 ? weightedAverageDate(investments) : null;
  const firstDate = operations > 0 ? minDate(investments) : null;
  const lastDate = operations > 0 ? maxDate(investments) : null;

  detailStats.innerHTML = `
    <div class="stat-pill"><span>Product Type</span><strong>${escapeHTML(product.type)}</strong></div>
    <div class="stat-pill"><span>Horizon Label</span><strong>${product.horizonLabel ? escapeHTML(product.horizonLabel) : "-"}</strong></div>
    <div class="stat-pill"><span>Expected Due Date</span><strong>${formatDueStatus(product.expectedDueDate)}</strong></div>
    <div class="stat-pill"><span>Current Value</span><strong>${formatMoney(product.currentValue)}</strong></div>
    <div class="stat-pill"><span>Operations</span><strong>${operations}</strong></div>
    <div class="stat-pill"><span>Total Invested</span><strong>${formatMoney(invested)}</strong></div>
    <div class="stat-pill"><span>Average Operation</span><strong>${formatMoney(averageAmount)}</strong></div>
    <div class="stat-pill"><span>Avg Buy Date</span><strong>${weightedAvgDate ? formatDate(weightedAvgDate) : "-"}</strong></div>
    <div class="stat-pill"><span>First Investment</span><strong>${firstDate ? formatDate(firstDate) : "-"}</strong></div>
    <div class="stat-pill"><span>Last Investment</span><strong>${lastDate ? formatDate(lastDate) : "-"}</strong></div>
  `;

  if (!operations) {
    detailInvestmentsBody.innerHTML =
      '<tr><td colspan="2" class="muted">No investment history yet.</td></tr>';
    return;
  }

  detailInvestmentsBody.innerHTML = investments
    .map(
      (inv) => `
        <tr>
          <td>${formatDate(inv.date)}</td>
          <td>${formatMoney(inv.amount)}</td>
        </tr>
      `
    )
    .join("");
}

function renderKpis() {
  let invested = 0;
  let current = 0;

  state.products.forEach((product) => {
    invested += totalInvested(product);
    current += product.currentValue;
  });

  const benefit = current - invested;
  kpiInvested.textContent = formatMoney(invested);
  kpiCurrent.textContent = formatMoney(current);
  kpiBenefit.textContent = formatMoney(benefit);
  kpiBenefit.classList.remove("positive", "negative");
  kpiBenefit.classList.add(benefit >= 0 ? "positive" : "negative");
}

function renderCharts() {
  renderChartByProduct();
  renderChartByType();
  renderChartByPlatform();
  renderChartFixedVsVariable();
  renderChartByHorizon();
}

function renderChartByProduct() {
  if (!state.products.length) {
    chartByProduct.innerHTML = '<p class="muted">No data to chart.</p>';
    return;
  }

  const rows = state.products
    .map((product) => ({
      label: product.name,
      amount: totalInvested(product),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (!rows.length) {
    chartByProduct.innerHTML = '<p class="muted">No invested amount yet.</p>';
    return;
  }

  const maxAmount = rows[0].amount;
  chartByProduct.innerHTML = rows
    .map((row) => {
      const width = maxAmount > 0 ? (row.amount / maxAmount) * 100 : 0;
      return `
        <div class="chart-row">
          <div class="chart-label-line">
            <span title="${escapeHTML(row.label)}">${escapeHTML(row.label)}</span>
            <strong>${formatMoney(row.amount)}</strong>
          </div>
          <div class="bar-track"><div class="bar-fill product" style="width:${width.toFixed(2)}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderChartByType() {
  if (!state.products.length) {
    chartByType.innerHTML = '<p class="muted">No data to chart.</p>';
    return;
  }

  const byType = new Map();
  state.products.forEach((product) => {
    const invested = totalInvested(product);
    byType.set(product.type, (byType.get(product.type) || 0) + invested);
  });

  const rows = [...byType.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  if (total <= 0) {
    chartByType.innerHTML = '<p class="muted">No invested amount yet.</p>';
    return;
  }

  chartByType.innerHTML = rows
    .map((row) => {
      const pct = (row.amount / total) * 100;
      return `
        <div class="chart-row">
          <div class="chart-label-line">
            <span>${escapeHTML(row.label)}</span>
            <strong>${pct.toFixed(1)}%</strong>
          </div>
          <div class="bar-track"><div class="bar-fill type" style="width:${pct.toFixed(2)}%"></div></div>
          <p class="chart-subvalue">${formatMoney(row.amount)}</p>
        </div>
      `;
    })
    .join("");
}

function renderChartByPlatform() {
  if (!chartByPlatform) {
    return;
  }

  if (!state.products.length) {
    chartByPlatform.innerHTML = '<p class="muted">No data to chart.</p>';
    return;
  }

  const byPlatform = new Map();
  state.products.forEach((product) => {
    const label = product.platform ? product.platform : "Unlabeled";
    const invested = totalInvested(product);
    byPlatform.set(label, (byPlatform.get(label) || 0) + invested);
  });

  const rows = [...byPlatform.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  if (total <= 0) {
    chartByPlatform.innerHTML = '<p class="muted">No invested amount yet.</p>';
    return;
  }

  const colors = ["#1f7a74", "#2b8f8a", "#4da5a0", "#77bdb8", "#a3d6d2"];
  const segments = rows.map((row, index) => ({
    label: row.label,
    amount: row.amount,
    color: colors[index % colors.length],
  }));
  renderPieChart(chartByPlatform, segments);
}

function renderChartFixedVsVariable() {
  if (!state.products.length) {
    chartFixedVariable.innerHTML = '<p class="muted">No data to chart.</p>';
    return;
  }

  let fixed = 0;
  let variable = 0;
  state.products.forEach((product) => {
    const invested = totalInvested(product);
    if (FIXED_PRODUCT_TYPES.has(product.type)) {
      fixed += invested;
    } else {
      variable += invested;
    }
  });

  const total = fixed + variable;
  if (total <= 0) {
    chartFixedVariable.innerHTML = '<p class="muted">No invested amount yet.</p>';
    return;
  }

  renderPieChart(chartFixedVariable, [
    {
      label: `Fixed (${[...FIXED_PRODUCT_TYPES].join(", ")})`,
      amount: fixed,
      color: "#2f78ad",
    },
    {
      label: "Variable (other types)",
      amount: variable,
      color: "#ba7117",
    },
  ]);
}

function renderChartByHorizon() {
  if (!chartByHorizon) {
    return;
  }

  if (!state.products.length) {
    chartByHorizon.innerHTML = '<p class="muted">No data to chart.</p>';
    return;
  }

  const byHorizon = new Map();
  state.products.forEach((product) => {
    const label = product.horizonLabel || "Unlabeled";
    const invested = totalInvested(product);
    byHorizon.set(label, (byHorizon.get(label) || 0) + invested);
  });

  const preferredOrder = ["Long term", "Mid/Long term", "Mid term", "Short term", "Unlabeled"];
  const rows = [...byHorizon.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => {
      const ia = preferredOrder.indexOf(a.label);
      const ib = preferredOrder.indexOf(b.label);
      if (ia === -1 && ib === -1) return b.amount - a.amount;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  if (total <= 0) {
    chartByHorizon.innerHTML = '<p class="muted">No invested amount yet.</p>';
    return;
  }

  const colors = ["#394e79", "#5f6fb4", "#8b63a8", "#bc6d8f", "#9e8d5d"];
  const segments = rows.map((row, index) => ({
    label: row.label,
    amount: row.amount,
    color: colors[index % colors.length],
  }));
  renderPieChart(chartByHorizon, segments);
}

function renderPieChart(container, segments) {
  const valid = segments.filter((segment) => segment.amount > 0);
  const total = valid.reduce((sum, segment) => sum + segment.amount, 0);
  if (total <= 0) {
    container.innerHTML = '<p class="muted">No invested amount yet.</p>';
    return;
  }

  let start = 0;
  const gradientParts = valid.map((segment) => {
    const pct = (segment.amount / total) * 100;
    const end = start + pct;
    const part = `${segment.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    start = end;
    return part;
  });

  const legend = valid
    .map((segment) => {
      const pct = (segment.amount / total) * 100;
      return `
        <li>
          <span><i class="dot" style="background:${segment.color}"></i>${escapeHTML(segment.label)}</span>
          <strong>${pct.toFixed(1)}% (${formatMoney(segment.amount)})</strong>
        </li>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="pie-wrap">
      <div class="pie-chart" style="background: conic-gradient(${gradientParts.join(", ")});" aria-hidden="true"></div>
      <ul class="pie-legend">${legend}</ul>
    </div>
  `;
}

function totalInvested(product) {
  return product.investments.reduce((sum, item) => sum + item.amount, 0);
}

function fillProductSelect(select, withProductsLabel, emptyLabel) {
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = state.products.length ? withProductsLabel : emptyLabel;
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  state.products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} (${product.type})`;
    select.appendChild(option);
  });
}

function renderInvestmentHistory(investments) {
  if (!Array.isArray(investments) || investments.length === 0) {
    return '<span class="muted">No entries</span>';
  }

  const sorted = [...investments].sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );

  const lines = sorted
    .map(
      (item) =>
        `<li><span>${escapeHTML(item.date)}</span><strong>${formatMoney(item.amount)}</strong></li>`
    )
    .join("");

  return `
    <details class="history-details">
      <summary>${investments.length} entr${investments.length === 1 ? "y" : "ies"}</summary>
      <ul class="history-list">${lines}</ul>
    </details>
  `;
}

function parseCurrency(value) {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(`${String(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return escapeHTML(String(value));
  }
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDueStatus(value) {
  if (!value) {
    return '<span class="muted">-</span>';
  }

  const due = new Date(`${String(value)}T00:00:00`);
  if (Number.isNaN(due.getTime())) {
    return escapeHTML(String(value));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  const baseDate = formatDate(value);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return `<span class="status-overdue">${baseDate} (${days} day${days === 1 ? "" : "s"} overdue)</span>`;
  }
  if (diffDays === 0) {
    return `<span class="status-today">${baseDate} (today)</span>`;
  }
  return `<span class="status-upcoming">${baseDate} (in ${diffDays} day${diffDays === 1 ? "" : "s"})</span>`;
}

function weightedAverageDate(investments) {
  let totalAmount = 0;
  let weightedMs = 0;
  investments.forEach((inv) => {
    const dateMs = new Date(`${String(inv.date)}T00:00:00`).getTime();
    if (!Number.isFinite(dateMs) || inv.amount <= 0) {
      return;
    }
    totalAmount += inv.amount;
    weightedMs += inv.amount * dateMs;
  });
  if (totalAmount <= 0) {
    return null;
  }
  return new Date(weightedMs / totalAmount).toISOString().slice(0, 10);
}

function minDate(investments) {
  return investments
    .map((inv) => String(inv.date))
    .filter(Boolean)
    .sort()[0];
}

function maxDate(investments) {
  return investments
    .map((inv) => String(inv.date))
    .filter(Boolean)
    .sort()
    .at(-1);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function initialize() {
  try {
    await loadFromServer();
    await migrateLegacyLocalDataIfNeeded();
    await loadFromServer();
    render();
    activateScreen("dashboard");
  } catch (error) {
    handleError(error);
  }
}

async function loadFromServer() {
  const data = await apiRequest("/api/portfolio");
  state.products = Array.isArray(data.products) ? data.products : [];
}

async function migrateLegacyLocalDataIfNeeded() {
  if (state.products.length > 0) {
    return;
  }

  const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) {
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch (_error) {
    return;
  }

  if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
    return;
  }

  await apiRequest("/api/import", {
    method: "POST",
    body: { products: parsed.products },
  });
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function handleError(error) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  alert(`Error: ${message}`);
}

initialize();
