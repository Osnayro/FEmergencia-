


// ===== ESTADO GLOBAL =====
const state = {
    score: 0,
    lives: 3,
    streak: 0,
    maxStreak: 0,
    currentQuestion: 0,
    totalQuestions: 10,
    mode: 'normal',
    timer: 30,
    timerInterval: null,
    isFrozen: false,
    questions: [],
    answeredCorrectly: {},
    powerups: {
        fifty: 3,
        time: 2,
        freeze: 1
    },
    badges: {
        perfectScore: false,
        speedDemon: false,
        survivor: false,
        streaker: false,
        financierPro: false,
        noPowerups: false
    },
    topicScores: {}
};

// ===== BANCO DE PREGUNTAS =====
const generalQuestions = [
    {
        id: 1,
        topic: 'presupuesto',
        type: 'multiple',
        question: '¿Qué es un presupuesto?',
        options: ['Un plan de gastos e ingresos', 'Un tipo de impuesto', 'Una cuenta bancaria', 'Un préstamo'],
        correct: 0,
        explanation: 'Un presupuesto es un plan financiero que estima ingresos y gastos en un período determinado.',
        points: 100
    },
    {
        id: 2,
        topic: 'ahorro',
        type: 'multiple',
        question: '¿Cuál es la regla 50/30/20 para ahorrar?',
        options: [
            '50% necesidades, 30% deseos, 20% ahorro',
            '50% ahorro, 30% inversión, 20% gastos',
            '50% gastos, 30% ahorro, 20% inversión',
            '50% deseos, 30% necesidades, 20% deudas'
        ],
        correct: 0,
        explanation: 'La regla 50/30/20 sugiere destinar 50% a necesidades básicas, 30% a gastos personales y 20% al ahorro.',
        points: 100
    },
    {
        id: 3,
        topic: 'inversion',
        type: 'multiple',
        question: '¿Qué significa "diversificar" en inversiones?',
        options: [
            'Invertir en diferentes activos para reducir riesgo',
            'Poner todo el dinero en una sola acción',
            'Retirar todo el dinero del banco',
            'Solo invertir en bienes raíces'
        ],
        correct: 0,
        explanation: 'Diversificar es distribuir las inversiones en distintos activos para minimizar el riesgo de pérdida.',
        points: 100
    },
    {
        id: 4,
        topic: 'credito',
        type: 'multiple',
        question: '¿Qué es el historial crediticio?',
        options: [
            'Un registro de cómo has manejado tus deudas',
            'El saldo de tu cuenta bancaria',
            'Una lista de tus inversiones',
            'Tu declaración de impuestos'
        ],
        correct: 0,
        explanation: 'El historial crediticio muestra tu comportamiento de pago de deudas y determina tu puntaje crediticio.',
        points: 100
    },
    {
        id: 5,
        topic: 'contabilidad',
        type: 'multiple',
        question: 'En contabilidad, ¿qué representa el "activo"?',
        options: [
            'Bienes y derechos de una empresa',
            'Las deudas de la empresa',
            'Las ganancias del año',
            'Los gastos mensuales'
        ],
        correct: 0,
        explanation: 'El activo son todos los bienes y derechos que posee una empresa o persona.',
        points: 100
    },
    {
        id: 6,
        topic: 'presupuesto',
        type: 'matching',
        question: 'Empareja los conceptos con sus definiciones:',
        pairs: [
            { left: 'Ingreso', right: 'Dinero recibido', id: 1 },
            { left: 'Gasto', right: 'Dinero desembolsado', id: 2 },
            { left: 'Ahorro', right: 'Dinero reservado', id: 3 },
            { left: 'Inversión', right: 'Dinero que genera más dinero', id: 4 }
        ],
        points: 200
    },
    {
        id: 7,
        topic: 'inversion',
        type: 'slider',
        question: '¿Qué porcentaje de tus ingresos recomiendan los expertos ahorrar mensualmente?',
        min: 0,
        max: 50,
        correctAnswer: 20,
        tolerance: 5,
        explanation: 'Los expertos recomiendan ahorrar al menos el 20% de los ingresos mensuales.',
        points: 150
    },
    {
        id: 8,
        topic: 'credito',
        type: 'multiple',
        question: '¿Qué es mejor para tu salud financiera?',
        options: [
            'Pagar el total de la tarjeta de crédito cada mes',
            'Pagar solo el mínimo requerido',
            'Tener muchas tarjetas de crédito',
            'Usar el crédito para gastos diarios'
        ],
        correct: 0,
        explanation: 'Pagar el total cada mes evita intereses y mantiene un buen historial crediticio.',
        points: 100
    },
    {
        id: 9,
        topic: 'contabilidad',
        type: 'multiple',
        question: 'La ecuación contable fundamental es:',
        options: [
            'Activo = Pasivo + Patrimonio',
            'Activo = Ingresos - Gastos',
            'Pasivo = Activo + Patrimonio',
            'Patrimonio = Activo - Ingresos'
        ],
        correct: 0,
        explanation: 'Activo = Pasivo + Patrimonio es la base de la contabilidad por partida doble.',
        points: 100
    },
    {
        id: 10,
        topic: 'finanzas',
        type: 'drag',
        question: 'Ordena los pasos para crear un plan financiero saludable:',
        items: [
            'Analizar ingresos y gastos',
            'Establecer metas financieras',
            'Crear un presupuesto',
            'Ahorrar e invertir regularmente',
            'Revisar y ajustar periódicamente'
        ],
        points: 200
    },
    {
        id: 11,
        topic: 'presupuesto',
        type: 'multiple',
        question: '¿Qué es un gasto hormiga?',
        options: [
            'Pequeños gastos diarios que suman grandes cantidades',
            'Gastos en insecticidas',
            'Grandes compras planificadas',
            'Inversiones pequeñas'
        ],
        correct: 0,
        explanation: 'Los gastos hormiga son pequeñas compras frecuentes que parecen insignificantes pero suman mucho al mes.',
        points: 100
    },
    {
        id: 12,
        topic: 'inversion',
        type: 'multiple',
        question: '¿Qué es el interés compuesto?',
        options: [
            'Intereses que generan más intereses con el tiempo',
            'Un tipo de impuesto financiero',
            'El interés que cobra el banco',
            'Una comisión por inversión'
        ],
        correct: 0,
        explanation: 'El interés compuesto hace que tu dinero crezca exponencialmente al reinvertir las ganancias.',
        points: 100
    }
];

// Preguntas de Fondo de Emergencia
const fondoEmergenciaQuestions = [
    {
        id: 101,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Qué es un fondo de emergencia?',
        options: [
            'Dinero para comprar regalos',
            'Un ahorro destinado a cubrir gastos inesperados',
            'Un préstamo bancario',
            'Dinero para vacaciones'
        ],
        correct: 1,
        explanation: '¡Exacto! Es un ahorro para imprevistos como urgencias médicas o reparaciones.',
        points: 100
    },
    {
        id: 102,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Cuál de estas situaciones corresponde a una emergencia?',
        options: [
            'Hospitalización inesperada',
            'Comprar ropa',
            'Ir al cine',
            'Comprar un celular nuevo'
        ],
        correct: 0,
        explanation: '¡Muy bien! Una emergencia de salud no se planifica y requiere fondos inmediatos.',
        points: 100
    },
    {
        id: 103,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Para qué sirve un fondo de emergencia?',
        options: [
            'Comprar cosas por impulso',
            'Ahorrar para vacaciones',
            'Cubrir gastos inesperados sin endeudarse',
            'Comprar tecnología'
        ],
        correct: 2,
        explanation: '¡Excelente! Te protege de pedir préstamos con intereses altos.',
        points: 100
    },
    {
        id: 104,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Cuándo es recomendable ahorrar?',
        options: [
            'Solo cuando sobra dinero',
            'Todos los meses',
            'Una vez al año',
            'Nunca'
        ],
        correct: 1,
        explanation: '¡Así se hace! El ahorro es un hábito constante que se planifica cada mes.',
        points: 100
    },
    {
        id: 105,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: 'Si se rompe el refrigerador de tu casa, ¿qué sería lo más recomendable?',
        options: [
            'Pedir un préstamo',
            'Esperar varios meses',
            'Utilizar el fondo de emergencia',
            'No hacer nada'
        ],
        correct: 2,
        explanation: '¡Correcto! Es una urgencia doméstica para la cual está diseñado este fondo.',
        points: 100
    },
    {
        id: 106,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Cuál de estas opciones NO corresponde a una emergencia?',
        options: [
            'Una operación médica',
            'Una reparación urgente',
            'Comprar el último modelo de celular',
            'Reparar una fuga de agua'
        ],
        correct: 2,
        explanation: '¡Exacto! Cambiar de teléfono por gusto es un deseo, no una emergencia.',
        points: 100
    },
    {
        id: 107,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Qué documento permite conocer cómo se distribuye el sueldo de un trabajador?',
        options: [
            'Factura',
            'Boleta',
            'Planilla de remuneraciones',
            'Balance general'
        ],
        correct: 2,
        explanation: '¡Muy bien! Ahí se detallan los haberes, descuentos y líquido a pagar.',
        points: 100
    },
    {
        id: 108,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Qué representa el sueldo líquido?',
        options: [
            'El sueldo antes de descuentos',
            'El dinero destinado a la AFP',
            'El dinero que finalmente recibe el trabajador',
            'Los impuestos'
        ],
        correct: 2,
        explanation: '¡Excelente! Es el monto real entregado al trabajador después de los descuentos.',
        points: 100
    },
    {
        id: 109,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Por qué la planilla de remuneraciones puede ayudar a crear un fondo de emergencia?',
        options: [
            'Porque aumenta el sueldo',
            'Porque elimina gastos',
            'Porque permite saber cuánto dinero recibe una persona y cuánto puede ahorrar',
            'Porque evita pagar impuestos'
        ],
        correct: 2,
        explanation: '¡Bien pensado! Saber tus ingresos exactos permite calcular tu capacidad de ahorro.',
        points: 100
    },
    {
        id: 110,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Cuál de las siguientes especialidades enseña sobre remuneraciones, educación financiera, administración y contabilidad?',
        options: [
            '🍳 Gastronomía',
            '👶 Atención de Párvulos',
            '📊 Contabilidad',
            '🥫 Elaboración Industrial de Alimentos',
            '⚡ Electrónica'
        ],
        correct: 2,
        explanation: '¡Correcto! Contabilidad entrega las herramientas para administrar el dinero y las organizaciones.',
        points: 100
    },
    {
        id: 111,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Cuántos meses de gastos debe cubrir idealmente un fondo de emergencia?',
        options: [
            '1 mes',
            '2 meses',
            'De 3 a 6 meses',
            '12 meses o más'
        ],
        correct: 2,
        explanation: 'Los expertos recomiendan cubrir entre 3 y 6 meses de gastos básicos.',
        points: 100
    },
    {
        id: 112,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Dónde es mejor guardar el dinero del fondo de emergencia?',
        options: [
            'En una alcancía en casa',
            'Invertido en acciones',
            'En una cuenta de ahorro de fácil acceso',
            'Prestado a un familiar'
        ],
        correct: 2,
        explanation: 'Debe estar disponible rápidamente y sin riesgo de pérdida.',
        points: 100
    },
    {
        id: 113,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Qué característica debe tener un fondo de emergencia?',
        options: [
            'Alta rentabilidad',
            'Liquidez inmediata',
            'Plazo fijo a 5 años',
            'Inversión en criptomonedas'
        ],
        correct: 1,
        explanation: 'La liquidez permite disponer del dinero en el momento exacto de la emergencia.',
        points: 100
    },
    {
        id: 114,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: 'Si ganas $500.000 mensuales, ¿cuánto deberías tener idealmente en tu fondo de emergencia?',
        options: [
            '$100.000',
            '$500.000',
            'Entre $1.500.000 y $3.000.000',
            '$10.000.000'
        ],
        correct: 2,
        explanation: 'Equivale a 3-6 meses de gastos. Si tus gastos son $500.000, necesitas entre $1.5 y $3 millones.',
        points: 100
    },
    {
        id: 115,
        topic: 'fondo-emergencia',
        type: 'multiple',
        question: '¿Cuál es el primer paso para crear un fondo de emergencia?',
        options: [
            'Calcular los gastos mensuales básicos',
            'Pedir un préstamo',
            'Invertir en la bolsa',
            'Gastar menos en entretención'
        ],
        correct: 0,
        explanation: 'Primero debes saber cuánto necesitas para cubrir tus gastos esenciales.',
        points: 100
    }
];

// Banco completo combinado
const questionBank = [...generalQuestions, ...fondoEmergenciaQuestions];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    setupSplashScreen();
    loadBadges();
    loadLeaderboard();
    setupPowerups();
});

function setupSplashScreen() {
    const skipBtn = document.getElementById('skip-splash-btn');
    const splashScreen = document.getElementById('splash-screen');
    
    setTimeout(() => {
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
            splashScreen.classList.add('hidden');
        }
    }, 6000);
    
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            splashScreen.classList.add('hidden');
        });
    }
}

function setupPowerups() {
    document.getElementById('powerup-fifty').addEventListener('click', () => usePowerup('fifty'));
    document.getElementById('powerup-time').addEventListener('click', () => usePowerup('time'));
    document.getElementById('powerup-freeze').addEventListener('click', () => usePowerup('freeze'));
}

// ===== NAVEGACIÓN DE PANTALLAS =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
    
    if (screenId === 'screen-badges') {
        loadBadges();
    }
    if (screenId === 'screen-leaderboard') {
        loadLeaderboard();
    }
}

// ===== SELECCIÓN DE MODO =====
function selectMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-card').forEach(card => card.classList.remove('selected'));
    document.getElementById(`mode-${mode}`).classList.add('selected');
    
    if (mode === 'timed') {
        document.getElementById('timer-display').style.display = 'flex';
    } else {
        document.getElementById('timer-display').style.display = 'none';
    }
}

// ===== INICIO DEL JUEGO =====
function startGame() {
    state.score = 0;
    state.lives = 3;
    state.streak = 0;
    state.maxStreak = 0;
    state.currentQuestion = 0;
    state.answeredCorrectly = {};
    state.topicScores = {};
    state.isFrozen = false;
    
    // Seleccionar preguntas: 2 de fondo de emergencia + 8 aleatorias del resto
    const fondoQuestions = shuffleArray([...fondoEmergenciaQuestions]).slice(0, 2);
    const otherQuestions = shuffleArray([...generalQuestions]).slice(0, 8);
    
    // Las 2 primeras son de fondo de emergencia, el resto mezcladas
    state.questions = [...fondoQuestions, ...shuffleArray(otherQuestions)];
    state.totalQuestions = state.questions.length;
    
    updateScore();
    updateLives();
    updateStreak();
    updateProgress();
    
    showScreen('screen-question');
    loadQuestion();
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ===== CARGA DE PREGUNTAS =====
function loadQuestion() {
    if (state.currentQuestion >= state.totalQuestions) {
        endGame();
        return;
    }
    
    clearInterval(state.timerInterval);
    
    const question = state.questions[state.currentQuestion];
    const questionText = document.getElementById('question-text');
    const questionImage = document.getElementById('question-image');
    const optionsGrid = document.getElementById('options-grid');
    const matchingContainer = document.getElementById('matching-container');
    const dragContainer = document.getElementById('drag-container');
    const sliderContainer = document.getElementById('slider-container');
    const feedbackBox = document.getElementById('feedback-box');
    const btnNext = document.getElementById('btn-next');
    const rabbitSvg = document.getElementById('rabbit-svg');
    const questionSpeech = document.getElementById('question-speech');
    
    // Limpiar todo
    optionsGrid.innerHTML = '';
    optionsGrid.style.display = 'none';
    matchingContainer.innerHTML = '';
    matchingContainer.style.display = 'none';
    dragContainer.innerHTML = '';
    dragContainer.style.display = 'none';
    sliderContainer.innerHTML = '';
    sliderContainer.style.display = 'none';
    feedbackBox.className = 'feedback-box';
    feedbackBox.innerHTML = '';
    btnNext.style.display = 'none';
    questionImage.style.display = 'none';
    rabbitSvg.className = 'rabbit-svg thinking';
    questionSpeech.textContent = getRandomSpeech('question');
    
    // Mostrar pregunta
    questionText.textContent = question.question;
    
    // Cargar según tipo
    switch (question.type) {
        case 'multiple':
            loadMultipleChoice(question);
            break;
        case 'matching':
            loadMatching(question);
            break;
        case 'slider':
            loadSlider(question);
            break;
        case 'drag':
            loadDrag(question);
            break;
    }
    
    // Iniciar timer en modo contrarreloj
    if (state.mode === 'timed') {
        startTimer();
    }
    
    updateProgress();
}

function getRandomSpeech(type) {
    const speeches = {
        question: [
            '¡Piensa bien tu respuesta! 🤔',
            'Tú puedes hacerlo 💪',
            'Confío en tu conocimiento 🌟',
            'Analiza cada opción con cuidado 📊',
            '¡Demuestra lo que sabes! 🎯'
        ],
        correct: [
            '¡Excelente trabajo! 🎉',
            '¡Eres un genio financiero! 🧠',
            '¡Respuesta correcta! ⭐',
            '¡Muy bien pensado! 👏',
            '¡Sabía que lo lograrías! 🏆'
        ],
        incorrect: [
            'No te preocupes, todos aprendemos 📚',
            '¡Sigue intentándolo! 💪',
            'Revisa bien la explicación 🔍',
            'El error es parte del aprendizaje 🌱',
            '¡En la próxima lo tendrás! 🎯'
        ]
    };
    
    const list = speeches[type] || speeches.question;
    return list[Math.floor(Math.random() * list.length)];
}

// ===== TIPOS DE PREGUNTAS =====
function loadMultipleChoice(question) {
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.style.display = 'flex';
    
    // Crear array de índices y mezclarlos aleatoriamente
    const indices = question.options.map((_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    
    // Guardar referencia del orden mezclado en la pregunta
    question._shuffledIndices = shuffledIndices;
    
    // Renderizar opciones en orden aleatorio
    shuffledIndices.forEach((originalIndex, displayIndex) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = question.options[originalIndex];
        btn.dataset.originalIndex = originalIndex;
        btn.dataset.displayIndex = displayIndex;
        btn.addEventListener('click', () => checkMultipleAnswer(originalIndex, question));
        optionsGrid.appendChild(btn);
    });
}

function loadMatching(question) {
    const matchingContainer = document.getElementById('matching-container');
    matchingContainer.style.display = 'grid';
    
    let selectedLeft = null;
    const matches = {};
    
    const leftItems = shuffleArray(question.pairs.map(p => ({ id: p.id, text: p.left })));
    const rightItems = shuffleArray(question.pairs.map(p => ({ id: p.id, text: p.right })));
    
    leftItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'matching-item';
        div.textContent = item.text;
        div.dataset.pairId = item.id;
        div.dataset.side = 'left';
        
        div.addEventListener('click', function() {
            if (this.classList.contains('matched')) return;
            
            document.querySelectorAll('.matching-item[data-side="left"]').forEach(el => {
                if (!el.classList.contains('matched')) el.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedLeft = this;
        });
        
        matchingContainer.appendChild(div);
    });
    
    rightItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'matching-item';
        div.textContent = item.text;
        div.dataset.pairId = item.id;
        div.dataset.side = 'right';
        
        div.addEventListener('click', function() {
            if (this.classList.contains('matched')) return;
            
            if (selectedLeft && !this.classList.contains('matched')) {
                if (selectedLeft.dataset.pairId === this.dataset.pairId) {
                    selectedLeft.classList.add('matched');
                    this.classList.add('matched');
                    matches[this.dataset.pairId] = true;
                    selectedLeft = null;
                    
                    if (Object.keys(matches).length === question.pairs.length) {
                        handleCorrectAnswer(question.points);
                    }
                } else {
                    const leftEl = selectedLeft;
                    leftEl.style.borderColor = 'var(--rojo-alerta)';
                    this.style.borderColor = 'var(--rojo-alerta)';
                    setTimeout(() => {
                        leftEl.style.borderColor = '#CBD5E1';
                        this.style.borderColor = '#CBD5E1';
                        leftEl.classList.remove('selected');
                    }, 500);
                    selectedLeft = null;
                }
            }
        });
        
        matchingContainer.appendChild(div);
    });
}

function loadSlider(question) {
    const sliderContainer = document.getElementById('slider-container');
    sliderContainer.style.display = 'block';
    
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = '20%';
    valueDisplay.id = 'slider-value-display';
    
    const track = document.createElement('div');
    track.className = 'slider-track';
    
    const fill = document.createElement('div');
    fill.className = 'slider-fill';
    fill.style.width = '40%';
    
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'slider-input';
    input.min = question.min;
    input.max = question.max;
    input.value = 20;
    
    input.addEventListener('input', () => {
        fill.style.width = `${(input.value / question.max) * 100}%`;
        valueDisplay.textContent = `${input.value}%`;
    });
    
    track.appendChild(fill);
    track.appendChild(input);
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'main-btn';
    submitBtn.textContent = 'Confirmar Respuesta ✅';
    submitBtn.addEventListener('click', () => {
        const userAnswer = parseInt(input.value);
        const isCorrect = Math.abs(userAnswer - question.correctAnswer) <= question.tolerance;
        
        if (isCorrect) {
            handleCorrectAnswer(question.points);
        } else {
            handleIncorrectAnswer(question);
        }
    });
    
    sliderContainer.appendChild(valueDisplay);
    sliderContainer.appendChild(track);
    sliderContainer.appendChild(submitBtn);
}

function loadDrag(question) {
    const dragContainer = document.getElementById('drag-container');
    dragContainer.style.display = 'flex';
    
    question.items.forEach((item, index) => {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.textContent = `${index + 1}. Soltar aquí`;
        dropZone.dataset.index = index;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const draggedIndex = e.dataTransfer.getData('text/plain');
            dropZone.textContent = `${index + 1}. ${question.items[draggedIndex]}`;
            dropZone.dataset.filled = draggedIndex;
            
            checkDragComplete(question);
        });
        
        dragContainer.appendChild(dropZone);
    });
    
    const itemsContainer = document.createElement('div');
    itemsContainer.style.display = 'flex';
    itemsContainer.style.flexWrap = 'wrap';
    itemsContainer.style.gap = '8px';
    itemsContainer.style.marginTop = '10px';
    
    shuffleArray(question.items).forEach((item, index) => {
        const draggable = document.createElement('div');
        draggable.className = 'draggable-item';
        draggable.textContent = item;
        draggable.draggable = true;
        draggable.dataset.originalIndex = question.items.indexOf(item);
        
        draggable.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', draggable.dataset.originalIndex);
            draggable.style.opacity = '0.5';
        });
        
        draggable.addEventListener('dragend', () => {
            draggable.style.opacity = '1';
        });
        
        itemsContainer.appendChild(draggable);
    });
    
    dragContainer.appendChild(itemsContainer);
}

function checkDragComplete(question) {
    const dropZones = document.querySelectorAll('.drop-zone');
    let allFilled = true;
    let allCorrect = true;
    
    dropZones.forEach((zone, index) => {
        if (!zone.dataset.filled) {
            allFilled = false;
        } else if (parseInt(zone.dataset.filled) !== index) {
            allCorrect = false;
        }
    });
    
    if (allFilled) {
        if (allCorrect) {
            handleCorrectAnswer(question.points);
        } else {
            handleIncorrectAnswer(question);
        }
    }
}

// ===== MANEJO DE RESPUESTAS =====
function checkMultipleAnswer(originalIndex, question) {
    const options = document.querySelectorAll('.option-btn');
    options.forEach(btn => btn.disabled = true);
    
    // Encontrar el índice visual del botón correcto
    const shuffledIndices = question._shuffledIndices;
    const correctDisplayIndex = shuffledIndices.indexOf(question.correct);
    
    // Encontrar el índice visual del botón clickeado
    let clickedDisplayIndex = -1;
    options.forEach((btn, i) => {
        if (parseInt(btn.dataset.originalIndex) === originalIndex) {
            clickedDisplayIndex = i;
        }
    });
    
    if (originalIndex === question.correct) {
        options[clickedDisplayIndex].classList.add('correct');
        handleCorrectAnswer(question.points);
    } else {
        options[clickedDisplayIndex].classList.add('incorrect');
        options[correctDisplayIndex].classList.add('correct');
        handleIncorrectAnswer(question);
    }
    
    clearInterval(state.timerInterval);
}

function handleCorrectAnswer(points) {
    state.score += points;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    
    const question = state.questions[state.currentQuestion];
    if (!state.topicScores[question.topic]) state.topicScores[question.topic] = { correct: 0, total: 0 };
    state.topicScores[question.topic].correct++;
    state.topicScores[question.topic].total++;
    
    updateScore();
    updateStreak();
    
    const rabbitSvg = document.getElementById('rabbit-svg');
    rabbitSvg.className = 'rabbit-svg correct';
    
    document.getElementById('question-speech').textContent = getRandomSpeech('correct');
    showFeedback(question.explanation || '¡Respuesta correcta!', 'correct');
    document.getElementById('btn-next').style.display = 'block';
    
    checkBadges();
    launchConfetti();
}

function handleIncorrectAnswer(question) {
    state.lives--;
    state.streak = 0;
    
    if (!state.topicScores[question.topic]) state.topicScores[question.topic] = { correct: 0, total: 0 };
    state.topicScores[question.topic].total++;
    
    updateLives();
    updateStreak();
    
    const rabbitSvg = document.getElementById('rabbit-svg');
    rabbitSvg.className = 'rabbit-svg incorrect';
    
    document.getElementById('question-speech').textContent = getRandomSpeech('incorrect');
    showFeedback(question.explanation || 'Respuesta incorrecta. ¡Aprende de esto!', 'incorrect');
    document.getElementById('btn-next').style.display = 'block';
    
    if (state.lives <= 0) {
        setTimeout(() => endGame(), 1500);
    }
}

function showFeedback(message, type) {
    const feedbackBox = document.getElementById('feedback-box');
    feedbackBox.textContent = message;
    feedbackBox.className = `feedback-box ${type}`;
}

// ===== SIGUIENTE PREGUNTA =====
function nextQuestion() {
    state.currentQuestion++;
    loadQuestion();
}

// ===== POWER-UPS =====
function usePowerup(type) {
    if (state.powerups[type] <= 0) return;
    if (state.currentQuestion >= state.totalQuestions) return;
    
    state.powerups[type]--;
    updatePowerupButtons();
    
    switch (type) {
        case 'fifty':
            applyFiftyFifty();
            break;
        case 'time':
            if (state.mode === 'timed') {
                state.timer += 15;
                updateTimerDisplay();
            }
            break;
        case 'freeze':
            state.isFrozen = true;
            document.getElementById('timer-display').style.backgroundColor = '#10B981';
            setTimeout(() => {
                state.isFrozen = false;
                document.getElementById('timer-display').style.backgroundColor = 'var(--azul-oscuro)';
            }, 10000);
            break;
    }
}

function applyFiftyFifty() {
    const question = state.questions[state.currentQuestion];
    if (question.type !== 'multiple') return;
    
    const options = document.querySelectorAll('.option-btn');
    const shuffledIndices = question._shuffledIndices;
    const correctDisplayIndex = shuffledIndices.indexOf(question.correct);
    
    const incorrectDisplayIndexes = [];
    options.forEach((btn, i) => {
        if (i !== correctDisplayIndex) {
            incorrectDisplayIndexes.push(i);
        }
    });
    
    // Eliminar 2 opciones incorrectas aleatorias
    shuffleArray(incorrectDisplayIndexes).slice(0, 2).forEach(index => {
        options[index].style.display = 'none';
    });
}

function updatePowerupButtons() {
    document.getElementById('powerup-fifty').querySelector('small').textContent = `(${state.powerups.fifty})`;
    document.getElementById('powerup-time').querySelector('small').textContent = `(${state.powerups.time})`;
    document.getElementById('powerup-freeze').querySelector('small').textContent = `(${state.powerups.freeze})`;
    
    if (state.powerups.fifty <= 0) document.getElementById('powerup-fifty').disabled = true;
    if (state.powerups.time <= 0) document.getElementById('powerup-time').disabled = true;
    if (state.powerups.freeze <= 0) document.getElementById('powerup-freeze').disabled = true;
}

// ===== TEMPORIZADOR =====
function startTimer() {
    state.timer = 30;
    updateTimerDisplay();
    
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.classList.remove('warning');
    
    state.timerInterval = setInterval(() => {
        if (state.isFrozen) return;
        
        state.timer--;
        updateTimerDisplay();
        
        if (state.timer <= 10) {
            timerDisplay.classList.add('warning');
        }
        
        if (state.timer <= 0) {
            clearInterval(state.timerInterval);
            handleIncorrectAnswer(state.questions[state.currentQuestion]);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.textContent = `⏱️ ${state.timer}s`;
}

// ===== ACTUALIZACIONES DE UI =====
function updateScore() {
    document.getElementById('score-badge').textContent = `⭐ ${state.score} pts`;
}

function updateLives() {
    const livesDisplay = document.getElementById('lives-display');
    let hearts = '';
    for (let i = 0; i < 3; i++) {
        hearts += i < state.lives ? '❤️' : '🖤';
    }
    livesDisplay.textContent = hearts;
}

function updateStreak() {
    document.getElementById('streak-display').textContent = `🔥 ${state.streak}`;
}

function updateProgress() {
    const progress = (state.currentQuestion / state.totalQuestions) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

// ===== FIN DEL JUEGO =====
function endGame() {
    clearInterval(state.timerInterval);
    
    document.getElementById('final-score').textContent = state.score;
    
    const topicAnalysis = document.getElementById('topic-analysis');
    topicAnalysis.innerHTML = '';
    
    const topicNames = {
        'presupuesto': 'Presupuesto',
        'ahorro': 'Ahorro',
        'inversion': 'Inversión',
        'credito': 'Crédito',
        'contabilidad': 'Contabilidad',
        'finanzas': 'Finanzas',
        'fondo-emergencia': 'Fondo de Emergencia'
    };
    
    const topicColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#E63946'];
    let colorIndex = 0;
    
    for (const [topic, scores] of Object.entries(state.topicScores)) {
        const percentage = Math.round((scores.correct / scores.total) * 100);
        const bar = document.createElement('div');
        bar.className = 'topic-bar';
        bar.innerHTML = `
            <span class="topic-label">${topicNames[topic] || topic}</span>
            <div class="topic-progress">
                <div class="topic-fill" style="width: ${percentage}%; background: ${topicColors[colorIndex]}"></div>
            </div>
            <span class="topic-score">${percentage}%</span>
        `;
        topicAnalysis.appendChild(bar);
        colorIndex = (colorIndex + 1) % topicColors.length;
    }
    
    const shareBadges = document.getElementById('share-badges');
    shareBadges.innerHTML = '';
    for (const [badge, unlocked] of Object.entries(state.badges)) {
        if (unlocked) {
            const badgeEl = document.createElement('span');
            badgeEl.className = 'share-badge';
            badgeEl.textContent = getBadgeIcon(badge);
            shareBadges.appendChild(badgeEl);
        }
    }
    
    const resultCharacterSpeech = document.getElementById('result-character-speech');
    if (state.score >= 900) {
        resultCharacterSpeech.textContent = '¡Puntaje Perfecto! Conti Conti está súper orgulloso. 🏆🐰';
    } else if (state.score >= 700) {
        resultCharacterSpeech.textContent = '¡Excelente resultado! Tienes bases muy sólidas. 👏🐰';
    } else if (state.score >= 400) {
        resultCharacterSpeech.textContent = '¡Buen esfuerzo! Sigue practicando con Conti Conti. 📚🐰';
    } else {
        resultCharacterSpeech.textContent = '¡El aprendizaje es un camino diario! 💡🐰';
    }
    
    showScreen('screen-results');
    launchConfetti();
    saveToLeaderboard();
}

function restartGame() {
    state.currentQuestion = 0;
    state.score = 0;
    state.lives = 3;
    state.streak = 0;
    updateScore();
    updateLives();
    updateStreak();
    updateProgress();
    startGame();
}

// ===== PANTALLA FINAL =====
function goToFinalScreen() {
    showScreen('screen-final');
    launchConfetti();
}

// ===== INSIGNIAS =====
function checkBadges() {
    if (state.score >= 1000 && !state.badges.financierPro) {
        state.badges.financierPro = true;
        alert('🏅 ¡Nueva insignia: Financiero Pro!');
        saveBadges();
    }
    if (state.streak >= 5 && !state.badges.streaker) {
        state.badges.streaker = true;
        alert('🔥 ¡Nueva insignia: Rachador!');
        saveBadges();
    }
}

function getBadgeIcon(badge) {
    const icons = {
        perfectScore: '💯',
        speedDemon: '⚡',
        survivor: '🛡️',
        streaker: '🔥',
        financierPro: '🏆',
        noPowerups: '💪'
    };
    return icons[badge] || '🏅';
}

function getBadgeName(badge) {
    const names = {
        perfectScore: 'Puntaje Perfecto',
        speedDemon: 'Velocista',
        survivor: 'Sobreviviente',
        streaker: 'Rachador',
        financierPro: 'Financiero Pro',
        noPowerups: 'Poder Natural'
    };
    return names[badge] || badge;
}

function loadBadges() {
    const saved = localStorage.getItem('conti_badges');
    if (saved) {
        state.badges = { ...state.badges, ...JSON.parse(saved) };
    }
    
    const badgesGrid = document.getElementById('badges-grid');
    if (!badgesGrid) return;
    
    badgesGrid.innerHTML = '';
    for (const [badge, unlocked] of Object.entries(state.badges)) {
        const badgeEl = document.createElement('div');
        badgeEl.className = `badge-item ${unlocked ? 'unlocked' : ''}`;
        badgeEl.innerHTML = `
            <div class="badge-icon">${getBadgeIcon(badge)}</div>
            <div class="badge-name">${getBadgeName(badge)}</div>
        `;
        badgesGrid.appendChild(badgeEl);
    }
}

function saveBadges() {
    localStorage.setItem('conti_badges', JSON.stringify(state.badges));
}

// ===== LEADERBOARD =====
function saveToLeaderboard() {
    const playerName = prompt('¡Buen trabajo! Ingresa tu nombre para la tabla de clasificación:', 'Jugador');
    if (!playerName) return;
    
    const leaderboard = JSON.parse(localStorage.getItem('conti_leaderboard') || '[]');
    leaderboard.push({
        name: playerName,
        score: state.score,
        badges: Object.values(state.badges).filter(Boolean).length,
        date: new Date().toLocaleDateString()
    });
    
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('conti_leaderboard', JSON.stringify(leaderboard.slice(0, 20)));
    
    loadLeaderboard();
}

function loadLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('conti_leaderboard') || '[]');
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        row.innerHTML = `
            <td class="${rankClass}">${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score} pts</td>
            <td>${'🏅'.repeat(entry.badges)}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== COMPARTIR =====
function shareResults() {
    const text = `🎉 ¡Acabo de conseguir ${state.score} puntos en Conti Conti Desafío Financiero! ¿Puedes superarme? 🏆`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Conti Conti - Desafío Financiero',
            text: text,
            url: window.location.href
        }).catch(console.log);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('📋 ¡Resultado copiado al portapapeles! Compártelo con tus amigos.');
        });
    }
}

// ===== CONFETTI =====
function launchConfetti() {
    if (typeof confetti !== 'function') return;
    
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A2D2FF', '#B8E9C0', '#FEF9D7', '#EC4899', '#8B5CF6']
    });
    
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 }
        });
    }, 200);
    
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 }
        });
    }, 400);
}

// ===== CANVAS DE EFECTOS =====
(function setupEffectsCanvas() {
    const canvas = document.getElementById('effects-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
})();
