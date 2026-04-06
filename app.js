let data = JSON.parse(localStorage.getItem("rc_data")) || {};

// INIT
function init(){
  data.coches = data.coches || [];
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

// RENDER
function render(){
  const cont = document.getElementById("coches");
  cont.innerHTML = "";

  const tipos = ["Drift","Futbol","Robot","Luchador"];

  tipos.forEach(tipo=>{
    const titulo = document.createElement("h2");
    titulo.innerText = tipo;

    const grid = document.createElement("div");
    grid.className="grid";

    data.coches.forEach((c,i)=>{
      if(!c.nombre.startsWith(tipo)) return;

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

  data.clientes.push({
    nombre,
    coche:c.nombre,
    inicio:new Date().toLocaleTimeString(),
    tiempo
  });

  cerrarModal();
  guardar();
  render();
}

// TERMINAR
function terminar(i){
  const c=data.coches[i];

  const total=Math.ceil(c.tiempoInicial/15)*precio(c.nombre);

  data.ventas.push({
    cliente:c.cliente,
    coche:c.nombre,
    total,
    inicio:c.inicio,
    fin:new Date().toLocaleTimeString()
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

// TIMER + SONIDO
setInterval(()=>{
  data.coches.forEach(c=>{
    if(c.estado==="uso"){
      if(c.tiempo===1){
        const a=document.getElementById("alarma");
        a.currentTime=0;
        a.play();
      }
      c.tiempo--;
      if(c.tiempo<0) c.tiempo=0;
    }
  });
  guardar();
  render();
},60000);

// DINERO
function totalVentas(){
  return data.ventas.reduce((a,v)=>a+v.total,0);
}
function totalRetiros(){
  return data.retiros.reduce((a,v)=>a+v.monto,0);
}
function totalDepositos(){
  return data.depositos.reduce((a,v)=>a+v.monto,0);
}

function actualizarDinero(){
  const total =
    data.caja.inicial +
    totalVentas() +
    totalDepositos() -
    totalRetiros();

  document.getElementById("dinero").innerText="💰 $"+total;
}

// CAJA
function abrirCaja(){
  const m=Number(prompt("Monto inicial"));
  if(m<=0) return;
  data.caja={abierta:true,inicial:m};
  guardar(); render();
}

function cerrarCaja(){
  const registro={
    fecha:new Date().toLocaleDateString(),
    hora:new Date().toLocaleTimeString(),
    inicial:data.caja.inicial,
    ventas:totalVentas(),
    retiros:totalRetiros(),
    depositos:totalDepositos(),
    final:data.caja.inicial+totalVentas()+totalDepositos()-totalRetiros()
  };

  data.historial.push(registro);

  data.ventas=[];
  data.retiros=[];
  data.depositos=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar(); render(); renderHistorial();
}

// RETIROS / DEPOSITOS
function hacerRetiro(){
  const monto=Number(prompt("Monto"));
  if(monto<=0) return;
  const motivo=prompt("Motivo")||"";
  data.retiros.push({monto,motivo});
  guardar(); render();
}

function hacerDeposito(){
  const monto=Number(prompt("Monto"));
  if(monto<=0) return;
  const motivo=prompt("Motivo")||"";
  data.depositos.push({monto,motivo});
  guardar(); render();
}

// CLIENTES
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  cont.innerHTML="";

  data.clientes.forEach(c=>{
    cont.innerHTML+=`
      <div class="card">
        <b>${c.nombre}</b><br>
        🚗 ${c.coche}<br>
        ⏱ Inicio: ${c.inicio}<br>
        ⌛ ${c.tiempo} min
      </div>
    `;
  });
}

// HISTORIAL
function renderHistorial(){
  const cont=document.getElementById("listaHistorial");
  cont.innerHTML="";

  data.historial.forEach(h=>{
    cont.innerHTML+=`
      <div class="card">
        📅 ${h.fecha} ${h.hora}<br>
        💰 Inicial: $${h.inicial}<br>
        <span class="verde">Ventas: $${h.ventas}</span><br>
        <span class="azul">Depósitos: $${h.depositos}</span><br>
        <span class="rojo">Retiros: $${h.retiros}</span><br>
        🟡 Final: $${h.final}
      </div>
    `;
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
  hacerRetiro, hacerDeposito,
  editarPrecios, cambiarVista
});
