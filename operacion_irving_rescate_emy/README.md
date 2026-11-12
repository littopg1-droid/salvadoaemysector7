# IRVING: RESCATE DE EMY — Videojuego de plataformas 2D

Año 2145. La colonia del Sector 7 está bajo ataque. La facción renegada secuestró a **Emy**. Controla a **Irving**, un soldado con gafas y uniforme azul inspirado en el retrato proporcionado, y rescátala.

## Cómo jugar en Visual Studio Code

1. Descomprime `Irving_Rescate_de_Emy_VSCode.zip`.
2. Abre la carpeta `operacion_irving_rescate_emy` en **Visual Studio Code**.
3. Abre `index.html` en Chrome / Edge o selecciona **Open with Live Server** si tienes instalada esa extensión.
4. Presiona **INICIAR MISIÓN**.

No necesita instalar Node.js, paquetes, servidores ni conexión a internet. También puedes usar el archivo independiente `Irving_Rescate_de_Emy_JUGAR.html` para jugar sin descomprimir.

## Controles

- **A / D** o **← / →**: moverse.
- **ESPACIO**, **W** o **↑**: saltar.
- **J**, **X** o **K**: disparar pulsos de energía.
- **E**: abrir una puerta cuando tengas suficiente energía.
- **P**: pausar o reanudar.
- **♪**: activar/desactivar efectos de sonido.
- En pantallas táctiles: botones integrados.

## El juego incluye

- Tres niveles completos: Perímetro en Llamas, Núcleo Oscuro y Torre de las Sombras.
- Desplazamiento lateral de cámara con escenario ciberpunk y paralaje.
- Plataformas, huecos, pinchos, láseres, células de energía y enemigos móviles.
- Escudo de tres corazones, puntos de control, disparos y partículas.
- Centinela final con barra de vida y proyectiles de plasma.
- Prisión de energía que solamente se abre si reúnes células y derrotas al Centinela.
- Rescate de Emy y escena final, con opción de volver a jugar.
- Progreso a nivel de misión almacenado localmente en el navegador (si tu navegador lo permite).
- Retrato de Irving basado en la imagen proporcionada, conservado en `assets/irving-retrato.jpg`.

## Estructura

- `index.html` → interfaz, indicadores y pantalla de misión.
- `styles.css` → colores, efectos, diseño adaptable y controles táctiles.
- `game.js` → motor de juego, niveles, decisiones físicas, enemigos y rescate.
- `assets/irving-retrato.jpg` → retrato del protagonista.

## Personalización

**Cambiar el nombre:** busca `IRVING` y `EMY` en `index.html` y `game.js`.

**Modificar las fases:** abre `game.js` y modifica el arreglo `LEVELS` (nombres, plataformas, drones, células, láseres, etc.). El sistema de historia está en el objeto `STORY`.

**Cambiar los colores:** edita las variables de `:root` en `styles.css`.

**Cambiar la foto:** sustituye `assets/irving-retrato.jpg` por otra imagen manteniendo el nombre.

**Agregar arte:** todas las ilustraciones del juego se dibujan dentro de Canvas por JavaScript; puedes modificar las funciones `drawIrving`, `drawEmy`, `drawBoss` y `sky` para diseñar otros sprites.

## Nota

Juego original HTML5 de ejemplo con inspiración general en los videojuegos clásicos de plataformas; no utiliza gráficos ni personajes de Mario Bros.
