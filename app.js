let vistaActual = "inicio";

// DATA SEGURA
let data;
try {
  data = JSON.parse(localStorage.getItem("rc_data")) || {};
} catch {
  data = {};
}

data.coches = data.coches || [];
data.clientes = data.clientes || [];
data.ventas = data.ventas || [];
data.retiros = data.retiros || [];
data.historial = data.historial || [];
data.caja = data.caja || { abierta:false, inicial:0 };

let cocheSel = null;

// INIT COCHES
if(data.coches.length===0){
  const lista = [
    {nombre:"Drift 1", tipo:"Drift"},
    {nombre:"Drift 2", tipo:"Drift"},
    ...Array.from({length:10},(_,i)=>({nombre:"Futbol "+(i+1),tipo:"Futbol"})),
    ...Array.from({length:6},(_,i)=>({nombre:"Robot "+(i+1),tipo:"Robot"}))
  ];

  data.coches = lista.map(c=>({
    nombre:c.nombre,
    tipo:c.tipo,
    estado:"libre",
    tiempo:0,
    tiempoInicial:0,
    cliente:""
  }));
}

function guardar(){
  localStorage.setItem("rc_data",JSON.stringify(data));
}

// 🔥 VISTAS SIN ERRORES
function cambiarVista(v){
  vistaActual = v;

  ["inicio","clientes","resumen"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.add("oculto");
  });

  const vista = document.getElementById(v);
  if(vista) vista.classList.remove("oculto");

  if(v==="clientes") renderClientes();
  if(v==="resumen") renderResumen();
}

// 🔥 ORDEN
function ordenarCoches(){
  return [...data.coches].sort((a,b)=>{
    if(a.estado==="uso" && b.estado!=="uso") return -1;
    if(a.estado!=="uso" && b.estado==="uso") return 1;
    return a.tipo.localeCompare(b.tipo);
  });
}

// 🔥 RENDER PERFECTO
function render(){
  const cont = document.getElementById("coches");
  if(!cont) return;

  cont.innerHTML="";

  const categorias = ["Drift","Futbol","Robot"];
  const coches = ordenarCoches();

  categorias.forEach(cat=>{
    const section=document.createElement("div");
    section.className="categoria";

    const title=document.createElement("h2");
    title.innerText=cat;

    const grid=document.createElement("div");
    grid.className="grid";

    coches.filter(c=>c.tipo===cat).forEach(c=>{
      const i = data.coches.findIndex(x=>x.nombre===c.nombre);

      let clase="libre";
      if(c.estado==="uso" && c.tiempo>5) clase="activo";
      if(c.tiempo<=5 && c.tiempo>0) clase="poco";
      if(c.tiempo<=0 && c.estado==="uso") clase="terminado";

      const div=document.createElement("div");
      div.className="coche "+clase;

      div.innerHTML=`
        <strong>${c.nombre}</strong><br>
        ${c.cliente || ""}<br>
        ${c.tiempo>0 ? c.tiempo+" min restantes" : ""}
        <br><br>
        ${
          c.estado==="uso"
          ? `<button onclick="terminar(${i})">✔</button>
             <button onclick="cancelar(${i})">✖</button>`
          : `<button onclick="abrirModal(${i})">▶</button>`
        }
      `;

      grid.appendChild(div);
    });

    section.appendChild(title);
    section.appendChild(grid);
    cont.appendChild(section);
  });

  actualizarDinero();
}

// MODAL
function abrirModal(i){
  if(!data.caja.abierta){
    alert("Debes abrir caja primero");
    return;
  }
  cocheSel=i;
  document.getElementById("modal").classList.remove("oculto");
}

function cerrarModal(){
  document.getElementById("modal").classList.add("oculto");
}

// INICIAR
function confirmarInicio(){
  const nombre=document.getElementById("nombre").value.trim();
  const tiempo=Number(document.getElementById("tiempo").value);

  if(!nombre || tiempo<=0) return;

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

  document.getElementById("nombre").value="";
  document.getElementById("tiempo").value="";

  cerrarModal();
  guardar();
  render();
}

// TERMINAR
function terminar(i){
  const c=data.coches[i];

  const total = Math.ceil(c.tiempoInicial/15)*50;

  data.ventas.push({
    cliente:c.cliente,
    total
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
  const el = document.getElementById("dinero");
  if(el){
    el.innerText = "💰 $" + (data.caja.inicial + totalVentas() - totalRetiros());
  }
}

// CAJA
function abrirCaja(){
  if(data.caja.abierta){
    alert("Caja ya abierta");
    return;
  }

  const monto=Number(prompt("Monto inicial"));
  if(!monto) return;

  data.caja={abierta:true,inicial:monto};
  guardar();
  render();
}

function cerrarCaja(){
  if(!data.caja.abierta) return;

  if(!confirm("¿Cerrar caja?")) return;

  const totalVentasDia = totalVentas();
  const totalRetirosDia = totalRetiros();
  const totalFinal = data.caja.inicial + totalVentasDia - totalRetirosDia;

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    hora:new Date().toLocaleTimeString(),
    cajaInicial:data.caja.inicial,
    totalVentas:totalVentasDia,
    totalRetiros:totalRetirosDia,
    totalFinal:totalFinal,
    clientes:[...data.clientes]
  });

  data.ventas=[];
  data.retiros=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
  renderResumen();
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

// 🔥 HISTORIAL BONITO Y COMPLETO
function renderResumen(){
  const cont=document.getElementById("listaResumen");
  if(!cont) return;

  cont.innerHTML="";

  data.historial.forEach(d=>{
    const inicial = d.cajaInicial ?? 0;
    const ventas = d.totalVentas ?? 0;
    const retiros = d.totalRetiros ?? 0;
    const final = d.totalFinal ?? (inicial + ventas - retiros);
    const clientes = d.clientes?.length ?? 0;

    const div=document.createElement("div");

    div.style.border="1px solid white";
    div.style.margin="10px";
    div.style.padding="10px";
    div.style.borderRadius="10px";
    div.style.background="#0f172a";

    div.innerHTML=`
      📅 ${d.fecha} - ${d.hora}<br>
      💰 Inicial: $${inicial}<br>
      🟢 Ventas: $${ventas}<br>
      🔴 Retiros: $${retiros}<br>
      🟡 Final: $${final}<br>
      👥 Clientes: ${clientes}
    `;

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
