let vistaActual = "inicio";

let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  clientes: [],
  ventas: [],
  retiros: [],
  historial: [],
  caja: { abierta:false, inicial:0 }
};

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

// VISTAS
function cambiarVista(v){
  vistaActual = v;

  ["inicio","clientes","resumen"].forEach(id=>{
    document.getElementById(id).classList.add("oculto");
  });

  document.getElementById(v).classList.remove("oculto");

  if(v==="clientes") renderClientes();
  if(v==="resumen") renderResumen();
}

function mantenerVista(){
  cambiarVista(vistaActual);
}

// ORDEN
function ordenarCoches(){
  return [...data.coches].sort((a,b)=>{
    if(a.estado==="uso" && b.estado!=="uso") return -1;
    if(a.estado!=="uso" && b.estado==="uso") return 1;
    return a.tipo.localeCompare(b.tipo);
  });
}

// RENDER BONITO
function render(){
  const cont = document.getElementById("coches");
  cont.innerHTML="";

  const categorias=["Drift","Futbol","Robot"];
  const coches = ordenarCoches();

  categorias.forEach(cat=>{
    const section=document.createElement("div");
    section.className="categoria";

    const title=document.createElement("h2");
    title.innerText=cat;

    const grid=document.createElement("div");
    grid.className="grid";

    coches.filter(c=>c.tipo===cat).forEach(c=>{
      const i=data.coches.findIndex(x=>x.nombre===c.nombre);

      let clase="libre";
      if(c.estado==="uso" && c.tiempo>5) clase="activo";
      if(c.tiempo<=5 && c.tiempo>0) clase="poco";
      if(c.tiempo<=0 && c.estado==="uso") clase="terminado";

      const div=document.createElement("div");
      div.className="coche "+clase;

      div.innerHTML=`
        <strong>${c.nombre}</strong><br>
        ${c.cliente || ""}<br>
        ${c.tiempo>0 ? c.tiempo+" min":""}
        <br>
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

// RESTO IGUAL PERO LLAMANDO render()

function abrirModal(i){
  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }
  cocheSel=i;
  document.getElementById("modal").classList.remove("oculto");
}

function cerrarModal(){
  document.getElementById("modal").classList.add("oculto");
}

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

  cerrarModal();
  guardar();
  render();
}

function terminar(i){
  const c=data.coches[i];

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

function cancelar(i){
  const c=data.coches[i];
  c.estado="libre";
  c.tiempo=0;
  c.tiempoInicial=0;
  c.cliente="";
  guardar();
  render();
}

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

function totalVentas(){
  return data.ventas.reduce((a,v)=>a+v.total,0);
}

function totalRetiros(){
  return data.retiros.reduce((a,r)=>a+r.monto,0);
}

function actualizarDinero(){
  document.getElementById("dinero").innerText =
    "💰 $" + (data.caja.inicial + totalVentas() - totalRetiros());
}

function abrirCaja(){
  if(data.caja.abierta) return alert("Ya abierta");
  const monto=Number(prompt("Monto"));
  if(!monto) return;

  data.caja={abierta:true,inicial:monto};
  guardar();
  render();
}

function cerrarCaja(){
  if(!data.caja.abierta) return;

  if(!confirm("¿Cerrar caja?")) return;

  const totalFinal = data.caja.inicial + totalVentas() - totalRetiros();

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    totalFinal
  });

  data.ventas=[];
  data.retiros=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
  renderResumen();
}

function renderClientes(){
  const cont=document.getElementById("listaClientes");
  cont.innerHTML="";
  data.clientes.forEach(c=>{
    const div=document.createElement("div");
    div.innerText=`${c.nombre} | ${c.coche}`;
    cont.appendChild(div);
  });
}

function renderResumen(){
  const cont=document.getElementById("listaResumen");
  cont.innerHTML="";
  data.historial.forEach(d=>{
    const div=document.createElement("div");
    div.innerText=`${d.fecha} | $${d.totalFinal}`;
    cont.appendChild(div);
  });
}

function hacerRetiro(){
  if(!data.caja.abierta) return alert("Abre caja");
  const monto=Number(prompt("Monto"));
  if(!monto) return;

  data.retiros.push({monto});
  guardar();
  render();
}

window.onload = ()=>{
  render();
  renderClientes();
  renderResumen();
};
