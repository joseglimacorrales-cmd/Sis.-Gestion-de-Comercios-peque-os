// CAMBIO DE PANTALLAS DEL SIDEBAR (solo los que tienen data-screen)
document.querySelectorAll(".nav-item:not(.nav-item-exit)").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item:not(.nav-item-exit)")
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

let pendingDeleteId = null;

window.deleteProduct = function (id) {
  pendingDeleteId = id;

  const backdrop = document.getElementById("delete-modal-backdrop");
  const text = document.getElementById("delete-modal-text");

  // Si tenemos el producto en caché, mostramos el nombre
  const prod = allProductsCache.find((p) => p.id == id);
  if (prod && text) {
    text.textContent = `¿Seguro que deseas eliminar el producto "${prod.nombre}"?`;
  } else if (text) {
    text.textContent = "¿Seguro que deseas eliminar este producto?";
  }

  backdrop.classList.remove("hidden");
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

/* ===================== UTILIDADES COMPARTIDAS ===================== */

function formatBs(n) {
  if (typeof n !== "number") n = Number(n || 0);
  return `Bs.${n.toFixed(2)}`;
}

function toLocal(dateStrOrDate) {
  const d = new Date(dateStrOrDate);
  return d.toLocaleString();
}

/* ===================== VENTAS (SCREEN-VENTAS) ===================== */

let ventaProductsCache = [];
let ventaItems = [];

async function initSalesScreen() {
  // Cargar productos para el select
  const res = await window.api.products.getAll();
  if (!res.ok) {
    console.error("Error cargando productos:", res.error);
    return;
  }
  ventaProductsCache = res.data || [];

  const select = document.getElementById("venta-producto-select");
  select.innerHTML = "";
  ventaProductsCache.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `#${p.id} ${p.nombre} — ${formatBs(p.precio_venta)} (Stock: ${p.stock})`;
    select.appendChild(opt);
  });

  document
    .getElementById("btn-venta-agregar")
    .addEventListener("click", handleAgregarItemVenta);

  document
    .getElementById("btn-venta-registrar")
    .addEventListener("click", handleRegistrarVenta);

  document
    .getElementById("btn-ventas-hoy-refrescar")
    .addEventListener("click", loadVentasHoy);

  await loadVentasHoy();
  renderVentaItems();
}

function renderVentaItems() {
  const tbody = document.getElementById("venta-items-tbody");
  if (!ventaItems.length) {
    tbody.innerHTML = `<tr><td colspan="5">No hay productos en la venta.</td></tr>`;
  } else {
    tbody.innerHTML = ventaItems
      .map(
        (item, idx) => `
      <tr>
        <td>${item.nombre}</td>
        <td>${item.cantidad}</td>
        <td>${formatBs(item.precioUnitario)}</td>
        <td>${formatBs(item.subtotal)}</td>
        <td>
          <button class="btn btn-small" data-remove-index="${idx}">✖</button>
        </td>
      </tr>
    `
      )
      .join("");
    tbody.querySelectorAll("button[data-remove-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.removeIndex);
        ventaItems.splice(i, 1);
        renderVentaItems();
      });
    });
  }

  const total = ventaItems.reduce((s, i) => s + i.subtotal, 0);
  document.getElementById("venta-total").textContent = formatBs(total);
}

function handleAgregarItemVenta(e) {
  e.preventDefault();
  const select = document.getElementById("venta-producto-select");
  const cantidadInput = document.getElementById("venta-cantidad-input");

  const id = Number(select.value);
  const cantidad = Number(cantidadInput.value || 0);

  const p = ventaProductsCache.find((x) => x.id === id);
  if (!p) {
    alert("Producto no encontrado");
    return;
  }
  if (cantidad <= 0 || cantidad > p.stock) {
    alert(`Cantidad inválida. Debe ser >0 y ≤ ${p.stock}`);
    return;
  }

  const subtotal = Number(p.precio_venta) * cantidad;
  ventaItems.push({
    productoId: p.id,
    nombre: p.nombre,
    cantidad,
    precioUnitario: Number(p.precio_venta),
    subtotal,
  });

  cantidadInput.value = 1;
  renderVentaItems();
}

async function handleRegistrarVenta(e) {
  e.preventDefault();
  if (!ventaItems.length) {
    alert("La venta no tiene productos.");
    return;
  }

  const total = ventaItems.reduce((s, i) => s + i.subtotal, 0);
  const metodo = document.getElementById("venta-metodo").value;
  const monto = Number(document.getElementById("venta-monto").value || 0);

  if (monto < total) {
    alert(`Monto insuficiente. Total: ${formatBs(total)}`);
    return;
  }

  const res = await window.api.sales.register(ventaItems, metodo, monto);
  if (!res.ok) {
    alert("Error al registrar venta: " + res.error);
    return;
  }

  const cambio = monto - total;
  alert(`Venta registrada correctamente.\nCambio: ${formatBs(cambio)}`);

  // Limpiar carrito
  ventaItems = [];
  renderVentaItems();
  document.getElementById("venta-monto").value = "";

  // Refrescar ventas del día y productos (stock)
  await loadVentasHoy();
  if (typeof loadProductsTable === "function") {
    await loadProductsTable();
  }
}

async function loadVentasHoy() {
  const cont = document.getElementById("ventas-hoy-lista");
  cont.innerHTML = "Cargando...";
  const res = await window.api.sales.today();
  if (!res.ok) {
    cont.textContent = "Error: " + res.error;
    return;
  }

  const ventas = res.data || [];
  if (!ventas.length) {
    cont.textContent = "No hay ventas registradas hoy.";
    return;
  }

  const total = ventas.reduce((s, v) => s + Number(v.total), 0);

  cont.innerHTML = `
    <ul class="ventas-ul">
      ${ventas
        .map(
          (v) => `
        <li>
          <div><strong>#${v.id}</strong> — ${toLocal(v.fecha_hora)}</div>
          <div>Total: <strong>${formatBs(v.total)}</strong> — Items: ${
            v.total_productos
          }</div>
        </li>
      `
        )
        .join("")}
    </ul>
    <div class="ventas-resumen">
      <strong>Ventas:</strong> ${ventas.length} &nbsp;|&nbsp;
      <strong>Total del día:</strong> ${formatBs(total)}
    </div>
  `;
}

/* ===================== REPORTES (SCREEN-REPORTES) ===================== */

async function initReportsScreen() {
  document
    .getElementById("btn-report-top")
    .addEventListener("click", loadReportTop);

  document
    .getElementById("btn-report-stats")
    .addEventListener("click", loadReportStats);

  document
    .getElementById("btn-report-pdf-low")
    .addEventListener("click", handlePdfLowStock);
}

async function loadReportTop() {
  const tbody = document.getElementById("report-top-tbody");
  tbody.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;
  const res = await window.api.reports.topProducts(10);
  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="5">Error: ${res.error}</td></tr>`;
    return;
  }
  const data = res.data || [];
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">Sin datos de ventas.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td>${p.total_vendido}</td>
      <td>${formatBs(p.total_ingresos)}</td>
    </tr>
  `
    )
    .join("");
}

async function loadReportStats() {
  const box = document.getElementById("report-stats-container");
  box.textContent = "Cargando...";
  const res = await window.api.reports.stats(30);
  if (!res.ok) {
    box.textContent = "Error: " + res.error;
    return;
  }
  const stats = res.data || [];
  if (!stats.length) {
    box.textContent = "Sin datos suficientes.";
    return;
  }

  let totalVentas = 0;
  let totalIngresos = 0;
  let mejorDia = { fecha: "", ingresos: 0 };

  const lines = stats.map((d) => {
    totalVentas += Number(d.total_ventas);
    totalIngresos += Number(d.ingresos_totales);
    if (Number(d.ingresos_totales) > mejorDia.ingresos) {
      mejorDia = { fecha: d.fecha, ingresos: Number(d.ingresos_totales) };
    }
    return `• ${d.fecha}: ${d.total_ventas} ventas — ${formatBs(
      d.ingresos_totales
    )} (prom: ${formatBs(d.promedio_por_venta)})`;
  });

  const promedioDiario = totalIngresos / stats.length;

  box.innerHTML = `
    <pre class="report-pre">
${lines.join("\n")}
----------------------------
Días con ventas: ${stats.length}
Total de ventas: ${totalVentas}
Ingresos totales: ${formatBs(totalIngresos)}
Promedio diario: ${formatBs(promedioDiario)}
Mejor día: ${mejorDia.fecha} (${formatBs(mejorDia.ingresos)})
    </pre>
  `;
}

async function handlePdfLowStock() {
  const box = document.getElementById("report-pdf-status");
  box.textContent = "Generando PDF...";
  const res = await window.api.reports.lowStockPdf();
  if (!res.ok) {
    box.textContent = "Error: " + res.error;
    return;
  }
  const { message, filePath } = res.data;
  box.innerHTML = `
    <p>${message}</p>
    <p><strong>Archivo:</strong> ${filePath}</p>
  `;
}

/* ===================== INICIALIZACIÓN GENERAL ===================== */

document.addEventListener("DOMContentLoaded", async () => {
  // Esto ya lo tienes para productos (no lo repito),
  // aquí solo llamamos a las inicializaciones nuevas:
  try {
    if (document.getElementById("screen-ventas")) {
      await initSalesScreen();
    }
    if (document.getElementById("screen-reportes")) {
      await initReportsScreen();
    }
  } catch (err) {
    console.error("Error inicializando pantallas extra:", err);
  }
});

/* ===================== SPLASH SCREEN / INICIO ===================== */

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const app = document.querySelector(".app");
  const subtitle = document.getElementById("splash-subtitle");

  if (!splash || !app || !subtitle) return;

  const mensajes = [
    "Conectando con la base de datos...",
    "Cargando productos y ventas...",
    "Acomodando las góndolas virtuales...",
    "Listo, preparando la caja..."
  ];

  // Cambiar mensajes cada cierto tiempo
  mensajes.forEach((texto, i) => {
    setTimeout(() => {
      subtitle.textContent = texto;
    }, 600 + i * 600);
  });

  // Ocultar splash y mostrar app cuando termina la “carga”
  const totalDuracion = 3000; // ms
  setTimeout(() => {
    splash.classList.add("splash-hide");
    app.classList.remove("app-hidden");
    app.classList.add("app-visible");
  }, totalDuracion);
});

// ======================= MODAL SALIR DEL SISTEMA =======================

document.addEventListener("DOMContentLoaded", () => {
  const btnExit = document.getElementById("btn-exit");
  const backdrop = document.getElementById("exit-modal-backdrop");
  const btnCancel = document.getElementById("btn-exit-cancel");
  const btnConfirm = document.getElementById("btn-exit-confirm");

  if (!btnExit || !backdrop) return;

  const openModal = () => {
    backdrop.classList.remove("hidden");
  };

  const closeModal = () => {
    backdrop.classList.add("hidden");
  };

  btnExit.addEventListener("click", openModal);

  btnCancel?.addEventListener("click", closeModal);

  // Clic fuera del cuadro = cerrar
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  btnConfirm?.addEventListener("click", () => {
    closeModal();
    // Si en tu app ya usas IPC, puedes cambiar esto por window.electronAPI.closeApp()
    window.close();
  });
});

// ======================= MODAL ELIMINAR PRODUCTO =======================

document.addEventListener("DOMContentLoaded", () => {
  const backdrop = document.getElementById("delete-modal-backdrop");
  const btnCancel = document.getElementById("btn-delete-cancel");
  const btnConfirm = document.getElementById("btn-delete-confirm");

  if (!backdrop) return;

  const closeModal = () => {
    backdrop.classList.add("hidden");
    pendingDeleteId = null;
  };

  btnCancel?.addEventListener("click", closeModal);

  // Clic fuera del cuadro = cancelar
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  btnConfirm?.addEventListener("click", async () => {
    if (!pendingDeleteId) return;

    const id = pendingDeleteId;
    pendingDeleteId = null;

    const res = await window.api.products.delete(id);
    if (!res.ok) {
      alert("Error al eliminar: " + res.error); // si quieres luego también lo cambiamos por un toast bonito
      closeModal();
      return;
    }

    // Actualizar caché y tabla como antes
    allProductsCache = allProductsCache.filter((p) => p.id !== id);
    loadProductsTable();

    closeModal();
  });
});

