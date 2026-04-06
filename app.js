// =======================
// 📦 DATA
// =======================
let data = JSON.parse(localStorage.getItem("rc_data")) || {};

function initData(){
  data.coches = Array.isArray(data.coches) ? data.coches : [];
  data.clientes = Array.isArray(data.clientes) ? data.clientes : [];
  data.ventas = Array.isArray(data.ventas) ? data.ventas : [];
  data.retiros = Array.isArray(data.retiros) ? data.retiros : [];
  data.depositos = Array.isArray(data.depositos) ? data.depositos : [];
  data.historial = Array.isArray(data.historial) ? data.historial : [];
  data.caja = data.caja || { abierta:false, inicial:0 };

  data.precios = data.precios || {
    normal:50,
    robot:40,
    luchador:40
  };
}

initData();

// =======================
// 🚗 CREAR BASE
// =======================
if(data.coches.length === 0){
  data.coches = [
    "Drift 1","Drift 2",
    ...Array.from({length:10},(_,i)=>"Futbol "+(i+1)),
    ...Array.from({length:6},(_,i)=>"Robot "+(i+1)),
    ...Array.from({length:10},(_,i)=>"Luchador "+(i+1))
  ].map(n=>({
    nombre:n,
    estado:"libre",
    tiempo:0,
    tiempoInicial:0,
    cliente:""
  }));
}

// =======================
// 💾 GUARDAR
// =======================
function guardar(){
  localStorage.setItem("rc_data", JSON.stringify(data));
}

// =======================
// 💰 PRECIOS
// =======================
function obtenerPrecio(nombre){
  nombre = nombre.toLowerCase();

  if(nombre.includes("luchador")) return data.precios.luchador;
  if(nombre.includes("robot")) return data.precios.robot;

  return data.precios.normal;
}

// =======================
// 🎨 RENDER
// =======================
function render(){
  const cont = document.getElementById("coches");
  if(!cont) return;

  cont.innerHTML = "";

  ["Drift","Futbol","Robot","Luchador"].forEach(tipo=>{
    const sec = document.createElement("div");
    sec.className="seccion";

    const t = document.createElement("h2");
    t.innerText = tipo;

    const grid = document.createElement("div");
    grid.className="grid";

    data.coches
      .filter(c=>c.nombre.includes(tipo))
      .forEach((c,i)=>{
        const div = document.createElement("div");
        div.className="coche " + getClase(c);

        div.innerHTML = `
          <b>${c.nombre}</b><br>
          ${c.cliente || ""}<br>
          ${c.tiempo>0 ? c.tiempo+" min":""}<br>
          ${
            c.estado==="uso"
            ? `<button onclick="terminar(${i})">✔</button>
               <button onclick="cancelar(${i})">✖</button>`
            : `<button onclick="abrirModal(${i})">▶</button>`
          }
        `;

        grid.appendChild(div);
      });

    sec.appendChild(t);
    sec.appendChild(grid);
    cont.appendChild(sec);
  });

  actualizarDinero();
}

function getClase(c){
  if(c.estado!=="uso") return "libre";
  if(c.tiempo<=0) return "terminado";
  if(c.tiempo<=5) return "poco";
  return "activo";
}

// =======================
// 🪟 MODAL
// =======================
let cocheSel=null;

function abrirModal(i){
  if(!data.caja.abierta) return alert("Abre caja primero");

  cocheSel=i;
  document.getElementById("modal").classList.add("activo");
}

function cerrarModal(){
  document.getElementById("modal").classList.remove("activo");
}

function confirmarInicio(){
  const nombre=document.getElementById("nombre").value.trim();
  const tiempo=Number(document.getElementById("tiempo").value);

  if(!nombre || tiempo<=0) return alert("Datos inválidos");

  const c=data.coches[cocheSel];

  c.estado="uso";
  c.cliente=nombre;
  c.tiempo=tiempo;
  c.tiempoInicial=tiempo;

  data.clientes.push({
    nombre,
    coche:c.nombre,
    tiempo,
    hora:new Date().toLocaleTimeString()
  });

  cerrarModal();
  guardar();
  render();
}

// =======================
// ✔ TERMINAR
// =======================
function terminar(i){
  const c=data.coches[i];
  const precio=obtenerPrecio(c.nombre);

  const total=Math.ceil(c.tiempoInicial/15)*precio;

  data.ventas.push({
    cliente:c.cliente,
    coche:c.nombre,
    total
  });

  resetCoche(c);
  guardar();
  render();
}

function cancelar(i){
  resetCoche(data.coches[i]);
  guardar();
  render();
}

function resetCoche(c){
  c.estado="libre";
  c.tiempo=0;
  c.cliente="";
}

// =======================
// ⏱ TIMER + 🔊 SONIDO
// =======================
setInterval(()=>{
  data.coches.forEach(c=>{
    if(c.estado==="uso"){

      if(c.tiempo===1){
        document.getElementById("alarma").play();
      }

      c.tiempo=Math.max(0,c.tiempo-1);
    }
  });

  guardar();
  render();
},60000);

// =======================
// 💰 DINERO
// =======================
const sum=(arr,k)=>arr.reduce((a,v)=>a+(v[k]||0),0);

function dineroTotal(){
  return data.caja.inicial
    + sum(data.ventas,"total")
    + sum(data.depositos,"monto")
    - sum(data.retiros,"monto");
}

function actualizarDinero(){
  document.getElementById("dinero").innerText="💰 $"+dineroTotal();
}

// =======================
// 🏦 CAJA
// =======================
function abrirCaja(){
  if(data.caja.abierta) return alert("Ya abierta");

  const monto=Number(prompt("Monto inicial"));
  if(monto<=0) return;

  data.caja={abierta:true,inicial:monto};
  guardar();
  render();
}

function cerrarCaja(){
  if(!data.caja.abierta) return;
  if(!confirm("¿Cerrar caja?")) return;

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    hora:new Date().toLocaleTimeString(),
    inicial:data.caja.inicial,
    ventas:sum(data.ventas,"total"),
    retiros:sum(data.retiros,"monto"),
    depositos:sum(data.depositos,"monto"),
    final:dineroTotal(),
    clientes:[...data.clientes]
  });

  data.ventas=[];
  data.retiros=[];
  data.depositos=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
  renderHistorial();
}

// =======================
// 👥 CLIENTES
// =======================
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  cont.innerHTML="";

  data.clientes.forEach(c=>{
    cont.innerHTML+=`<div>${c.nombre} | ${c.coche} | ${c.tiempo}min | ${c.hora}</div>`;
  });
}

// =======================
// 📜 HISTORIAL
// =======================
function renderHistorial(){
  const cont=document.getElementById("listaHistorial");
  cont.innerHTML="";

  data.historial.forEach(d=>{
    cont.innerHTML+=`
      <div class="card">
        📅 ${d.fecha} - ${d.hora}<br>
        💰 Inicial: $${d.inicial}<br>
        🟢 Ventas: $${d.ventas}<br>
        🔵 Depósitos: $${d.depositos}<br>
        🔴 Retiros: $${d.retiros}<br>
        🟡 Final: $${d.final}<br>
        👥 Clientes: ${d.clientes.length}
      </div>
    `;
  });
}

// =======================
// 💸 MOVIMIENTOS
// =======================
function hacerRetiro(){
  if(!data.caja.abierta) return alert("Abre caja primero");

  const monto=Number(prompt("Monto"));
  if(monto<=0) return;

  data.retiros.push({monto});
  guardar();
  render();
}

function hacerDeposito(){
  if(!data.caja.abierta) return alert("Abre caja primero");

  const monto=Number(prompt("Monto"));
  if(monto<=0) return;

  const motivo=prompt("Motivo")||"";

  data.depositos.push({monto,motivo});
  guardar();
  render();
}

// =======================
// ⚙️ EXTRA
// =======================
function editarPrecios(){
  const normal=Number(prompt("Precio normal",data.precios.normal));
  const robot=Number(prompt("Precio robots",data.precios.robot));
  const luchador=Number(prompt("Precio luchadores",data.precios.luchador));

  if(normal>0) data.precios.normal=normal;
  if(robot>0) data.precios.robot=robot;
  if(luchador>0) data.precios.luchador=luchador;

  guardar();
  alert("Precios actualizados");
}

function agregarCoche(){
  const nombre=document.getElementById("nuevoCocheNombre").value.trim();

  if(!nombre) return alert("Pon nombre");

  if(data.coches.some(c=>c.nombre===nombre)){
    return alert("Ya existe");
  }

  data.coches.push({
    nombre,
    estado:"libre",
    tiempo:0,
    tiempoInicial:0,
    cliente:""
  });

  document.getElementById("nuevoCocheNombre").value="";
  guardar();
  render();
}

// =======================
// 🚀 INIT
// =======================
window.addEventListener("DOMContentLoaded",render);

// =======================
// 🌐 GLOBAL
// =======================
Object.assign(window,{
  abrirModal, cerrarModal, confirmarInicio,
  terminar, cancelar,
  abrirCaja, cerrarCaja,
  hacerRetiro, hacerDeposito,
  editarPrecios, agregarCoche,
  cambiarVista: (v)=>{
    document.querySelectorAll(".vista").forEach(x=>x.classList.remove("activo"));
    document.getElementById(v).classList.add("activo");

    if(v==="clientes") renderClientes();
    if(v==="historial") renderHistorial();
  }
});
