// --- VARIABLES DE MULTIJUGADOR (p5.party) ---
let miEstadoCompartido;
let listaJugadores;
let nombreUsuario;

// Cache para almacenar imágenes de otros jugadores según su URL
let cacheImagenes = {};
let cacheImagenesTintadas = {};

// --- BARRAS DE ESTADO Y MONEDAS ---
let hambre = 100;
let energia = 100;
let felicidad = 100;
let monedas = 0;

// Desgaste estilo Pou (por segundo)
const DESGASTE_HAMBRE_POR_SEG = 100 / (12 * 3600);   // ~12 Horas
const DESGASTE_ENERGIA_POR_SEG = 100 / (18 * 3600);  // ~18 Horas
const DESGASTE_FELICIDAD_POR_SEG = 100 / (24 * 3600); // ~24 Horas

// --- INVENTARIO DE COMIDA Y DECORACIONES ---
let inventarioComida = { manzana: 0, pizza: 0, pastel: 0 };
let decoracionEquipada = null; 
let decoracionesCompradas = [];
let colorTinte = null; // Guardará el color en formato [R, G, B] o null
let tintePrevisualizado = null; // Guardará temporalmente el tinte seleccionado en el menú

// Paleta de tintes disponibles
const PALETA_TINTES = [
  { nombre: "ROJO", color: [235, 76, 52] },
  { nombre: "NARANJO", color: [235, 186, 52] },
  { nombre: "AMARILLO", color: [235, 217, 52] },
  { nombre: "VERDE", color: [52, 235, 89] },
  { nombre: "CIAN", color: [52, 232, 235] },
  { nombre: "AZUL", color: [34, 35, 245] },
  { nombre: "MAGENTA", color: [128, 52, 235] },
  { nombre: "ROSA", color: [211, 52, 235] }
];

// --- ESTADOS DEL JUEGO ---
let estadoJuego = "PRINCIPAL"; 
let pestanaTienda = "COMIDA";

// --- TECLADO CUSTOMIZADO PARA CAMBIO DE NOMBRE ---
let mostrandoTecladoNombre = false;
let textoNuevoNombre = "";
let mayusculasTeclado = true;
let modoNumerosTeclado = false;

// --- GUARDERÍA Y DUELOS MULTIJUGADOR ---
let indiceGuarderia = 0;

// Variables de Control del Duelo 1v1
let idRivalDuelo = null;
let tipoDueloSeleccionado = "GALLETAS"; 
let temporizadorDuelo = 1800;
let puntajeRival = 0;
let rivalX = 200;
let rivalY = 200;
let finDelDuelo = false;
let mensajeResultadoDuelo = "";

// Multiplicador de aceleración para Atrapa Galletas
let aceleracionGalletas = 1.0;
let esHostDuelo = false;

// --- VARIABLES DE ALIMENTACIÓN INTERACTIVA ---
let comidaArrastrando = null;
let comidaX = 0, comidaY = 0;
let comiendoAnimacion = 0;

// --- VARIABLES DE MINIJUEGOS Y FÍSICAS ---
let jugadorX = 200, jugadorY = 200, jugadorVY = 0;
let climbCamY = 0;
let maxPlataformaAlcanzada = 0;

const GRAVEDAD_CLIMB = 1100;
const SALTO_CLIMB = -620;

let objetos = [];
let paredes = [];
let plataformas = [];
let estadoLuz = "APAGADA";
let temporizadorLuz = 0;
let advertenciaLuz = 0;
let puntajeMinijuego = 0;
let monedasGanadasMinijuego = 0;
let gameOverGalletas = false;
let gameOverNinja = false;
let gameOverClimb = false;

// --- CONFIGURACIÓN DE ALGEBRALIANS ---
const ALGEBRALIANS = [
  { nombre: "X", url: "164.webp" }, 
  { nombre: "Four", url: "164 (1).webp" }
];

let miAlgebralian = null;
let imagenPersonaje = null;

function guardarJuego() {
  try {
    let datos = {
      personaje: miAlgebralian,
      nombreUsuario: nombreUsuario,
      hambre: hambre,
      energia: energia,
      felicidad: felicidad,
      monedas: monedas,
      inventarioComida: inventarioComida,
      decoracionEquipada: decoracionEquipada,
      decoracionesCompradas: decoracionesCompradas,
      colorTinte: colorTinte,
      ultimoAcceso: Date.now()
    };
    localStorage.setItem("algebralian_guardado", JSON.stringify(datos));
  } catch (e) {
    console.log("Error al guardar en localStorage", e);
  }
}

// Helper global para evaluar colisión en recuadros (AABB)
function colisionCaja(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function obtenerImagenPersonaje(url) {
  if (!url) return imagenPersonaje;
  if (!cacheImagenes[url]) {
    cacheImagenes[url] = loadImage(url);
  }
  return cacheImagenes[url];
}

function obtenerImagenTintada(img, tinte, umbralNegro = 10, umbralBlanco = 245) {
  if (!img || !tinte) return img;

  let claveCache = img.canvas ? img.canvas.toDataURL() + "_" + tinte.join(",") : tinte.join(",");
  if (cacheImagenesTintadas[claveCache]) {
    return cacheImagenesTintadas[claveCache];
  }

  let imgProcesada = img.get();
  imgProcesada.loadPixels();

  let tr = tinte[0] / 255;
  let tg = tinte[1] / 255;
  let tb = tinte[2] / 255;

  for (let i = 0; i < imgProcesada.pixels.length; i += 4) {
    let r = imgProcesada.pixels[i];
    let g = imgProcesada.pixels[i + 1];
    let b = imgProcesada.pixels[i + 2];
    let a = imgProcesada.pixels[i + 3];

    if (a === 0) continue;

        // Un píxel se considera blanco si TODOS sus canales están muy cerca del blanco puro (255)
    let esBlancoPuro = (r >= umbralBlanco && g >= umbralBlanco && b >= umbralBlanco);
    let esNegroPuro = (r <= umbralNegro && g <= umbralNegro && b <= umbralNegro);

    // Modificar el color solo si no es negro ni blanco puro
    if (!esNegroPuro && !esBlancoPuro) {
      imgProcesada.pixels[i] = tr * 255;
      imgProcesada.pixels[i + 1] = tg * 255;
      imgProcesada.pixels[i + 2] = tb * 255;
    }
  }

  imgProcesada.updatePixels();
  cacheImagenesTintadas[claveCache] = imgProcesada;
  return imgProcesada;
}

function preload() {
  nombreUsuario = "JUGADOR_" + floor(random(100, 999));
  try {
    let guardado = localStorage.getItem("algebralian_guardado");
    if (guardado) {
      let datos = JSON.parse(guardado);
      miAlgebralian = datos.personaje;
      if (datos.nombreUsuario) nombreUsuario = datos.nombreUsuario;
      if (datos.hambre !== undefined) hambre = datos.hambre;
      if (datos.energia !== undefined) energia = datos.energia;
      if (datos.felicidad !== undefined) felicidad = datos.felicidad;
      if (datos.monedas !== undefined) monedas = datos.monedas;
      if (datos.inventarioComida !== undefined) inventarioComida = datos.inventarioComida;
      if (datos.decoracionEquipada !== undefined) decoracionEquipada = datos.decoracionEquipada;
      if (datos.decoracionesCompradas !== undefined) decoracionesCompradas = datos.decoracionesCompradas;
      if (datos.colorTinte !== undefined) colorTinte = datos.colorTinte;

      if (datos.ultimoAcceso) {
        let segundosTranscurridos = (Date.now() - datos.ultimoAcceso) / 1000;
        hambre = max(10, hambre - (segundosTranscurridos * DESGASTE_HAMBRE_POR_SEG));
        energia = max(10, energia - (segundosTranscurridos * DESGASTE_ENERGIA_POR_SEG));
        felicidad = max(10, felicidad - (segundosTranscurridos * DESGASTE_FELICIDAD_POR_SEG));
      }
    }
  } catch (e) {
    console.log("Error al leer localStorage", e);
  }

  if (!miAlgebralian || !miAlgebralian.nombre) {
    miAlgebralian = ALGEBRALIANS[floor(random(ALGEBRALIANS.length))];
  } else {
    let encontrado = ALGEBRALIANS.find(a => a.nombre === miAlgebralian.nombre);
    if (encontrado) miAlgebralian.url = encontrado.url;
  }

  guardarJuego();
  imagenPersonaje = loadImage(miAlgebralian.url);
  
  partyConnect("wss://demoserver.p5party.org", "algebralian_pou_duelos_v8");
  
  miEstadoCompartido = partyLoadMyShared({
    idJugador: floor(random(1000, 9999)),
    nombreUsuario: nombreUsuario,
    nombre: miAlgebralian.nombre,
    url: miAlgebralian.url,
    decoracion: null,
    tinte: null,
    estado: "Feliz",
    retoRecibido: null,
    estadoDuelo: "LIBRE",
    posXDuelo: 200,
    posYDuelo: 200,
    puntajeDuelo: 0,
    objetosRed: [],     
    paredesRed: [],     
    plataformasRed: [], 
    luzRed: "APAGADA"   
  });
  listaJugadores = partyLoadGuestShareds();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  imageMode(CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  listaJugadores = partyLoadGuestShareds();
  let dt = deltaTime / 1000; 
  if (isNaN(dt) || dt > 0.1) dt = 0.016;

  if (!miAlgebralian || !miAlgebralian.nombre) {
    background(20);
    fill(255);
    textSize(16);
    text("Cargando Algebralian...", width / 2, height / 2);
    return;
  }

  if (miEstadoCompartido) {
    miEstadoCompartido.nombreUsuario = nombreUsuario;
    miEstadoCompartido.nombre = miAlgebralian.nombre;
    miEstadoCompartido.url = miAlgebralian.url;
    miEstadoCompartido.decoracion = decoracionEquipada;
    miEstadoCompartido.tinte = colorTinte;
    miEstadoCompartido.estado = hambre < 30 ? "Hambriento" : (energia < 30 ? "Con Sueño" : "Muy Feliz");
  }

  // Desgaste escalado por Delta Time
  hambre = max(0, hambre - (DESGASTE_HAMBRE_POR_SEG * dt * 60));
  energia = max(0, energia - (DESGASTE_ENERGIA_POR_SEG * dt * 60));
  felicidad = max(0, felicidad - (DESGASTE_FELICIDAD_POR_SEG * dt * 60));
  
  if (frameCount % 60 === 0) guardarJuego();

  if (estadoJuego === "ESPERANDO_RESPUESTA_DUELO") {
    let rivalData = listaJugadores.find(p => p.idJugador === idRivalDuelo);
    if (!rivalData) {
      background(30, 20, 45);
      fill(255, 100, 100);
      textSize(min(width, height) * 0.035);
      text("El rival se ha desconectado.", width / 2, height * 0.4);
      dibujarBotonSatisfactorio(width * 0.35, height * 0.6, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
      return;
    }
    if (rivalData.estadoDuelo === "EN_DUELO") {
      iniciarDuelo(idRivalDuelo, tipoDueloSeleccionado);
    } else {
      background(30, 20, 45);
      fill(255, 220, 80);
      textSize(min(width, height) * 0.04);
      textStyle(BOLD);
      text("⏳ Esperando respuesta del rival...", width / 2, height * 0.4);
      textSize(min(width, height) * 0.025);
      fill(200);
      text("Minijuego elegido: " + tipoDueloSeleccionado, width / 2, height * 0.48);
      dibujarBotonSatisfactorio(width * 0.35, height * 0.65, width * 0.3, height * 0.08, "Cancelar", color(240, 90, 90), color(190, 60, 60));
      return;
    }
  }

  switch (estadoJuego) {
    case "PRINCIPAL": dibujarPantallaPrincipal(); break;
    case "MENU_MINIJUEGOS": dibujarMenuMinijuegos(); break;
    case "MINIJUEGO_GALLETAS": ejecutarMinijuegoGalletas(dt); break;
    case "MINIJUEGO_NINJA": ejecutarMinijuegoNinja(dt); break;
    case "MINIJUEGO_CLIMB": ejecutarMinijuegoClimb(dt); break;
    case "TIENDA": dibujarTienda(); break;
    case "MENU_TINTES": dibujarMenuSeleccionTintes(); break;
    case "GUARDERIA": dibujarGuarderiaOnline(); break;
    case "MENU_SELECCION_RETOS": dibujarMenuSeleccionRetos(); break;
    case "SALA_DUELO": ejecutarSalaDuelo1v1(dt); break;
  }

  dibujarVentanaRetoEntrante();

  if (mostrandoTecladoNombre) {
    dibujarTecladoCustomizado();
  }
}

function dibujarVentanaRetoEntrante() {
  if (miEstadoCompartido && miEstadoCompartido.retoRecibido && estadoJuego !== "SALA_DUELO" && estadoJuego !== "ESPERANDO_RESPUESTA_DUELO") {
    push();
    fill(0, 180);
    rect(0, 0, width, height);

    stroke(255, 200, 60);
    strokeWeight(3);
    fill(35, 40, 60);
    rect(width * 0.15, height * 0.3, width * 0.7, height * 0.4, 20);

    noStroke();
    fill(255);
    textSize(min(width, height) * 0.04);
    textStyle(BOLD);
    text("⚔ ¡DESAFÍO DE DUELO! ⚔️", width / 2, height * 0.38);

    textSize(min(width, height) * 0.026);
    fill(220, 230, 245);
    let infoReto = miEstadoCompartido.retoRecibido;
    text(infoReto.deNombre + " te ha retado a:\n" + (infoReto.tipoMinijuego || "GALLETAS"), width / 2, height * 0.47);

    dibujarBotonSatisfactorio(width * 0.22, height * 0.58, width * 0.26, height * 0.08, "ACEPTAR", color(100, 210, 120), color(60, 160, 80));
    dibujarBotonSatisfactorio(width * 0.52, height * 0.58, width * 0.26, height * 0.08, "RECHAZAR", color(240, 90, 90), color(190, 60, 60));
    pop();
  }
}

function dibujarMenuSeleccionRetos() {
  background(24, 28, 42);

  fill(230, 235, 245);
  noStroke();
  textSize(min(width, height) * 0.04);
  textStyle(BOLD);
  text("⚔ Elige el Reto de Duelo", width / 2, height * 0.09);

  let cardW = width * 0.72;
  let cardH = height * 0.19;

  dibujarTarjetaMinijuego(width * 0.14, height * 0.16, cardW, cardH, "🍪 Duelo Pong Galletas", "Pásate la galleta estilo Pong con tu rival.", color(45, 40, 55), color(230, 150, 80));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.37, cardW, cardH, "🥷 Escape Ninja 2D", "Duelo 1v1: Cúbrete en las paredes sincronizadas.", color(35, 45, 65), color(90, 150, 220));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.58, cardW, cardH, "🧗 Algebralian Climb", "Duelo 1v1: Sube 25 plataformas lo más rápido posible.", color(30, 55, 45), color(90, 210, 140));

  dibujarBotonSatisfactorio(width * 0.35, height * 0.82, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
}

function enviarDesafioDuelo(idRival, tipoMinijuego) {
  idRivalDuelo = idRival;
  tipoDueloSeleccionado = tipoMinijuego;
  estadoJuego = "ESPERANDO_RESPUESTA_DUELO";
  miEstadoCompartido.estadoDuelo = "ESPERANDO";

  let objetivo = listaJugadores.find(p => p.idJugador === idRivalDuelo);
  if (objetivo) {
    objetivo.retoRecibido = {
      deId: miEstadoCompartido.idJugador,
      deNombre: nombreUsuario,
      tipoMinijuego: tipoDueloSeleccionado
    };
  }
}

function iniciarDuelo(idRival, tipoMinijuego) {
  idRivalDuelo = idRival;
  tipoDueloSeleccionado = tipoMinijuego;
  estadoJuego = "SALA_DUELO";
  miEstadoCompartido.estadoDuelo = "EN_DUELO";
  miEstadoCompartido.puntajeDuelo = 0;
  miEstadoCompartido.objetosRed = [];
  miEstadoCompartido.paredesRed = [];
  miEstadoCompartido.plataformasRed = [];
  miEstadoCompartido.luzRed = "APAGADA";
  aceleracionGalletas = 1.0;

  esHostDuelo = miEstadoCompartido.idJugador < idRivalDuelo;

  if (esHostDuelo) {
    if (tipoDueloSeleccionado === "GALLETAS") {
      miEstadoCompartido.objetosRed = [{
        id: random(100000),
        x: width / 2,
        y: height * 0.2,
        vx: random(-150, 150),
        vy: 250,
        ultimoGolpe: null
      }];
    } else if (tipoDueloSeleccionado === "NINJA") {
      miEstadoCompartido.paredesRed = [
        { x: width * 0.3, y: height * 0.4, targetX: width * 0.3, targetY: height * 0.4, w: width * 0.18, h: height * 0.18, tiempoCambio: 0 },
        { x: width * 0.7, y: height * 0.7, targetX: width * 0.7, targetY: height * 0.7, w: width * 0.18, h: height * 0.18, tiempoCambio: 0 }
      ];
      miEstadoCompartido.luzRed = "APAGADA";
      temporizadorLuz = millis() + random(4000, 7000);
    } else if (tipoDueloSeleccionado === "CLIMB") {
      let listaPlats = [{ index: 0, x: width / 2, y: 0, w: width * 0.35, h: 18 }];
      for (let i = 1; i <= 25; i++) {
        listaPlats.push({
          index: i,
          x: random(width * 0.2, width * 0.8),
          y: -i * 125,
          w: width * 0.22,
          h: 18
        });
      }
      miEstadoCompartido.plataformasRed = listaPlats;
    }
  }

  objetos = [];
  puntajeMinijuego = 0;
  maxPlataformaAlcanzada = 0;
  jugadorVY = SALTO_CLIMB;
  climbCamY = 0;
  temporizadorDuelo = 1800; 
  finDelDuelo = false;
  mensajeResultadoDuelo = "";
  jugadorX = width / 2;
  jugadorY = tipoDueloSeleccionado === "CLIMB" ? -20 : height * 0.82;
}

function ejecutarSalaDuelo1v1(dt) {
  let rivalData = listaJugadores.find(p => p.idJugador === idRivalDuelo);

  if (!rivalData) {
    background(30, 20, 45);
    fill(255, 100, 100);
    textSize(min(width, height) * 0.04);
    text("El rival se ha desconectado...", width / 2, height * 0.4);
    dibujarBotonSatisfactorio(width * 0.35, height * 0.6, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
    return;
  }

  let imgRival = obtenerImagenPersonaje(rivalData.url);
  let hostData = esHostDuelo ? miEstadoCompartido : rivalData;
  let luzActual = hostData.luzRed || "APAGADA";

  if (tipoDueloSeleccionado === "NINJA") {
    if (luzActual === "APAGADA") background(18, 22, 32);
    else if (luzActual === "ADVERTENCIA") background(180, 130, 40);
    else if (luzActual === "ENCENDIDA") background(240, 230, 180);
  } else if (tipoDueloSeleccionado === "CLIMB") {
    background(25, 35, 55);
  } else {
    background(30, 20, 45);
  }

  if (tipoDueloSeleccionado === "GALLETAS") {
    // Jugador Local: Abajo | Jugador Rival: Arriba
    jugadorX = constrain(mouseX, 40, width - 40);
    jugadorY = height * 0.82;
    rivalX = rivalData.posXDuelo || width / 2;
    rivalY = height * 0.15;
  } else if (tipoDueloSeleccionado === "NINJA") {
    let tamJ = min(width, height) * 0.13;
    jugadorX = constrain(mouseX, tamJ / 2, width - tamJ / 2);
    jugadorY = constrain(mouseY, height * 0.15, height - tamJ / 2);
    rivalX = rivalData.posXDuelo || width / 2;
    rivalY = rivalData.posYDuelo || 0;
  } else if (tipoDueloSeleccionado === "CLIMB") {
    jugadorX = constrain(mouseX, 30, width - 30);
    jugadorVY += GRAVEDAD_CLIMB * dt;
    jugadorY += jugadorVY * dt;

    let targetCamY = min(climbCamY, jugadorY);
    climbCamY = lerp(climbCamY, targetCamY, 0.1);

    rivalX = rivalData.posXDuelo || width / 2;
    rivalY = rivalData.posYDuelo || 0;
  }

  puntajeRival = rivalData.puntajeDuelo || 0;

  miEstadoCompartido.posXDuelo = jugadorX;
  miEstadoCompartido.posYDuelo = jugadorY;
  miEstadoCompartido.puntajeDuelo = tipoDueloSeleccionado === "CLIMB" ? maxPlataformaAlcanzada : puntajeMinijuego;

  if (finDelDuelo) {
    fill(255, 220, 80);
    textSize(min(width, height) * 0.05);
    textStyle(BOLD);
    text(mensajeResultadoDuelo, width / 2, height * 0.35);

    fill(230);
    textSize(min(width, height) * 0.03);
    let etiquetaP = tipoDueloSeleccionado === "CLIMB" ? "Plataformas" : "Puntos";
    text("Tu Progreso: " + floor(miEstadoCompartido.puntajeDuelo) + " " + etiquetaP + " vs Rival: " + floor(puntajeRival), width / 2, height * 0.48);

    dibujarBotonSatisfactorio(width * 0.35, height * 0.68, width * 0.3, height * 0.08, "Salir al Menú", color(100, 210, 120), color(60, 160, 80));
    return;
  }

  temporizadorDuelo -= (60 * dt);
  if (temporizadorDuelo <= 0) {
    finDelDuelo = true;
    let miPunt = miEstadoCompartido.puntajeDuelo;
    if (miPunt > puntajeRival) {
      mensajeResultadoDuelo = "🏆 ¡VICTORIA! GANASTE EL DUELO 🏆";
      monedas += 30;
      felicidad = min(100, felicidad + 20);
    } else if (miPunt < puntajeRival) {
      mensajeResultadoDuelo = "💔 DERROTA... EL RIVAL GANÓ";
    } else {
      mensajeResultadoDuelo = "🤝 ¡EMPATE!";
      monedas += 10;
    }
    guardarJuego();
  }

  // --- LÓGICA DE DUELO EN RED SEGÚN EL ROL ---
  if (esHostDuelo) {
    let tiempoActual = millis();

    if (tipoDueloSeleccionado === "GALLETAS") {
      aceleracionGalletas += 0.03 * dt;
      let galletasRed = miEstadoCompartido.objetosRed || [];

      if (galletasRed.length === 0) {
        miEstadoCompartido.objetosRed.push({
          id: random(100000),
          x: width / 2,
          y: height * 0.3,
          vx: random(-150, 150),
          vy: 250,
          ultimoGolpe: null
        });
      }

      for (let i = galletasRed.length - 1; i >= 0; i--) {
        let g = galletasRed[i];
        g.x += g.vx * dt * aceleracionGalletas;
        g.y += g.vy * dt * aceleracionGalletas;

        if (g.x < 30 || g.x > width - 30) {
          g.vx *= -1;
          g.x = constrain(g.x, 30, width - 30);
        }

        let tamJ = min(width, height) * 0.12;

        if (g.vy > 0 && dist(g.x, g.y, jugadorX, jugadorY) < tamJ * 0.7) {
          g.vy = -abs(g.vy) - 20;
          g.vx = (g.x - jugadorX) * 4;
          g.ultimoGolpe = miEstadoCompartido.idJugador;
          puntajeMinijuego += 10;
        }

        if (g.vy < 0 && dist(g.x, g.y, rivalX, rivalY) < tamJ * 0.7) {
          g.vy = abs(g.vy) + 20;
          g.vx = (g.x - rivalX) * 4;
          g.ultimoGolpe = rivalData.idJugador;
        }

        if (g.y > height + 40 || g.y < -40) {
          miEstadoCompartido.objetosRed.splice(i, 1);
        }
      }
    } else if (tipoDueloSeleccionado === "NINJA") {
      if (miEstadoCompartido.luzRed === "APAGADA" && tiempoActual > temporizadorLuz) {
        miEstadoCompartido.luzRed = "ADVERTENCIA";
        advertenciaLuz = tiempoActual + 1500;
      } else if (miEstadoCompartido.luzRed === "ADVERTENCIA" && tiempoActual > advertenciaLuz) {
        miEstadoCompartido.luzRed = "ENCENDIDA";
        temporizadorLuz = tiempoActual + 3000;
      } else if (miEstadoCompartido.luzRed === "ENCENDIDA" && tiempoActual > temporizadorLuz) {
        miEstadoCompartido.luzRed = "APAGADA";
        temporizadorLuz = tiempoActual + random(5000, 9000);
      }

      for (let p of miEstadoCompartido.paredesRed) {
        if (frameCount > p.tiempoCambio) {
          p.targetX = random(width * 0.15, width * 0.85);
          p.targetY = random(height * 0.25, height * 0.8);
          p.tiempoCambio = frameCount + floor(random(180, 300));
        }
        p.x = lerp(p.x, p.targetX, 2.5 * dt);
        p.y = lerp(p.y, p.targetY, 2.5 * dt);
      }

      if (frameCount % 45 === 0) {
        miEstadoCompartido.objetosRed.push({ id: random(100000), x: random(width * 0.1, width * 0.9), y: random(height * 0.2, height * 0.85), vida: 160 });
      }
    }
  }

  // --- RENDERIZADO DEL DUELO CLIMB ---
  if (tipoDueloSeleccionado === "CLIMB") {
    let platsRed = hostData.plataformasRed || [];
    let tamJ = min(width, height) * 0.12;

    for (let plat of platsRed) {
      let screenY = plat.y - climbCamY + height * 0.65;

      noStroke();
      fill(80, 180, 100);
      rect(plat.x - plat.w / 2, screenY, plat.w, plat.h, 8);
      fill(255, 220, 100);
      textSize(12);
      text("#" + plat.index, plat.x, screenY + 9);

      if (jugadorVY > 0) {
        let pieY = jugadorY + tamJ / 2;
        let pieViejo = (jugadorY - jugadorVY * dt) + tamJ / 2;
        if (jugadorX >= plat.x - plat.w / 2 - 10 && jugadorX <= plat.x + plat.w / 2 + 10) {
          if (pieViejo <= plat.y + 8 && pieY >= plat.y - 8) {
            jugadorVY = SALTO_CLIMB;
            jugadorY = plat.y - tamJ / 2;
            maxPlataformaAlcanzada = max(maxPlataformaAlcanzada, plat.index);

            if (maxPlataformaAlcanzada >= 25) {
              finDelDuelo = true;
              mensajeResultadoDuelo = "🏆 ¡LLEGASTE A LA PLATAFORMA 25 PRIMERO! 🏆";
              monedas += 40;
              guardarJuego();
            }
          }
        }
      }
    }

    if (jugadorY > climbCamY + height * 0.5) {
      jugadorY = -maxPlataformaAlcanzada * 125 - 20;
      jugadorVY = SALTO_CLIMB;
    }

    let rivalScreenY = rivalY - climbCamY + height * 0.65;
    let tamR = min(width, height) * 0.13;
    push();
    let imgRivalTintada = obtenerImagenTintada(imgRival, rivalData.tinte);
    image(imgRivalTintada, rivalX, rivalScreenY, tamR, tamR);
    noTint();
    fill(255, 120, 120);
    textSize(13);
    text((rivalData.nombreUsuario || rivalData.nombre) + " (#" + (rivalData.puntajeDuelo || 0) + ")", rivalX, rivalScreenY - tamJ * 0.6);
    pop();

    let miScreenY = jugadorY - climbCamY + height * 0.65;
    if (imagenPersonaje) {
      push();
      let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
      image(imgFinal, jugadorX, miScreenY, tamJ, tamJ);
      pop();
    }

  } else if (tipoDueloSeleccionado === "GALLETAS") {
    let objetosFuenteRed = hostData.objetosRed || [];
    let tamR = min(width, height) * 0.13;

    for (let obj of objetosFuenteRed) {
      let renderX = obj.x;
      let renderY = obj.y;

      push();
      if (!esHostDuelo) {
        renderY = height - obj.y;
        translate(renderX, renderY);
        scale(1, -1);
      } else {
        translate(renderX, renderY);
      }

      textSize(min(width, height) * 0.05);
      text("🍪", 0, 0);
      pop();

      let vyEfectiva = esHostDuelo ? obj.vy : -obj.vy;
      let posYCliente = esHostDuelo ? obj.y : (height - obj.y);

      if (!esHostDuelo && vyEfectiva > 0 && dist(obj.x, posYCliente, jugadorX, jugadorY) < tamR * 0.7) {
        obj.vy = abs(obj.vy) + 20;
        obj.vx = (obj.x - jugadorX) * 4;
        puntajeMinijuego += 10;
      }
    }

    push();
    let imgRivalTintada = obtenerImagenTintada(imgRival, rivalData.tinte);
    if (imgRivalTintada) image(imgRivalTintada, rivalX, rivalY, tamR, tamR);
    fill(255, 120, 120);
    textSize(14);
    text(rivalData.nombreUsuario || rivalData.nombre, rivalX, rivalY + tamR * 0.7);
    pop();

    if (imagenPersonaje) {
      push();
      let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
      image(imgFinal, jugadorX, jugadorY, tamR, tamR);
      pop();
    }
  } else if (tipoDueloSeleccionado === "NINJA") {
    let paredesFuenteRed = hostData.paredesRed || [];
    let objetosFuenteRed = hostData.objetosRed || [];
    let aSalvoLocal = false;

    for (let p of paredesFuenteRed) {
      noStroke();
      fill(0, 50);
      rect(p.x - p.w / 2 + 4, p.y - p.h / 2 + 4, p.w, p.h, 14);
      stroke(60, 35, 15);
      strokeWeight(2.5);
      fill(100, 60, 30);
      rect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 14);
      noStroke();
      textSize(min(width, height) * 0.04);
      text("🪵", p.x, p.y);

      if (abs(jugadorX - p.x) < p.w / 2 && abs(jugadorY - p.y) < p.h / 2) aSalvoLocal = true;
    }

    for (let i = objetosFuenteRed.length - 1; i >= 0; i--) {
      let obj = objetosFuenteRed[i];
      if (esHostDuelo) obj.vida -= (60 * dt);

      textSize(min(width, height) * 0.05);
      text("⭐", obj.x, obj.y);

      if (dist(obj.x, obj.y, jugadorX, jugadorY) < min(width, height) * 0.08) {
        puntajeMinijuego += 15;
        if (esHostDuelo) miEstadoCompartido.objetosRed.splice(i, 1);
        continue;
      }
      if (obj.vida <= 0 && esHostDuelo) miEstadoCompartido.objetosRed.splice(i, 1);
    }

    if (luzActual === "APAGADA") puntajeMinijuego += (6 * dt);
    else if (luzActual === "ENCENDIDA" && !aSalvoLocal) puntajeMinijuego = max(0, puntajeMinijuego - (25 * dt));

    push();
    let tamR = min(width, height) * 0.15;
    let imgRivalTintada = obtenerImagenTintada(imgRival, rivalData.tinte);
    if (imgRivalTintada) image(imgRivalTintada, rivalX, rivalY, tamR, tamR);
    fill(255, 120, 120);
    textSize(14);
    text(rivalData.nombreUsuario || rivalData.nombre, rivalX, rivalY - tamR * 0.6);
    pop();

    if (imagenPersonaje) {
      let tamM = min(width, height) * 0.15;
      push();
      let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
      image(imgFinal, jugadorX, jugadorY, tamM, tamM);
      pop();
    }
  }

  fill(255);
  noStroke();
  textSize(min(width, height) * 0.03);
  textStyle(BOLD);
  let unidad = tipoDueloSeleccionado === "CLIMB" ? " / 25" : " pts";
  text("Tú: " + floor(miEstadoCompartido.puntajeDuelo) + unidad, width * 0.22, height * 0.08);
  text("Rival: " + floor(puntajeRival) + unidad, width * 0.78, height * 0.08);

  fill(255, 200, 60);
  textSize(min(width, height) * 0.04);
  text("⏳ " + max(0, ceil(temporizadorDuelo / 60)) + "s", width / 2, height * 0.08);
}

function dibujarPantallaPrincipal() {
  background(28, 32, 48);
  dibujarHUD();

  let posX = width / 2;
  let posY = height * 0.50;

  if (imagenPersonaje) {
    let jitter = (hambre < 30 || energia < 30 || felicidad < 30) ? random(-2, 2) : 0;
    let escalaEfecto = (comiendoAnimacion > 0) ? 1.15 : 1.0;
    let tam = min(width, height) * 0.35;
    
    if (comiendoAnimacion > 0) comiendoAnimacion--;

    push();
    translate(posX + jitter, posY);
    scale(escalaEfecto);
    noStroke();
    fill(0, 80);
    ellipse(0, tam * 0.45, tam * 0.7, tam * 0.15);

    // Aplicar tinte especial si está equipado
    let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
    image(imgFinal, 0, 0, tam, tam);

    if (decoracionEquipada === "GORRO") {
      textSize(tam * 0.38);
      text("🧢", 0, -tam * 0.38);
    } else if (decoracionEquipada === "SOMBRERO") {
      textSize(tam * 0.4);
      text("🎩", 0, -tam * 0.42);
    } else if (decoracionEquipada === "CORONA") {
      textSize(tam * 0.4);
      text("👑", 0, -tam * 0.42);
    }
    pop();
  }

  if (comidaArrastrando) {
    comidaX = mouseX;
    comidaY = mouseY;
    textSize(45);
    let emoji = comidaArrastrando === "manzana" ? "🍎" : (comidaArrastrando === "pizza" ? "🍕" : "🎂");
    text(emoji, comidaX, comidaY);

    if (dist(comidaX, comidaY, posX, posY) < min(width, height) * 0.15) {
      if (comidaArrastrando === "manzana") hambre = min(100, hambre + 25);
      else if (comidaArrastrando === "pizza") hambre = min(100, hambre + 50);
      else if (comidaArrastrando === "pastel") {
        hambre = min(100, hambre + 80);
        felicidad = min(100, felicidad + 10);
      }

      inventarioComida[comidaArrastrando]--;
      comidaArrastrando = null;
      comiendoAnimacion = 15;
      guardarJuego();
    }
  }

  dibujarBotones();
}

function dibujarHUD() {
  fill(230, 235, 245);
  noStroke();
  textSize(min(width, height) * 0.04);
  textStyle(BOLD);
  text(miAlgebralian.nombre, width / 2, height * 0.05);

  textSize(min(width, height) * 0.022);
  dibujarPill(width * 0.22, height * 0.09, "🪙 " + monedas, color(45, 40, 30), color(255, 200, 60));
  
  let totalComida = inventarioComida.manzana + inventarioComida.pizza + inventarioComida.pastel;
  dibujarPill(width * 0.78, height * 0.09, "🍱 " + totalComida, color(45, 30, 35), color(255, 100, 100));

  let anchoBarra = width * 0.24;
  let yBarras = height * 0.15;

  dibujarBarraEstilizada("Comida", hambre, width * 0.08, yBarras, anchoBarra, color(255, 140, 60));
  dibujarBarraEstilizada("Sueño", energia, width * 0.38, yBarras, anchoBarra, color(80, 160, 240));
  dibujarBarraEstilizada("Juego", felicidad, width * 0.68, yBarras, anchoBarra, color(240, 90, 160));
}

function dibujarPill(x, y, texto, colorFondo, colorTexto) {
  push();
  stroke(colorTexto);
  strokeWeight(1.5);
  fill(colorFondo);
  rectMode(CENTER);
  rect(x, y, width * 0.2, height * 0.04, 20);
  fill(colorTexto);
  noStroke();
  textStyle(BOLD);
  text(texto, x, y);
  pop();
}

function dibujarBarraEstilizada(etiqueta, valor, x, y, ancho, col) {
  push();
  textAlign(LEFT, CENTER);
  noStroke();
  fill(180, 190, 210);
  textSize(min(width, height) * 0.02);
  textStyle(BOLD);
  text(etiqueta, x, y);

  fill(40, 48, 68);
  rect(x, y + 12, ancho, 14, 8);

  fill(col);
  rect(x, y + 12, map(valor, 0, 100, 0, ancho), 14, 8);
  pop();
}

function dibujarBotones() {
  let btnW = width * 0.17;
  let btnH = height * 0.08;
  let btnY = height * 0.88;

  dibujarBotonSatisfactorio(width * 0.02, btnY, btnW, btnH, "🍱 Comer", color(255, 160, 60), color(200, 110, 30));
  dibujarBotonSatisfactorio(width * 0.21, btnY, btnW, btnH, "💤 Dormir", color(80, 160, 240), color(50, 120, 190));
  dibujarBotonSatisfactorio(width * 0.40, btnY, btnW, btnH, "🎮 Jugar", color(240, 90, 160), color(180, 50, 120));
  dibujarBotonSatisfactorio(width * 0.59, btnY, btnW, btnH, "🏪 Tienda", color(255, 200, 60), color(200, 150, 20));
  dibujarBotonSatisfactorio(width * 0.78, btnY, btnW, btnH, "🏢 Guardería", color(160, 100, 240), color(110, 60, 180));
}

function dibujarBotonSatisfactorio(x, y, w, h, etiqueta, col, colSombra) {
  push();
  let hover = colisionCaja(x, y, w, h);
  let presionado = hover && mouseIsPressed;
  let scaleFactor = presionado ? 0.95 : (hover ? 1.04 : 1.0);

  translate(x + w / 2, y + h / 2);
  scale(scaleFactor);

  noStroke();
  fill(colSombra);
  rect(-w / 2, -h / 2 + 4, w, h, 14);

  fill(hover ? lerpColor(col, color(255), 0.15) : col);
  rect(-w / 2, -h / 2, w, h, 14);

  fill(255);
  textSize(min(width, height) * 0.022);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(etiqueta, 0, 0);
  pop();
}

function dibujarMenuMinijuegos() {
  background(24, 28, 42);
  fill(230, 235, 245);
  noStroke();
  textSize(min(width, height) * 0.045);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("🎮 Selecciona un Minijuego", width / 2, height * 0.09);

  let cardW = width * 0.72;
  let cardH = height * 0.19;

  dibujarTarjetaMinijuego(width * 0.14, height * 0.16, cardW, cardH, "🍪 Atrapa Galletas", "Atrapa galletas aceleradas y evita bombas.", color(45, 40, 55), color(230, 150, 80));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.37, cardW, cardH, "🥷 Escape Ninja 2D", "Cúbrete tras las paredes móviles.", color(35, 45, 65), color(90, 150, 220));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.58, cardW, cardH, "🧗 Algebralian Climb", "Sube rebotando por plataformas infinitas. ¡Haz clic para un supersalto!", color(30, 55, 45), color(90, 210, 140));

  dibujarBotonSatisfactorio(width * 0.35, height * 0.82, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
}

function dibujarTarjetaMinijuego(x, y, w, h, titulo, desc, colFondo, colBorde) {
  push();
  let hover = colisionCaja(x, y, w, h);
  let scaleFactor = hover ? 1.02 : 1.0;

  translate(x + w / 2, y + h / 2);
  scale(scaleFactor);

  stroke(colBorde);
  strokeWeight(2.5);
  fill(hover ? lerpColor(colFondo, color(255), 0.1) : colFondo);
  rect(-w / 2, -h / 2, w, h, 20);

  noStroke();
  textAlign(CENTER, CENTER);

  fill(230, 235, 245);
  textSize(min(width, height) * 0.032);
  textStyle(BOLD);
  text(titulo, 0, -h * 0.22);

  fill(160, 170, 190);
  textSize(min(width, height) * 0.020);
  textWrap(WORD);
  rectMode(CENTER);
  text(desc, 0, h * 0.18, w * 0.88, h * 0.5);
  pop();
}

function iniciarMinijuegoGalletas() {
  estadoJuego = "MINIJUEGO_GALLETAS";
  objetos = [];
  puntajeMinijuego = 0;
  monedasGanadasMinijuego = 0;
  jugadorX = width / 2;
  jugadorY = height * 0.82; // Fijo abajo en modo normal
  comidaArrastrando = null;
  gameOverGalletas = false;
  aceleracionGalletas = 1.0;
}

function ejecutarMinijuegoGalletas(dt) {
  if (gameOverGalletas) {
    background(25, 15, 20);
    fill(240, 70, 70);
    textSize(min(width, height) * 0.06);
    textStyle(BOLD);
    text("💥 ¡BOOM! GAME OVER 💥", width / 2, height * 0.3);

    fill(230);
    textSize(min(width, height) * 0.03);
    text("¡Atrapaste una bomba!", width / 2, height * 0.4);
    text("Puntos conseguidos: " + puntajeMinijuego, width / 2, height * 0.5);
    text("Monedas recolectadas: 🪙 " + monedasGanadasMinijuego, width / 2, height * 0.56);

    dibujarBotonSatisfactorio(width * 0.35, height * 0.72, width * 0.3, height * 0.08, "Aceptar", color(240, 90, 90), color(190, 60, 60));
    return;
  }

  background(35, 30, 45);
  jugadorX = constrain(mouseX, 40, width - 40);
  jugadorY = height * 0.82; // Posición fija abajo en modo 1 solo jugador

  aceleracionGalletas += 0.02 * dt;

  if (frameCount % 10 === 0) {
    let azar = random(1);
    let tipoObjeto = "GALLETA";
    if (azar < 0.25) tipoObjeto = "BOMBA";
    else if (azar < 0.55) tipoObjeto = "MONEDA";

    objetos.push({ x: random(20, width - 20), y: -20, vy: random(180, 320) * aceleracionGalletas, tipo: tipoObjeto });
  }

  for (let i = objetos.length - 1; i >= 0; i--) {
    let obj = objetos[i];
    obj.y += obj.vy * dt;
    textSize(min(width, height) * 0.05);
    if (obj.tipo === "GALLETA") text("🍪", obj.x, obj.y);
    else if (obj.tipo === "MONEDA") text("🪙", obj.x, obj.y);
    else text("💣", obj.x, obj.y);

    if (dist(obj.x, obj.y, jugadorX, jugadorY) < min(width, height) * 0.08) {
      if (obj.tipo === "GALLETA") {
        puntajeMinijuego += 10;
        felicidad = min(100, felicidad + 5);
      } else if (obj.tipo === "MONEDA") {
        monedas++;
        monedasGanadasMinijuego++;
      } else if (obj.tipo === "BOMBA") {
        gameOverGalletas = true;
        guardarJuego();
        return;
      }
      objetos.splice(i, 1);
      continue;
    }
    if (obj.y > height) objetos.splice(i, 1);
  }

  if (imagenPersonaje) {
    let tam = min(width, height) * 0.15;
    push();
    let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
    image(imgFinal, jugadorX, jugadorY, tam, tam);
    pop();
  }

  dibujarHUDMinijuego();
}

let margenDeVida = 0;

function iniciarMinijuegoNinja() {
  estadoJuego = "MINIJUEGO_NINJA";
  objetos = [];
  puntajeMinijuego = 0;
  monedasGanadasMinijuego = 0;
  jugadorX = width / 2;
  jugadorY = height / 2;
  comidaArrastrando = null;
  gameOverNinja = false;
  estadoLuz = "APAGADA";
  temporizadorLuz = millis() + random(4000, 7000);
  margenDeVida = 0;
  paredes = [
    { x: width * 0.3, y: height * 0.4, targetX: width * 0.3, targetY: height * 0.4, w: width * 0.18, h: height * 0.18, tiempoCambio: 0 },
    { x: width * 0.7, y: height * 0.7, targetX: width * 0.7, targetY: height * 0.7, w: width * 0.18, h: height * 0.18, tiempoCambio: 0 }
  ];
}

function ejecutarMinijuegoNinja(dt) {
  if (gameOverNinja) {
    background(20, 10, 15);
    fill(240, 70, 70);
    textSize(min(width, height) * 0.06);
    textStyle(BOLD);
    text("🚨 ¡GAME OVER! 🚨", width / 2, height * 0.3);

    fill(230);
    textSize(min(width, height) * 0.03);
    text("¡Te detectó la luz ninja!", width / 2, height * 0.4);
    text("Puntos conseguidos: " + floor(puntajeMinijuego), width / 2, height * 0.5);
    text("Monedas recolectadas: 🪙 " + monedasGanadasMinijuego, width / 2, height * 0.56);

    dibujarBotonSatisfactorio(width * 0.35, height * 0.72, width * 0.3, height * 0.08, "Aceptar", color(240, 90, 90), color(190, 60, 60));
    return;
  }

  if (estadoLuz === "APAGADA") background(18, 22, 32);
  else if (estadoLuz === "ADVERTENCIA") background(180, 130, 40);
  else if (estadoLuz === "ENCENDIDA") background(240, 230, 180);

  let tamJugador = min(width, height) * 0.13;
  jugadorX = constrain(mouseX, tamJugador / 2, width - tamJugador / 2);
  jugadorY = constrain(mouseY, height * 0.15, height - tamJugador / 2);

  let tiempoActual = millis();

  if (estadoLuz === "APAGADA" && tiempoActual > temporizadorLuz) {
    estadoLuz = "ADVERTENCIA";
    advertenciaLuz = tiempoActual + 1500;
  } else if (estadoLuz === "ADVERTENCIA" && tiempoActual > advertenciaLuz) {
    estadoLuz = "ENCENDIDA";
    temporizadorLuz = tiempoActual + 3000;
  } else if (estadoLuz === "ENCENDIDA" && tiempoActual > temporizadorLuz) {
    estadoLuz = "APAGADA";
    temporizadorLuz = tiempoActual + random(5000, 9000);
  }

  if (frameCount % 45 === 0) {
    objetos.push({ x: random(width * 0.1, width * 0.9), y: random(height * 0.2, height * 0.85), vida: 160 });
  }

  for (let p of paredes) {
    if (frameCount > p.tiempoCambio) {
      p.targetX = random(width * 0.15, width * 0.85);
      p.targetY = random(height * 0.25, height * 0.8);
      p.tiempoCambio = frameCount + floor(random(180, 300));
    }
    p.x = lerp(p.x, p.targetX, 2.5 * dt);
    p.y = lerp(p.y, p.targetY, 2.5 * dt);

    noStroke();
    fill(0, 50);
    rect(p.x - p.w / 2 + 4, p.y - p.h / 2 + 4, p.w, p.h, 14);
    stroke(60, 35, 15);
    strokeWeight(2.5);
    fill(100, 60, 30);
    rect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 14);
    noStroke();
    textSize(min(width, height) * 0.04);
    text("🪵", p.x, p.y);
  }

  let aSalvo = false;
  for (let p of paredes) {
    if (abs(jugadorX - p.x) < p.w / 2 && abs(jugadorY - p.y) < p.h / 2) {
      aSalvo = true;
      margenDeVida = 0;
      break;
    }
  }

  if (estadoLuz === "ENCENDIDA" && !aSalvo) {
    margenDeVida += deltaTime;
    if (margenDeVida > 0.07) {
    gameOverNinja = true;
    guardarJuego();
    return;
    }
  }

  if (imagenPersonaje) {
    push();
    let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
    if (aSalvo) {
      tint(255, 180); 
      image(imgFinal, jugadorX, jugadorY, tamJugador, tamJugador);
    } else {
      image(imgFinal, jugadorX, jugadorY, tamJugador, tamJugador);
    }
    pop();
  }

  for (let i = objetos.length - 1; i >= 0; i--) {
    let obj = objetos[i];
    obj.vida -= (60 * dt);
    textSize(min(width, height) * 0.05);
    text("🪙", obj.x, obj.y);

    if (dist(obj.x, obj.y, jugadorX, jugadorY) < tamJugador * 0.6) {
      monedas++;
      monedasGanadasMinijuego++;
      objetos.splice(i, 1);
      continue;
    }
    if (obj.vida <= 0) objetos.splice(i, 1);
  }

  if (estadoLuz === "ADVERTENCIA") {
    fill(255, 230, 80);
    textSize(min(width, height) * 0.035);
    textStyle(BOLD);
    text("⚠ ¡CÚBRETE EN LAS PAREDES! ⚠️", width / 2, height * 0.18);
  } else if (estadoLuz === "APAGADA") {
    puntajeMinijuego += (6 * dt);
  }

  dibujarHUDMinijuego();
}

function iniciarMinijuegoClimb() {
  estadoJuego = "MINIJUEGO_CLIMB";
  puntajeMinijuego = 0;
  monedasGanadasMinijuego = 0;
  maxPlataformaAlcanzada = 0;
  gameOverClimb = false;
  jugadorX = width / 2;
  jugadorY = -20;
  jugadorVY = SALTO_CLIMB;
  climbCamY = 0;

  plataformas = [{ index: 0, x: width / 2, y: 0, w: width * 0.35, h: 18 }];
  for (let i = 1; i < 25; i++) {
    plataformas.push({
      index: i,
      x: random(width * 0.18, width * 0.82),
      y: -i * 125,
      w: random(width * 0.2, width * 0.28),
      h: 18
    });
  }
}

function ejecutarMinijuegoClimb(dt) {
  if (gameOverClimb) {
    background(25, 30, 20);
    fill(240, 70, 70);
    textSize(min(width, height) * 0.06);
    textStyle(BOLD);
    text("🧗 ¡CAÍSTE! GAME OVER 🧗", width / 2, height * 0.3);

    fill(230);
    textSize(min(width, height) * 0.03);
    text("Máxima Plataforma Alcanzada: #" + maxPlataformaAlcanzada, width / 2, height * 0.42);
    text("Monedas recolectadas: 🪙 " + monedasGanadasMinijuego, width / 2, height * 0.5);

    dibujarBotonSatisfactorio(width * 0.35, height * 0.72, width * 0.3, height * 0.08, "Aceptar", color(240, 90, 90), color(190, 60, 60));
    return;
  }

  background(25, 35, 55);

  jugadorX = constrain(mouseX, 30, width - 30);
  jugadorVY += GRAVEDAD_CLIMB * dt;
  jugadorY += jugadorVY * dt;

  let targetCamY = min(climbCamY, jugadorY);
  climbCamY = lerp(climbCamY, targetCamY, 0.1);

  let tamJ = min(width, height) * 0.12;

  for (let i = plataformas.length - 1; i >= 0; i--) {
    let plat = plataformas[i];
    let screenY = plat.y - climbCamY + height * 0.65;

    if (screenY > height + 150) {
      plataformas.splice(i, 1);
      let ultimaPlat = plataformas[plataformas.length - 1];
      let nuevoIndex = ultimaPlat.index + 1;
      plataformas.push({
        index: nuevoIndex,
        x: random(width * 0.18, width * 0.82),
        y: -nuevoIndex * 125,
        w: random(width * 0.2, width * 0.28),
        h: 18
      });
      continue;
    }

    if (screenY > -50 && screenY < height + 50) {
      noStroke();
      fill(80, 180, 100);
      rect(plat.x - plat.w / 2, screenY, plat.w, plat.h, 8);
      fill(255, 220, 100);
      textSize(12);
      text("#" + plat.index, plat.x, screenY + 9);

      if (jugadorVY > 0) {
        let pieY = jugadorY + tamJ / 2;
        let pieViejo = (jugadorY - jugadorVY * dt) + tamJ / 2;
        if (jugadorX >= plat.x - plat.w / 2 - 10 && jugadorX <= plat.x + plat.w / 2 + 10) {
          if (pieViejo <= plat.y + 8 && pieY >= plat.y - 8) {
            jugadorVY = SALTO_CLIMB;
            jugadorY = plat.y - tamJ / 2;

            if (plat.index > maxPlataformaAlcanzada) {
              for (let p = maxPlataformaAlcanzada + 1; p <= plat.index; p++) {
                if (p % 2 === 0) {
                  monedas++;
                  monedasGanadasMinijuego++;
                }
              }
              maxPlataformaAlcanzada = plat.index;
              puntajeMinijuego = maxPlataformaAlcanzada * 10;
              felicidad = min(100, felicidad + 2);
            }
          }
        }
      }
    }
  }

  if (jugadorY > climbCamY + height * 0.5) {
    gameOverClimb = true;
    guardarJuego();
    return;
  }

  let miScreenY = jugadorY - climbCamY + height * 0.65;
  if (imagenPersonaje) {
    push();
    let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
    image(imgFinal, jugadorX, miScreenY, tamJ, tamJ);
    pop();
  }

  dibujarHUDMinijuego();
}

function intentarSuperSaltoClimb() {
  if (estadoJuego !== "MINIJUEGO_CLIMB" && !(estadoJuego === "SALA_DUELO" && tipoDueloSeleccionado === "CLIMB")) return;

  let tamJ = min(width, height) * 0.12;
  let listaPlats = (estadoJuego === "SALA_DUELO") ? (miEstadoCompartido.plataformasRed || []) : plataformas;

  for (let plat of listaPlats) {
    let distanciaY = abs((jugadorY + tamJ / 2) - plat.y);
    let dentroEnX = jugadorX >= plat.x - plat.w / 2 - 25 && jugadorX <= plat.x + plat.w / 2 + 25;

    if (dentroEnX && distanciaY < 65 && jugadorVY > -100) {
      jugadorVY = SALTO_CLIMB * 1.4;
      break;
    }
  }
}

function keyPressed() {
  if (mostrandoTecladoNombre) {
    if (keyCode === BACKSPACE) {
      textoNuevoNombre = textoNuevoNombre.substring(0, textoNuevoNombre.length - 1);
      return false;
    } else if (keyCode === ESCAPE) {
      mostrandoTecladoNombre = false;
      return false;
    }
  }

  if (key === ' ' || keyCode === UP_ARROW) {
    intentarSuperSaltoClimb();
  }
}

function dibujarHUDMinijuego() {
  fill(240);
  noStroke();
  textSize(min(width, height) * 0.024);
  textStyle(BOLD);
  let txtP = estadoJuego === "MINIJUEGO_CLIMB" ? "Plataforma: #" + maxPlataformaAlcanzada : "Puntos: " + floor(puntajeMinijuego);
  text(txtP, width * 0.2, height * 0.05);
  text("🪙 + " + monedasGanadasMinijuego, width * 0.5, height * 0.05);

  // Botón "Salir" centrado responsivo
  let btnW = min(width, height) * 0.18;
  let btnH = min(width, height) * 0.06;
  let btnX = width * 0.82 - btnW / 2;
  let btnY = height * 0.03;

  dibujarBotonSatisfactorio(btnX, btnY, btnW, btnH, "Salir", color(240, 80, 80), color(180, 50, 50));
}


function dibujarTienda() {
  background(26, 30, 44);
  fill(230, 235, 245);
  noStroke();
  textSize(min(width, height) * 0.045);
  textStyle(BOLD);
  text("🏪 Tienda", width / 2, height * 0.08);

  fill(255, 200, 60);
  textSize(min(width, height) * 0.026);
  text("Tus Monedas: 🪙 " + monedas, width / 2, height * 0.13);

  let pW = width * 0.35;
  let pH = height * 0.06;
  
  dibujarBotonSatisfactorio(width * 0.12, height * 0.17, pW, pH, "🍎 Comida", pestanaTienda === "COMIDA" ? color(255, 140, 60) : color(60, 70, 90), color(40, 45, 60));
  dibujarBotonSatisfactorio(width * 0.53, height * 0.17, pW, pH, "👑 Decoración", pestanaTienda === "DECORACION" ? color(180, 100, 240) : color(60, 70, 90), color(40, 45, 60));

  if (pestanaTienda === "COMIDA") {
    dibujarItemTienda(height * 0.25, "🍎", "Manzana (+25 Hambre)", "10");
    dibujarItemTienda(height * 0.40, "🍕", "Pizza (+50 Hambre)", "20");
    dibujarItemTienda(height * 0.55, "🎂", "Pastel (+80 Hambre, +10 Felicidad)", "35");
  } else if (pestanaTienda === "DECORACION") {
    let poseoGorro = decoracionesCompradas.includes("GORRO");
    let txtGorro = poseoGorro ? (decoracionEquipada === "GORRO" ? "Equipado" : "Equipar") : "🪙 30";
    dibujarItemTienda(height * 0.25, "🧢", "Gorro Casual", txtGorro);

    let poseoSombrero = decoracionesCompradas.includes("SOMBRERO");
    let txtSombrero = poseoSombrero ? (decoracionEquipada === "SOMBRERO" ? "Equipado" : "Equipar") : "🪙 50";
    dibujarItemTienda(height * 0.39, "🎩", "Sombrero Elegante", txtSombrero);

    let poseoCorona = decoracionesCompradas.includes("CORONA");
    let txtCorona = poseoCorona ? (decoracionEquipada === "CORONA" ? "Equipada" : "Equipar") : "🪙 100";
    dibujarItemTienda(height * 0.53, "👑", "Corona Real", txtCorona);

    let poseoTinte = decoracionesCompradas.includes("TINTE");
    let txtTinte = poseoTinte ? "🎨 Personalizar" : "🪙 40";
    dibujarItemTienda(height * 0.67, "🎨", "Tinte de Color Especial", txtTinte);
  }

  dibujarBotonSatisfactorio(width * 0.35, height * 0.83, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
}

function dibujarItemTienda(y, emoji, nombre, precioTexto) {
  push();
  stroke(55, 65, 90);
  strokeWeight(2);
  fill(38, 44, 62);
  rect(width * 0.1, y, width * 0.8, height * 0.12, 16);

  noStroke();
  textSize(min(width, height) * 0.05);
  text(emoji, width * 0.18, y + height * 0.06);

  textAlign(LEFT, CENTER);
  fill(230, 235, 245);
  textSize(min(width, height) * 0.024);
  textStyle(BOLD);
  text(nombre, width * 0.28, y + height * 0.06);

  let btnW = width * 0.24;
  let btnH = height * 0.055;
  let btnX = width * 0.63;
  let btnY = y + height * 0.032;

  dibujarBotonSatisfactorio(btnX, btnY, btnW, btnH, precioTexto, color(100, 210, 120), color(60, 160, 80));
  pop();
}

// --- MENÚ DE SELECCIÓN Y PREVISUALIZACIÓN DE TINTES ---
function abrirMenuTintes() {
  tintePrevisualizado = colorTinte ? [...colorTinte] : null;
  estadoJuego = "MENU_TINTES";
}

function dibujarMenuSeleccionTintes() {
  background(26, 30, 44);

  fill(230, 235, 245);
  noStroke();
  textSize(min(width, height) * 0.045);
  textStyle(BOLD);
  text("🎨 Tinte para tu Algebralian", width / 2, height * 0.08);

  textSize(min(width, height) * 0.022);
  fill(170, 180, 205);
  text("Selecciona un color para previsualizar la apariencia", width / 2, height * 0.13);

  // --- PREVISUALIZACIÓN CENTRAL DE TU ALGEBRALIAN ---
  let prevX = width / 2;
  let prevY = height * 0.32;
  let tam = min(width, height) * 0.28;

  push();
  fill(38, 44, 62);
  stroke(60, 70, 95);
  strokeWeight(3);
  rect(prevX - tam * 0.7, prevY - tam * 0.55, tam * 1.4, tam * 1.1, 20);

  noStroke();
  fill(0, 70);
  ellipse(prevX, prevY + tam * 0.4, tam * 0.6, tam * 0.12);

  if (imagenPersonaje) {
    let imgPrev = obtenerImagenTintada(imagenPersonaje, tintePrevisualizado);
    image(imgPrev, prevX, prevY, tam, tam);

    if (decoracionEquipada === "GORRO") {
      textSize(tam * 0.38);
      text("🧢", prevX, prevY - tam * 0.38);
    } else if (decoracionEquipada === "SOMBRERO") {
      textSize(tam * 0.4);
      text("🎩", prevX, prevY - tam * 0.42);
    } else if (decoracionEquipada === "CORONA") {
      textSize(tam * 0.4);
      text("👑", prevX, prevY - tam * 0.42);
    }
  }
  pop();

  // Nombre del color seleccionado
  let nombreColor = "SIN TINTE (Original)";
  if (tintePrevisualizado) {
    let encontrado = PALETA_TINTES.find(t => t.color[0] === tintePrevisualizado[0] && t.color[1] === tintePrevisualizado[1] && t.color[2] === tintePrevisualizado[2]);
    if (encontrado) nombreColor = encontrado.nombre;
  }
  fill(255, 220, 100);
  textSize(min(width, height) * 0.026);
  textStyle(BOLD);
  text("Color: " + nombreColor, width / 2, height * 0.51);

  // --- PALETA EN CUADRÍCULA ---
  let cols = 4;
  let btnW = width * 0.18;
  let btnH = height * 0.065;
  let gapX = width * 0.02;
  let gapY = height * 0.018;

  let totalW = cols * btnW + (cols - 1) * gapX;
  let startX = width / 2 - totalW / 2;
  let startY = height * 0.56;

  for (let i = 0; i < PALETA_TINTES.length; i++) {
    let item = PALETA_TINTES[i];
    let colIndex = i % cols;
    let rowIndex = floor(i / cols);

    let bx = startX + colIndex * (btnW + gapX);
    let by = startY + rowIndex * (btnH + gapY);

    let c = item.color;
    let colBtn = color(c[0], c[1], c[2]);
    let colSombra = color(max(0, c[0] - 50), max(0, c[1] - 50), max(0, c[2] - 50));

    // Resaltar si está seleccionado en la previsualización
    let seleccionado = tintePrevisualizado && tintePrevisualizado[0] === c[0] && tintePrevisualizado[1] === c[1] && tintePrevisualizado[2] === c[2];
    if (seleccionado) {
      stroke(255, 230, 80);
      strokeWeight(3.5);
    } else {
      noStroke();
    }

    dibujarBotonSatisfactorio(bx, by, btnW, btnH, item.nombre, colBtn, colSombra);
  }

  // --- BOTONES INFERIORES ---
  let bW = width * 0.25;
  let bH = height * 0.075;
  let bY = height * 0.82;

  dibujarBotonSatisfactorio(width * 0.08, bY, bW, bH, "🚫 Quitar Tinte", color(200, 80, 80), color(140, 40, 40));
  dibujarBotonSatisfactorio(width * 0.375, bY, bW, bH, "💾 Guardar", color(100, 210, 120), color(60, 160, 80));
  dibujarBotonSatisfactorio(width * 0.67, bY, bW, bH, "↩ Cancelar", color(120, 130, 150), color(80, 90, 110));
}

function manejarClickMenuTintes() {
  let cols = 4;
  let btnW = width * 0.18;
  let btnH = height * 0.065;
  let gapX = width * 0.02;
  let gapY = height * 0.018;

  let totalW = cols * btnW + (cols - 1) * gapX;
  let startX = width / 2 - totalW / 2;
  let startY = height * 0.56;

  // Selección de color de la paleta
  for (let i = 0; i < PALETA_TINTES.length; i++) {
    let colIndex = i % cols;
    let rowIndex = floor(i / cols);

    let bx = startX + colIndex * (btnW + gapX);
    let by = startY + rowIndex * (btnH + gapY);

    if (colisionCaja(bx, by, btnW, btnH)) {
      tintePrevisualizado = PALETA_TINTES[i].color;
      return;
    }
  }

  let bW = width * 0.25;
  let bH = height * 0.075;
  let bY = height * 0.82;

  // Botón Quitar Tinte
  if (colisionCaja(width * 0.08, bY, bW, bH)) {
    tintePrevisualizado = null;
  }

  // Botón Guardar Tinte
  if (colisionCaja(width * 0.375, bY, bW, bH)) {
    colorTinte = tintePrevisualizado;
    guardarJuego();
    estadoJuego = "TIENDA";
  }

  // Botón Cancelar
  if (colisionCaja(width * 0.67, bY, bW, bH)) {
    estadoJuego = "TIENDA";
  }
}

function dibujarGuarderiaOnline() {
  background(28, 32, 48);

  push();
  textAlign(LEFT, CENTER);
  fill(255, 220, 100);
  textSize(min(width, height) * 0.024);
  textStyle(BOLD);
  text("👤 " + nombreUsuario, width * 0.03, height * 0.05);
  pop();

  dibujarBotonSatisfactorio(width * 0.03, height * 0.08, width * 0.22, height * 0.05, "✏️ Cambiar Nombre", color(80, 180, 200), color(50, 130, 150));

  fill(230, 235, 245);
  noStroke();
  textSize(min(width, height) * 0.045);
  textStyle(BOLD);
  text("🌐 Guardería Online", width / 2, height * 0.08);

  let otrosJugadores = listaJugadores.filter(p => p.idJugador !== miEstadoCompartido.idJugador);

  if (otrosJugadores.length === 0) {
    fill(180, 190, 210);
    textSize(min(width, height) * 0.028);
    text("Buscando cuidadores en red...", width / 2, height * 0.45);
    text("🟢 Estás en la guardería esperando...", width / 2, height * 0.52);
    dibujarBotonSatisfactorio(width * 0.35, height * 0.82, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
    return;
  }

  indiceGuarderia = constrain(indiceGuarderia, 0, otrosJugadores.length - 1);
  let jugadorActual = otrosJugadores[indiceGuarderia];
  let imgJugadorGuarderia = obtenerImagenPersonaje(jugadorActual.url);

  stroke(60, 70, 95);
  strokeWeight(3);
  fill(36, 42, 60);
  rect(width * 0.15, height * 0.16, width * 0.7, height * 0.6, 20);

  noStroke();
  fill(255, 200, 60);
  textSize(min(width, height) * 0.035);
  textStyle(BOLD);
  let nombreRivalFinal = jugadorActual.nombreUsuario || ("Jugador #" + jugadorActual.idJugador);
  text(nombreRivalFinal, width / 2, height * 0.22);

  textSize(min(width, height) * 0.022);
  fill(160, 170, 190);
  text("Personaje: " + (jugadorActual.nombre || "Algebralian"), width / 2, height * 0.27);
  text("Estado actual: " + (jugadorActual.estado || "Normal"), width / 2, height * 0.31);

  let tam = min(width, height) * 0.25;
  if (imgJugadorGuarderia) {
    push();
    translate(width / 2, height * 0.48);
    let imgRival = obtenerImagenPersonaje(jugadorActual.url);
    let imgRivalTintada = obtenerImagenTintada(imgRival, jugadorActual.tinte);
    image(imgRivalTintada, 0, 0, tam, tam);

    if (jugadorActual.decoracion === "GORRO") {
      textSize(tam * 0.38);
      text("🧢", 0, -tam * 0.38);
    } else if (jugadorActual.decoracion === "SOMBRERO") {
      textSize(tam * 0.4);
      text("🎩", 0, -tam * 0.42);
    } else if (jugadorActual.decoracion === "CORONA") {
      textSize(tam * 0.4);
      text("👑", 0, -tam * 0.42);
    }
    pop();
  }

  dibujarBotonSatisfactorio(width * 0.25, height * 0.65, width * 0.5, height * 0.07, "⚔️ DESAFIAR A DUELO", color(240, 90, 90), color(180, 50, 50));

  dibujarBotonSatisfactorio(width * 0.05, height * 0.42, width * 0.08, height * 0.1, "◀", color(80, 160, 240), color(50, 120, 190));
  dibujarBotonSatisfactorio(width * 0.87, height * 0.42, width * 0.08, height * 0.1, "▶", color(80, 160, 240), color(50, 120, 190));

  dibujarBotonSatisfactorio(width * 0.35, height * 0.82, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
}

function obtenerFilasTeclado() {
  if (modoNumerosTeclado) {
    return [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'],
      ["ABC", ".", ",", "?", "!", "'", "⌫"]
    ];
  } else {
    let f1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
    let f2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
    let f3 = ["⇧", "Z", "X", "C", "V", "B", "N", "M", "123", "⌫"];

    if (!mayusculasTeclado) {
      f1 = f1.map(c => c.toLowerCase());
      f2 = f2.map(c => c.toLowerCase());
      f3 = f3.map(c => (c === "⇧" || c === "123" || c === "⌫") ? c : c.toLowerCase());
    }
    return [f1, f2, f3];
  }
}

function dibujarTecladoCustomizado() {
  push();
  fill(0, 190);
  rect(0, 0, width, height);

  stroke(80, 100, 140);
  strokeWeight(2);
  fill(30, 36, 52);
  rect(width * 0.08, height * 0.15, width * 0.84, height * 0.72, 24);

  noStroke();
  fill(255);
  textSize(min(width, height) * 0.035);
  textStyle(BOLD);
  text("✏ Ingresa tu Nombre de Usuario", width / 2, height * 0.21);

  fill(18, 22, 32);
  stroke(100, 180, 240);
  strokeWeight(2);
  rect(width * 0.15, height * 0.25, width * 0.7, height * 0.08, 12);

  noStroke();
  fill(255, 220, 100);
  textSize(min(width, height) * 0.032);
  text(textoNuevoNombre + "│", width / 2, height * 0.29);

  let filas = obtenerFilasTeclado();
  let startY = height * 0.38;
  let keyH = height * 0.08;

  for (let r = 0; r < filas.length; r++) {
    let fila = filas[r];
    let keyW = (width * 0.78) / fila.length;
    let startX = width / 2 - (keyW * fila.length) / 2;

    for (let c = 0; c < fila.length; c++) {
      let kx = startX + c * keyW;
      let ky = startY + r * (keyH + 8);
      let charKey = fila[c];

      let colBoton = color(55, 65, 90);
      let colSombra = color(35, 42, 60);

      if (charKey === "⇧" && mayusculasTeclado) {
        colBoton = color(80, 160, 240);
        colSombra = color(50, 120, 190);
      } else if (charKey === "123" || charKey === "ABC") {
        colBoton = color(160, 100, 240);
        colSombra = color(110, 60, 180);
      }

      dibujarBotonSatisfactorio(kx + 2, ky, keyW - 4, keyH, charKey, colBoton, colSombra);
    }
  }

  dibujarBotonSatisfactorio(width * 0.18, height * 0.74, width * 0.3, height * 0.08, "GUARDAR", color(100, 210, 120), color(60, 160, 80));
  dibujarBotonSatisfactorio(width * 0.52, height * 0.74, width * 0.3, height * 0.08, "CANCELAR", color(240, 90, 90), color(190, 60, 60));
  pop();
}

function manejarClickTeclado() {
  let filas = obtenerFilasTeclado();
  let startY = height * 0.38;
  let keyH = height * 0.08;

  for (let r = 0; r < filas.length; r++) {
    let fila = filas[r];
    let keyW = (width * 0.78) / fila.length;
    let startX = width / 2 - (keyW * fila.length) / 2;

    for (let c = 0; c < fila.length; c++) {
      let kx = startX + c * keyW;
      let ky = startY + r * (keyH + 8);

      if (colisionCaja(kx + 2, ky, keyW - 4, keyH)) {
        let charKey = fila[c];
        
        if (charKey === "⌫") {
          textoNuevoNombre = textoNuevoNombre.substring(0, textoNuevoNombre.length - 1);
        } else if (charKey === "⇧") {
          mayusculasTeclado = !mayusculasTeclado;
        } else if (charKey === "123") {
          modoNumerosTeclado = true;
        } else if (charKey === "ABC") {
          modoNumerosTeclado = false;
        } else {
          if (textoNuevoNombre.length < 14) textoNuevoNombre += charKey;
        }
        return;
      }
    }
  }

  if (colisionCaja(width * 0.18, height * 0.74, width * 0.3, height * 0.08)) {
    if (textoNuevoNombre.trim() !== "") {
      nombreUsuario = textoNuevoNombre.trim();
      guardarJuego();
    }
    mostrandoTecladoNombre = false;
  }

  if (colisionCaja(width * 0.52, height * 0.74, width * 0.3, height * 0.08)) {
    mostrandoTecladoNombre = false;
  }
}

function mousePressed() {
  if (mostrandoTecladoNombre) {
    manejarClickTeclado();
    return;
  }

  if (estadoJuego === "MENU_TINTES") {
    manejarClickMenuTintes();
    return;
  }

  intentarSuperSaltoClimb();

  if (miEstadoCompartido && miEstadoCompartido.retoRecibido && estadoJuego !== "SALA_DUELO" && estadoJuego !== "ESPERANDO_RESPUESTA_DUELO") {
    let infoReto = miEstadoCompartido.retoRecibido;

    if (colisionCaja(width * 0.22, height * 0.58, width * 0.26, height * 0.08)) {
      miEstadoCompartido.retoRecibido = null;
      iniciarDuelo(infoReto.deId, infoReto.tipoMinijuego || "GALLETAS");
      return;
    }
    if (colisionCaja(width * 0.52, height * 0.58, width * 0.26, height * 0.08)) {
      miEstadoCompartido.retoRecibido = null;
      return;
    }
  }

  if (estadoJuego === "ESPERANDO_RESPUESTA_DUELO") {
    let rivalData = listaJugadores.find(p => p.idJugador === idRivalDuelo);
    if (!rivalData) {
      if (colisionCaja(width * 0.35, height * 0.60, width * 0.3, height * 0.08)) {
        miEstadoCompartido.estadoDuelo = "LIBRE";
        estadoJuego = "GUARDERIA";
        return;
      }
    } else {
      if (colisionCaja(width * 0.35, height * 0.65, width * 0.3, height * 0.08)) {
        miEstadoCompartido.estadoDuelo = "LIBRE";
        estadoJuego = "GUARDERIA";
        return;
      }
    }
  }

  if (estadoJuego === "SALA_DUELO") {
    let rivalData = listaJugadores.find(p => p.idJugador === idRivalDuelo);
    if (!rivalData && colisionCaja(width * 0.35, height * 0.60, width * 0.3, height * 0.08)) {
      miEstadoCompartido.estadoDuelo = "LIBRE";
      estadoJuego = "GUARDERIA";
      return;
    }
  }

  let btnW = width * 0.17;
  let btnH = height * 0.08;
  let btnY = height * 0.88;

  if (estadoJuego === "PRINCIPAL") {
    if (colisionCaja(width * 0.02, btnY, btnW, btnH)) {
      if (inventarioComida.manzana > 0) comidaArrastrando = "manzana";
      else if (inventarioComida.pizza > 0) comidaArrastrando = "pizza";
      else if (inventarioComida.pastel > 0) comidaArrastrando = "pastel";
    }
    if (colisionCaja(width * 0.21, btnY, btnW, btnH)) {
      energia = min(100, energia + 30);
      guardarJuego();
    }
    if (colisionCaja(width * 0.40, btnY, btnW, btnH)) estadoJuego = "MENU_MINIJUEGOS";
    if (colisionCaja(width * 0.59, btnY, btnW, btnH)) estadoJuego = "TIENDA";
    if (colisionCaja(width * 0.78, btnY, btnW, btnH)) estadoJuego = "GUARDERIA";

  } else if (estadoJuego === "MENU_MINIJUEGOS") {
    let cardW = width * 0.72, cardH = height * 0.19;

    if (colisionCaja(width * 0.14, height * 0.16, cardW, cardH)) iniciarMinijuegoGalletas();
    if (colisionCaja(width * 0.14, height * 0.37, cardW, cardH)) iniciarMinijuegoNinja();
    if (colisionCaja(width * 0.14, height * 0.58, cardW, cardH)) iniciarMinijuegoClimb();
    if (colisionCaja(width * 0.35, height * 0.82, width * 0.3, height * 0.08)) estadoJuego = "PRINCIPAL";

  } else if (estadoJuego === "MENU_SELECCION_RETOS") {
    let cardW = width * 0.72, cardH = height * 0.19;
    let otrosJugadores = listaJugadores.filter(p => p.idJugador !== miEstadoCompartido.idJugador);
    let objetivo = otrosJugadores[indiceGuarderia];

    if (objetivo) {
      if (colisionCaja(width * 0.14, height * 0.16, cardW, cardH)) enviarDesafioDuelo(objetivo.idJugador, "GALLETAS");
      if (colisionCaja(width * 0.14, height * 0.37, cardW, cardH)) enviarDesafioDuelo(objetivo.idJugador, "NINJA");
      if (colisionCaja(width * 0.14, height * 0.58, cardW, cardH)) enviarDesafioDuelo(objetivo.idJugador, "CLIMB");
    }
    if (colisionCaja(width * 0.35, height * 0.82, width * 0.3, height * 0.08)) estadoJuego = "GUARDERIA";
  } else if (estadoJuego === "MINIJUEGO_GALLETAS" || estadoJuego === "MINIJUEGO_NINJA" || estadoJuego === "MINIJUEGO_CLIMB") {
    if (gameOverGalletas || gameOverNinja || gameOverClimb) {
      if (colisionCaja(width * 0.35, height * 0.72, width * 0.3, height * 0.08)) estadoJuego = "PRINCIPAL";
    } else {
      // Coordenadas exactas matching a dibujarHUDMinijuego con margen de tolerancia (+10px)
      let btnW = min(width, height) * 0.18;
      let btnH = min(width, height) * 0.06;
      let btnX = width * 0.82 - btnW / 2;
      let btnY = height * 0.03;

      // Evaluamos con un margen expandido de 10px para que el clic sea 100% consistente
      if (mouseX >= btnX - 10 && mouseX <= btnX + btnW + 10 && mouseY >= btnY - 10 && mouseY <= btnY + btnH + 10) {
        guardarJuego();
        estadoJuego = "PRINCIPAL";
      }
    }
  } else if (estadoJuego === "SALA_DUELO") {
    if (finDelDuelo && colisionCaja(width * 0.35, height * 0.68, width * 0.3, height * 0.08)) {
      miEstadoCompartido.estadoDuelo = "LIBRE";
      estadoJuego = "PRINCIPAL";
    }
  } else if (estadoJuego === "TIENDA") {
    let pW = width * 0.35, pH = height * 0.06;

    if (colisionCaja(width * 0.12, height * 0.17, pW, pH)) pestanaTienda = "COMIDA";
    if (colisionCaja(width * 0.53, height * 0.17, pW, pH)) pestanaTienda = "DECORACION";

    let btnX = width * 0.63, btnWItem = width * 0.24, btnHItem = height * 0.055;

    if (pestanaTienda === "COMIDA") {
      if (colisionCaja(btnX, height * 0.25 + height * 0.032, btnWItem, btnHItem) && monedas >= 10) { monedas -= 10; inventarioComida.manzana++; guardarJuego(); }
      if (colisionCaja(btnX, height * 0.40 + height * 0.032, btnWItem, btnHItem) && monedas >= 20) { monedas -= 20; inventarioComida.pizza++; guardarJuego(); }
      if (colisionCaja(btnX, height * 0.55 + height * 0.032, btnWItem, btnHItem) && monedas >= 35) { monedas -= 35; inventarioComida.pastel++; guardarJuego(); }
    } else if (pestanaTienda === "DECORACION") {
      // Gorro Casual
      if (colisionCaja(btnX, height * 0.25 + height * 0.032, btnWItem, btnHItem)) {
        let poseoGorro = decoracionesCompradas.includes("GORRO");
        if (!poseoGorro && monedas >= 30) {
          monedas -= 30;
          decoracionesCompradas.push("GORRO");
          decoracionEquipada = "GORRO";
        } else if (poseoGorro) {
          decoracionEquipada = (decoracionEquipada === "GORRO") ? null : "GORRO";
        }
        guardarJuego();
      }
      // Sombrero Elegante
      if (colisionCaja(btnX, height * 0.39 + height * 0.032, btnWItem, btnHItem)) {
        let poseoSombrero = decoracionesCompradas.includes("SOMBRERO");
        if (!poseoSombrero && monedas >= 50) {
          monedas -= 50;
          decoracionesCompradas.push("SOMBRERO");
          decoracionEquipada = "SOMBRERO";
        } else if (poseoSombrero) {
          decoracionEquipada = (decoracionEquipada === "SOMBRERO") ? null : "SOMBRERO";
        }
        guardarJuego();
      }
      // Corona Real
      if (colisionCaja(btnX, height * 0.53 + height * 0.032, btnWItem, btnHItem)) {
        let poseoCorona = decoracionesCompradas.includes("CORONA");
        if (!poseoCorona && monedas >= 100) {
          monedas -= 100;
          decoracionesCompradas.push("CORONA");
          decoracionEquipada = "CORONA";
        } else if (poseoCorona) {
          decoracionEquipada = (decoracionEquipada === "CORONA") ? null : "CORONA";
        }
        guardarJuego();
      }
      // Tinte Especial
      if (colisionCaja(btnX, height * 0.67 + height * 0.032, btnWItem, btnHItem)) {
        let poseoTinte = decoracionesCompradas.includes("TINTE");
        if (!poseoTinte && monedas >= 40) {
          monedas -= 40;
          decoracionesCompradas.push("TINTE");
          abrirMenuTintes();
        } else if (poseoTinte) {
          abrirMenuTintes();
        }
        guardarJuego();
      }
    }

    if (colisionCaja(width * 0.35, height * 0.83, width * 0.3, height * 0.08)) estadoJuego = "PRINCIPAL";

  } else if (estadoJuego === "GUARDERIA") {
    let otrosJugadores = listaJugadores.filter(p => p.idJugador !== miEstadoCompartido.idJugador);

    if (colisionCaja(width * 0.03, height * 0.08, width * 0.22, height * 0.05)) {
      textoNuevoNombre = nombreUsuario;
      mostrandoTecladoNombre = true;
      return;
    }

    if (otrosJugadores.length > 0) {
      if (colisionCaja(width * 0.05, height * 0.42, width * 0.08, height * 0.1)) {
        indiceGuarderia = (indiceGuarderia - 1 + otrosJugadores.length) % otrosJugadores.length;
      }
      if (colisionCaja(width * 0.87, height * 0.42, width * 0.08, height * 0.1)) {
        indiceGuarderia = (indiceGuarderia + 1) % otrosJugadores.length;
      }
      if (colisionCaja(width * 0.25, height * 0.65, width * 0.5, height * 0.07)) {
        estadoJuego = "MENU_SELECCION_RETOS";
      }
    }

    if (colisionCaja(width * 0.35, height * 0.82, width * 0.3, height * 0.08)) estadoJuego = "PRINCIPAL";
  }
}
