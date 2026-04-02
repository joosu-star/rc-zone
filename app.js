// ----- DATOS -----
let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  ventas: [],
  retiros: [],
  caja: { abierta: false, inicial: 0 }
};

// ----- INICIALIZAR COCHES -----
if (data.coches.length === 0) {
  data.coches = [
    { nombre: "Drift 1", tipo: "drift" },
    { nombre: "Drift 2", tipo: "drift" },

    ...Array.from({ length: 10 }, (_, i) => ({
      nombre: "Futbol " + (i + 1),
      tipo: "futbol"
    })),

    ...Array.from({ length: 6 }, (_, i) => ({
      nombre: "Robot " + (i + 1),
      tipo: "robot"
    }))
  ].map(c => ({
    ...c,
    estado: "libre",
    tiempo: 0,
    cliente: ""
  }));
}

// ----- PRECIOS -----
const precios = {
  drift: 10,
  futbol: 8,
  robot: 12
};

// ----- GUARDAR -----
function guardar() {
  localStorage.setItem("rc_data", JSON.stringify(data));
}

// ----- RENDER -----
function render() {
  ["drift", "futbol", "robot"].forEach(t => {
    document.getElementById(t).innerHTML = "";
  });

  data.coches.forEach((c, i) => {
    const div = document.createElement("div");

    let clase = "libre";
    if (c.estado === "uso" && c.tiempo > 5) clase = "uso";
    if (c.tiempo <= 5 && c.tiempo > 0) clase = "poco";
    if (c.tiempo <= 0 && c.estado === "uso") clase = "terminado";

    div.className = "coche " + clase;

    div.innerHTML = `
      ${c.nombre}<br>
      ${c.cliente || ""}
      ${c.tiempo > 0 ? "<br>" + c.tiempo + " min" : ""}
    `;

    div.onclick = () => usar(i);

    document.getElementById(c.tipo).appendChild(div);
  });

  actualizarDinero();
}

// ----- USAR COCHE -----
function usar(i) {
  const c = data.coches[i];
  if (c.estado === "uso") return;

  const cliente = prompt("Nombre:");
  if (!cliente) return;

  c.estado = "uso";
  c.cliente = cliente;
  c.tiempo = 15;

  guardar();
  render();
}

// ----- TIMER -----
setInterval(() => {
  data.coches.forEach(c => {
    if (c.estado === "uso") {
      c.tiempo--;

      if (c.tiempo <= 0) {
        // generar venta
        const precio = precios[c.tipo] * 15;

        data.ventas.push({
          coche: c.nombre,
          cliente: c.cliente,
          total: precio,
          fecha: new Date()
        });

        c.estado = "libre";
        c.cliente = "";
        c.tiempo = 0;
      }
    }
  });

  guardar();
  render();
}, 60000);

// ----- DINERO -----
function totalVentas() {
  return data.ventas.reduce((a, v) => a + v.total, 0);
}

function totalRetiros() {
  return data.retiros.reduce((a, r) => a + r.monto, 0);
}

function actualizarDinero() {
  const total = totalVentas() - totalRetiros();
  document.getElementById("dinero").innerText = "💰 $" + total;
}

// ----- CAJA -----
function abrirCaja() {
  const monto = Number(prompt("Monto inicial:"));
  if (!monto) return;

  data.caja = { abierta: true, inicial: monto };
  guardar();
}

function cerrarCaja() {
  const total = totalVentas();
  const retiros = totalRetiros();

  alert(
    "Ventas: $" + total +
    "\nRetiros: $" + retiros +
    "\nTotal final: $" + (total - retiros)
  );
}

// ----- RETIROS -----
function hacerRetiro() {
  const monto = Number(prompt("Monto a retirar:"));
  const motivo = prompt("Motivo:");

  if (!monto || !motivo) return;

  data.retiros.push({
    monto,
    motivo,
    fecha: new Date()
  });

  guardar();
  render();
}

// ----- INICIO -----
render();
