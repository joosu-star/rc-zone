function error(msg){
  console.error(msg);
  const box = document.getElementById("errorBox");
  if(box){
    box.style.display = "block";
    box.innerText = msg;
  }
}

// CARGA SEGURA
let data;
try {
  data = JSON.parse(localStorage.getItem("rc_data")) || {};
} catch {
  error("Error en datos, reiniciando...");
  data = {};
}

// DEFAULTS
data.coches = data.coches || [];
data.clientes = data.clientes || [];
data.ventas = data.ventas || [];
data.retiros = data.retiros || [];
data.historial = data.historial || [];
data.caja = data.caja || { abierta:false, inicial:0 };

let cocheSel = null;

// INIT COCHES
if(data.coches.length===0){
  data.coches = [
    "Drift 1","Drift 2",
    ...Array.from({length:10},(_,i)=>"Futbol "+(i+1)),
    ...Array.from({length:6},(_,i)=>"Robot "+(i+1))
  ].map(n=>({
    nombre:n,
    estado:"libre",
    tiempo:0,
    tiempoInicial:0,
    cliente:""
  }));
}

function guardar(){
  try {
    localStorage.setItem("rc_data",JSON.stringify(data));
  } catch {
    error("No se pudo guardar");
  }
}

// VISTAS
function cambiarVista(v){
  ["inicio","clientes","resumen"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.add("oculto");
  });

  const vista = document.getElementById(v);
  if(vista) vista.classList.remove("oculto");

  renderClientes();
  renderResumen();
}

// RENDER
function render(){
  const cont = document.getElementById("coches");

  if(!cont){
    error("No existe el contenedor de coches");
    return;
  }

  cont.innerHTML="";

  data.coches.forEach((c,i)=>{
    const div=document.createElement("div");

    let clase="libre";
    if(c.estado==="uso" && c.tiempo>5) clase="activo";
    if(c.tiempo<=5 && c.tiempo>0) clase="poco";
    if(c.tiempo<=0 && c.estado==="uso") clase="terminado";

    div.className="coche "+clase;

    div.innerHTML=`
      <strong>${c.nombre}</strong><br>
      ${c.cliente || ""}<br>
      ${c.tiempo>0 ? c.tiempo+" min" : ""}
      <br>
      ${
        c.estado==="uso"
        ? `<button onclick="terminar(${i})">✔</button>
           <button onclick="cancelar(${i})">✖</button>`
        : `<button onclick="abrirModal(${i})">▶</button>`
      }
    `;

    cont.appendChild(div);
  });

  actualizarDinero();
}

// MODAL
function abrirModal(i){
  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }
  cocheSel=i;
  document.getElementById("modal")?.classList.remove("oculto");
}

function cerrarModal(){
  document.getElementById("modal")?.classList.add("oculto");
}

// INICIAR
function confirmarInicio(){
  const nombre=document.getElementById("nombre")?.value.trim();
  const tiempo=Number(document.getElementById("tiempo")?.value);

  if(!nombre || tiempo<=0){
    error("Datos inválidos");
    return;
  }

  const c=data.coches[cocheSel];
  if(!c) return;

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

  document.getElementById("nombre").value="";
  document.getElementById("tiempo").value="";

  cerrarModal();
  guardar();
  render();
}

// TERMINAR
function terminar(i){
  const c=data.coches[i];
  if(!c) return;

  data.ventas.push({
    cliente:c.cliente,
    total: Math.ceil(c.tiempoInicial/15)*50
  });

  c.estado="libre";
  c.tiempo=0;
  c.tiempoInicial=0;
  c.cliente="";

  guardar();
  render();
}

// CANCELAR
function cancelar(i){
  const c=data.coches[i];
  if(!c) return;

  c.estado="libre";
  c.tiempo=0;
  c.tiempoInicial=0;
  c.cliente="";

  guardar();
  render();
}

// TIMER
setInterval(()=>{
  data.coches.forEach(c=>{
    if(c.estado==="uso"){
      c.tiempo--;
      if(c.tiempo<=0){
        c.tiempo=0;
        c.estado="terminado";
      }
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
  return data.retiros.reduce((a,r)=>a+r.monto,0);
}
function actualizarDinero(){
  const el=document.getElementById("dinero");
  if(el){
    el.innerText="💰 $" + (data.caja.inicial + totalVentas() - totalRetiros());
  }
}

// CAJA
function abrirCaja(){
  if(data.caja.abierta){
    alert("Caja ya abierta");
    return;
  }

  const monto=Number(prompt("Monto inicial"));
  if(!monto || monto<0) return;

  data.caja={abierta:true,inicial:monto};
  guardar();
  render();
}

function cerrarCaja(){
  if(!data.caja.abierta) return;

  if(!confirm("¿Cerrar caja?")) return;

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    ventas:[...data.ventas],
    retiros:[...data.retiros],
    clientes:[...data.clientes]
  });

  data.ventas=[];
  data.retiros=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
}

// CLIENTES
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  if(!cont) return;

  cont.innerHTML="";
  data.clientes.forEach(c=>{
    const div=document.createElement("div");
    div.innerText=`${c.nombre} | ${c.coche} | ${c.tiempo}min | ${c.hora}`;
    cont.appendChild(div);
  });
}

// RESUMEN
function renderResumen(){
  const cont=document.getElementById("listaResumen");
  if(!cont) return;

  cont.innerHTML="";
  data.historial.forEach(d=>{
    const div=document.createElement("div");
    div.innerText=`${d.fecha} | Clientes: ${d.clientes.length}`;
    cont.appendChild(div);
  });
}

// RETIRO
function hacerRetiro(){
  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }

  const monto=Number(prompt("Monto"));
  if(!monto) return;

  data.retiros.push({monto});
  guardar();
  render();
}

// INIT
window.onload = ()=>{
  render();
  renderClientes();
  renderResumen();
};
