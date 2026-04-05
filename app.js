import { db } from "./firebase.js";
import {
  collection, addDoc, onSnapshot, updateDoc, doc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ================= DATA
let coches = [];
let config = { caja:{abierta:false,inicial:0} };
let cocheSel = null;

// ================= PRECIOS
const precios = {
  coche:50,
  robot:50,
  luchador:40
};

// ================= CREAR COCHES
async function crearCoches(){
  const ref = collection(db,"coches");
  const snap = await getDocs(ref);
  if(!snap.empty) return;

  const crear=(n,t)=>({nombre:n,tipo:t,estado:"libre",tiempo:0,tiempoInicial:0,cliente:""});

  const lista=[
    crear("Drift 1","coche"),
    crear("Drift 2","coche"),
    ...Array.from({length:10},(_,i)=>crear("Futbol "+(i+1),"coche")),
    ...Array.from({length:6},(_,i)=>crear("Robot "+(i+1),"robot")),
    ...Array.from({length:10},(_,i)=>crear("Luchador "+(i+1),"luchador"))
  ];

  for(const c of lista) await addDoc(ref,c);
}

// ================= CONFIG (CAJA)
function escucharConfig(){
  onSnapshot(doc(db,"config","global"),(d)=>{
    if(d.exists()) config = d.data();
    actualizarDinero();
  });
}

// ================= COCHES REALTIME
function escucharCoches(){
  onSnapshot(collection(db,"coches"),snap=>{
    coches = snap.docs.map(d=>({id:d.id,...d.data()}));
    render();
  });
}

// ================= HISTORIAL
function escucharHistorial(){
  onSnapshot(collection(db,"historial"),snap=>{
    const cont=document.getElementById("historial");
    cont.innerHTML="<h2>Historial</h2>";

    snap.docs.forEach(d=>{
      const h=d.data();
      const div=document.createElement("div");
      div.className="card";
      div.innerText=`${h.fecha} | $${h.total}`;
      cont.appendChild(div);
    });
  });
}

// ================= PRECIO
function calcularPrecio(c){
  return Math.ceil(c.tiempoInicial/15)*(precios[c.tipo]||50);
}

// ================= RENDER
function render(){
  const cont=document.getElementById("coches");
  cont.innerHTML="";

  coches.forEach((c,i)=>{
    const div=document.createElement("div");

    let clase="libre";
    if(c.estado==="uso" && c.tiempo>5) clase="activo";
    if(c.tiempo<=5 && c.tiempo>0) clase="poco";

    div.className="coche "+clase;

    div.innerHTML=`
      <b>${c.nombre}</b><br>
      ${c.cliente||""}<br>
      ${c.tiempo>0?c.tiempo+" min":""}<br>
      ${
        c.estado==="uso"
        ? `<button onclick="terminar(${i})">✔</button>`
        : `<button onclick="abrirModal(${i})">▶</button>`
      }
    `;

    cont.appendChild(div);
  });
}

// ================= MODAL
function abrirModal(i){
  if(!config.caja.abierta) return alert("Caja cerrada");
  cocheSel=i;
  modal.classList.add("activo");
}
function cerrarModal(){ modal.classList.remove("activo"); }

// ================= INICIAR
async function confirmarInicio(){
  const nombre=nombreInput.value;
  const tiempo=Number(tiempoInput.value);
  if(!nombre||!tiempo) return;

  const c=coches[cocheSel];

  await updateDoc(doc(db,"coches",c.id),{
    estado:"uso",cliente:nombre,tiempo,tiempoInicial:tiempo
  });

  cerrarModal();
}

// ================= TERMINAR
async function terminar(i){
  const c=coches[i];
  const total=calcularPrecio(c);

  await addDoc(collection(db,"ventas"),{
    cliente:c.cliente,
    tipo:c.tipo,
    total,
    fecha:new Date().toISOString()
  });

  await updateDoc(doc(db,"coches",c.id),{
    estado:"libre",tiempo:0,cliente:""
  });

  actualizarDinero();
}

// ================= CAJA
async function abrirCaja(){
  const monto=Number(prompt("Monto inicial"));
  if(!monto) return;

  await updateDoc(doc(db,"config","global"),{
    caja:{abierta:true,inicial:monto}
  });
}

async function cerrarCaja(){
  const total=parseInt(dinero.innerText.replace(/\D/g,""));

  await addDoc(collection(db,"historial"),{
    fecha:new Date().toLocaleString(),
    total
  });

  await updateDoc(doc(db,"config","global"),{
    caja:{abierta:false,inicial:0}
  });
}

// ================= DINERO
function actualizarDinero(){
  dinero.innerText="💰 $"+config.caja.inicial;
}

// ================= TIMER
setInterval(()=>{
  coches.forEach(async c=>{
    if(c.estado==="uso"&&c.tiempo>0){
      await updateDoc(doc(db,"coches",c.id),{
        tiempo:c.tiempo-1
      });
    }
  });
},60000);

// ================= INIT
window.addEventListener("DOMContentLoaded",async()=>{
  await crearCoches();

  // crear config si no existe
  try{
    await updateDoc(doc(db,"config","global"),{
      caja:{abierta:false,inicial:0}
    });
  }catch{}

  escucharCoches();
  escucharConfig();
  escucharHistorial();
});

// ================= GLOBAL
window.abrirModal=abrirModal;
window.cerrarModal=cerrarModal;
window.confirmarInicio=confirmarInicio;
window.terminar=terminar;
window.abrirCaja=abrirCaja;
window.cerrarCaja=cerrarCaja;
