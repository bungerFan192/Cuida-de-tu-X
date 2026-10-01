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

// --- GUARDERÍA ONLINE ---
let indiceGuarderia = 0;
let mensajeGuarderia = "";

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

// --- VARIABLES MINIJUEGO TERREMOTO DEFORME MODIFICADO ---
let terremotoPuntos = [];
let terremotoPinchos = [];
let terremotoSenales = [];
let terremotoMonedas = [];
let terremotoAlgebralianX = 0;
let terremotoAlgebralianY = 0;
let terremotoDireccion = 1; // 1 -> Derecha, -1 -> Izquierda
let terremotoVelocidad = 50;
let tiempoInicioTerremoto = 0;
let proximoSpawnPincho = 0;
let gameOverTerremoto = false;

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

function obtenerImagenTintada(img, tinte, umbralNegro = 30, umbralBlanco = 248) {
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

    let esBlancoPuro = (r >= umbralBlanco && g >= umbralBlanco && b >= umbralBlanco);
    let esNegroPuro = (r <= umbralNegro && g <= umbralNegro && b <= umbralNegro);

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
  
  partyConnect("wss://demoserver.p5party.org", "algebralian_pou_guarderia_v1");
  
  miEstadoCompartido = partyLoadMyShared({
    idJugador: floor(random(1000, 9999)),
    nombreUsuario: nombreUsuario,
    nombre: miAlgebralian.nombre,
    url: miAlgebralian.url,
    decoracion: null,
    tinte: null,
    estado: "Feliz",
    hambre: 100
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
    miEstadoCompartido.hambre = hambre;
    miEstadoCompartido.estado = hambre < 30 ? "Hambriento" : (energia < 30 ? "Con Sueño" : "Muy Feliz");
  }

  // Desgaste escalado por Delta Time
  hambre = max(0, hambre - (DESGASTE_HAMBRE_POR_SEG * dt * 60));
  energia = max(0, energia - (DESGASTE_ENERGIA_POR_SEG * dt * 60));
  felicidad = max(0, felicidad - (DESGASTE_FELICIDAD_POR_SEG * dt * 60));
  
  if (frameCount % 60 === 0) guardarJuego();

  switch (estadoJuego) {
    case "PRINCIPAL": dibujarPantallaPrincipal(); break;
    case "MENU_MINIJUEGOS": dibujarMenuMinijuegos(); break;
    case "MINIJUEGO_GALLETAS": ejecutarMinijuegoGalletas(dt); break;
    case "MINIJUEGO_NINJA": ejecutarMinijuegoNinja(dt); break;
    case "MINIJUEGO_CLIMB": ejecutarMinijuegoClimb(dt); break;
    case "MINIJUEGO_TERREMOTO": ejecutarMinijuegoTerremoto(dt); break;
    case "TIENDA": dibujarTienda(); break;
    case "MENU_TINTES": dibujarMenuSeleccionTintes(); break;
    case "GUARDERIA": dibujarGuarderiaOnline(); break;
  }

  if (mostrandoTecladoNombre) {
    dibujarTecladoCustomizado();
  }
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
  text("🎮 Selecciona un Minijuego", width / 2, height * 0.07);

  let cardW = width * 0.72;
  let cardH = height * 0.16;

  dibujarTarjetaMinijuego(width * 0.14, height * 0.13, cardW, cardH, "🍪 Atrapa Galletas", "Atrapa galletas aceleradas y evita bombas.", color(45, 40, 55), color(230, 150, 80));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.30, cardW, cardH, "🥷 Escape Ninja 2D", "Cúbrete tras las paredes móviles.", color(35, 45, 65), color(90, 150, 220));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.47, cardW, cardH, "🧗 Algebralian Climb", "Sube por plataformas rebotando.", color(30, 55, 45), color(90, 210, 140));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.64, cardW, cardH, "🌋 Terremoto Deforme", "Haz clic para deformar la línea sísmica y esquivar pinchos.", color(55, 35, 45), color(220, 100, 100));

  dibujarBotonSatisfactorio(width * 0.35, height * 0.83, width * 0.3, height * 0.08, "Volver", color(240, 90, 90), color(190, 60, 60));
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
  textSize(min(width, height) * 0.03);
  textStyle(BOLD);
  text(titulo, 0, -h * 0.22);

  fill(160, 170, 190);
  textSize(min(width, height) * 0.019);
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
  jugadorY = height * 0.82;
  comidaArrastrando = null;
  gameOverGalletas = false;
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
  jugadorY = height * 0.82;

  if (frameCount % 10 === 0) {
    let azar = random(1);
    let tipoObjeto = "GALLETA";
    if (azar < 0.25) tipoObjeto = "BOMBA";
    else if (azar < 0.55) tipoObjeto = "MONEDA";

    objetos.push({ x: random(20, width - 20), y: -20, vy: random(180, 320), tipo: tipoObjeto });
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
        monedas++;
        monedasGanadasMinijuego++;
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
    margenDeVida += dt;
    if (margenDeVida > 0.07) {
      gameOverNinja = true;
      guardarJuego();
      return;
    }
  } else {
    margenDeVida = 0;
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
            let fuerzaSalto = SALTO_CLIMB;
            if (mouseIsPressed || keyIsPressed) {
              fuerzaSalto *= 1.4;
            }
            jugadorVY = fuerzaSalto;
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

// --- LÓGICA MINIJUEGO TERREMOTO DEFORME (MODIFICADO) ---
function iniciarMinijuegoTerremoto() {
  estadoJuego = "MINIJUEGO_TERREMOTO";
  puntajeMinijuego = 0;
  monedasGanadasMinijuego = 0;
  gameOverTerremoto = false;
  terremotoAlgebralianX = width * 0.1;
  terremotoDireccion = 1;
  terremotoVelocidad = 50; // Inicia lento y acelera gradualmente
  tiempoInicioTerremoto = millis();
  proximoSpawnPincho = millis() + 5000; // Primeros 5 segundos sin pinchos

  let numPuntos = 20;
  terremotoPuntos = [];
  let baseHeight = height * 0.55;
  let pasoX = width / (numPuntos - 1);

  for (let i = 0; i < numPuntos; i++) {
    terremotoPuntos.push({
      x: i * pasoX,
      y: baseHeight + sin(i * 0.8) * 40,
      targetY: baseHeight + sin(i * 0.8) * 40
    });
  }

  terremotoPinchos = [];
  terremotoSenales = [];

  terremotoMonedas = [];
  for (let i = 0; i < 3; i++) {
    terremotoMonedas.push({
      idx: floor(random(1, numPuntos - 1)),
      visible: true,
      timer: random(100, 300)
    });
  }

  obtenerPosicionTerremoto();
}

function obtenerPosicionTerremoto() {
  let pasoX = width / (terremotoPuntos.length - 1);
  let idx = constrain(floor(terremotoAlgebralianX / pasoX), 0, terremotoPuntos.length - 2);
  let pct = (terremotoAlgebralianX - idx * pasoX) / pasoX;

  let y1 = terremotoPuntos[idx].y;
  let y2 = terremotoPuntos[idx + 1].y;

  terremotoAlgebralianY = lerp(y1, y2, pct) - 25;
}

function ejecutarMinijuegoTerremoto(dt) {
  if (gameOverTerremoto) {
    background(30, 15, 20);
    fill(240, 70, 70);
    textSize(min(width, height) * 0.06);
    textStyle(BOLD);
    text("🌋 ¡GAME OVER! 🌋", width / 2, height * 0.3);

    fill(230);
    textSize(min(width, height) * 0.03);
    text("¡Chocaste con un pincho flotante!", width / 2, height * 0.42);
    text("Puntos conseguidos: " + floor(puntajeMinijuego), width / 2, height * 0.5);
    text("Monedas recolectadas: 🪙 " + monedasGanadasMinijuego, width / 2, height * 0.56);

    dibujarBotonSatisfactorio(width * 0.35, height * 0.72, width * 0.3, height * 0.08, "Aceptar", color(240, 90, 90), color(190, 60, 60));
    return;
  }

  let ahora = millis();
  let tiempoTranscurrido = (ahora - tiempoInicioTerremoto) / 1000;

  // Aceleración progresiva del Algebralian
  terremotoVelocidad = 50 + tiempoTranscurrido * 12;

  // Sistema de spawner para advertencias y pinchos
  if (tiempoTranscurrido >= 5 && ahora >= proximoSpawnPincho) {
    let xSpawn = random(width * 0.08, width * 0.92);
    let dirY = random() < 0.5 ? 1 : -1; // 1: baja, -1: sube
    
    // Añadir señal de advertencia por 0.5s (500 ms)
    terremotoSenales.push({
      x: xSpawn,
      dirY: dirY,
      tiempoFin: ahora + 500
    });

    // Frecuencia de generación de pinchos progresivamente más rápida
    let intervalo = max(600, 2200 - tiempoTranscurrido * 50);
    proximoSpawnPincho = ahora + intervalo;
  }

  background(40, 25, 35);

  for (let p of terremotoPuntos) {
    p.y = lerp(p.y, p.targetY, 6 * dt);
  }

  terremotoAlgebralianX += terremotoDireccion * terremotoVelocidad * dt;
  if (terremotoAlgebralianX >= width - 40) {
    terremotoAlgebralianX = width - 40;
    terremotoDireccion = -1;
    puntajeMinijuego += 10;
  } else if (terremotoAlgebralianX <= 40) {
    terremotoAlgebralianX = 40;
    terremotoDireccion = 1;
    puntajeMinijuego += 10;
  }

  obtenerPosicionTerremoto();

  // Dibujar terremoto (Línea sísmica)
  stroke(220, 100, 100);
  strokeWeight(8);
  noFill();
  beginShape();
  for (let p of terremotoPuntos) {
    vertex(p.x, p.y);
  }
  endShape();

  stroke(150, 50, 50);
  strokeWeight(2);
  for (let p of terremotoPuntos) {
    line(p.x, p.y, p.x, height);
  }

  // Procesar señales de advertencia (duran 0.5 segundos)
  for (let i = terremotoSenales.length - 1; i >= 0; i--) {
    let s = terremotoSenales[i];
    
    // Dibujar señal
    noStroke();
    fill(255, 200, 0);
    textSize(min(width, height) * 0.04);
    let yAdvertencia = s.dirY === 1 ? height * 0.08 : height * 0.92;
    text("⚠️", s.x, yAdvertencia);

    if (ahora >= s.tiempoFin) {
      // Transformar la señal en un pincho flotante al finalizar los 0.5s
      let yInicial = s.dirY === 1 ? -30 : height + 30;
      let vySpeed = random(180, 320) * s.dirY;
      terremotoPinchos.push({
        x: s.x,
        y: yInicial,
        vy: vySpeed,
        radio: min(width, height) * 0.025
      });
      terremotoSenales.splice(i, 1);
    }
  }

  // Actualizar y dibujar Pinchos (Círculos Negros Flotantes)
  for (let i = terremotoPinchos.length - 1; i >= 0; i--) {
    let pincho = terremotoPinchos[i];
    pincho.y += pincho.vy * dt;

    // Dibujar Círculo Negro Flotante
    noStroke();
    fill(10);
    ellipse(pincho.x, pincho.y, pincho.radio * 2, pincho.radio * 2);

    // Brillo interior para acabado estético
    fill(60);
    ellipse(pincho.x - pincho.radio * 0.3, pincho.y - pincho.radio * 0.3, pincho.radio * 0.6, pincho.radio * 0.6);

    // Detección de colisión con Algebralian
    if (dist(terremotoAlgebralianX, terremotoAlgebralianY, pincho.x, pincho.y) < pincho.radio + 20) {
      gameOverTerremoto = true;
      guardarJuego();
      return;
    }

    // Borrar cuando sale de la pantalla por arriba o por abajo
    if ((pincho.vy > 0 && pincho.y > height + 50) || (pincho.vy < 0 && pincho.y < -50)) {
      terremotoPinchos.splice(i, 1);
    }
  }

  // Monedas
  for (let m of terremotoMonedas) {
    m.timer -= 60 * dt;
    if (m.timer <= 0) {
      m.visible = !m.visible;
      m.timer = random(100, 300);
      m.idx = floor(random(1, terremotoPuntos.length - 1));
    }

    if (m.visible) {
      let mx = terremotoPuntos[m.idx].x;
      let my = terremotoPuntos[m.idx].y - 35;

      noStroke();
      fill(255, 200, 60);
      textSize(min(width, height) * 0.04);
      text("🪙", mx, my);

      if (dist(terremotoAlgebralianX, terremotoAlgebralianY, mx, my) < 30) {
        monedas++;
        monedasGanadasMinijuego++;
        m.visible = false;
        m.timer = random(120, 250);
      }
    }
  }

  // Dibujar Algebralian rebotando
  let tam = min(width, height) * 0.12;
  let rebo = abs(sin(frameCount * 0.15)) * 12;

  push();
  let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
  image(imgFinal, terremotoAlgebralianX, terremotoAlgebralianY - rebo - tam / 2, tam, tam);
  pop();

  puntajeMinijuego += 2 * dt;
  dibujarHUDMinijuego();
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
}

function dibujarHUDMinijuego() {
  fill(240);
  noStroke();
  textSize(min(width, height) * 0.024);
  textStyle(BOLD);
  let txtP = estadoJuego === "MINIJUEGO_CLIMB" ? "Plataforma: #" + maxPlataformaAlcanzada : "Puntos: " + floor(puntajeMinijuego);
  text(txtP, width * 0.2, height * 0.05);
  text("🪙 + " + monedasGanadasMinijuego, width * 0.5, height * 0.05);

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

  let nombreColor = "SIN TINTE (Original)";
  if (tintePrevisualizado) {
    let encontrado = PALETA_TINTES.find(t => t.color[0] === tintePrevisualizado[0] && t.color[1] === tintePrevisualizado[1] && t.color[2] === tintePrevisualizado[2]);
    if (encontrado) nombreColor = encontrado.nombre;
  }
  fill(255, 220, 100);
  textSize(min(width, height) * 0.026);
  textStyle(BOLD);
  text("Color: " + nombreColor, width / 2, height * 0.51);

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

    let seleccionado = tintePrevisualizado && tintePrevisualizado[0] === c[0] && tintePrevisualizado[1] === c[1] && tintePrevisualizado[2] === c[2];
    if (seleccionado) {
      stroke(255, 230, 80);
      strokeWeight(3.5);
    } else {
      noStroke();
    }

    dibujarBotonSatisfactorio(bx, by, btnW, btnH, item.nombre, colBtn, colSombra);
  }

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

  if (colisionCaja(width * 0.08, bY, bW, bH)) {
    tintePrevisualizado = null;
  }

  if (colisionCaja(width * 0.375, bY, bW, bH)) {
    colorTinte = tintePrevisualizado;
    guardarJuego();
    estadoJuego = "TIENDA";
  }

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
    text("Buscando Algebralians en la guardería...", width / 2, height * 0.45);
    text("🟢 Estás solo por ahora en la red...", width / 2, height * 0.52);
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
  text("Personaje: " + (jugadorActual.nombre || "Algebralian"), width / 2, height * 0.26);
  text("Hambre actual: " + floor(jugadorActual.hambre || 0) + "%", width / 2, height * 0.30);

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

  dibujarBotonSatisfactorio(width * 0.25, height * 0.64, width * 0.5, height * 0.07, "🍎 ALIMENTAR (+15 Monedas)", color(100, 210, 120), color(60, 160, 80));

  if (mensajeGuarderia !== "") {
    fill(255, 220, 100);
    textSize(min(width, height) * 0.022);
    text(mensajeGuarderia, width / 2, height * 0.73);
  }

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

  if (estadoJuego === "MINIJUEGO_TERREMOTO" && !gameOverTerremoto) {
    for (let p of terremotoPuntos) {
      if (dist(mouseX, mouseY, p.x, p.y) < 80) {
        p.targetY = mouseY;
      }
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
    let cardW = width * 0.72, cardH = height * 0.16;

    if (colisionCaja(width * 0.14, height * 0.13, cardW, cardH)) iniciarMinijuegoGalletas();
    if (colisionCaja(width * 0.14, height * 0.30, cardW, cardH)) iniciarMinijuegoNinja();
    if (colisionCaja(width * 0.14, height * 0.47, cardW, cardH)) iniciarMinijuegoClimb();
    if (colisionCaja(width * 0.14, height * 0.64, cardW, cardH)) iniciarMinijuegoTerremoto();
    if (colisionCaja(width * 0.35, height * 0.83, width * 0.3, height * 0.08)) estadoJuego = "PRINCIPAL";

  } else if (estadoJuego === "MINIJUEGO_GALLETAS" || estadoJuego === "MINIJUEGO_NINJA" || estadoJuego === "MINIJUEGO_CLIMB" || estadoJuego === "MINIJUEGO_TERREMOTO") {
    if (gameOverGalletas || gameOverNinja || gameOverClimb || gameOverTerremoto) {
      if (colisionCaja(width * 0.35, height * 0.72, width * 0.3, height * 0.08)) estadoJuego = "PRINCIPAL";
    } else {
      let btnW = min(width, height) * 0.18;
      let btnH = min(width, height) * 0.06;
      let btnX = width * 0.82 - btnW / 2;
      let btnY = height * 0.03;

      if (colisionCaja(btnX, btnY, btnW, btnH)) {
        guardarJuego();
        estadoJuego = "PRINCIPAL";
      }
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
        mensajeGuarderia = "";
      }
      if (colisionCaja(width * 0.87, height * 0.42, width * 0.08, height * 0.1)) {
        indiceGuarderia = (indiceGuarderia + 1) % otrosJugadores.length;
        mensajeGuarderia = "";
      }
      if (colisionCaja(width * 0.25, height * 0.64, width * 0.5, height * 0.07)) {
        let objetivo = otrosJugadores[indiceGuarderia];
        if (objetivo) {
          objetivo.hambre = min(100, (objetivo.hambre || 50) + 20);
          monedas += 15;
          mensajeGuarderia = "✨ ¡Alimentaste a " + (objetivo.nombreUsuario || "Algebralian") + "! Ganaste 15 monedas 🪙";
          guardarJuego();
        }
      }
    }

    if (colisionCaja(width * 0.35, height * 0.82, width * 0.3, height * 0.08)) {
      mensajeGuarderia = "";
      estadoJuego = "PRINCIPAL";
    }
  }
}
