(() => {
  "use strict";

  const apiUrl = "/api/products";
  const state = { products: [], categories: [] };
  const elements = {
    tableBody: document.querySelector("#products-body"),
    emptyState: document.querySelector("#empty-state"),
    resultCaption: document.querySelector("#result-caption"),
    filtersForm: document.querySelector("#filters-form"),
    search: document.querySelector("#search"),
    categoryFilter: document.querySelector("#category-filter"),
    statusFilter: document.querySelector("#status-filter"),
    clearFilters: document.querySelector("#clear-filters"),
    newProduct: document.querySelector("#new-product"),
    dialog: document.querySelector("#product-dialog"),
    dialogTitle: document.querySelector("#dialog-title"),
    form: document.querySelector("#product-form"),
    formAlert: document.querySelector("#form-alert"),
    closeDialog: document.querySelector("#close-dialog"),
    cancelDialog: document.querySelector("#cancel-dialog"),
    saveProduct: document.querySelector("#save-product"),
    categoryOptions: document.querySelector("#category-options"),
    toast: document.querySelector("#toast"),
    mobileMenu: document.querySelector(".mobile-menu"),
    mobileOverlay: document.querySelector(".mobile-overlay"),
    sidebar: document.querySelector("#sidebar")
  };

  const currency = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });
  const number = new Intl.NumberFormat("es-CO");
  let searchTimer;
  let toastTimer;

  async function request(url, options = {}) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options
    });

    if (response.status === 204) {
      return null;
    }

    const body = await response.json();

    if (!response.ok) {
      const details = Array.isArray(body.details) ? ` ${body.details.join(" ")}` : "";
      throw new Error(`${body.message ?? "No fue posible completar la operación."}${details}`);
    }

    return body;
  }

  async function loadProducts() {
    try {
      const parameters = new URLSearchParams(new FormData(elements.filtersForm));
      const response = await request(`${apiUrl}?${parameters.toString()}`);
      state.products = response.data;
      renderProducts();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function loadSummary() {
    try {
      const [summaryResponse, allProductsResponse] = await Promise.all([
        request(`${apiUrl}/summary`),
        request(apiUrl)
      ]);
      const summary = summaryResponse.data;
      state.categories = [...new Set(allProductsResponse.data.map((product) => product.category))].sort((a, b) =>
        a.localeCompare(b, "es")
      );

      document.querySelector("#total-products").textContent = number.format(summary.totalProducts);
      document.querySelector("#total-units").textContent = number.format(summary.totalUnits);
      document.querySelector("#attention-count").textContent = number.format(
        summary.lowStock + summary.outOfStock
      );
      document.querySelector("#inventory-value").textContent = currency.format(summary.inventoryValue);
      document.querySelector("#nav-count").textContent = summary.totalProducts;
      renderCategories();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function renderProducts() {
    elements.tableBody.replaceChildren();
    elements.emptyState.hidden = state.products.length > 0;
    elements.resultCaption.textContent = `${number.format(state.products.length)} ${
      state.products.length === 1 ? "producto encontrado" : "productos encontrados"
    }`;

    state.products.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td data-label="Producto">
          <div class="product-cell">
            <span class="product-symbol">${escapeHtml(initials(product.name))}</span>
            <div>
              <strong>${escapeHtml(product.name)}</strong>
              <small title="${escapeHtml(product.description)}">${escapeHtml(product.description || "Sin descripción")}</small>
            </div>
          </div>
        </td>
        <td data-label="SKU"><span class="sku">${escapeHtml(product.sku)}</span></td>
        <td data-label="Categoría">${escapeHtml(product.category)}</td>
        <td class="number-cell" data-label="Existencias"><span class="quantity">${number.format(product.quantity)}</span></td>
        <td class="number-cell" data-label="Precio">${currency.format(product.unitPrice)}</td>
        <td data-label="Estado"><span class="status-badge status--${product.status}">${statusLabel(product.status)}</span></td>
        <td data-label="Acciones">
          <div class="row-actions">
            <button class="row-action" type="button" data-action="edit" data-id="${product.id}" aria-label="Editar ${escapeHtml(product.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.3-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm10-12 3 3"/></svg>
            </button>
            <button class="row-action row-action--delete" type="button" data-action="delete" data-id="${product.id}" aria-label="Eliminar ${escapeHtml(product.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>
            </button>
          </div>
        </td>`;
      elements.tableBody.append(row);
    });
  }

  function renderCategories() {
    const currentValue = elements.categoryFilter.value;
    elements.categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    elements.categoryOptions.replaceChildren();

    state.categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      elements.categoryFilter.append(option);
      elements.categoryOptions.append(option.cloneNode(true));
    });
    elements.categoryFilter.value = currentValue;
  }

  function openCreateDialog() {
    elements.form.reset();
    elements.form.elements.id.value = "";
    elements.form.elements.quantity.value = 0;
    elements.form.elements.minStock.value = 5;
    elements.dialogTitle.textContent = "Nuevo producto";
    hideFormAlert();
    elements.dialog.showModal();
    elements.form.elements.sku.focus();
  }

  async function openEditDialog(id) {
    try {
      const response = await request(`${apiUrl}/${id}`);
      const product = response.data;
      elements.form.reset();

      Object.entries(product).forEach(([key, value]) => {
        if (elements.form.elements[key]) {
          elements.form.elements[key].value = value;
        }
      });
      elements.dialogTitle.textContent = "Editar producto";
      hideFormAlert();
      elements.dialog.showModal();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    hideFormAlert();

    if (!elements.form.reportValidity()) {
      return;
    }

    const values = Object.fromEntries(new FormData(elements.form));
    const id = values.id;
    delete values.id;
    values.quantity = Number(values.quantity);
    values.minStock = Number(values.minStock);
    values.unitPrice = Number(values.unitPrice);

    try {
      setSaving(true);
      const response = await request(id ? `${apiUrl}/${id}` : apiUrl, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(values)
      });
      elements.dialog.close();
      showToast(response.message);
      await Promise.all([loadProducts(), loadSummary()]);
    } catch (error) {
      showFormAlert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    const product = state.products.find((item) => item.id === id);
    const confirmed = window.confirm(
      `¿Deseas eliminar “${product?.name ?? "este producto"}”? Esta acción no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await request(`${apiUrl}/${id}`, { method: "DELETE" });
      showToast("Producto eliminado correctamente.");
      await Promise.all([loadProducts(), loadSummary()]);
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function statusLabel(status) {
    return { available: "Disponible", low: "Stock bajo", out: "Agotado" }[status] ?? "Sin estado";
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  // Escapa contenido dinámico antes de insertarlo en la tabla para evitar HTML no deseado.
  function escapeHtml(value) {
    const container = document.createElement("div");
    container.textContent = String(value ?? "");
    return container.innerHTML;
  }

  function setSaving(isSaving) {
    elements.saveProduct.disabled = isSaving;
    elements.saveProduct.textContent = isSaving ? "Guardando…" : "Guardar producto";
  }

  function showFormAlert(message) {
    elements.formAlert.textContent = message;
    elements.formAlert.hidden = false;
  }

  function hideFormAlert() {
    elements.formAlert.hidden = true;
    elements.formAlert.textContent = "";
  }

  function showToast(message, isError = false) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast toast--visible${isError ? " toast--error" : ""}`;
    toastTimer = window.setTimeout(() => {
      elements.toast.className = "toast";
    }, 3200);
  }

  function setMobileMenu(isOpen) {
    elements.sidebar.classList.toggle("sidebar--open", isOpen);
    elements.mobileOverlay.classList.toggle("mobile-overlay--visible", isOpen);
    elements.mobileOverlay.tabIndex = isOpen ? 0 : -1;
    elements.mobileMenu.setAttribute("aria-expanded", String(isOpen));
    elements.mobileMenu.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  }

  elements.newProduct.addEventListener("click", openCreateDialog);
  elements.closeDialog.addEventListener("click", () => elements.dialog.close());
  elements.cancelDialog.addEventListener("click", () => elements.dialog.close());
  elements.form.addEventListener("submit", saveProduct);
  elements.mobileMenu.addEventListener("click", () => {
    setMobileMenu(elements.mobileMenu.getAttribute("aria-expanded") !== "true");
  });
  elements.mobileOverlay.addEventListener("click", () => setMobileMenu(false));
  elements.sidebar.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMobileMenu(false);
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.mobileMenu.getAttribute("aria-expanded") === "true") {
      setMobileMenu(false);
      elements.mobileMenu.focus();
    }
  });
  elements.filtersForm.addEventListener("change", loadProducts);
  elements.search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(loadProducts, 250);
  });
  elements.clearFilters.addEventListener("click", () => {
    elements.filtersForm.reset();
    loadProducts();
  });
  elements.tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "edit") {
      openEditDialog(button.dataset.id);
    } else if (button.dataset.action === "delete") {
      deleteProduct(button.dataset.id);
    }
  });

  Promise.all([loadProducts(), loadSummary()]);
})();
