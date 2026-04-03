let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  ventas: [],
  retiros: [],
  clientes: [],
  caja: { abierta: false, inicial: 0 }
};

let cocheSeleccionado = null;

// INICIALIZAR
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

function guardar() {
  localStorage.setItem("rc_data", JSON.stringify(data));
}

function render() {
  ["drift","futbol","robot"].forEach(t => {
    document.getElementById(t).innerHTML = "";
  });

  data.coches.forEach((c,i) => {
    const div = document.createElement("div");

    let clase = "libre";
    if (c.estado === "uso" && c.tiempo > 5) clase = "activo";
    if (c.tiempo <= 5 && c.tiempo > 0) clase = "poco";
    if (c.tiempo <= 0 && c.estado === "uso") clase = "terminado";

    div.className = "coche " + clase;

    div.innerHTML = `
      ${c.nombre}<br>
      ${c.cliente || ""}
      ${c.tiempo > 0 ? "<br>"+c.tiempo+" min" : ""}
      <br>
      ${c.estado === "uso" ? `
        <button onclick="terminar(${i})">✔</button>
        <button onclick="cancelar(${i})">✖</button>
      ` : `<button onclick="abrirInicio(${i})">Iniciar</button>`}
    `;

    document.getElementById(c.tipo).appendChild(div);
  });

  actualizarDinero();
}

// ----- INICIO -----
function abrirInicio(i){
  cocheSeleccionado = i;
  document.getElementById("panelInicio").classList.remove("oculto");
}

function cerrarInicio(){
  document.getElementById("panelInicio").classList.add("oculto");
}

function confirmarInicio(){
  const nombre = document.getElementById("nombreInput").value;
  const tiempo = Number(document.getElementById("tiempoInput").value);

  if(!nombre || !tiempo) return;

  const c = data.coches[cocheSeleccionado];
  c.estado = "uso";
  c.cliente = nombre;
  c.tiempo = tiempo;

  if (!data.clientes.includes(nombre)) data.clientes.push(nombre);

  cerrarInicio();
  guardar();
  render();
}

// ----- TERMINAR -----
function terminar(i){
  const c = data.coches[i];

  const total = Math.ceil(c.tiempo / 15) * 50;

  data.ventas.push({
    cliente: c.cliente,
    total
  });

  c.estado="libre";
  c.tiempo=0;
  c.cliente="";

  guardar();
  render();
}

// ----- CANCELAR -----
function cancelar(i){
  const c = data.coches[i];
  c.estado="libre";
  c.tiempo=0;
  c.cliente="";
  guardar();
  render();
}

// ----- TIMER -----
setInterval(()=>{
  data.coches.forEach(c=>{
    if(c.estado==="uso"){
      c.tiempo--;
      if(c.tiempo<=0) c.estado="terminado";
    }
  });
  guardar();
  render();
},60000);

// ----- DINERO -----
function totalVentas(){
  return data.ventas.reduce((a,v)=>a+v.total,0);
}
function totalRetiros(){
  return data.retiros.reduce((a,r)=>a+r.monto,0);
}

function actualizarDinero(){
  const total = data.caja.inicial + totalVentas() - totalRetiros();
  document.getElementById("dinero").innerText="💰 $"+total;
}

// ----- CAJA -----
function abrirCaja(){
  const monto = Number(prompt("Monto inicial:"));
  if(!monto) return;

  data.caja = { abierta:true, inicial:monto };
  guardar();
  render();
}

function cerrarCaja(){
  if(!confirm("¿Cerrar caja?")) return;

  alert(
    "Total: $" + (data.caja.inicial + totalVentas() - totalRetiros())
  );
}

// ----- RETIROS -----
function hacerRetiro(){
  const monto = Number(prompt("Monto:"));
  const motivo = prompt("Motivo:");
  if(!monto || !motivo) return;

  data.retiros.push({monto,motivo});
  guardar();
  render();
}

// ----- CLIENTES -----
function toggleClientes(){
  const panel = document.getElementById("panelClientes");

  if(panel.classList.contains("oculto")){
    const lista = document.getElementById("listaClientes");
    lista.innerHTML = "";
    data.clientes.forEach(c=>{
      const li = document.createElement("li");
      li.textContent = c;
      lista.appendChild(li);
    });

    panel.classList.remove("oculto");
  }else{
    panel.classList.add("oculto");
  }
}

render();
