let data = JSON.parse(localStorage.getItem("rc_data")) || {};

function init(){
  data.coches = data.coches || [];
  data.clientes = data.clientes || [];
  data.ventas = data.ventas || [];
  data.historial = data.historial || [];
  data.caja = data.caja || { abierta:false, inicial:0 };

  data.precios = data.precios || {
    normal:50,
    robot:40,
    luchador:40
  };
}

init();

// CREAR COCHES
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

function guardar(){
  localStorage.setItem("rc_data", JSON.stringify(data));
}

// PRECIOS
function precio(nombre){
  nombre = nombre.toLowerCase();
  if(nombre.includes("robot")) return data.precios.robot;
  if(nombre.includes("luchador")) return data.precios.luchador;
  return data.precios.normal;
}

// RENDER (FIX REAL)
function render(){
  const cont = document.getElementById("coches");
  cont.innerHTML = "";

  ["Drift","Futbol","Robot","Luchador"].forEach(tipo=>{
    const grid = document.createElement("div");
    grid.className="grid";

    const titulo = document.createElement("h2");
    titulo.innerText = tipo;

    data.coches.forEach((c,i)=>{
      if(!c.nombre.includes(tipo)) return;

      const div = document.createElement("div");
      div.className="coche "+estado(c);

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

    cont.appendChild(titulo);
    cont.appendChild(grid);
  });

  actualizarDinero();
}

function estado(c){
  if(c.estado!=="uso") return "libre";
  if(c.tiempo<=0) return "terminado";
  if(c.tiempo<=5) return "poco";
  return "activo";
}

// MODAL
let seleccionado=null;

function abrirModal(i){
  if(!data.caja.abierta) return alert("Abre caja");
  seleccionado=i;
  document.getElementById("modal").classList.add("activo");
}

function cerrarModal(){
  document.getElementById("modal").classList.remove("activo");
}

function confirmarInicio(){
  const nombre=document.getElementById("nombre").value;
  const tiempo=Number(document.getElementById("tiempo").value);

  if(!nombre || tiempo<=0) return;

  const c=data.coches[seleccionado];

  c.estado="uso";
  c.cliente=nombre;
  c.tiempo=tiempo;
  c.tiempoInicial=tiempo;

  data.clientes.push({nombre,coche:c.nombre});

  cerrarModal();
  guardar();
  render();
}

// TERMINAR
function terminar(i){
  const c=data.coches[i];

  data.ventas.push({
    total: Math.ceil(c.tiempoInicial/15)*precio(c.nombre)
  });

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

// TIMER
setInterval(()=>{
  data.coches.forEach(c=>{
    if(c.estado==="uso"){
      if(c.tiempo===1){
        document.getElementById("alarma").play();
      }
      c.tiempo--;
      if(c.tiempo<0) c.tiempo=0;
    }
  });
  guardar();
  render();
},60000);

// DINERO
function actualizarDinero(){
  const total = data.ventas.reduce((a,v)=>a+v.total,0);
  document.getElementById("dinero").innerText="💰 $"+(data.caja.inicial+total);
}

// CAJA
function abrirCaja(){
  const m=Number(prompt("Monto inicial"));
  if(m<=0) return;
  data.caja={abierta:true,inicial:m};
  guardar(); render();
}

function cerrarCaja(){
  data.historial.push({total:document.getElementById("dinero").innerText});
  data.ventas=[];
  data.caja={abierta:false,inicial:0};
  guardar(); render(); renderHistorial();
}

// HISTORIAL
function renderHistorial(){
  const cont=document.getElementById("listaHistorial");
  cont.innerHTML="";
  data.historial.forEach(h=>{
    cont.innerHTML+=`<div>${h.total}</div>`;
  });
}

// CLIENTES
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  cont.innerHTML="";
  data.clientes.forEach(c=>{
    cont.innerHTML+=`<div>${c.nombre}</div>`;
  });
}

// PRECIOS
function editarPrecios(){
  const n=Number(prompt("Normal",data.precios.normal));
  const r=Number(prompt("Robot",data.precios.robot));
  const l=Number(prompt("Luchador",data.precios.luchador));

  if(n>0) data.precios.normal=n;
  if(r>0) data.precios.robot=r;
  if(l>0) data.precios.luchador=l;

  guardar();
}

// VISTAS
function cambiarVista(v){
  document.querySelectorAll(".vista").forEach(x=>x.classList.remove("activo"));
  document.getElementById(v).classList.add("activo");

  if(v==="clientes") renderClientes();
  if(v==="historial") renderHistorial();
}

window.addEventListener("DOMContentLoaded",render);

Object.assign(window,{
  abrirModal, cerrarModal, confirmarInicio,
  terminar, cancelar,
  abrirCaja, cerrarCaja,
  editarPrecios, cambiarVista
});
