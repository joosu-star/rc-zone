let vista = "inicio";

let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  clientes: [],
  ventas: [],
  retiros: [],
  historial: [],
  caja: { abierta:false, inicial:0 }
};

let cocheSel = null;

// COCHES
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
  localStorage.setItem("rc_data", JSON.stringify(data));
}

// 🔥 VISTAS SEGURAS
function cambiarVista(v){
  vista = v;

  ["inicio","clientes","historial"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.add("oculto");
  });

  const actual = document.getElementById(v);
  if(actual) actual.classList.remove("oculto");

  if(v==="clientes") renderClientes();
  if(v==="historial") renderHistorial();
}

// 🔥 RENDER
function render(){
  const cont = document.getElementById("coches");
  if(!cont) return;

  cont.innerHTML="";

  data.coches.forEach((c,i)=>{
    let clase="libre";
    if(c.estado==="uso" && c.tiempo>5) clase="activo";
    if(c.tiempo<=5 && c.tiempo>0) clase="poco";
    if(c.tiempo<=0 && c.estado==="uso") clase="terminado";

    const div=document.createElement("div");
    div.className="coche "+clase;

    div.innerHTML=`
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

    cont.appendChild(div);
  });

  actualizarDinero();
}

// MODAL SEGURO
function abrirModal(i){
  const modal = document.getElementById("modal");
  if(!modal) return;

  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }

  cocheSel=i;
  modal.classList.remove("oculto");
}

function cerrarModal(){
  const modal = document.getElementById("modal");
  if(modal) modal.classList.add("oculto");
}

// INICIAR
function confirmarInicio(){
  const nombre=document.getElementById("nombre")?.value;
  const tiempo=Number(document.getElementById("tiempo")?.value);

  if(!nombre || !tiempo) return;

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

  data.ventas.push({
    total: Math.ceil(c.tiempoInicial/15)*50
  });

  c.estado="libre";
  c.tiempo=0;
  c.cliente="";

  guardar();
  render();
}

// CANCELAR
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
  return data.retiros.reduce((a,r)=>a+r.monto,0);
}
function actualizarDinero(){
  const el = document.getElementById("dinero");
  if(el){
    el.innerText = "💰 $" + (data.caja.inicial + totalVentas() - totalRetiros());
  }
}

// CAJA
function abrirCaja(){
  const monto=Number(prompt("Monto inicial"));
  if(!monto) return;

  data.caja={abierta:true,inicial:monto};
  guardar();
  render();
}

function cerrarCaja(){
  if(!confirm("Cerrar caja?")) return;

  const total = data.caja.inicial + totalVentas() - totalRetiros();

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    total
  });

  data.ventas=[];
  data.retiros=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
  renderHistorial();
}

// CLIENTES
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  if(!cont) return;

  cont.innerHTML="";
  data.clientes.forEach(c=>{
    const div=document.createElement("div");
    div.innerText=`${c.nombre} | ${c.coche}`;
    cont.appendChild(div);
  });
}

// HISTORIAL
function renderHistorial(){
  const cont=document.getElementById("listaHistorial");
  if(!cont) return;

  cont.innerHTML="";
  data.historial.forEach(d=>{
    const div=document.createElement("div");
    div.className="card";
    div.innerText=`${d.fecha} | $${d.total}`;
    cont.appendChild(div);
  });
}

// RETIRO
function hacerRetiro(){
  const monto=Number(prompt("Monto"));
  if(!monto) return;

  data.retiros.push({monto});
  guardar();
  render();
}

// INIT
window.onload = render;
