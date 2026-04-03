let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  ventas: [],
  retiros: [],
  clientes: [],
  caja: { abierta: false, inicial: 0 }
};

// INICIALIZAR COCHES
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

const precios = {
  drift: 10,
  futbol: 8,
  robot: 12
};

function guardar() {
  localStorage.setItem("rc_data", JSON.stringify(data));
}

function render() {
  ["drift", "futbol", "robot"].forEach(t => {
    document.getElementById(t).innerHTML = "";
  });

  data.coches.forEach((c, i) => {
    const div = document.createElement("div");

    let clase = "libre";
    if (c.estado === "uso" && c.tiempo > 5) clase = "activo";
    if (c.tiempo <= 5 && c.tiempo > 0) clase = "poco";
    if (c.tiempo <= 0 && c.estado === "uso") clase = "terminado";

    div.className = "coche " + clase;

    div.innerHTML = `
      ${c.nombre}<br>
      ${c.cliente || ""}
      ${c.tiempo > 0 ? "<br>" + c.tiempo + " min" : ""}
    `;

    div.onclick = () => acciones(i);

    document.getElementById(c.tipo).appendChild(div);
  });

  actualizarDinero();
}

// ACCIONES
function acciones(i) {
  const c = data.coches[i];

  if (c.estado === "uso") {
    const opcion = prompt("1 = Terminar\n2 = Cancelar");
    
    if (opcion == "1") terminar(i);
    if (opcion == "2") cancelar(i);

  } else {
    iniciar(i);
  }
}

// INICIAR
function iniciar(i) {
  const cliente = prompt("Nombre:");
  if (!cliente) return;

  const tiempo = Number(prompt("Minutos (máx 60):"));
  if (!tiempo || tiempo <= 0) return;

  const c = data.coches[i];
  c.estado = "uso";
  c.cliente = cliente;
  c.tiempo = tiempo;

  if (!data.clientes.includes(cliente)) {
    data.clientes.push(cliente);
  }

  guardar();
  render();
}

// TERMINAR (cobra)
function terminar(i) {
  const c = data.coches[i];

  const total = precios[c.tipo] * c.tiempo;

  data.ventas.push({
    coche: c.nombre,
    cliente: c.cliente,
    total,
    fecha: new Date()
  });

  c.estado = "libre";
  c.cliente = "";
  c.tiempo = 0;

  guardar();
  render();
}

// CANCELAR (no cobra)
function cancelar(i) {
  const c = data.coches[i];

  c.estado = "libre";
  c.cliente = "";
  c.tiempo = 0;

  guardar();
  render();
}

// TIMER
setInterval(() => {
  data.coches.forEach(c => {
    if (c.estado === "uso") {
      c.tiempo--;

      if (c.tiempo <= 0) {
        c.estado = "terminado";
      }
    }
  });

  guardar();
  render();
}, 60000);

// DINERO
function totalVentas() {
  return data.ventas.reduce((a, v) => a + v.total, 0);
}

function totalRetiros() {
  return data.retiros.reduce((a, r) => a + r.monto, 0);
}

function actualizarDinero() {
  document.getElementById("dinero").innerText =
    "💰 $" + (totalVentas() - totalRetiros());
}

// CAJA
function abrirCaja() {
  const monto = Number(prompt("Monto inicial:"));
  if (!monto) return;

  data.caja = { abierta: true, inicial: monto };
  guardar();
}

function cerrarCaja() {
  alert(
    "Ventas: $" + totalVentas() +
    "\nRetiros: $" + totalRetiros() +
    "\nTotal: $" + (totalVentas() - totalRetiros())
  );
}

// RETIROS
function hacerRetiro() {
  const monto = Number(prompt("Monto:"));
  const motivo = prompt("Motivo:");

  if (!monto || !motivo) return;

  data.retiros.push({ monto, motivo, fecha: new Date() });

  guardar();
  render();
}

// CLIENTES
function verClientes() {
  if (data.clientes.length === 0) {
    alert("No hay clientes aún");
    return;
  }

  alert("Clientes:\n\n" + data.clientes.join("\n"));
}

// INICIO
render();
