// CAMBIO DE PANTALLAS DEL SIDEBAR
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const screen = btn.dataset.screen;
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("screen-active"));
    document
      .getElementById(`screen-${screen}`)
      .classList.add("screen-active");
  });
});

// CARGAR PANTALLA DE PRODUCTOS
document.addEventListener("DOMContentLoaded", () => {
  initProductsScreen();
  setupEditModal();
});

function formatBs(n) {
  const num = Number(n || 0);
  return `Bs.${num.toFixed(2)}`;
}

async function initProductsScreen() {
  // Formulario "Agregar nuevo producto"
  const form = document.getElementById("product-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    // Validaciones sencillas
    if (!data.nombre.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }

    try {
      const res = await window.api.products.add({
        nombre: data.nombre.trim(),
        categoria: data.categoria || "General",
        precio_venta: Number(data.precio_venta),
        precio_compra: Number(data.precio_compra),
        stock: Number(data.stock || 0),
        stock_minimo: Number(data.stock_minimo || 5),
        codigo_barras: data.codigo_barras || "",
      });

      if (!res.ok) {
        alert("Error: " + res.error);
        return;
      }

      form.reset();
      form.categoria.value = "General";
      form.stock.value = 0;
      form.stock_minimo.value = 5;
      await loadProductsTable(); // refrescar tabla
    } catch (err) {
      alert("Error inesperado: " + err.message);
    }
  });

  // Botones "Ver todos" y "Stock bajo"
  document
    .getElementById("btn-ver-todos")
    .addEventListener("click", () => loadProductsTable());

  document
    .getElementById("btn-stock-bajo")
    .addEventListener("click", () => loadProductsTable({ lowStockOnly: true }));

  // Buscador
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", () =>
    loadProductsTable({ search: searchInput.value })
  );

  // Primera carga
  await loadProductsTable();
}

let allProductsCache = [];

async function loadProductsTable(options = {}) {
  const tbody = document.getElementById("products-tbody");
  tbody.innerHTML = `<tr><td colspan="8">Cargando...</td></tr>`;

  if (!allProductsCache.length || !options.search && !options.lowStockOnly) {
    const res = await window.api.products.getAll();
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:#f97373">Error: ${res.error}</td></tr>`;
      return;
    }
    allProductsCache = res.data || [];
  }

  let productos = [...allProductsCache];

  if (options.lowStockOnly) {
    productos = productos.filter((p) => p.stock <= (p.stock_minimo || 5));
  }

  if (options.search && options.search.trim()) {
    const term = options.search.toLowerCase();
    productos = productos.filter((p) =>
      p.nombre.toLowerCase().includes(term)
    );
  }

  if (!productos.length) {
    tbody.innerHTML = `<tr><td colspan="8">No se encontraron productos.</td></tr>`;
    return;
  }

  tbody.innerHTML = productos
    .map((p) => {
      const isLow = p.stock <= (p.stock_minimo || 5);
      const estadoHtml = isLow
        ? `<span class="tag tag-low">⚠ Stock bajo</span>`
        : `<span class="tag tag-ok">✔ Aceptable</span>`;

      return `
      <tr>
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.categoria}</td>
        <td>${p.stock}</td>
        <td>${p.stock_minimo || 5}</td>
        <td>${formatBs(p.precio_venta)}</td>
        <td>${estadoHtml}</td>
        <td class="col-actions">
          <div class="actions-group">
            <button class="btn-icon edit" onclick="editProduct(${p.id})">✏️</button>
            <button class="btn-icon delete" onclick="deleteProduct(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Función global para poder llamarla desde onclick
window.deleteProduct = async function (id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
  const res = await window.api.products.delete(id);
  if (!res.ok) {
    alert("Error al eliminar: " + res.error);
    return;
  }
  allProductsCache = allProductsCache.filter((p) => p.id !== id);
  loadProductsTable();
};

let editingProductId = null;

function setupEditModal() {
  const backdrop = document.getElementById("edit-modal-backdrop");
  const form = document.getElementById("edit-product-form");
  const btnCancel = document.getElementById("btn-edit-cancel");

  btnCancel.addEventListener("click", () => {
    backdrop.classList.add("hidden");
    editingProductId = null;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!editingProductId) return;

    const data = Object.fromEntries(new FormData(form).entries());

    const changes = {
      nombre: data.edit_nombre.trim(),
      categoria: data.edit_categoria || "General",
      precio_venta: Number(data.edit_precio_venta),
      precio_compra: Number(data.edit_precio_compra),
      stock: Number(data.edit_stock),
      stock_minimo: Number(data.edit_stock_minimo || 5),
      codigo_barras: data.edit_codigo_barras || null,
    };

    const res = await window.api.products.update(editingProductId, changes);
    if (!res.ok) {
      alert("Error al actualizar: " + res.error);
      return;
    }

    backdrop.classList.add("hidden");
    editingProductId = null;
    await loadProductsTable();
  });
}

// función global para usar en onclick
window.editProduct = async function (id) {
  editingProductId = id;

  const res = await window.api.products.getById(id);
  if (!res.ok || !res.data) {
    alert("No se pudo cargar el producto: " + (res.error || ""));
    editingProductId = null;
    return;
  }

  const p = res.data;
  const backdrop = document.getElementById("edit-modal-backdrop");
  const subtitle = document.getElementById("edit-modal-subtitle");
  const form = document.getElementById("edit-product-form");

  subtitle.textContent = `ID ${p.id} • ${p.nombre}`;

  form.elements["edit_nombre"].value = p.nombre || "";
  form.elements["edit_categoria"].value = p.categoria || "General";
  form.elements["edit_precio_venta"].value = p.precio_venta || 0;
  form.elements["edit_precio_compra"].value = p.precio_compra || 0;
  form.elements["edit_stock"].value = p.stock || 0;
  form.elements["edit_stock_minimo"].value = p.stock_minimo || 5;
  form.elements["edit_codigo_barras"].value = p.codigo_barras || "";

  backdrop.classList.remove("hidden");
};
