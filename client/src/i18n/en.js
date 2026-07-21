// English UI string catalog. Flat, dot-namespaced keys. Values may contain
// {var} placeholders; plural entries are { one, other } objects selected by a
// `count` variable. These English values must stay identical to what the UI
// showed before i18n (so unit tests that assert English text keep passing).
//
// Teacher-authored data (question text, game/team names) is NOT in here — it is
// never translated. Server error messages are also intentionally left in English.
export default {
  // Title screen (main menu)
  'home.tagline': 'Classroom English quiz race',
  'home.play': 'Play',
  'home.language': 'Language',

  // Admin panel
  'admin.title': 'Admin Panel',
  'admin.menu': 'Menu',

  // Game screen status
  'game.cantReach': 'Could not reach the game server.',
  'game.loading': 'Loading…',
  'game.waiting': 'Waiting for the teacher to launch a game…',

  // Board HUD controls
  'controls.nextQuestion': 'Next Question',
  'controls.home': 'Home',
  'controls.pause': 'Pause',
  'controls.resume': 'Resume',
  'controls.mute': 'Mute',
  'controls.unmute': 'Unmute',

  // Turn indicator ({name} marks where the team name goes)
  'turn.paused': '⏸ Paused',
  'turn.turn': '{name}’s turn',

  // Question popup
  'question.correct': 'Correct',
  'question.incorrect': 'Incorrect',
  'question.ariaCurrent': 'Current question',
  'question.points': { one: '{count} point', other: '{count} points' },

  // Winner banner
  'winner.wins': 'WINS!',
  'winner.ariaWins': '{name} wins',

  // Board aria-labels
  'board.aria': 'Race board',
  'board.finishAria': 'Finish planet',
  'board.shipAria': 'Team {team} spaceship',

  // Game library
  'library.title': 'My Games',
  'library.newGame': '+ New Game',
  'library.empty': 'No games yet. Create your first game to get started.',
  'library.inProgress': 'In progress',
  'library.resume': 'Resume',
  'library.restart': 'Restart',
  'library.play': 'Play',
  'library.edit': 'Edit',
  'library.delete': 'Delete',
  'library.confirm': 'Confirm',
  'library.cancel': 'Cancel',
  'library.teams': { one: '{count} team', other: '{count} teams' },
  'library.questions': { one: '{count} question', other: '{count} questions' },
  'library.restartAria': 'Restart {name}',
  'library.editAria': 'Edit {name}',
  'library.deleteAria': 'Delete {name}',
  'library.confirmDeleteAria': 'Confirm delete {name}',

  // Setup wizard
  'wizard.newTitle': 'New Game',
  'wizard.editTitle': 'Edit: {name}',
  'wizard.step1': 'Step 1 of 3 — Game & rules',
  'wizard.step2': 'Step 2 of 3 — Team names',
  'wizard.step3': 'Step 3 of 3 — Question bank',
  'wizard.gameName': 'Game name',
  'wizard.spacesToWin': 'Spaces to win (3–10)',
  'wizard.numTeams': 'Number of teams',
  'wizard.teamNameLabel': 'Team {n} name',
  'wizard.cancel': 'Cancel',
  'wizard.nextTeams': 'Next: Team names',
  'wizard.back': 'Back',
  'wizard.nextQuestions': 'Next: Questions',
  'wizard.done': 'Done',
  'wizard.nameRequired': 'Game name is required',
  'wizard.everyTeamName': 'Every team needs a name',

  // Question bank
  'bank.title': 'Question Bank',
  'bank.question': 'Question',
  'bank.correctAnswer': 'Correct answer',
  'bank.pointValue': 'Point value',
  'bank.addQuestion': 'Add question',
  'bank.saveChanges': 'Save changes',
  'bank.cancel': 'Cancel',
  'bank.edit': 'Edit',
  'bank.delete': 'Delete',
  'bank.prev': 'Prev',
  'bank.next': 'Next',
  'bank.empty': 'No questions yet. Add one above.',
  'bank.colNum': '#',
  'bank.colQuestion': 'Question',
  'bank.colAnswer': 'Answer',
  'bank.colPts': 'Pts',
  'bank.colActions': 'Actions',
  'bank.page': 'Page {current} / {total}',
  'bank.editAria': 'Edit question {id}',
  'bank.deleteAria': 'Delete question {id}',
}
