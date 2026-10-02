# Próximos pasos

Resumen de lo hablado hasta ahora y plan de trabajo por fases. El análisis técnico detallado está en [ANALISIS.md](ANALISIS.md).

## Dónde estamos

- El juego completo está en `index.html`, un único archivo sin dependencias de compilación.
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

## Fase 1: mejoras rápidas de jugabilidad (prioridad alta)

Cambios pequeños, sin riesgo y muy visibles.

- [ ] **Cifras: ordenar solo los operandos de restas y divisiones.** Hoy da error si se pulsa primero el número pequeño.
- [ ] **Cifras: elegir cuántos números grandes salen** (25, 50, 75, 100): de 0 a 4, o al azar, igual que se eligen las vocales en letras.
- [ ] **Cifras: atajos de teclado** para números, `+ − × ÷`, Intro, Retroceso y deshacer.
- [ ] **Botón de tema** claro, oscuro o automático. El CSS ya lo admite con `data-theme`.
- [ ] **Validar los ajustes guardados** al cargarlos, para que un valor corrupto en `localStorage` no rompa la partida.

## Fase 2: publicar el juego (prioridad alta)

Es requisito para probar el modo online y la pantalla compartida con dispositivos reales.

- [ ] Publicar en **GitHub Pages**, que es gratis y se activa desde la configuración del repositorio.
- [ ] Añadir un `README.md` con cómo jugar y el enlace.
- [ ] Probar el modo "Varios móviles" con móviles reales, en la misma wifi y con datos móviles.
- [ ] Probar el modo "Por equipos" duplicando la pantalla en la tele.
- [ ] Probar que el juego abre en el navegador Silk del Fire TV.

## Fase 3: pantalla compartida (prioridad media-alta)

- [ ] **Vista "pantalla"** pensada para verse desde lejos: fichas y reloj en grande, código de sala y QR, lista de jugadores, quién ha entregado, revelación de respuestas y marcador.
- [ ] **Paso B:** la pantalla entra como espectador en una sala existente.
- [ ] **Paso A:** refactorizar el anfitrión para que pueda no ser jugador, y que la pantalla cree la sala.
- [ ] **Código QR** con el enlace `#sala=XXXX`.
- [ ] **Controles delegados:** "Siguiente", "Cerrar la prueba ya" y "Dar por válida" desde el móvil del primer jugador.
- [ ] **Navegación con mando** (flechas y OK) para Fire TV.
- [ ] **Sonido y animaciones solo en la pantalla**, silenciados en los móviles.
- [ ] **Pantalla completa** con un botón.

## Fase 4: comodidad y continuidad (prioridad media)

- [ ] **Guardar la partida en curso** (solo y por equipos) y ofrecer continuarla tras recargar la página.
- [ ] **Estadísticas en solitario:** partidas jugadas, mejor puntuación, palabra más larga y cifras exactas.
- [ ] **Resolvedor de cifras más robusto:** no bloquear la página si el worker falla, y mostrar un mensaje claro si se agota el tiempo.
- [ ] **Hacerlo instalable y que funcione sin conexión** (PWA: manifest, service worker e icono).
- [ ] **Fuentes alojadas en el propio repositorio**, en lugar de cargarlas desde Google.

## Fase 5: opcional o a valorar más adelante (prioridad baja)

- [ ] **Escala de puntos por distancia en cifras**, si se confirman las normas.
- [ ] **Modo "palabra de 10 letras"** (anagrama a contrarreloj). Es idea propia; no está confirmado que exista en el concurso.
- [ ] **Servidor TURN** para que el modo online funcione fuera de la misma wifi. Necesita un servicio externo, posiblemente de pago, y credenciales fuera del repositorio.
- [ ] **Separar el código en varios archivos** (CSS, JS y diccionario) con un paso de compilación que siga generando un único HTML.
- [ ] **Tests automáticos** del resolvedor, de la validación de palabras y de la puntuación.

## Lo que no se recomienda hacer

- Un servidor propio con cuentas, ranking global o salas persistentes: rompe el diseño sin backend y añade mantenimiento y datos personales.
- Chat de texto en las salas: aporta poco y abre problemas de moderación.
- Cargar el diccionario desde un servidor: se perdería el juego sin conexión.
- Migrar a un framework como React: sobreingeniería para esta interfaz.
- Que cada invitado valide su propia respuesta: hoy lo valida el anfitrión, que es lo correcto frente a trampas.
