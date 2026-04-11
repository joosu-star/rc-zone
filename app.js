let data = JSON.parse(localStorage.getItem("rc_data")) || {};

function init(){
  data.coches = data.coches || [];
  data.caja = data.caja || { abierta:false, inicial:0 };
  data.ticket = data.ticket || 1;

  data.precios = data.precios || {
    normal:50,
    robot:40,
    luchador:40
  };
}
init();

if(data.coches.length === 0){
  data.coches = ["Drift 1","Drift 2"].map(n=>({
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

function precio(nombre){
  return data.precios.normal;
}

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
