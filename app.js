let data = JSON.parse(localStorage.getItem("rc_data")) || {};

function init(){
  data.coches = data.coches || [];
  data.clientes = data.clientes || [];
  data.ventas = data.ventas || [];
  data.retiros = data.retiros || [];
  data.depositos = data.depositos || [];
  data.historial = data.historial || [];
  data.caja = data.caja || { abierta:false, inicial:0 };
  data.ticket = data.ticket || 1;

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
    cliente:"",
    inicio:null
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

// INICIAR
function confirmarInicio(conTicket=false){
  const nombre = document.getElementById("nombre").value;
  const tiempo = Number(document.getElementById("tiempo").value);

  if(!nombre || tiempo<=0) return alert("Datos inválidos");

  const c = data.coches[seleccionado];

  c.estado="uso";
  c.tiempo=tiempo;
  c.tiempoInicial=tiempo;
  c.cliente=nombre;
  c.inicio=new Date();

  // 👥 CLIENTES
  data.clientes.push({
    nombre,
    coche:c.nombre,
    inicio:c.inicio.toLocaleString()
  });

  guardar();
  cerrarModal();
  render();

  if(conTicket){
    const fin=new Date(c.inicio.getTime()+tiempo*60000);
    const costo=Math.ceil(tiempo/15)*precio(c.nombre);

    imprimirTicket({
      nombre,
      coche:c.nombre,
      inicio:c.inicio,
      fin,
      tiempo,
      costo
    });
  }
}

// 🧾 TICKET
function imprimirTicket(info){

  const numero = String(data.ticket).padStart(6,"0");
  data.ticket++;

  const area = document.getElementById("ticketArea");

  area.innerHTML = `
    <div id="ticket">

      <div class="bold" style="font-size:16px;">RC ZONE 189</div>
      <div>Entretención al máximo</div>

      <div>Plaza Tangamanga Isla C115</div>
      <div>San Luis Potosí</div>

      <br>

      <div class="bold" style="font-size:16px;">4442140002</div>

      <div class="line"></div>

      Ticket: ${numero}<br>
      Cliente: ${info.nombre}<br>
      Coche: ${info.coche}<br>

      <div class="line"></div>

      Inicio:<br>
      ${info.inicio.toLocaleString()}<br>

      Fin:<br>
      ${info.fin.toLocaleString()}<br>

      Tiempo: ${info.tiempo} min

      <div class="line"></div>

      <div class="bold" style="font-size:14px;">
        TOTAL: $${info.costo}
      </div>

      <div class="line"></div>

      <div>Gracias por tu visita</div>
      <div class="bold">TAMBIÉN VAMOS A TU FIESTA</div>

    </div>
  `;

  guardar();

  area.style.display="block";
  window.print();

  setTimeout(()=>area.style.display="none",500);
}

// RENDER
function render(){
  const cont=document.getElementById("coches");
  cont.innerHTML="";

  const tipos=["Drift","Futbol","Robot","Luchador"];

  tipos.forEach(tipo=>{
    const titulo=document.createElement("h2");
    titulo.innerText=tipo;

    const grid=document.createElement("div");
    grid.className="grid";

    data.coches.forEach((c,i)=>{
      if(!c.nombre.startsWith(tipo)) return;

      const div=document.createElement("div");
      div.className="coche "+estado(c);

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

// TERMINAR
function terminar(i){
  const c=data.coches[i];

  const total=Math.ceil(c.tiempoInicial/15)*precio(c.nombre);

  data.ventas.push({
    cliente:c.cliente,
    coche:c.nombre,
    total
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

// 🔊 TIMER + SONIDO
setInterval(()=>{
  data.coches.forEach(c=>{
    if(c.estado==="uso"){

      if(c.tiempo === 1){
        const a = document.getElementById("alarma");
        if(a){
          a.currentTime = 0;
          a.play().catch(()=>{});
        }
      }

      c.tiempo--;
      if(c.tiempo<0) c.tiempo=0;
    }
  });

  guardar();
  render();
},60000);

// DINERO
function totalVentas(){ return data.ventas.reduce((a,v)=>a+v.total,0); }
function totalRetiros(){ return data.retiros.reduce((a,v)=>a+v.monto,0); }
function totalDepositos(){ return data.depositos.reduce((a,v)=>a+v.monto,0); }

function actualizarDinero(){
  const total=data.caja.inicial+totalVentas()+totalDepositos()-totalRetiros();
  document.getElementById("dinero").innerText="💰 $"+total;
}

// CAJA
function abrirCaja(){
  const m=Number(prompt("Monto inicial"));
  if(m<=0) return;
  data.caja={abierta:true,inicial:m};
  guardar(); render();
}

// 📜 HISTORIAL BONITO
function cerrarCaja(){
  if(!confirm("¿Cerrar caja?")) return;

  const totalFinal = data.caja.inicial + totalVentas() + totalDepositos() - totalRetiros();

  const registro = {
    fecha: new Date().toLocaleDateString(),
    hora: new Date().toLocaleTimeString(),

    inicial: data.caja.inicial,
    ventas: totalVentas(),
    retiros: totalRetiros(),
    depositos: totalDepositos(),

    total: totalFinal,
    numVentas: data.ventas.length
  };

  data.historial.push(registro);

  // reset
  data.ventas=[];
  data.retiros=[];
  data.depositos=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
  renderHistorial();
}

  data.ventas=[];
  data.retiros=[];
  data.depositos=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
  renderHistorial();
}

// RETIROS / DEPÓSITOS
function hacerRetiro(){
  const monto=Number(prompt("Monto"));
  if(monto<=0) return;
  data.retiros.push({monto});
  guardar(); render();
}

function hacerDeposito(){
  const monto=Number(prompt("Monto"));
  if(monto<=0) return;
  data.depositos.push({monto});
  guardar(); render();
}

// 👥 CLIENTES
function renderClientes(){
  const cont = document.getElementById("listaClientes");
  cont.innerHTML = "";

  data.clientes.forEach(c=>{
    cont.innerHTML += `
      <div class="card">
        <b>${c.nombre}</b><br>
        🚗 ${c.coche}<br>
        🕒 ${c.inicio}
      </div>
    `;
  });
}

// 📜 HISTORIAL
function renderHistorial(){
  const cont = document.getElementById("listaHistorial");
  cont.innerHTML = "";

  data.historial.slice().reverse().forEach(h=>{
    cont.innerHTML += `
      <div class="card">
        <b>📅 ${h.fecha}</b> - ${h.hora}<br><br>

        💵 Inicial: $${h.inicial}<br>
        🟢 Ventas: $${h.ventas} (${h.numVentas})<br>
        🔵 Depósitos: $${h.depositos}<br>
        🔴 Retiros: $${h.retiros}<br>

        <hr>

        <b>💰 Total: $${h.total}</b>
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
