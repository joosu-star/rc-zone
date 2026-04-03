let vista = "inicio";

let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  clientes: [],
  ventas: [],
  retiros: [],
  historial: [],
  caja: { abierta:false, inicial:0 }
};

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

// VISTAS
function cambiarVista(v){
  vista = v;

  document.getElementById("inicio").classList.add("oculto");
  document.getElementById("clientes").classList.add("oculto");
  document.getElementById("historial").classList.add("oculto");

  document.getElementById(v).classList.remove("oculto");

  if(v==="clientes") renderClientes();
  if(v==="historial") renderHistorial();
}

// RENDER COCHES
function render(){
  const cont = document.getElementById("coches");
  cont.innerHTML="";

  const orden = [...data.coches].sort((a,b)=>{
    if(a.estado==="uso") return -1;
    if(b.estado==="uso") return 1;
    return 0;
  });

  orden.forEach((c)=>{
    const i = data.coches.findIndex(x=>x.nombre===c.nombre);

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
        : `<button onclick="iniciar(${i})">▶</button>`
      }
    `;

    cont.appendChild(div);
  });

  actualizarDinero();
}

// INICIAR
function iniciar(i){
  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }

  const nombre = prompt("Nombre");
  const tiempo = Number(prompt("Minutos"));

  if(!nombre || !tiempo) return;

  const c = data.coches[i];
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

  guardar();
  render();
}

// TERMINAR
function terminar(i){
  const c=data.coches[i];

  data.ventas.push({
    cliente:c.cliente,
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
  document.getElementById("dinero").innerText =
    "💰 $" + (data.caja.inicial + totalVentas() - totalRetiros());
}

// CAJA
function abrirCaja(){
  if(data.caja.abierta){
    alert("Ya abierta");
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
    inicial:data.caja.inicial,
    ventas:totalVentasDia,
    retiros:totalRetirosDia,
    final:totalFinal,
    clientes:[...data.clientes]
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
  cont.innerHTML="";

  data.clientes.forEach(c=>{
    const div=document.createElement("div");
    div.innerText=`${c.nombre} | ${c.coche} | ${c.tiempo}min | ${c.hora}`;
    cont.appendChild(div);
  });
}

// HISTORIAL BONITO 🔥
function renderHistorial(){
  const cont=document.getElementById("listaHistorial");
  cont.innerHTML="";

  data.historial.forEach(d=>{
    const div=document.createElement("div");
    div.className="card";

    div.innerHTML=`
      📅 ${d.fecha} - ${d.hora}<br>
      💰 Inicial: $${d.inicial}<br>
      🟢 Ventas: $${d.ventas}<br>
      🔴 Retiros: $${d.retiros}<br>
      🟡 Final: $${d.final}<br>
      👥 Clientes: ${d.clientes.length}
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
window.onload = render;
