# Análisis de la aplicación

Revisión del código de `index.html`: puntos fuertes y partes mejorables, ordenadas por fases según la prioridad. Las referencias de línea apuntan a `index.html` en el commit inicial. El plan de trabajo está en [PROXIMOS_PASOS.md](PROXIMOS_PASOS.md).

## Cómo está construida

| Parte | Líneas | Qué hace |
|---|---|---|
| Estilos | 11–239 | Tema claro y oscuro con variables CSS, diseño adaptable a móvil y respeto a `prefers-reduced-motion`. |
| Diccionario | 263, 300–355 | Lista de palabras en gzip + base64 dentro del HTML. Se descomprime con `DecompressionStream`, o con `pako` desde cdnjs si el navegador no lo tiene. |
| Resolvedor de cifras | 358–425 | Búsqueda exhaustiva con memoria. Corre en un Web Worker y, si falla, en el hilo principal. |
| Sorteos | 428–439 | Bolsas de vocales y consonantes; 6 números de un grupo de 24 y un objetivo entre 100 y 999. |
| Reloj | 453–498 | Reloj circular con pausa, avisos sonoros y anuncios para lectores de pantalla. |
| Modos solo y por equipos | 515–1172 | Pantallas de inicio, letras, cifras (con el constructor de operaciones) y clasificación final. |
| Modo varios móviles | 1176–1650 | Sala con PeerJS. El anfitrión reparte, valida las respuestas y puntúa; los invitados solo responden. |

## Puntos fuertes (conviene mantenerlos)

- **Accesibilidad muy cuidada:** regiones `aria-live`, foco gestionado en cada pantalla, etiquetas en todos los botones, enlace para saltar al juego y animaciones reducidas si el sistema lo pide.
- **Funciona sin conexión**, con el diccionario incluido en el propio archivo.
- **Sin dependencias ni paso de compilación:** basta con abrir el archivo.
- **El anfitrión valida las respuestas online** (`verifyAnswer`, línea 1388), así que un invitado no puede hacer trampas enviando un resultado inventado.
- **Escapado de HTML coherente** con `esc()` en los nombres y palabras que escriben los jugadores.
- **Reconexión:** un jugador que pierde la conexión vuelve a entrar con su nombre y sigue donde estaba.

---

## Fase 0: lo primero (base para todo lo demás)

### 0.1 Todo está en un solo archivo de 425 KB
- **Problema:** unas 1.400 líneas de código con funciones globales, CSS y el diccionario en medio. Cada cambio de las fases siguientes toca este archivo, y los diffs son difíciles de revisar en git.
- **Mejora:** separar en `index.html`, `css/` y `js/` (un archivo por parte del juego).
- **Condición:** usar scripts clásicos (`<script src>`), no módulos ES, para que el juego siga funcionando al abrir `index.html` con doble clic. Con `file://` el navegador bloquea `fetch()` y los módulos.

### 0.2 El diccionario está incrustado y no se puede regenerar
- **Dónde:** línea 263.
- **Problema:** el repositorio solo tiene el diccionario ya comprimido en base64 (441.756 palabras), sin la lista original ni el script que lo genera. Corregir o añadir una palabra es muy difícil.
- **Mejora:**
  - Guardar la lista de palabras en texto plano en el repositorio.
  - Añadir un script que genere el archivo comprimido a partir de ella.
  - Cargar el diccionario desde un archivo `.js` propio que deje los datos en una variable global, para que también funcione con doble clic.

---

## Fase 1: prioridad alta

Problemas de uso que se notan en cada partida, o riesgos con arreglo sencillo.

### 1.1 Las restas y divisiones exigen un orden concreto
- **Dónde:** constructor de cifras, líneas 1007–1008.
- **Problema:** si se pulsa primero el número menor, sale un error ("pon primero el número mayor"). En la tele se dice "100 entre 4" o "4 de 100" indistintamente.
- **Mejora:** ordenar los operandos automáticamente cuando el orden contrario es válido.

### 1.2 No se puede elegir cuántos números grandes salen
- **Dónde:** `drawNumbers`, líneas 435–439.
- **Problema:** salen 6 números al azar de un grupo de 24. En letras se eligen las vocales, pero en cifras no hay ninguna decisión equivalente.
- **Mejora:** elegir de 0 a 4 números grandes (25, 50, 75, 100), o al azar.

### 1.3 Un nombre repetido puede quitarle el sitio a otro jugador online
- **Dónde:** `hostHello`, líneas 1313–1320.
- **Problema:** con la partida empezada, si alguien entra con el nombre de un jugador que sigue conectado, se cierra la conexión del original y el recién llegado ocupa su sitio. Sirve para reconectar, pero también para suplantar a alguien sin querer, por ejemplo dos personas que se llaman igual.
- **Mejora:** dar a cada jugador un identificador secreto al entrar y guardarlo en `sessionStorage`. Solo quien lo tenga puede recuperar el sitio.

### 1.4 Los ajustes guardados no se validan
- **Dónde:** línea 443.
- **Problema:** se mezclan con los valores por defecto sin comprobar nada. Un valor corrupto en `localStorage`, como `rounds: "abc"`, deja la partida en un estado raro.
- **Mejora:** comprobar cada campo contra los valores permitidos.

### 1.5 No hay botón de tema
- **Dónde:** el CSS ya define `[data-theme="dark"]` y `[data-theme="light"]` (líneas 24–43), pero ningún código lo usa.
- **Mejora:** añadir un botón claro, oscuro o automático en la cabecera y guardar la elección.

---

## Fase 2: prioridad media-alta

Mejoras de robustez y de la experiencia en grupo.

### 2.1 El modo online depende de servicios públicos sin respaldo
- **Dónde:** líneas 1176 y 1186–1190.
- **Problema:** usa el servidor de señalización público de PeerJS y solo STUN, sin servidor TURN. Con datos móviles o en algunas redes la conexión falla, y el mensaje de error solo lo sugiere.
- **Mejora a corto plazo:** publicar el juego y probarlo en redes reales. Explicar mejor en el error qué está pasando y qué se puede hacer.
- **Mejora a largo plazo:** un servidor TURN propio o de un proveedor (ver fase 5).

### 2.2 El anfitrión siempre es el jugador 0
- **Dónde:** líneas 1253, 1312, 1341–1345 y 1515.
- **Problema:** el código da por hecho en muchos sitios que el anfitrión juega y está en `players[0]`. Eso impide que una tele sea el anfitrión sin jugar.
- **Mejora:** separar el anfitrión de la lista de jugadores. Es el refactor necesario para la pantalla compartida (opción A en PROXIMOS_PASOS.md).

### 2.3 Los invitados se fían por completo del anfitrión
- **Dónde:** `staticBoard` (líneas 1612–1617), `cifrasResultsHtml` (líneas 1102–1103) y las fichas del código de sala (línea 1542).
- **Problema:** algunos datos que llegan del anfitrión se pintan con `innerHTML` sin escapar: letras, números, código de sala y resultados de cifras. Un anfitrión malicioso podría inyectar código en los móviles de los invitados. El riesgo es bajo, porque se juega con conocidos, pero el arreglo es trivial.
- **Mejora:** escapar con `esc()` o convertir a número todo lo que llegue por la red antes de pintarlo.

### 2.4 Las librerías externas se cargan sin control de integridad
- **Dónde:** líneas 307 (`pako`) y 1176 (`peerjs`).
- **Problema:** se cargan desde cdnjs sin el atributo `integrity`. Si el CDN sirviera un archivo alterado, se ejecutaría tal cual.
- **Mejora:** añadir el hash SRI y `crossorigin` en `loadScript`.

### 2.5 El modo por equipos es lento en cifras
- **Dónde:** `cifrasTeamAnswer`, líneas 1062–1081.
- **Problema:** cada equipo repite sus operaciones uno detrás de otro en el mismo dispositivo. Con 4 o más equipos se hace largo.
- **Mejora:** la pantalla compartida lo resuelve, porque cada equipo responde en su móvil. Mientras tanto, permitir escribir solo el número final y comprobarlo después solo si hay empate o duda.

### 2.6 En el modo por equipos las palabras no se validan al escribirlas
- **Dónde:** `letrasTeamAnswers`, líneas 812–824.
- **Problema:** en solitario se avisa al momento si falta una letra (líneas 776–788), pero en el modo por equipos solo se descubre en los resultados.
- **Mejora:** reutilizar la misma validación en vivo en cada campo.

---

## Fase 3: prioridad media

Continuidad y comodidad.

### 3.1 Recargar la página borra la partida
- **Problema:** solo se guardan los ajustes (`cyl-ajustes`); el estado de la partida se pierde.
- **Mejora:** guardar `S.game` al acabar cada prueba y ofrecer continuar al volver.

### 3.2 El resolvedor puede bloquear la página
- **Dónde:** `solveAsync`, líneas 411–425.
- **Problema:** si el worker falla o tarda más de 9 s, el cálculo se repite en el hilo principal sin límite de tiempo, y la pestaña puede congelarse.
- **Mejora:** limitar la búsqueda en el hilo principal (por número de nodos o por tiempo) y, si se agota, mostrar "no se ha podido calcular la mejor solución" en lugar de bloquearse.

### 3.3 No hay estadísticas
- **Mejora:** en solitario, guardar partidas jugadas, mejor puntuación, palabra más larga y cifras exactas.

### 3.4 No se puede instalar ni hay icono
- **Problema:** no hay `manifest`, `service worker` ni `favicon`.
- **Mejora:** convertirlo en PWA. Requiere publicarlo antes en una URL.

### 3.5 Las fuentes vienen de Google
- **Dónde:** líneas 8–10.
- **Problema:** sin conexión el diseño cambia, y se envían datos a Google en cada visita.
- **Mejora:** alojar las fuentes en el repositorio.

### 3.6 Algunos textos de ayuda tienen contexto que no aplica a todos
- **Dónde:** línea 1263, que menciona Claude en un mensaje para el jugador.
- **Mejora:** revisar los mensajes de error para que valgan para cualquier sitio donde se aloje el juego.

---

## Fase 4: prioridad baja (mantenimiento)

### 4.1 No hay tests
- **Mejora:** tests automáticos de las partes con lógica pura: `solveCifras`, `checkWord`, `letrasPointsOf`, `cifrasPointsOf` y `verifyAnswer`. Será mucho más fácil después de la fase 0.

### 4.2 El README está vacío
- **Mejora:** explicar qué es, cómo se juega, cómo se publica y cómo se regenera el diccionario.

---

## Fase 5: a valorar

- **Servidor TURN** para que el modo online funcione fuera de la misma red. Necesita un servicio externo y credenciales fuera del repositorio.
- **Escala de puntos por distancia en cifras.** Hoy es 10 por la exacta y 7 por la más cercana; hay que confirmar qué normas se quieren.
- **Pistas en solitario,** por ejemplo mostrar una palabra de 5 letras o el primer paso de cifras, con penalización de puntos.
