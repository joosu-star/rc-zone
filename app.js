let data = JSON.parse(localStorage.getItem("rc_data")) || {};

// INIT
function initData(){
  data.coches = Array.isArray(data.coches) ? data.coches : [];
  data.clientes = data.clientes || [];
  data.ventas = data.ventas || [];
  data.retiros = data.retiros || [];
  data.depositos = data.depositos || [];
  data.historial = data.historial || [];
  data.caja = data.caja || { abierta:false, inicial:0 };

  data.precios = data.precios || {
    normal:50,
    robot:40,
    luchador:40
  };
}
initData();

// CREAR BASE
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

// GUARDAR
function guardar(){
  localStorage.setItem("rc_data", JSON.stringify(data));
}

// PRECIOS
function obtenerPrecio(nombre){
  nombre = nombre.toLowerCase();
  if(nombre.includes("luchador")) return data.precios.luchador;
  if(nombre.includes("robot")) return data.precios.robot;
  return data.precios.normal;
}

// RENDER (🔥 FIX ÍNDICE REAL)
function render(){
  const cont = document.getElementById("coches");
  cont.innerHTML = "";

  ["Drift","Futbol","Robot","Luchador"].forEach(tipo=>{
    const sec = document.createElement("div");
    const grid = document.createElement("div");

    sec.className="seccion";
    grid.className="grid";

    const t = document.createElement("h2");
    t.innerText = tipo;

    data.coches
      .map((c,index)=>({...c,index})) // 🔥 FIX
      .filter(c=>c.nombre.includes(tipo))
      .forEach(c=>{
        const div = document.createElement("div");
        div.className="coche "+getClase(c);

        div.innerHTML = `
          <b>${c.nombre}</b><br>
          ${c.cliente || ""}<br>
          ${c.tiempo>0 ? c.tiempo+" min":""}<br>
          ${
            c.estado==="uso"
            ? `<button onclick="terminar(${c.index})">✔</button>
               <button onclick="cancelar(${c.index})">✖</button>`
            : `<button onclick="abrirModal(${c.index})">▶</button>`
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

// MODAL
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

// TERMINAR
function terminar(i){
  const c=data.coches[i];
  const total=Math.ceil(c.tiempoInicial/15)*obtenerPrecio(c.nombre);

  data.ventas.push({cliente:c.cliente,coche:c.nombre,total});

  c.estado="libre";
  c.tiempo=0;
  c.cliente="";

  guardar();
  render();
}

function cancelar(i){
  const c=data.coches[i];
  c.estado="libre";
  c.tiempo=0;
  c.cliente="";
  guardar();
  render();
}

// TIMER + SONIDO
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

// DINERO
const sum=(a,k)=>a.reduce((x,y)=>x+(y[k]||0),0);

function actualizarDinero(){
  document.getElementById("dinero").innerText =
    "💰 $" + (
      data.caja.inicial +
      sum(data.ventas,"total") +
      sum(data.depositos,"monto") -
      sum(data.retiros,"monto")
    );
}

// CAJA
function abrirCaja(){
  if(data.caja.abierta) return alert("Ya abierta");
  const m=Number(prompt("Monto inicial"));
  if(m<=0) return;
  data.caja={abierta:true,inicial:m};
  guardar(); render();
}

function cerrarCaja(){
  if(!confirm("¿Cerrar caja?")) return;

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    hora:new Date().toLocaleTimeString(),
    final:document.getElementById("dinero").innerText
  });

  data.ventas=[]; data.retiros=[]; data.depositos=[]; data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar(); render(); renderHistorial();
}

// CLIENTES
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  cont.innerHTML="";
  data.clientes.forEach(c=>{
    cont.innerHTML+=`<div>${c.nombre} | ${c.coche}</div>`;
  });
}

// HISTORIAL
function renderHistorial(){
  const cont=document.getElementById("listaHistorial");
  cont.innerHTML="";
  data.historial.forEach(h=>{
    cont.innerHTML+=`<div class="card">${h.fecha} ${h.final}</div>`;
  });
}

// EXTRA
function editarPrecios(){
  const n=Number(prompt("Normal",data.precios.normal));
  const r=Number(prompt("Robot",data.precios.robot));
  const l=Number(prompt("Luchador",data.precios.luchador));

  if(n>0) data.precios.normal=n;
  if(r>0) data.precios.robot=r;
  if(l>0) data.precios.luchador=l;

  guardar();
}

function agregarCoche(){
  const n=document.getElementById("nuevoCocheNombre").value.trim();
  if(!n) return;
  if(data.coches.some(c=>c.nombre===n)) return alert("Ya existe");

  data.coches.push({
    nombre:n,
    estado:"libre",
    tiempo:0,
    tiempoInicial:0,
    cliente:""
  });

  guardar(); render();
}

// VISTAS
function cambiarVista(v){
  document.querySelectorAll(".vista").forEach(x=>x.classList.remove("activo"));
  document.getElementById(v).classList.add("activo");

  if(v==="clientes") renderClientes();
  if(v==="historial") renderHistorial();
}

// INIT
window.addEventListener("DOMContentLoaded",render);

// GLOBAL
Object.assign(window,{
  abrirModal, cerrarModal, confirmarInicio,
  terminar, cancelar,
  abrirCaja, cerrarCaja,
  hacerRetiro:()=>{},
  hacerDeposito:()=>{},
  editarPrecios, agregarCoche,
  cambiarVista
});
