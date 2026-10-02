# Cifras y Letras

Juego de **Cifras y Letras** en castellano, con las normas del concurso de La 2: formar la palabra más larga con diez letras y llegar a una cifra exacta con seis números.

**Jugar:** <https://thors97.github.io/CifrasYLetras/>

> Proyecto de aficionados. No tiene relación con el programa de televisión ni con RTVE.

## Qué incluye

- **Tres formas de jugar:**
  - **Solo:** escribes tu respuesta en la pantalla y se puntúa contra la mejor solución posible.
  - **Por equipos:** de 2 a 6 equipos con un solo dispositivo. Cada equipo apunta su respuesta en papel y la introduce al acabar el tiempo.
  - **Varios móviles:** una sala para 2 a 8 jugadores, cada uno con su móvil. Se entra con un código de 4 letras, un enlace o un código QR.
- **Pantalla grande:** una tele, un portátil o un proyector puede enseñar el tablero, el reloj y los resultados mientras cada jugador responde con su móvil.
- **Diccionario propio** de 441.757 palabras de 5 a 10 letras, con plurales, femeninos y formas verbales. Funciona sin conexión.
- **Solucionador de cifras:** al acabar cada prueba enseña la solución con menos operaciones, o la aproximación más cercana si la cifra exacta no se podía conseguir.
- **Palabras más largas:** al acabar cada prueba de letras enseña las mejores palabras posibles, con enlace a su definición en el DLE.
- **Tema** automático, claro u oscuro.
- **Accesible:** se maneja con teclado, avisa a los lectores de pantalla de lo que pasa y respeta la opción de reducir animaciones.

## Cómo se juega

### Letras: la palabra más larga

- Quien tiene el turno elige cuántas vocales quiere, de 3 a 6. Salen 10 letras y el resto son consonantes. También puede dejarlo al azar.
- Hay 30 segundos para formar la palabra más larga, de 5 letras como mínimo. Cada letra se puede usar tantas veces como aparece.
- Vale cualquier palabra del Diccionario de la lengua española: plurales, femeninos y cualquier forma verbal. Se admite el pronombre reflexivo pegado al verbo, como en «levántate», pero no el de complemento directo, como en «cómelo». Las tildes no cuentan.
- La palabra más larga se lleva 1 punto por letra. Si hay empate, puntúan todos los empatados.
- Si el diccionario del juego rechaza una palabra que sí está en el DLE, se puede dar por válida en los resultados de la prueba.

### Cifras: la cifra exacta

- Salen 6 números y un objetivo entre 100 y 999. Quien tiene el turno elige cuántos números grandes quiere (25, 50, 75 y 100), de 0 a 4; el resto son pequeños, del 1 al 10. También puede dejarlo al azar.
- Hay 40 segundos para acercarse al objetivo sumando, restando, multiplicando y dividiendo. Cada número se usa una vez como mucho y no hace falta usarlos todos. Solo valen resultados enteros y positivos.
- La cifra exacta vale 10 puntos. Si nadie la consigue, la aproximación más cercana vale 7. Los empates puntúan para todos.
- Jugando solo no hay rival con quien comparar: la aproximación vale 7 puntos si te quedas a 10 o menos del objetivo, o si igualas la mejor aproximación posible.

### Opciones de partida

- **Pruebas:** 4, 6 o 10 (como en la tele).
- **Tipo:** letras y cifras alternadas, solo letras o solo cifras.
- **Tiempo:** el oficial (30 y 40 s), el doble (60 y 80 s) o sin límite.
- **Sonido** del reloj, que se puede quitar.

### Atajos de teclado en cifras

| Tecla | Acción |
|---|---|
| Números | Elegir ese número (los de varias cifras esperan un instante) |
| `+` `-` `*` `/` | Sumar, restar, multiplicar y dividir (también `x` y `:`) |
| Retroceso | Deshacer la última operación |
| Esc | Cancelar la selección |
| Intro | Entregar el resultado |

Las restas y las divisiones se ordenan solas: da igual si eliges primero el número mayor o el menor. Tras una operación, pulsar otra sigue con su resultado, como en una calculadora.

## Jugar con varios móviles

1. Una persona elige «Varios móviles» → «Crear una sala». Aparece un código de 4 letras y un enlace.
2. Los demás abren el juego, eligen «Varios móviles» → «Unirme a una sala» y escriben el código, o abren el enlace.
3. Cada uno responde en su móvil sin ver lo que escriben los demás. Al acabar el tiempo, o cuando todos han entregado, se revelan las respuestas a la vez.
4. Quien creó la sala maneja el paso entre pruebas y puede dar por válida una palabra que el diccionario rechace.
5. Si alguien pierde la conexión, puede volver a entrar con el mismo nombre y continúa donde estaba.

## Jugar con una pantalla grande

Una tele, un portátil o un proyector enseña el tablero y nadie juega en él:

1. En el dispositivo grande, elige «Varios móviles» → «Crear una sala en una pantalla grande». También puedes abrir directamente `https://thors97.github.io/CifrasYLetras/#pantalla`.
2. Los jugadores escanean el código QR de la pantalla, o escriben el código de 4 letras, desde su móvil.
3. La pantalla y el primer jugador que entró manejan «Empezar», «Siguiente», «Cerrar la prueba», «Dar por válida» y «Otra partida».
4. Hay un botón de pantalla completa. Con pantalla, el sonido sale solo de ella y los móviles van en silencio.

En una tele con navegador (por ejemplo un Fire TV con Silk), guarda la dirección con `#pantalla` como marcador para no tener que teclearla.

## Limitaciones conocidas

- **La sala online necesita conexión a internet.** Usa conexiones directas entre dispositivos (WebRTC) a través de PeerJS, con su servidor público para encontrarse. Entre redes distintas, o con algunos datos móviles, la conexión puede fallar, porque no hay servidor TURN. Lo más fiable es que todos estén en la misma wifi.
- **La sala online y la pantalla grande se han probado con un PeerJS simulado,** no todavía con dispositivos reales. Tampoco se ha probado el manejo con mando en un Fire TV.
- **El modo online no funciona dentro de vistas previas** que bloquean conexiones externas; hay que abrir el juego en una web propia.
- El diccionario puede rechazar alguna palabra válida del DLE. Para eso existe «Dar por válida».

## Cómo abrirlo en local

Abre `index.html` en el navegador (con doble clic vale). No hay que instalar ni compilar nada. La sala online necesita además publicar la carpeta en una web.

Para publicarlo en GitHub Pages: *Settings → Pages → Build and deployment → Deploy from a branch* → rama `main`, carpeta `/ (root)`. El archivo `.nojekyll` evita que GitHub procese los archivos.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Estructura de la página y orden de carga de los scripts. |
| `css/estilos.css` | Estilos, con tema claro y oscuro y la vista de pantalla grande. |
| `js/` | Código del juego, un archivo por parte. Son scripts clásicos (no módulos), que comparten el ámbito global y se cargan en el orden de `index.html`. |
| `js/vendor/qrcode.js` | Generador de códigos QR ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), licencia MIT). |
| `diccionario/palabras.txt` | Lista base de palabras: una por línea, en minúsculas y con tildes. |
| `diccionario/añadidas.txt` | Palabras que añadimos a la lista base. |
| `diccionario/excluidas.txt` | Palabras que quitamos de la lista base. |
| `diccionario/datos.js` | Diccionario comprimido que carga el juego. **Se genera; no se edita a mano.** |
| `scripts/generar-diccionario.js` | Genera `datos.js` a partir de los `.txt`. |

Los archivos de `js/`, en el orden en que se cargan: `utilidades`, `diccionario`, `resolvedor` (cifras), `sorteos`, `estado`, `reloj`, `inicio`, `letras`, `cifras`, `final`, `online` y `arranque`. `tema.js` se carga antes, en la cabecera, para aplicar el tema sin parpadeo.

## Cambiar el diccionario

1. Añade palabras en `diccionario/añadidas.txt` o quítalas con `diccionario/excluidas.txt`, una por línea. Las líneas que empiezan por `#` son comentarios.
2. Regenera el diccionario (hace falta Node.js):

   ```
   node scripts/generar-diccionario.js
   ```

3. Sube los `.txt` y el `datos.js` generado en el mismo commit.

Solo se admiten palabras de 5 a 10 letras.

## Planificación

- [PROXIMOS_PASOS.md](PROXIMOS_PASOS.md): plan de trabajo por fases.
- [ANALISIS.md](ANALISIS.md): análisis técnico y mejoras pendientes.

## Créditos y licencias

- El diccionario se ha elaborado a partir del lemario del Diccionario de la lengua española (DLE) de la Real Academia Española, con sus plurales, femeninos y conjugaciones. Los enlaces de definición llevan a [dle.rae.es](https://dle.rae.es).
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), de Kazuhiko Arase, bajo licencia MIT, incluido en `js/vendor/`.
- [PeerJS](https://peerjs.com), bajo licencia MIT, cargado desde cdnjs solo en la sala online. Si el navegador no admite `DecompressionStream`, se carga [pako](https://github.com/nodeca/pako) desde cdnjs.
- Fuentes [Archivo](https://fonts.google.com/specimen/Archivo) y [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), cargadas desde Google Fonts.
