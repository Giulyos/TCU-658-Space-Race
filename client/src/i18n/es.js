// Spanish UI string catalog. Same keys as en.js. Draft translations — the
// teacher (native speaker) can review/adjust this single file. {var} placeholders
// and { one, other } plural entries mirror en.js.
export default {
  // Pantalla de título (menú principal)
  'home.tagline': 'Carrera de preguntas de inglés para el aula',
  'home.play': 'Jugar',
  'home.language': 'Idioma',

  // Panel de administración
  'admin.title': 'Panel de administración',
  'admin.menu': 'Menú',

  // Estado de la pantalla de juego
  'game.cantReach': 'No se pudo conectar con el servidor del juego.',
  'game.loading': 'Cargando…',
  'game.waiting': 'Esperando a que el docente inicie un juego…',

  // Controles del tablero
  'controls.nextQuestion': 'Siguiente pregunta',
  'controls.home': 'Inicio',
  'controls.pause': 'Pausa',
  'controls.resume': 'Reanudar',
  'controls.mute': 'Silenciar',
  'controls.unmute': 'Activar sonido',

  // Indicador de turno ({name} marca dónde va el nombre del equipo)
  'turn.paused': '⏸ En pausa',
  'turn.turn': 'Turno de {name}',

  // Ventana de pregunta
  'question.correct': 'Correcto',
  'question.incorrect': 'Incorrecto',
  'question.ariaCurrent': 'Pregunta actual',
  'question.points': { one: '{count} punto', other: '{count} puntos' },

  // Cartel de ganador
  'winner.wins': '¡GANA!',
  'winner.ariaWins': '{name} gana',

  // Etiquetas del tablero (accesibilidad)
  'board.aria': 'Tablero de carrera',
  'board.finishAria': 'Planeta de meta',
  'board.shipAria': 'Nave del equipo {team}',

  // Biblioteca de juegos
  'library.title': 'Mis juegos',
  'library.newGame': '+ Nuevo juego',
  'library.empty': 'Aún no hay juegos. Crea tu primer juego para comenzar.',
  'library.inProgress': 'En curso',
  'library.resume': 'Reanudar',
  'library.restart': 'Reiniciar',
  'library.play': 'Jugar',
  'library.edit': 'Editar',
  'library.delete': 'Eliminar',
  'library.confirm': 'Confirmar',
  'library.cancel': 'Cancelar',
  'library.teams': { one: '{count} equipo', other: '{count} equipos' },
  'library.questions': { one: '{count} pregunta', other: '{count} preguntas' },
  'library.restartAria': 'Reiniciar {name}',
  'library.editAria': 'Editar {name}',
  'library.deleteAria': 'Eliminar {name}',
  'library.confirmDeleteAria': 'Confirmar eliminación de {name}',

  // Asistente de configuración
  'wizard.newTitle': 'Nuevo juego',
  'wizard.editTitle': 'Editar: {name}',
  'wizard.step1': 'Paso 1 de 3 — Juego y reglas',
  'wizard.step2': 'Paso 2 de 3 — Nombres de equipos',
  'wizard.step3': 'Paso 3 de 3 — Banco de preguntas',
  'wizard.gameName': 'Nombre del juego',
  'wizard.spacesToWin': 'Casillas para ganar (3–10)',
  'wizard.numTeams': 'Número de equipos',
  'wizard.teamNameLabel': 'Nombre del equipo {n}',
  'wizard.cancel': 'Cancelar',
  'wizard.nextTeams': 'Siguiente: Nombres de equipos',
  'wizard.back': 'Atrás',
  'wizard.nextQuestions': 'Siguiente: Preguntas',
  'wizard.done': 'Listo',
  'wizard.nameRequired': 'El nombre del juego es obligatorio',
  'wizard.everyTeamName': 'Cada equipo necesita un nombre',

  // Banco de preguntas
  'bank.title': 'Banco de preguntas',
  'bank.question': 'Pregunta',
  'bank.correctAnswer': 'Respuesta correcta',
  'bank.pointValue': 'Valor en puntos',
  'bank.addQuestion': 'Agregar pregunta',
  'bank.saveChanges': 'Guardar cambios',
  'bank.cancel': 'Cancelar',
  'bank.edit': 'Editar',
  'bank.delete': 'Eliminar',
  'bank.prev': 'Anterior',
  'bank.next': 'Siguiente',
  'bank.empty': 'Aún no hay preguntas. Agrega una arriba.',
  'bank.colNum': '#',
  'bank.colQuestion': 'Pregunta',
  'bank.colAnswer': 'Respuesta',
  'bank.colPts': 'Pts',
  'bank.colActions': 'Acciones',
  'bank.page': 'Página {current} / {total}',
  'bank.editAria': 'Editar pregunta {id}',
  'bank.deleteAria': 'Eliminar pregunta {id}',
}
