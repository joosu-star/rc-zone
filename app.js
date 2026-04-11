// ================= DATOS =================
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

// ================= COCHES =================
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

// ================= PRECIOS =================
function precio(nombre){
  nombre = nombre.toLowerCase();
  if(nombre.includes("robot")) return data.precios.robot;
  if(nombre.includes("luchador")) return data.precios.luchador;
  return data.precios.normal;
}

// ================= INICIAR =================
let seleccionado=null;

function abrirModal(i){
  if(!data.caja.abierta) return alert("Abre caja");
  seleccionado=i;
  document.getElementById("modal").classList.add("activo");
}

function cerrarModal(){
  document.getElementById("modal").classList.remove("activo");
}

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

// ================= TICKET =================
function imprimirTicket(info){

  const numero=String(data.ticket).padStart(6,"0");
  data.ticket++;

  const area=document.getElementById("ticketArea");

  area.innerHTML=`
    <div id="ticket">
      <div class="center bold" style="font-size:16px;">RC ZONE 189</div>
      <div class="center">Entretención al máximo</div>

      <div class="center">Dirección:</div>
      <div class="center">Plaza Tangamanga Isla C115</div>
      <div class="center">San Luis Potosí</div>

      <br>

      <div class="center bold" style="font-size:18px;">
        TEL: 4442140002
      </div>

      <hr>

      Ticket: ${numero}<br>
      Cliente: ${info.nombre}<br>
      Coche: ${info.coche}<br>

      <hr>

      Inicio: ${info.inicio.toLocaleString()}<br>
      Fin: ${info.fin.toLocaleString()}<br>
      Tiempo: ${info.tiempo} min<br>

      <hr>

      <div class="bold">Subtotal: $${info.costo} MXN</div>

      <hr>

      <div class="center">¡Gracias por tu visita!</div>
    </div>
  `;

  guardar();

  area.style.display="block";
  window.print();

  setTimeout(()=>area.style.display="none",500);
}

// ================= RENDER =================
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

// ================= RESTO =================
function terminar(i){
  const c=data.coches[i];
  const total=Math.ceil(c.tiempoInicial/15)*precio(c.nombre);

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

function totalVentas(){ return data.ventas.reduce((a,v)=>a+v.total,0); }
function totalRetiros(){ return data.retiros.reduce((a,v)=>a+v.monto,0); }
function totalDepositos(){ return data.depositos.reduce((a,v)=>a+v.monto,0); }

function actualizarDinero(){
  const total=data.caja.inicial+totalVentas()+totalDepositos()-totalRetiros();
  document.getElementById("dinero").innerText="💰 $"+total;
}

function abrirCaja(){
  const m=Number(prompt("Monto inicial"));
  if(m<=0) return;
  data.caja={abierta:true,inicial:m};
  guardar(); render();
}

function cerrarCaja(){
  if(!confirm("¿Cerrar caja?")) return;

  data.ventas=[];
  data.retiros=[];
  data.depositos=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar(); render();
}

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

function editarPrecios(){
  const n=Number(prompt("Normal",data.precios.normal));
  const r=Number(prompt("Robot",data.precios.robot));
  const l=Number(prompt("Luchador",data.precios.luchador));

  if(n>0) data.precios.normal=n;
  if(r>0) data.precios.robot=r;
  if(l>0) data.precios.luchador=l;

  guardar();
}

function cambiarVista(v){
  document.querySelectorAll(".vista").forEach(x=>x.classList.remove("activo"));
  document.getElementById(v).classList.add("activo");
}

window.addEventListener("DOMContentLoaded",render);

Object.assign(window,{
  abrirModal, cerrarModal, confirmarInicio,
  terminar, cancelar,
  abrirCaja, cerrarCaja,
  hacerRetiro, hacerDeposito,
  editarPrecios, cambiarVista
});
