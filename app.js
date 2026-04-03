let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  clientes: [],
  ventas: [],
  retiros: [],
  historial: [],
  caja: { abierta:false, inicial:0 }
};

let actual = "inicio";
let cocheSel = null;

// INIT
if(data.coches.length===0){
  data.coches = [
    "Drift 1","Drift 2",
    ...Array.from({length:10},(_,i)=>"Futbol "+(i+1)),
    ...Array.from({length:6},(_,i)=>"Robot "+(i+1))
  ].map(n=>({
    nombre:n,
    estado:"libre",
    tiempo:0,
    cliente:""
  }));
}

function guardar(){
  localStorage.setItem("rc_data",JSON.stringify(data));
}

// VISTAS
function cambiarVista(v){
  ["inicio","clientes","resumen"].forEach(id=>{
    document.getElementById(id).classList.add("oculto");
  });
  document.getElementById(v).classList.remove("oculto");
}

// RENDER COCHES
function render(){
  const cont = document.getElementById("coches");
  cont.innerHTML="";

  data.coches.forEach((c,i)=>{
    let clase="libre";
    if(c.estado==="uso" && c.tiempo>5) clase="activo";
    if(c.tiempo<=5 && c.tiempo>0) clase="poco";
    if(c.tiempo<=0 && c.estado==="uso") clase="terminado";

    const div=document.createElement("div");
    div.className="coche "+clase;

    div.innerHTML=`
      ${c.nombre}<br>
      ${c.cliente}<br>
      ${c.tiempo}
      <br>
      ${c.estado==="uso" ? `
        <button onclick="terminar(${i})">✔</button>
        <button onclick="cancelar(${i})">✖</button>
      ` : `<button onclick="abrirModal(${i})">Iniciar</button>`}
    `;

    cont.appendChild(div);
  });

  actualizarDinero();
}

// MODAL
function abrirModal(i){
  if(!data.caja.abierta){
    alert("Debes abrir caja");
    return;
  }
  cocheSel=i;
  document.getElementById("modal").classList.remove("oculto");
}
function cerrarModal(){
  document.getElementById("modal").classList.add("oculto");
}

function confirmarInicio(){
  const nombre=document.getElementById("nombre").value;
  const tiempo=Number(document.getElementById("tiempo").value);

  const c=data.coches[cocheSel];
  c.estado="uso";
  c.cliente=nombre;
  c.tiempo=tiempo;

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
    cliente:c.cliente,
    total: Math.ceil(c.tiempo/15)*50
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
      if(c.tiempo<=0) c.estado="terminado";
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
  document.getElementById("dinero").innerText=
    "$"+(data.caja.inicial+totalVentas()-totalRetiros());
}

// CAJA
function abrirCaja(){
  const monto=Number(prompt("Monto inicial"));
  if(!monto) return;

  data.caja={abierta:true,inicial:monto};
  guardar();
}

function cerrarCaja(){
  if(!confirm("Cerrar caja?")) return;

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    ventas:data.ventas,
    retiros:data.retiros,
    clientes:data.clientes
  });

  data.ventas=[];
  data.retiros=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  renderResumen();
}

// CLIENTES VIEW
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  cont.innerHTML="";
  data.clientes.forEach(c=>{
    const div=document.createElement("div");
    div.innerText=`${c.nombre} - ${c.coche} - ${c.tiempo}min - ${c.hora}`;
    cont.appendChild(div);
  });
}

// RESUMEN VIEW
function renderResumen(){
  const cont=document.getElementById("listaResumen");
  cont.innerHTML="";
  data.historial.forEach(d=>{
    const div=document.createElement("div");
    div.innerText=`${d.fecha} - Clientes: ${d.clientes.length}`;
    cont.appendChild(div);
  });
}

// RETIRO
function hacerRetiro(){
  const monto=Number(prompt("Monto"));
  if(!monto) return;
  data.retiros.push({monto});
  guardar();
}

// LOOP VIEWS
setInterval(()=>{
  renderClientes();
  renderResumen();
},1000);

render();
