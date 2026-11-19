// Catálogo de ejercicios, plan de entrenamiento y logros.
// Todo en un solo lugar para poder editar la rutina sin tocar la lógica.

const EXERCISES = {
  // ---- Tren superior ----
  press_pecho_maq: {
    name: 'Press de pecho en máquina', group: 'Pecho', zone: 'upper',
    tips: ['Espalda y cabeza apoyadas, omóplatos juntos y hacia abajo.', 'Agarres a la altura del medio del pecho.', 'Empujá sin trabar los codos y volvé lento (2-3 s).'],
    q: 'press de pecho en maquina tecnica correcta',
  },
  jalon_pecho: {
    name: 'Jalón al pecho', group: 'Espalda', zone: 'upper',
    tips: ['Agarre un poco más ancho que los hombros.', 'Llevá la barra a la parte alta del pecho tirando con los codos hacia abajo.', 'No te balancees: el torso apenas inclinado hacia atrás.'],
    q: 'jalon al pecho tecnica correcta',
  },
  press_hombro_manc: {
    name: 'Press de hombros con mancuernas (sentado)', group: 'Hombros', zone: 'upper',
    tips: ['Banco a 80-90°, espalda apoyada.', 'Mancuernas a la altura de las orejas, codos un poco adelante.', 'Subí sin chocar las mancuernas arriba; no arquees la zona lumbar.'],
    q: 'press de hombros con mancuernas sentado tecnica',
  },
  remo_polea: {
    name: 'Remo sentado en polea', group: 'Espalda', zone: 'upper',
    tips: ['Pecho alto, espalda neutra.', 'Tirá hacia el ombligo juntando los omóplatos.', 'Estirá los brazos controlando, sin redondear la espalda.'],
    q: 'remo sentado en polea baja tecnica correcta',
  },
  elev_laterales: {
    name: 'Elevaciones laterales', group: 'Hombros', zone: 'upper',
    tips: ['Codos apenas flexionados.', 'Subí hasta la altura de los hombros, no más.', 'Peso liviano y control: sin impulso.'],
    q: 'elevaciones laterales mancuernas tecnica correcta',
  },
  curl_manc: {
    name: 'Curl de bíceps con mancuernas', group: 'Brazos', zone: 'upper',
    tips: ['Codos pegados al cuerpo y quietos.', 'Girá la palma hacia arriba al subir.', 'Bajá lento hasta estirar casi del todo.'],
    q: 'curl de biceps con mancuernas tecnica correcta',
  },
  ext_triceps_polea: {
    name: 'Extensión de tríceps en polea', group: 'Brazos', zone: 'upper',
    tips: ['Codos fijos a los costados.', 'Extendé hasta abajo y apretá el tríceps.', 'Volvé hasta 90° sin que se te suban los codos.'],
    q: 'extension de triceps en polea tecnica correcta',
  },
  press_inclinado_manc: {
    name: 'Press inclinado con mancuernas', group: 'Pecho', zone: 'upper',
    tips: ['Banco a 30°.', 'Mancuernas bajan a los costados del pecho, codos a ~45°.', 'Pies firmes y omóplatos juntos.'],
    q: 'press inclinado con mancuernas tecnica correcta',
  },
  remo_manc: {
    name: 'Remo con mancuerna a un brazo', group: 'Espalda', zone: 'upper',
    tips: ['Rodilla y mano apoyadas en el banco, espalda plana.', 'Llevá la mancuerna hacia la cadera.', 'No gires el torso para subir.'],
    q: 'remo con mancuerna a una mano tecnica correcta',
  },
  jalon_neutro: {
    name: 'Jalón agarre neutro (o dominadas asistidas)', group: 'Espalda', zone: 'upper',
    tips: ['Palmas enfrentadas.', 'Pecho hacia la barra, codos hacia las costillas.', 'Si usás la máquina asistida, más contrapeso = más fácil.'],
    q: 'jalon agarre neutro tecnica correcta',
  },
  peck_deck: {
    name: 'Aperturas en máquina (peck deck)', group: 'Pecho', zone: 'upper',
    tips: ['Codos levemente flexionados y a la altura del pecho.', 'Juntá los brazos como abrazando un árbol.', 'Abrí lento, sin ir más atrás de la línea del cuerpo.'],
    q: 'aperturas en maquina peck deck tecnica',
  },
  face_pull: {
    name: 'Face pull en polea', group: 'Hombros', zone: 'upper',
    tips: ['Polea a la altura de la cara, soga.', 'Tirá hacia la frente separando las manos.', 'Excelente para postura y hombros sanos.'],
    q: 'face pull polea tecnica correcta',
  },
  curl_martillo: {
    name: 'Curl martillo', group: 'Brazos', zone: 'upper',
    tips: ['Palmas enfrentadas todo el recorrido.', 'Codos quietos.', 'Sin balancear el cuerpo.'],
    q: 'curl martillo tecnica correcta',
  },
  press_frances: {
    name: 'Press francés con barra Z o mancuernas', group: 'Brazos', zone: 'upper',
    tips: ['Acostado, brazos verticales.', 'Bajá doblando solo los codos hacia la frente.', 'Codos apuntando al techo, no hacia afuera.'],
    q: 'press frances tecnica correcta',
  },
  flexiones: {
    name: 'Flexiones de brazos', group: 'Pecho', zone: 'upper', bodyweight: true,
    tips: ['Hasta que queden 1-2 reps en reserva.', 'Si cuestan, manos apoyadas en un banco; cuando salgan más de 15, bajá la altura hasta el piso.', 'Cuerpo recto, codos a ~45°.'],
    q: 'flexiones de brazos tecnica correcta',
  },
  // ---- Tren inferior ----
  prensa: {
    name: 'Prensa de piernas', group: 'Piernas', zone: 'lower',
    tips: ['Pies al ancho de hombros en el medio de la plataforma.', 'Bajá hasta ~90° sin despegar la cola del asiento.', 'No trabes las rodillas arriba.'],
    q: 'prensa de piernas 45 tecnica correcta',
  },
  curl_femoral: {
    name: 'Curl femoral (máquina)', group: 'Piernas', zone: 'lower',
    tips: ['Rodilla alineada con el eje de la máquina.', 'Flexioná hasta el máximo y apretá.', 'Volvé lento, sin dejar caer el peso.'],
    q: 'curl femoral maquina tecnica correcta',
  },
  ext_cuadriceps: {
    name: 'Extensión de cuádriceps', group: 'Piernas', zone: 'lower',
    tips: ['Espalda apoyada, agarrate de los mangos.', 'Extendé y sostené 1 s arriba.', 'Bajá controlando.'],
    q: 'extension de cuadriceps maquina tecnica correcta',
  },
  hip_thrust: {
    name: 'Hip thrust (o puente de glúteos)', group: 'Glúteos', zone: 'lower',
    tips: ['Espalda alta apoyada en el banco, mentón al pecho.', 'Empujá con los talones y apretá glúteos arriba.', 'Arriba, el torso queda paralelo al piso; sin arquear la lumbar.'],
    q: 'hip thrust tecnica correcta',
  },
  gemelos_pie: {
    name: 'Gemelos de pie', group: 'Piernas', zone: 'lower',
    tips: ['Recorrido completo: abajo estirá, arriba en puntas.', 'Pausa de 1 s arriba.', 'Sin rebotar.'],
    q: 'elevacion de talones de pie gemelos tecnica',
  },
  sentadilla_goblet: {
    name: 'Sentadilla goblet', group: 'Piernas', zone: 'lower',
    tips: ['Mancuerna pegada al pecho.', 'Bajá con el pecho alto, rodillas siguiendo la punta de los pies.', 'Bajá hasta donde mantengas la espalda neutra.'],
    q: 'sentadilla goblet tecnica correcta',
  },
  pm_rumano: {
    name: 'Peso muerto rumano con mancuernas', group: 'Glúteos', zone: 'lower',
    tips: ['Rodillas apenas flexionadas y fijas.', 'Llevá la cadera hacia atrás, mancuernas pegadas a las piernas.', 'Espalda recta siempre; bajá hasta sentir el femoral estirado.'],
    q: 'peso muerto rumano con mancuernas tecnica correcta',
  },
  estocadas: {
    name: 'Estocadas (zancadas) con mancuernas', group: 'Piernas', zone: 'lower',
    tips: ['Paso largo, torso erguido.', 'La rodilla de atrás baja cerca del piso.', 'Las reps son por pierna.'],
    q: 'estocadas con mancuernas tecnica correcta',
  },
  abduccion: {
    name: 'Abducción de cadera (máquina)', group: 'Glúteos', zone: 'lower',
    tips: ['Espalda apoyada o levemente inclinado hacia adelante.', 'Abrí con control y pausa afuera.', 'Volvé sin que choquen las placas.'],
    q: 'abduccion de cadera maquina tecnica',
  },
  gemelos_sentado: {
    name: 'Gemelos sentado', group: 'Piernas', zone: 'lower',
    tips: ['Rodillas bajo el apoyo.', 'Recorrido completo y lento.', 'Pausa arriba.'],
    q: 'gemelos sentado maquina tecnica',
  },
  // ---- Core ----
  plancha: {
    name: 'Plancha', group: 'Core', zone: 'core', time: true,
    tips: ['Codos debajo de los hombros.', 'Cuerpo en línea recta: apretá abdomen y glúteos.', 'Respirá normal. Se registra en segundos.'],
    q: 'plancha abdominal tecnica correcta',
  },
  dead_bug: {
    name: 'Dead bug', group: 'Core', zone: 'core',
    tips: ['Boca arriba, zona lumbar pegada al piso.', 'Estirá brazo y pierna contrarios, lento.', 'Las reps son por lado.'],
    q: 'dead bug ejercicio tecnica',
  },
  pallof: {
    name: 'Pallof press', group: 'Core', zone: 'core',
    tips: ['De costado a la polea, manos al pecho.', 'Empujá al frente sin dejar que te gire.', 'Las reps son por lado.'],
    q: 'pallof press tecnica',
  },
  crunch_polea: {
    name: 'Crunch en polea', group: 'Core', zone: 'core',
    tips: ['De rodillas, soga a los costados de la cabeza.', 'Enroscá el torso llevando codos a los muslos.', 'La cadera no se mueve.'],
    q: 'crunch en polea alta tecnica',
  },
  elev_piernas: {
    name: 'Elevación de piernas acostado', group: 'Core', zone: 'core',
    tips: ['Boca arriba, manos bajo la cola, lumbar pegada al piso.', 'Subí las piernas rectas hasta 90° y bajá lento sin tocar el piso.'],
    q: 'elevacion de piernas acostado abdominales tecnica',
  },
  plancha_lateral: {
    name: 'Plancha lateral (por lado)', group: 'Core', zone: 'core', time: true,
    tips: ['Codo bajo el hombro, cadera alta y cuerpo en línea recta.', 'Hacé el tiempo de cada serie de un lado y después del otro. Se registra en segundos por lado.'],
    q: 'plancha lateral tecnica correcta',
  },
  // ---- Cardio ----
  cardio_z2: {
    name: 'Cardio zona 2 (bici fija, cinta inclinada o elíptico)', group: 'Cardio', zone: 'cardio', cardio: true,
    tips: ['Ritmo en el que podés hablar pero no cantar.', 'Si tenés reloj: ~60-70% de tu frecuencia máxima (≈ 125-140 ppm).', 'Se registra en minutos.'],
    q: 'cardio zona 2 que es como hacerlo',
  },
};

// Fases del plan de reintroducción (semanas desde el inicio).
const PHASES = [
  { id: 1, from: 1, to: 1, name: 'Fase 1 · Adaptación', sets: 2, reps: [10, 12], rir: '3', time: [20, 30], cardio: 25,
    desc: 'Una semana para retomar la técnica y que el cuerpo se acostumbre. Terminá cada serie sintiendo que podrías hacer 3 reps más. Es normal tener agujetas los primeros días.' },
  { id: 2, from: 2, to: 3, name: 'Fase 2 · Base', sets: 3, reps: [10, 12], rir: '2', time: [30, 45], cardio: 30,
    desc: 'Sumamos una serie. Te tienen que quedar 2 reps en reserva.' },
  { id: 3, from: 4, to: 6, name: 'Fase 3 · Progresión', sets: 3, reps: [8, 12], rir: '1-2', time: [45, 60], cardio: 35, compoundSets: 4,
    desc: 'Ya podés apretar más: 1-2 reps en reserva y 4 series en los ejercicios básicos. La app te va a pedir subir peso seguido.' },
  { id: 4, from: 7, to: 999, name: 'Construcción', sets: 3, reps: [8, 12], rir: '1-2', time: [45, 60], cardio: 40, compoundSets: 4,
    desc: 'Plan de reintroducción terminado. Doble progresión: cuando completás todas las series en el tope de reps, subís peso.' },
];

const COMPOUNDS = ['press_pecho_maq', 'jalon_pecho', 'prensa', 'press_inclinado_manc', 'remo_manc', 'sentadilla_goblet', 'pm_rumano', 'hip_thrust'];

// Rutina semanal: 1 = lunes ... 5 = viernes
// fixedSets: ejercicios de cierre con series fijas. rir: reemplaza el RIR de la fase ese día.
const ROUTINE = {
  1: { key: 'sup_a', name: 'Tren superior A', emoji: '💪', ex: ['press_pecho_maq', 'jalon_pecho', 'press_hombro_manc', 'remo_polea', 'elev_laterales', 'curl_manc', 'ext_triceps_polea', 'flexiones', 'dead_bug'], fixedSets: { flexiones: 2, dead_bug: 2 } },
  2: { key: 'inf_a', name: 'Tren inferior A', emoji: '🦵', ex: ['prensa', 'curl_femoral', 'ext_cuadriceps', 'hip_thrust', 'gemelos_pie', 'plancha', 'elev_piernas'], fixedSets: { plancha: 2, elev_piernas: 2 } },
  3: { key: 'acc', name: 'Hombros, brazos y core', emoji: '💪', ex: ['elev_laterales', 'face_pull', 'curl_manc', 'ext_triceps_polea', 'pallof', 'plancha'], rir: '2-3',
       note: 'Día más liviano: dejá 2-3 reps en reserva aunque la fase diga menos, para no llegar cansado al jueves.' },
  4: { key: 'sup_b', name: 'Tren superior B', emoji: '💪', ex: ['press_inclinado_manc', 'remo_manc', 'jalon_neutro', 'peck_deck', 'face_pull', 'curl_martillo', 'press_frances', 'flexiones', 'plancha_lateral'], fixedSets: { flexiones: 2, plancha_lateral: 2 } },
  5: { key: 'inf_b', name: 'Tren inferior B', emoji: '🦵', ex: ['sentadilla_goblet', 'pm_rumano', 'estocadas', 'abduccion', 'gemelos_sentado', 'crunch_polea', 'plancha'], fixedSets: { crunch_polea: 2, plancha: 2 } },
};

// Guía de bici por día (0 = domingo ... 6 = sábado)
const BIKE_GUIDE = {
  intro: 'Si el mismo día hay gym y bici: primero el gym y después la bici. Casi todos los días, 30-60 min suave (zona 2: podés hablar pero no cantar).',
  days: {
    1: 'Bici: solo suave (30-60 min), mañana hay piernas.',
    2: 'Bici: después del gym, 20-40 min suave.',
    3: 'Bici: 30-60 min suave.',
    4: 'Bici: solo suave (30-60 min), mañana hay piernas.',
    5: 'Bici: después del gym, 20-40 min suave.',
    6: 'Bici: salida larga de 1-2 h. Desde la semana 3, este día va la salida exigente de la semana.',
    0: 'Bici: salida larga de 1-2 h a ritmo suave (si no la hiciste el sábado).',
  },
};

const LEVEL_TITLES = [
  [1, 'Reiniciando'], [3, 'Novato decidido'], [6, 'Constante'], [10, 'En forma'],
  [15, 'Atleta'], [20, 'Máquina'], [30, 'Leyenda'],
];

const GROUPS = ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Glúteos', 'Core', 'Cardio'];

// Logros: check(stats) devuelve true cuando se desbloquea.
const ACHIEVEMENTS = [
  { id: 'first_workout', em: '🏁', name: 'Primer paso', desc: 'Completá tu primer entrenamiento', check: s => s.workouts >= 1 },
  { id: 'week_full', em: '📅', name: 'Semana perfecta', desc: '5 entrenamientos en una misma semana', check: s => s.bestWeek >= 5 },
  { id: 'w10', em: '🔟', name: 'Diez de diez', desc: '10 entrenamientos', check: s => s.workouts >= 10 },
  { id: 'w25', em: '🥉', name: 'Hábito formado', desc: '25 entrenamientos', check: s => s.workouts >= 25 },
  { id: 'w50', em: '🥈', name: 'Medio centenar', desc: '50 entrenamientos', check: s => s.workouts >= 50 },
  { id: 'w100', em: '🥇', name: 'Centurión', desc: '100 entrenamientos', check: s => s.workouts >= 100 },
  { id: 'streak10', em: '🔥', name: 'En racha', desc: 'Racha de 10 días hábiles', check: s => s.bestStreak >= 10 },
  { id: 'streak20', em: '🌋', name: 'Un mes sin faltar', desc: 'Racha de 20 días hábiles', check: s => s.bestStreak >= 20 },
  { id: 'phase1', em: '🎓', name: 'Reintroducción completa', desc: 'Llegá a la semana 7 entrenando', check: s => s.maxWeekTrained >= 7 },
  { id: 'pr1', em: '⚡', name: 'Récord personal', desc: 'Superá tu mejor marca en un ejercicio', check: s => s.prs >= 1 },
  { id: 'pr25', em: '🚀', name: 'Rompe récords', desc: '25 récords personales', check: s => s.prs >= 25 },
  { id: 'weigh1', em: '⚖️', name: 'Punto de partida', desc: 'Registrá tu peso por primera vez', check: s => s.weighIns >= 1 },
  { id: 'lost2', em: '📉', name: '-2 kg', desc: 'Bajá 2 kg desde tu peso inicial', check: s => s.lost >= 2 },
  { id: 'lost5', em: '🎯', name: '-5 kg', desc: 'Bajá 5 kg desde tu peso inicial', check: s => s.lost >= 5 },
  { id: 'lost10', em: '🏆', name: '-10 kg', desc: 'Bajá 10 kg desde tu peso inicial', check: s => s.lost >= 10 },
  { id: 'bike50', em: '🚲', name: 'De vuelta al pedal', desc: '50 km en bici', check: s => s.bikeKm >= 50 },
  { id: 'bike100', em: '🛣️', name: '100 km en bici', desc: '100 km acumulados en bici', check: s => s.bikeKm >= 100 },
  { id: 'bike500', em: '🗺️', name: 'Ruta larga', desc: '500 km acumulados en bici', check: s => s.bikeKm >= 500 },
  { id: 'habits7', em: '✨', name: 'Hábitos de acero', desc: '7 días seguidos con los 3 hábitos', check: s => s.habitStreak >= 7 },
  { id: 'lvl5', em: '⭐', name: 'Nivel 5', desc: 'Alcanzá el nivel 5', check: s => s.level >= 5 },
  { id: 'lvl10', em: '🌟', name: 'Nivel 10', desc: 'Alcanzá el nivel 10', check: s => s.level >= 10 },
  { id: 'lvl20', em: '👑', name: 'Nivel 20', desc: 'Alcanzá el nivel 20', check: s => s.level >= 20 },
];

const HABITS = [
  { id: 'water', em: '💧', name: 'Agua 2,5 L' },
  { id: 'sleep', em: '😴', name: 'Dormir 7 h+' },
  { id: 'steps', em: '👟', name: '8.000 pasos' },
];

const XP = { set: 10, workout: 100, pr: 50, weigh: 20, habit: 15, allHabits: 15, cardioMin: 2, bikeKm: 3 };
