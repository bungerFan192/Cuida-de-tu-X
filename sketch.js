// ==========================================
// ALGEBRALIAN POU - CORRECCIÓN DE BOTONES 🌿✨
// ==========================================

// --- MULTIJUGADOR ---
let miEstadoCompartido;
let listaJugadores;
let nombreUsuario;

// Cache optimizada de imágenes teñidas
let cacheImagenes = {};
let cacheGraficosTintados = {}; 

// --- BARRAS DE ESTADO Y ECONOMÍA ---
let hambre = 100;
let energia = 100;
let felicidad = 100;
let monedas = 0;

// Desgaste equilibrado y relajado
const DESGASTE_HAMBRE_POR_SEG = 100 / (12 * 3600);
const DESGASTE_ENERGIA_POR_SEG = 100 / (18 * 3600);
const DESGASTE_FELICIDAD_POR_SEG = 100 / (24 * 3600);

// --- INVENTARIO Y DECORACIÓN ---
let inventarioComida = { manzana: 0, pizza: 0, pastel: 0 };
let decoracionEquipada = null; 
let decoracionesCompradas = [];
let colorTinte = null; 
let tintePrevisualizado = null; 

// Paleta Relax Pastel
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

// --- ESTADOS Y MENÚS ---
let estadoJuego = "PRINCIPAL"; 
let pestanaTienda = "COMIDA";

// TECLADO
let mostrandoTecladoNombre = false;
let textoNuevoNombre = "";
let mayusculasTeclado = true;
let modoNumerosTeclado = false;

// GUARDERÍA
let indiceGuarderia = 0;
let mensajeGuarderia = "";

// INTERACCIÓN ALIMENTOS
let comidaArrastrando = null;
let comiendoAnimacion = 0;

// MINIJUEGOS Y AMBIENTE
let partículasFondo = [];
let jugadorX = 200, jugadorY = 200, jugadorVY = 0;
let climbCamY = 0;
let maxPlataformaAlcanzada = 0;

const GRAVEDAD_CLIMB = 1000;
const SALTO_CLIMB = -600;

let objetos = [];
let paredes = [];
let plataformas = [];
let estadoLuz = "APAGADA";
let temporizadorLuz = 0;
let advertenciaLuz = 0;
let puntajeMinijuego = 0;
let monedasGanadasMinijuego = 0;
let gameOverGalletas = false, gameOverNinja = false, gameOverClimb = false, gameOverTerremoto = false;

// TERREMOTO DEFORME
let terremotoPuntos = [];
let terremotoPinchos = [];
let terremotoSenales = [];
let terremotoMonedas = [];
let terremotoAlgebralianX = 0;
let terremotoAlgebralianY = 0;
let terremotoDireccion = 1;
let terremotoVelocidad = 50;
let tiempoInicioTerremoto = 0;
let proximoSpawnPincho = 0;

// ALGEBRALIANS
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
    console.log("Error al guardar:", e);
  }
}

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

function obtenerImagenTintada(img, tinte) {
  if (!img) return null;
  if (!tinte) return img;

  let claveCache = (img.url || "img") + "_" + tinte.join(",");
  if (cacheGraficosTintados[claveCache]) {
    return cacheGraficosTintados[claveCache];
  }

  let pg = createGraphics(img.width, img.height);
  pg.image(img, 0, 0);
  pg.loadPixels();

  let tr = tinte[0] / 255, tg = tinte[1] / 255, tb = tinte[2] / 255;

  for (let i = 0; i < pg.pixels.length; i += 4) {
    let a = pg.pixels[i + 3];
    if (a < 10) continue;
    let r = pg.pixels[i], g = pg.pixels[i + 1], b = pg.pixels[i + 2];
    
    if ((r < 35 && g < 35 && b < 35) || (r > 245 && g > 245 && b > 245)) continue;

    pg.pixels[i] = r * tr;
    pg.pixels[i + 1] = g * tg;
    pg.pixels[i + 2] = b * tb;
  }

  pg.updatePixels();
  cacheGraficosTintados[claveCache] = pg;
  return pg;
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
      if (datos.inventarioComida) inventarioComida = datos.inventarioComida;
      if (datos.decoracionEquipada !== undefined) decoracionEquipada = datos.decoracionEquipada;
      if (datos.decoracionesCompradas) decoracionesCompradas = datos.decoracionesCompradas;
      if (datos.colorTinte) colorTinte = datos.colorTinte;

      if (datos.ultimoAcceso) {
        let segs = (Date.now() - datos.ultimoAcceso) / 1000;
        hambre = max(10, hambre - (segs * DESGASTE_HAMBRE_POR_SEG));
        energia = max(10, energia - (segs * DESGASTE_ENERGIA_POR_SEG));
        felicidad = max(10, felicidad - (segs * DESGASTE_FELICIDAD_POR_SEG));
      }
    }
  } catch (e) {}

  if (!miAlgebralian || !miAlgebralian.nombre) {
    miAlgebralian = ALGEBRALIANS[floor(random(ALGEBRALIANS.length))];
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

  for (let i = 0; i < 30; i++) {
    partículasFondo.push({
      x: random(width),
      y: random(height),
      tam: random(2, 6),
      velY: random(0.2, 0.8),
      alfa: random(80, 200)
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  listaJugadores = partyLoadGuestShareds();
  let dt = deltaTime / 1000; 
  if (isNaN(dt) || dt > 0.1) dt = 0.016;

  hambre = max(0, hambre - (DESGASTE_HAMBRE_POR_SEG * dt * 60));
  energia = max(0, energia - (DESGASTE_ENERGIA_POR_SEG * dt * 60));
  felicidad = max(0, felicidad - (DESGASTE_FELICIDAD_POR_SEG * dt * 60));
  
  if (frameCount % 120 === 0) guardarJuego();

  if (miEstadoCompartido) {
    miEstadoCompartido.nombreUsuario = nombreUsuario;
    miEstadoCompartido.decoracion = decoracionEquipada;
    miEstadoCompartido.tinte = colorTinte;
    miEstadoCompartido.hambre = hambre;
  }

  dibujarFondoRelax(dt);

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

  if (mostrandoTecladoNombre) dibujarTecladoCustomizado();
}

function dibujarFondoRelax(dt) {
  background(22, 26, 42);
  noStroke();
  
  for (let p of partículasFondo) {
    p.y -= p.velY;
    if (p.y < 0) p.y = height;
    fill(255, 255, 230, p.alfa * 0.5);
    ellipse(p.x, p.y, p.tam);
  }
}

function dibujarPantallaPrincipal() {
  dibujarHUD();

  let posX = width / 2;
  let posY = height * 0.52;

  if (imagenPersonaje) {
    let respiracion = sin(frameCount * 0.05) * 6;
    let escalaEfecto = (comiendoAnimacion > 0) ? 1.15 : 1.0;
    let tam = min(width, height) * 0.34 + respiracion;
    
    if (comiendoAnimacion > 0) comiendoAnimacion--;

    push();
    translate(posX, posY);
    scale(escalaEfecto);

    noStroke();
    fill(10, 15, 28, 120);
    ellipse(0, tam * 0.42, tam * 0.65, tam * 0.15);

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
    textSize(50);
    let emoji = comidaArrastrando === "manzana" ? "🍎" : (comidaArrastrando === "pizza" ? "🍕" : "🎂");
    text(emoji, mouseX, mouseY);

    if (dist(mouseX, mouseY, posX, posY) < min(width, height) * 0.16) {
      if (comidaArrastrando === "manzana") hambre = min(100, hambre + 25);
      else if (comidaArrastrando === "pizza") hambre = min(100, hambre + 50);
      else if (comidaArrastrando === "pastel") {
        hambre = min(100, hambre + 80);
        felicidad = min(100, felicidad + 10);
      }
      inventarioComida[comidaArrastrando]--;
      comidaArrastrando = null;
      comiendoAnimacion = 18;
      guardarJuego();
    }
  }

  dibujarBotones();
}

function dibujarHUD() {
  fill(240, 245, 255);
  noStroke();
  textSize(min(width, height) * 0.04);
  textStyle(BOLD);
  text(miAlgebralian.nombre, width / 2, height * 0.05);

  textSize(min(width, height) * 0.022);
  dibujarPill(width * 0.22, height * 0.09, "🪙 " + monedas, color(38, 44, 62), color(255, 215, 100));
  
  let totalComida = inventarioComida.manzana + inventarioComida.pizza + inventarioComida.pastel;
  dibujarPill(width * 0.78, height * 0.09, "🍱 " + totalComida, color(38, 44, 62), color(255, 130, 130));

  let anchoBarra = width * 0.24;
  let yBarras = height * 0.15;

  dibujarBarraEstilizada("Comida", hambre, width * 0.08, yBarras, anchoBarra, color(255, 150, 110));
  dibujarBarraEstilizada("Sueño", energia, width * 0.38, yBarras, anchoBarra, color(130, 180, 255));
  dibujarBarraEstilizada("Juego", felicidad, width * 0.68, yBarras, anchoBarra, color(255, 140, 200));
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
  textSize(min(width, height) * 0.018);
  textStyle(BOLD);
  text(etiqueta, x, y);

  fill(32, 38, 55);
  rect(x, y + 12, ancho, 12, 6);

  fill(col);
  rect(x, y + 12, map(valor, 0, 100, 0, ancho), 12, 6);
  pop();
}

function dibujarBotones() {
  let btnW = width * 0.17;
  let btnH = height * 0.08;
  let btnY = height * 0.88;

  dibujarBotonSatisfactorio(width * 0.02, btnY, btnW, btnH, "🍱 Comer", color(255, 160, 100), color(200, 110, 60));
  dibujarBotonSatisfactorio(width * 0.21, btnY, btnW, btnH, "💤 Dormir", color(120, 170, 240), color(70, 120, 190));
  dibujarBotonSatisfactorio(width * 0.40, btnY, btnW, btnH, "🎮 Jugar", color(240, 120, 180), color(180, 70, 130));
  dibujarBotonSatisfactorio(width * 0.59, btnY, btnW, btnH, "🏪 Tienda", color(255, 200, 100), color(200, 150, 50));
  dibujarBotonSatisfactorio(width * 0.78, btnY, btnW, btnH, "🏢 Guardería", color(170, 130, 240), color(120, 80, 180));
}

// --- FUNCIÓN DE BOTÓN OPTIMIZADA SIN TRASLACIÓN GLOBAL ---
function dibujarBotonSatisfactorio(x, y, w, h, etiqueta, col, colSombra) {
  push();
  let hover = colisionCaja(x, y, w, h);
  let presionado = hover && mouseIsPressed;
  let desplY = presionado ? 2 : (hover ? -2 : 0);

  noStroke();
  // Sombra del botón
  fill(colSombra);
  rect(x, y + 4, w, h, 16);

  // Botón principal
  fill(hover ? lerpColor(col, color(255), 0.15) : col);
  rect(x, y + desplY, w, h, 16);

  // Texto del botón
  fill(255);
  textSize(min(width, height) * 0.02);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(etiqueta, x + w / 2, y + h / 2 + desplY);
  pop();
}

function dibujarMenuMinijuegos() {
  fill(240, 245, 255);
  noStroke();
  textSize(min(width, height) * 0.04);
  textStyle(BOLD);
  text("🎮 Minijuegos Relax", width / 2, height * 0.07);

  let cardW = width * 0.72;
  let cardH = height * 0.16;

  dibujarTarjetaMinijuego(width * 0.14, height * 0.13, cardW, cardH, "🍪 Atrapa Galletas", "Atrapa galletas y suma monedas.", color(38, 44, 62), color(255, 180, 120));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.30, cardW, cardH, "🥷 Escape Ninja 2D", "Protégete tras los muros móviles.", color(38, 44, 62), color(130, 180, 255));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.47, cardW, cardH, "🧗 Algebralian Climb", "Sube a tu ritmo rebotando alto.", color(38, 44, 62), color(140, 230, 170));
  dibujarTarjetaMinijuego(width * 0.14, height * 0.64, cardW, cardH, "🌋 Terremoto Deforme", "Haz clic para moldear la onda sísmica y esquivar pinchos.", color(38, 44, 62), color(255, 130, 130));

  dibujarBotonSatisfactorio(width * 0.35, height * 0.83, width * 0.3, height * 0.08, "Volver", color(240, 100, 100), color(180, 60, 60));
}

function dibujarTarjetaMinijuego(x, y, w, h, titulo, desc, colFondo, colBorde) {
  push();
  let hover = colisionCaja(x, y, w, h);
  let desplY = hover ? -2 : 0;

  stroke(colBorde);
  strokeWeight(2);
  fill(colFondo);
  rect(x, y + desplY, w, h, 20);

  noStroke();
  textAlign(CENTER, CENTER);
  fill(240, 245, 255);
  textSize(min(width, height) * 0.028);
  textStyle(BOLD);
  text(titulo, x + w / 2, y + h * 0.3 + desplY);

  fill(170, 180, 200);
  textSize(min(width, height) * 0.018);
  rectMode(CENTER);
  text(desc, x + w / 2, y + h * 0.7 + desplY, w * 0.88, h * 0.5);
  rectMode(CORNER);
  pop();
}

function iniciarMinijuegoGalletas() {
  estadoJuego = "MINIJUEGO_GALLETAS";
  objetos = [];
  puntajeMinijuego = 0;
  monedasGanadasMinijuego = 0;
  jugadorX = width / 2;
  jugadorY = height * 0.82;
  gameOverGalletas = false;
}

function ejecutarMinijuegoGalletas(dt) {
  if (gameOverGalletas) {
    dibujarGameOver("🍪 ¡Fin del Minijuego!", "Monedas conseguidas: 🪙 " + monedasGanadasMinijuego);
    return;
  }

  jugadorX = lerp(jugadorX, constrain(mouseX, 40, width - 40), 0.2);
  jugadorY = height * 0.82;

  if (frameCount % 12 === 0) {
    let azar = random(1);
    let tipoObjeto = azar < 0.2 ? "BOMBA" : (azar < 0.55 ? "MONEDA" : "GALLETA");
    objetos.push({ x: random(30, width - 30), y: -20, vy: random(180, 300), tipo: tipoObjeto });
  }

  for (let i = objetos.length - 1; i >= 0; i--) {
    let obj = objetos[i];
    obj.y += obj.vy * dt;
    textSize(min(width, height) * 0.05);
    text(obj.tipo === "GALLETA" ? "🍪" : (obj.tipo === "MONEDA" ? "🪙" : "💣"), obj.x, obj.y);

    if (dist(obj.x, obj.y, jugadorX, jugadorY) < min(width, height) * 0.08) {
      if (obj.tipo === "GALLETA") {
        puntajeMinijuego += 10;
        monedas++;
        monedasGanadasMinijuego++;
        felicidad = min(100, felicidad + 3);
      } else if (obj.tipo === "MONEDA") {
        monedas++;
        monedasGanadasMinijuego++;
      } else {
        gameOverGalletas = true;
        guardarJuego();
        return;
      }
      objetos.splice(i, 1);
      continue;
    }
    if (obj.y > height + 30) objetos.splice(i, 1);
  }

  if (imagenPersonaje) {
    let tam = min(width, height) * 0.14;
    let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
    image(imgFinal, jugadorX, jugadorY, tam, tam);
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
    dibujarGameOver("🚨 ¡Te detectaron!", "Puntos alcanzados: " + floor(puntajeMinijuego));
    return;
  }

  let tamJugador = min(width, height) * 0.13;
  jugadorX = lerp(jugadorX, constrain(mouseX, tamJugador / 2, width - tamJugador / 2), 0.2);
  jugadorY = lerp(jugadorY, constrain(mouseY, height * 0.15, height - tamJugador / 2), 0.2);

  let tiempoActual = millis();

  if (estadoLuz === "APAGADA" && tiempoActual > temporizadorLuz) {
    estadoLuz = "ADVERTENCIA";
    advertenciaLuz = tiempoActual + 1500;
  } else if (estadoLuz === "ADVERTENCIA" && tiempoActual > advertenciaLuz) {
    estadoLuz = "ENCENDIDA";
    temporizadorLuz = tiempoActual + 3000;
  } else if (estadoLuz === "ENCENDIDA" && tiempoActual > temporizadorLuz) {
    estadoLuz = "APAGADA";
    temporizadorLuz = tiempoActual + random(5000, 8000);
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
    p.x = lerp(p.x, p.targetX, 2.0 * dt);
    p.y = lerp(p.y, p.targetY, 2.0 * dt);

    fill(60, 45, 75);
    rect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 16);
    fill(255);
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
    if (margenDeVida > 0.08) {
      gameOverNinja = true;
      guardarJuego();
      return;
    }
  }

  if (imagenPersonaje) {
    push();
    let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
    if (aSalvo) tint(255, 170);
    image(imgFinal, jugadorX, jugadorY, tamJugador, tamJugador);
    pop();
  }

  for (let i = objetos.length - 1; i >= 0; i--) {
    let obj = objetos[i];
    obj.vida -= (60 * dt);
    textSize(min(width, height) * 0.04);
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
    fill(255, 220, 100);
    textSize(min(width, height) * 0.03);
    textStyle(BOLD);
    text("⚠ ¡Protégete tras las paredes! ⚠️", width / 2, height * 0.18);
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
    dibujarGameOver("🧗 ¡Buena subida!", "Máxima plataforma: #" + maxPlataformaAlcanzada);
    return;
  }

  jugadorX = lerp(jugadorX, constrain(mouseX, 30, width - 30), 0.25);
  jugadorVY += GRAVEDAD_CLIMB * dt;
  jugadorY += jugadorVY * dt;

  climbCamY = lerp(climbCamY, min(climbCamY, jugadorY), 0.1);
  let tamJ = min(width, height) * 0.12;

  for (let i = plataformas.length - 1; i >= 0; i--) {
    let plat = plataformas[i];
    let screenY = plat.y - climbCamY + height * 0.65;

    if (screenY > height + 150) {
      plataformas.splice(i, 1);
      let ult = plataformas[plataformas.length - 1];
      let nIdx = ult.index + 1;
      plataformas.push({
        index: nIdx,
        x: random(width * 0.18, width * 0.82),
        y: -nIdx * 125,
        w: random(width * 0.2, width * 0.28),
        h: 18
      });
      continue;
    }

    if (screenY > -50 && screenY < height + 50) {
      fill(130, 210, 160);
      rect(plat.x - plat.w / 2, screenY, plat.w, plat.h, 8);

      if (jugadorVY > 0) {
        let pieY = jugadorY + tamJ / 2;
        let pieViejo = (jugadorY - jugadorVY * dt) + tamJ / 2;
        if (jugadorX >= plat.x - plat.w / 2 - 10 && jugadorX <= plat.x + plat.w / 2 + 10) {
          if (pieViejo <= plat.y + 8 && pieY >= plat.y - 8) {
            jugadorVY = (mouseIsPressed || keyIsPressed) ? SALTO_CLIMB * 1.35 : SALTO_CLIMB;
            jugadorY = plat.y - tamJ / 2;

            if (plat.index > maxPlataformaAlcanzada) {
              for (let p = maxPlataformaAlcanzada + 1; p <= plat.index; p++) {
                if (p % 2 === 0) { monedas++; monedasGanadasMinijuego++; }
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
    let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
    image(imgFinal, jugadorX, miScreenY, tamJ, tamJ);
  }

  dibujarHUDMinijuego();
}

function iniciarMinijuegoTerremoto() {
  estadoJuego = "MINIJUEGO_TERREMOTO";
  puntajeMinijuego = 0;
  monedasGanadasMinijuego = 0;
  gameOverTerremoto = false;
  terremotoAlgebralianX = width * 0.1;
  terremotoDireccion = 1;
  terremotoVelocidad = 50;
  tiempoInicioTerremoto = millis();
  proximoSpawnPincho = millis() + 5000;

  let numPuntos = 10;
  terremotoPuntos = [];
  let baseHeight = height * 0.55;
  let pasoX = width / (numPuntos - 1);

  for (let i = 0; i < numPuntos; i++) {
    terremotoPuntos.push({
      x: i * pasoX,
      y: baseHeight + sin(i * 0.8) * 35,
      targetY: baseHeight + sin(i * 0.8) * 35
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
    dibujarGameOver("🌋 ¡Gran intento!", "Monedas recolectadas: 🪙 " + monedasGanadasMinijuego);
    return;
  }

  let ahora = millis();
  let tiempoTranscurrido = (ahora - tiempoInicioTerremoto) / 1000;
  terremotoVelocidad = 50 + tiempoTranscurrido * 12;

  if (tiempoTranscurrido >= 5 && ahora >= proximoSpawnPincho) {
    let xSpawn = random(width * 0.08, width * 0.92);
    let dirY = random() < 0.5 ? 1 : -1;
    
    terremotoSenales.push({
      x: xSpawn,
      dirY: dirY,
      tiempoFin: ahora + 500
    });

    let intervalo = max(600, 2200 - tiempoTranscurrido * 50);
    proximoSpawnPincho = ahora + intervalo;
  }

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

  stroke(255, 140, 140);
  strokeWeight(6);
  noFill();
  beginShape();
  for (let p of terremotoPuntos) vertex(p.x, p.y);
  endShape();

  stroke(255, 140, 140, 40);
  strokeWeight(1);
  for (let p of terremotoPuntos) line(p.x, p.y, p.x, height);

  for (let i = terremotoSenales.length - 1; i >= 0; i--) {
    let s = terremotoSenales[i];
    noStroke();
    fill(255, 215, 0);
    textSize(min(width, height) * 0.035);
    let yAdv = s.dirY === 1 ? height * 0.08 : height * 0.92;
    text("⚠️", s.x, yAdv);

    if (ahora >= s.tiempoFin) {
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

  for (let i = terremotoPinchos.length - 1; i >= 0; i--) {
    let pincho = terremotoPinchos[i];
    pincho.y += pincho.vy * dt;

    noStroke();
    fill(45, 50, 65);
    ellipse(pincho.x, pincho.y, pincho.radio * 2);
    fill(255, 100, 100);
    ellipse(pincho.x, pincho.y, pincho.radio * 0.8);

    if (dist(terremotoAlgebralianX, terremotoAlgebralianY, pincho.x, pincho.y) < pincho.radio + 18) {
      gameOverTerremoto = true;
      guardarJuego();
      return;
    }

    if ((pincho.vy > 0 && pincho.y > height + 50) || (pincho.vy < 0 && pincho.y < -50)) {
      terremotoPinchos.splice(i, 1);
    }
  }

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
      fill(255, 215, 0);
      textSize(min(width, height) * 0.035);
      text("🪙", mx, my);

      if (dist(terremotoAlgebralianX, terremotoAlgebralianY, mx, my) < 30) {
        monedas++;
        monedasGanadasMinijuego++;
        m.visible = false;
        m.timer = random(120, 250);
      }
    }
  }

  let tam = min(width, height) * 0.12;
  let rebo = abs(sin(frameCount * 0.15)) * 10;

  push();
  let imgFinal = obtenerImagenTintada(imagenPersonaje, colorTinte);
  image(imgFinal, terremotoAlgebralianX, terremotoAlgebralianY - rebo - tam / 2, tam, tam);
  pop();

  puntajeMinijuego += 2 * dt;
  dibujarHUDMinijuego();
}

function dibujarGameOver(titulo, sub) {
  fill(38, 44, 62);
  rect(width * 0.2, height * 0.25, width * 0.6, height * 0.5, 24);

  fill(255, 140, 140);
  textSize(min(width, height) * 0.045);
  textStyle(BOLD);
  text(titulo, width / 2, height * 0.38);

  fill(230);
  textSize(min(width, height) * 0.025);
  text(sub, width / 2, height * 0.48);

  dibujarBotonSatisfactorio(width * 0.35, height * 0.6, width * 0.3, height * 0.08, "Aceptar", color(240, 100, 100), color(180, 60, 60));
}

function dibujarHUDMinijuego() {
  fill(240);
  noStroke();
  textSize(min(width, height) * 0.022);
  textStyle(BOLD);
  let txtP = estadoJuego === "MINIJUEGO_CLIMB" ? "Plataforma: #" + maxPlataformaAlcanzada : "Puntos: " + floor(puntajeMinijuego);
  text(txtP, width * 0.2, height * 0.05);
  text("🪙 + " + monedasGanadasMinijuego, width * 0.5, height * 0.05);

  let btnW = min(width, height) * 0.16;
  let btnH = min(width, height) * 0.05;
  let btnX = width * 0.82 - btnW / 2;
  let btnY = height * 0.03;

  dibujarBotonSatisfactorio(btnX, btnY, btnW, btnH, "Salir", color(240, 90, 90), color(180, 50, 50));
}

function dibujarTienda() {
  fill(240, 245, 255);
  noStroke();
  textSize(min(width, height) * 0.04);
  textStyle(BOLD);
  text("🏪 Tienda Relax", width / 2, height * 0.08);

  fill(255, 215, 100);
  textSize(min(width, height) * 0.024);
  text("Monedas: 🪙 " + monedas, width / 2, height * 0.13);

  let pW = width * 0.35, pH = height * 0.06;
  dibujarBotonSatisfactorio(width * 0.12, height * 0.17, pW, pH, "🍎 Comida", pestanaTienda === "COMIDA" ? color(255, 160, 100) : color(50, 60, 80), color(35, 40, 55));
  dibujarBotonSatisfactorio(width * 0.53, height * 0.17, pW, pH, "👑 Decoración", pestanaTienda === "DECORACION" ? color(170, 130, 240) : color(50, 60, 80), color(35, 40, 55));

  if (pestanaTienda === "COMIDA") {
    dibujarItemTienda(height * 0.25, "🍎", "Manzana (+25 Hambre)", "10");
    dibujarItemTienda(height * 0.40, "🍕", "Pizza (+50 Hambre)", "20");
    dibujarItemTienda(height * 0.55, "🎂", "Pastel (+80 Hambre, +10 Felicidad)", "35");
  } else if (pestanaTienda === "DECORACION") {
    let pGorro = decoracionesCompradas.includes("GORRO");
    dibujarItemTienda(height * 0.25, "🧢", "Gorro Casual", pGorro ? (decoracionEquipada === "GORRO" ? "Equipado" : "Equipar") : "🪙 30");

    let pSombrero = decoracionesCompradas.includes("SOMBRERO");
    dibujarItemTienda(height * 0.39, "🎩", "Sombrero Elegante", pSombrero ? (decoracionEquipada === "SOMBRERO" ? "Equipado" : "Equipar") : "🪙 50");

    let pCorona = decoracionesCompradas.includes("CORONA");
    dibujarItemTienda(height * 0.53, "👑", "Corona Real", pCorona ? (decoracionEquipada === "CORONA" ? "Equipada" : "Equipar") : "🪙 100");

    let pTinte = decoracionesCompradas.includes("TINTE");
    dibujarItemTienda(height * 0.67, "🎨", "Tinte de Color Especial", pTinte ? "🎨 Personalizar" : "🪙 40");
  }

  dibujarBotonSatisfactorio(width * 0.35, height * 0.83, width * 0.3, height * 0.08, "Volver", color(240, 100, 100), color(180, 60, 60));
}

function dibujarItemTienda(y, emoji, nombre, precioTexto) {
  push();
  stroke(50, 60, 85);
  strokeWeight(2);
  fill(38, 44, 62);
  rect(width * 0.1, y, width * 0.8, height * 0.12, 16);

  noStroke();
  textSize(min(width, height) * 0.05);
  text(emoji, width * 0.18, y + height * 0.06);

  textAlign(LEFT, CENTER);
  fill(240, 245, 255);
  textSize(min(width, height) * 0.022);
  textStyle(BOLD);
  text(nombre, width * 0.28, y + height * 0.06);

  let btnW = width * 0.24, btnH = height * 0.055;
  let btnX = width * 0.63, btnY = y + height * 0.032;

  dibujarBotonSatisfactorio(btnX, btnY, btnW, btnH, precioTexto, color(110, 210, 140), color(70, 160, 95));
  pop();
}

function abrirMenuTintes() {
  tintePrevisualizado = colorTinte ? [...colorTinte] : null;
  estadoJuego = "MENU_TINTES";
}

function dibujarMenuSeleccionTintes() {
  fill(240, 245, 255);
  noStroke();
  textSize(min(width, height) * 0.04);
  textStyle(BOLD);
  text("🎨 Tinte Personalizado", width / 2, height * 0.08);

  let prevX = width / 2, prevY = height * 0.32;
  let tam = min(width, height) * 0.26;

  push();
  fill(38, 44, 62);
  stroke(60, 70, 95);
  strokeWeight(2);
  rect(prevX - tam * 0.7, prevY - tam * 0.55, tam * 1.4, tam * 1.1, 20);

  if (imagenPersonaje) {
    let imgPrev = obtenerImagenTintada(imagenPersonaje, tintePrevisualizado);
    image(imgPrev, prevX, prevY, tam, tam);
  }
  pop();

  let cols = 4;
  let btnW = width * 0.18, btnH = height * 0.065;
  let gapX = width * 0.02, gapY = height * 0.018;

  let totalW = cols * btnW + (cols - 1) * gapX;
  let startX = width / 2 - totalW / 2;
  let startY = height * 0.56;

  for (let i = 0; i < PALETA_TINTES.length; i++) {
    let item = PALETA_TINTES[i];
    let colIndex = i % cols, rowIndex = floor(i / cols);
    let bx = startX + colIndex * (btnW + gapX);
    let by = startY + rowIndex * (btnH + gapY);

    let c = item.color;
    dibujarBotonSatisfactorio(bx, by, btnW, btnH, item.nombre, color(c[0], c[1], c[2]), color(max(0, c[0] - 40), max(0, c[1] - 40), max(0, c[2] - 40)));
  }

  let bW = width * 0.25, bH = height * 0.075, bY = height * 0.82;
  dibujarBotonSatisfactorio(width * 0.08, bY, bW, bH, "🚫 Sin Tinte", color(220, 100, 100), color(160, 50, 50));
  dibujarBotonSatisfactorio(width * 0.375, bY, bW, bH, "💾 Guardar", color(110, 210, 140), color(70, 160, 95));
  dibujarBotonSatisfactorio(width * 0.67, bY, bW, bH, "↩ Volver", color(130, 140, 160), color(90, 100, 120));
}

function manejarClickMenuTintes() {
  let cols = 4, btnW = width * 0.18, btnH = height * 0.065;
  let gapX = width * 0.02, gapY = height * 0.018;
  let totalW = cols * btnW + (cols - 1) * gapX;
  let startX = width / 2 - totalW / 2, startY = height * 0.56;

  for (let i = 0; i < PALETA_TINTES.length; i++) {
    let colIndex = i % cols, rowIndex = floor(i / cols);
    let bx = startX + colIndex * (btnW + gapX);
    let by = startY + rowIndex * (btnH + gapY);

    if (colisionCaja(bx, by, btnW, btnH)) {
      tintePrevisualizado = PALETA_TINTES[i].color;
      return;
    }
  }

  let bW = width * 0.25, bH = height * 0.075, bY = height * 0.82;
  if (colisionCaja(width * 0.08, bY, bW, bH)) tintePrevisualizado = null;
  if (colisionCaja(width * 0.375, bY, bW, bH)) { colorTinte = tintePrevisualizado; guardarJuego(); estadoJuego = "TIENDA"; }
  if (colisionCaja(width * 0.67, bY, bW, bH)) estadoJuego = "TIENDA";
}

function dibujarGuarderiaOnline() {
  push();
  textAlign(LEFT, CENTER);
  fill(255, 215, 100);
  textSize(min(width, height) * 0.022);
  textStyle(BOLD);
  text("👤 " + nombreUsuario, width * 0.03, height * 0.05);
  pop();

  dibujarBotonSatisfactorio(width * 0.03, height * 0.08, width * 0.22, height * 0.05, "✏️ Cambiar Nombre", color(100, 180, 220), color(60, 130, 160));

  fill(240, 245, 255);
  noStroke();
  textSize(min(width, height) * 0.04);
  textStyle(BOLD);
  text("🌐 Guardería Online", width / 2, height * 0.08);

  let otrosJugadores = listaJugadores.filter(p => p.idJugador !== miEstadoCompartido.idJugador);

  if (otrosJugadores.length === 0) {
    fill(170, 180, 200);
    textSize(min(width, height) * 0.025);
    text("Buscando Algebralians conectados...", width / 2, height * 0.48);
    dibujarBotonSatisfactorio(width * 0.35, height * 0.82, width * 0.3, height * 0.08, "Volver", color(240, 100, 100), color(180, 60, 60));
    return;
  }

  indiceGuarderia = constrain(indiceGuarderia, 0, otrosJugadores.length - 1);
  let jugadorActual = otrosJugadores[indiceGuarderia];

  fill(38, 44, 62);
  rect(width * 0.15, height * 0.16, width * 0.7, height * 0.6, 20);

  fill(255, 215, 100);
  textSize(min(width, height) * 0.032);
  textStyle(BOLD);
  text(jugadorActual.nombreUsuario || ("Jugador #" + jugadorActual.idJugador), width / 2, height * 0.22);

  let tam = min(width, height) * 0.24;
  let imgRival = obtenerImagenPersonaje(jugadorActual.url);
  if (imgRival) {
    push();
    translate(width / 2, height * 0.46);
    let imgRivalTintada = obtenerImagenTintada(imgRival, jugadorActual.tinte);
    image(imgRivalTintada, 0, 0, tam, tam);
    pop();
  }

  dibujarBotonSatisfactorio(width * 0.25, height * 0.64, width * 0.5, height * 0.07, "🍎 ALIMENTAR (+15 Monedas)", color(110, 210, 140), color(70, 160, 95));

  if (mensajeGuarderia !== "") {
    fill(255, 220, 100);
    textSize(min(width, height) * 0.02);
    text(mensajeGuarderia, width / 2, height * 0.73);
  }

  dibujarBotonSatisfactorio(width * 0.05, height * 0.42, width * 0.08, height * 0.1, "◀", color(120, 170, 240), color(70, 120, 190));
  dibujarBotonSatisfactorio(width * 0.87, height * 0.42, width * 0.08, height * 0.1, "▶", color(120, 170, 240), color(70, 120, 190));
  dibujarBotonSatisfactorio(width * 0.35, height * 0.82, width * 0.3, height * 0.08, "Volver", color(240, 100, 100), color(180, 60, 60));
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
  fill(0, 180);
  rect(0, 0, width, height);

  fill(30, 36, 52);
  rect(width * 0.08, height * 0.15, width * 0.84, height * 0.72, 24);

  fill(255);
  textSize(min(width, height) * 0.03);
  textStyle(BOLD);
  text("✏ Cambiar Nombre", width / 2, height * 0.21);

  fill(20, 25, 38);
  rect(width * 0.15, height * 0.25, width * 0.7, height * 0.08, 12);

  fill(255, 215, 100);
  textSize(min(width, height) * 0.03);
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

      dibujarBotonSatisfactorio(kx + 2, ky, keyW - 4, keyH, charKey, color(50, 60, 85), color(35, 42, 60));
    }
  }

  dibujarBotonSatisfactorio(width * 0.18, height * 0.74, width * 0.3, height * 0.08, "GUARDAR", color(110, 210, 140), color(70, 160, 95));
  dibujarBotonSatisfactorio(width * 0.52, height * 0.74, width * 0.3, height * 0.08, "CANCELAR", color(240, 100, 100), color(180, 60, 60));
  pop();
}

function manejarClickTeclado() {
  let filas = obtenerFilasTeclado();
  let startY = height * 0.38, keyH = height * 0.08;

  for (let r = 0; r < filas.length; r++) {
    let fila = filas[r];
    let keyW = (width * 0.78) / fila.length;
    let startX = width / 2 - (keyW * fila.length) / 2;

    for (let c = 0; c < fila.length; c++) {
      let kx = startX + c * keyW, ky = startY + r * (keyH + 8);

      if (colisionCaja(kx + 2, ky, keyW - 4, keyH)) {
        let charKey = fila[c];
        if (charKey === "⌫") textoNuevoNombre = textoNuevoNombre.substring(0, textoNuevoNombre.length - 1);
        else if (charKey === "⇧") mayusculasTeclado = !mayusculasTeclado;
        else if (charKey === "123") modoNumerosTeclado = true;
        else if (charKey === "ABC") modoNumerosTeclado = false;
        else if (textoNuevoNombre.length < 14) textoNuevoNombre += charKey;
        return;
      }
    }
  }

  if (colisionCaja(width * 0.18, height * 0.74, width * 0.3, height * 0.08)) {
    if (textoNuevoNombre.trim() !== "") { nombreUsuario = textoNuevoNombre.trim(); guardarJuego(); }
    mostrandoTecladoNombre = false;
  }
  if (colisionCaja(width * 0.52, height * 0.74, width * 0.3, height * 0.08)) mostrandoTecladoNombre = false;
}

function keyPressed() {
  if (mostrandoTecladoNombre) {
    if (keyCode === BACKSPACE) textoNuevoNombre = textoNuevoNombre.substring(0, textoNuevoNombre.length - 1);
    else if (keyCode === ESCAPE) mostrandoTecladoNombre = false;
  }
}

function mousePressed() {
  if (mostrandoTecladoNombre) { manejarClickTeclado(); return; }
  if (estadoJuego === "MENU_TINTES") { manejarClickMenuTintes(); return; }

  if (estadoJuego === "MINIJUEGO_TERREMOTO" && !gameOverTerremoto) {
    for (let p of terremotoPuntos) {
      if (dist(mouseX, mouseY, p.x, p.y) < 90) p.targetY = mouseY;
    }
  }

  let btnW = width * 0.17, btnH = height * 0.08, btnY = height * 0.88;

  if (estadoJuego === "PRINCIPAL") {
    if (colisionCaja(width * 0.02, btnY, btnW, btnH)) {
      if (inventarioComida.manzana > 0) comidaArrastrando = "manzana";
      else if (inventarioComida.pizza > 0) comidaArrastrando = "pizza";
      else if (inventarioComida.pastel > 0) comidaArrastrando = "pastel";
    }
    if (colisionCaja(width * 0.21, btnY, btnW, btnH)) { energia = min(100, energia + 30); guardarJuego(); }
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

  } else if (estadoJuego.startsWith("MINIJUEGO_")) {
    if (gameOverGalletas || gameOverNinja || gameOverClimb || gameOverTerremoto) {
      if (colisionCaja(width * 0.35, height * 0.6, width * 0.3, height * 0.08)) estadoJuego = "PRINCIPAL";
    } else {
      let bW = min(width, height) * 0.16, bH = min(width, height) * 0.05;
      if (colisionCaja(width * 0.82 - bW / 2, height * 0.03, bW, bH)) { guardarJuego(); estadoJuego = "PRINCIPAL"; }
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
    } else {
      if (colisionCaja(btnX, height * 0.25 + height * 0.032, btnWItem, btnHItem)) {
        if (!decoracionesCompradas.includes("GORRO") && monedas >= 30) { monedas -= 30; decoracionesCompradas.push("GORRO"); decoracionEquipada = "GORRO"; }
        else if (decoracionesCompradas.includes("GORRO")) decoracionEquipada = (decoracionEquipada === "GORRO") ? null : "GORRO";
        guardarJuego();
      }
      if (colisionCaja(btnX, height * 0.39 + height * 0.032, btnWItem, btnHItem)) {
        if (!decoracionesCompradas.includes("SOMBRERO") && monedas >= 50) { monedas -= 50; decoracionesCompradas.push("SOMBRERO"); decoracionEquipada = "SOMBRERO"; }
        else if (decoracionesCompradas.includes("SOMBRERO")) decoracionEquipada = (decoracionEquipada === "SOMBRERO") ? null : "SOMBRERO";
        guardarJuego();
      }
      if (colisionCaja(btnX, height * 0.53 + height * 0.032, btnWItem, btnHItem)) {
        if (!decoracionesCompradas.includes("CORONA") && monedas >= 100) { monedas -= 100; decoracionesCompradas.push("CORONA"); decoracionEquipada = "CORONA"; }
        else if (decoracionesCompradas.includes("CORONA")) decoracionEquipada = (decoracionEquipada === "CORONA") ? null : "CORONA";
        guardarJuego();
      }
      if (colisionCaja(btnX, height * 0.67 + height * 0.032, btnWItem, btnHItem)) {
        if (!decoracionesCompradas.includes("TINTE") && monedas >= 40) { monedas -= 40; decoracionesCompradas.push("TINTE"); abrirMenuTintes(); }
        else if (decoracionesCompradas.includes("TINTE")) abrirMenuTintes();
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
        let obj = otrosJugadores[indiceGuarderia];
        if (obj) {
          obj.hambre = min(100, (obj.hambre || 50) + 20);
          monedas += 15;
          mensajeGuarderia = "✨ ¡Alimentaste a " + (obj.nombreUsuario || "Algebralian") + "! +15 Monedas 🪙";
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
p
