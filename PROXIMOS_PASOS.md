# Próximos pasos

Resumen de lo hablado hasta ahora y plan de trabajo por fases. El análisis técnico detallado está en [ANALISIS.md](ANALISIS.md).

## Dónde estamos

- El juego está separado en `index.html`, `css/`, `js/` y `diccionario/`, sin paso de compilación: se abre con doble clic o desde cualquier web estática.
- Tiene tres modos:
  - **Solo:** se responde en pantalla.
  - **Por equipos:** de 2 a 6 equipos con un solo dispositivo; las respuestas se apuntan en papel y luego se introducen.
  - **Varios móviles:** una sala por código, conexión directa entre móviles con WebRTC (PeerJS), y el anfitrión es también jugador.
- El diccionario va incrustado y comprimido, así que el juego funciona sin conexión salvo el modo online.

## Lo que hemos decidido o hablado

- **Pantalla compartida (estilo Jackbox).** Una tele o un portátil muestra el tablero y cada jugador responde en su móvil. Hay dos formas de hacerlo:
  - **A. La pantalla es el anfitrión.** Es la recomendada: crea la sala y lleva la partida, y todos los jugadores son invitados. Obliga a refactorizar el modo online, que hoy da por hecho que el anfitrión es el jugador 0.
  - **B. La pantalla es solo un espectador** de una sala creada desde un móvil. Es más sencilla y sirve como paso intermedio.
- **Fire TV.** Debería poder abrir el juego desde el navegador Silk si está publicado en una URL. La pantalla tendría que manejarse con el mando (flechas y OK), con muy pocos controles. Falta probarlo en el aparato.
- **Alternativa sin programar nada.** Duplicar la pantalla del móvil o del portátil en la tele (Miracast, AirPlay, Chromecast o HDMI) y jugar en modo "Por equipos". Funciona ya hoy.

## Decisiones pendientes

- [ ] ¿Qué dispositivo se usará como pantalla: Fire TV, portátil por HDMI o un móvil duplicado?
- [ ] Pantalla compartida: ¿opción A, B o B y luego A?
- [ ] ¿Quién controla "Siguiente prueba" con pantalla compartida: el primer jugador, la pantalla o ambos?
- [ ] ¿La puntuación de cifras se queda en 10 / 7 o se pasa a una escala por distancia? Hay que confirmar las normas que se quieren.

---

## Fase 0: separar el código y sacar el diccionario (hecha)

Es la base para todo lo demás: hoy cualquier cambio toca un archivo de 425 KB con el diccionario en medio, y el diccionario no se puede corregir porque no está la lista original.

- [x] **Separar en archivos:**
  - `index.html`: solo la estructura.
  - `css/estilos.css`: los estilos.
  - `js/`: un archivo por parte (utilidades, diccionario, cifras, reloj, letras, online…).
  - `diccionario/`: los datos de las palabras.
- [x] **Scripts clásicos (`<script src>`), no módulos ES**, para que el juego siga funcionando al abrir `index.html` con doble clic (`file://`), donde el navegador bloquea `fetch()` y los módulos.
- [x] **Diccionario como archivo `.js`** que deja los datos comprimidos en una variable global. Se carga igual con doble clic que desde una web.
- [x] **Lista de palabras en texto plano** en el repositorio (441.757 palabras), con un script que genera el archivo comprimido a partir de ella. Así se pueden añadir o corregir palabras.
- [x] **Comprobar que todo sigue funcionando igual.** Probado en Chromium abriendo el archivo con doble clic: diccionario, letras y cifras en solitario y modo por equipos, con el mismo resultado que la versión anterior.
- [ ] **Probar el modo "Varios móviles"** con dispositivos reales: no se pudo probar en el entorno de desarrollo, aunque su código no ha cambiado.

Esta fase no cambia nada de lo que ve el jugador.

## Fase 1: mejoras rápidas de jugabilidad (hecha)

- [x] **Cifras: restas y divisiones en cualquier orden.** Se pone primero el número mayor automáticamente.
- [x] **Cifras: elegir cuántos números grandes salen** (25, 50, 75, 100): de 0 a 4, o al azar. Por equipos elige un equipo cada vez, empezando por uno distinto al de las letras. En "Varios móviles" siguen saliendo al azar.
- [x] **Cifras: encadenar operaciones** como en una calculadora: tras un resultado, pulsar una operación sigue con ese resultado.
- [x] **Cifras: atajos de teclado.** Se escriben los números y `+ − × ÷` (o `* /`); Retroceso deshace, Esc cancela la selección e Intro entrega. Solo se muestra la ayuda en dispositivos con ratón.
- [x] **Botón de tema** automático, claro u oscuro, que se recuerda entre visitas.
- [x] **Validar los ajustes guardados** al cargarlos: cada valor no válido se sustituye por el de por defecto.
- [x] **Repaso visual** en móvil y escritorio, claro y oscuro: botón de tema compacto con icono (ya no descuadra la cabecera en móvil), reloj "Sin límite de tiempo" como etiqueta en vez de círculo, fichas de cifras que ya no se desvanecen al ver los resultados y tabla final que cabe en pantallas estrechas.
- [ ] **Online: un nombre repetido puede quitarle el sitio a otro jugador** (ANALISIS.md, 1.3). Aplazado porque el modo online no es prioritario.

## Fase 2: publicar el juego (prioridad alta)

Es requisito para probar el modo online y la pantalla compartida con dispositivos reales.

- [ ] Publicar en **GitHub Pages**: en el repositorio, *Settings → Pages → Build and deployment*, elegir *Deploy from a branch*, la rama y la carpeta `/ (root)`. La web queda en `https://<usuario>.github.io/<repositorio>/`.
- [ ] Añadir el enlace al `README.md`.
- [ ] Probar el modo "Varios móviles" con móviles reales, en la misma wifi y con datos móviles.
- [ ] Probar el modo "Por equipos" duplicando la pantalla en la tele.
- [ ] Probar que el juego abre en el navegador Silk del Fire TV.

## Fase 3: pantalla compartida (hecha)

- [x] **Vista "pantalla"** para verse desde lejos: fichas y reloj grandes, código de sala con QR, lista de jugadores, quién falta por entregar, revelación de respuestas y marcador.
- [x] **La pantalla es el anfitrión** (opción A): crea la sala y lleva la partida sin jugar; todos los jugadores son invitados. Se elige en «Varios móviles → Crear una sala en una pantalla grande». También vale abrir la dirección terminada en `#pantalla`.
- [x] **Código QR** con el enlace `#sala=XXXX`, generado con `qrcode-generator` (MIT) incluido en `js/vendor/`, así que funciona sin CDN.
- [x] **Controles delegados:** "Empezar", "Siguiente", "Cerrar la prueba ya", "Dar por válida" y "Otra partida" los tienen la pantalla y el primer jugador que entró.
- [x] **Sin sonido en los móviles** cuando hay pantalla: suena solo ella.
- [x] **Pantalla completa** con un botón.
- [x] **Foco para el mando** (flechas y OK): en la pantalla el foco queda en el botón principal de cada vista.
- [x] **Probado con tres pestañas** (pantalla y dos móviles) y un PeerJS simulado: sala, QR, vocales, letras, cifras, cierre de prueba desde la pantalla, "Siguiente" desde la pantalla y desde un móvil, reconexión de un jugador a mitad de partida, otra partida y salir.
- [ ] **Probar en dispositivos reales:** tele o Fire TV con Silk, y móviles por wifi y por datos. No se ha podido probar con el servidor real de PeerJS.
- [ ] **Navegación con mando en Fire TV:** comprobar que las flechas llegan a todos los botones.
- [ ] **Modo espectador (opción B)**, para ver una sala ya creada desde un móvil. No se ha hecho; la opción A cubre el caso de uso.

## Fase 4: comodidad y continuidad (prioridad media)

- [x] **Pantalla «Cómo jugar»:** botón `?` en la cabecera (y tecla `?`) con apartados de letras, cifras y en grupo, un ejemplo comprobado con el motor del juego en cada prueba, y un aviso la primera vez que se entra. Para el reloj mientras se lee, salvo en una sala online.
- [ ] **Guardar la partida en curso** (solo y por equipos) y ofrecer continuarla tras recargar la página.
- [ ] **Estadísticas en solitario:** partidas jugadas, mejor puntuación, palabra más larga y cifras exactas.
- [ ] **Resolvedor de cifras más robusto:** no bloquear la página si el worker falla, y mostrar un mensaje claro si se agota el tiempo.
- [ ] **Hacerlo instalable y que funcione sin conexión** (PWA: manifest, service worker e icono).
- [ ] **Fuentes alojadas en el propio repositorio**, en lugar de cargarlas desde Google.

## Fase 5: opcional o a valorar más adelante (prioridad baja)

- [ ] **Escala de puntos por distancia en cifras**, si se confirman las normas.
- [ ] **Modo "palabra de 10 letras"** (anagrama a contrarreloj). Es idea propia; no está confirmado que exista en el concurso.
- [ ] **Servidor TURN** para que el modo online funcione fuera de la misma wifi. Necesita un servicio externo, posiblemente de pago, y credenciales fuera del repositorio.
- [ ] **Tests automáticos** del resolvedor, de la validación de palabras y de la puntuación.

## Lo que no se recomienda hacer

- Un servidor propio con cuentas, ranking global o salas persistentes: rompe el diseño sin backend y añade mantenimiento y datos personales.
- Chat de texto en las salas: aporta poco y abre problemas de moderación.
- Cargar el diccionario desde un servidor externo: se perdería el juego sin conexión. Sacarlo a un archivo propio del juego (fase 0) sí es buena idea.
- Migrar a un framework como React: sobreingeniería para esta interfaz.
- Que cada invitado valide su propia respuesta: hoy lo valida el anfitrión, que es lo correcto frente a trampas.
