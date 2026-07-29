
/**
 * ============================================================
 * ContiGame Engine v3.6.0 — Producción
 * Lógica del juego, control de estado y flujos financieros
 * Para "ContiChallenge: Desafío Contable y Financiero"
 * ============================================================
 *
 * Cambios v3.6.0 sobre v3.5.1:
 *   - MEJORA: Banco de preguntas separado en questions.js (132 preguntas).
 *   - MEJORA: Temporizador de precisión con Date.now() (sin deriva).
 *   - MEJORA: Tick simplificado (50ms, 2 nodos).
 *   - MEJORA: Bocadillo del conejo con colores dinámicos.
 *   - MEJORA: Sistema de niveles bloqueados progresivamente.
 *
 * Dependencia: questions.js debe cargarse antes que este archivo.
 */

// ===== ESTADO GLOBAL =====
const state = {
    score: 0,
    levelScore: 0,
    lives: 3,
    streak: 0,
    maxStreak: 0,
    currentQuestion: 0,
    totalQuestions: 10,
    currentLevel: 1,
    mode: 'normal',
    timer: 30,
    timerInterval: null,
    _boredTimeout: null,
    _freezeTimeout: null,
    isFrozen: false,
    questions: [],
    answeredCorrectly: {},
    correctInLevel: 0,
    powerups: {
        fifty: 3,
        time: 2,
        freeze: 1,
        hint: 2
    },
    powerupsUsedThisLevel: false,
    levelPerfect: true,
    questionStartTime: 0,
    bonusQuestionActive: false,
    levelStars: {},
    badges: {
        perfectScore: false,
        speedDemon: false,
        survivor: false,
        streaker: false,
        financierPro: false,
        noPowerups: false
    },
    topicScores: {},
    unlockedLevels: {
        1: true,
        2: false,
        3: false,
        4: false
    },
    _timerStartTime: 0,
    _timerTotalTime: 0
};

// Mapa de niveles (las preguntas vienen de questions.js)
const levelQuestionsMap = {
    1: fondoEmergenciaQuestions,
    2: nivel2Questions,
    3: nivel3Questions,
    4: nivelAvanzadoQuestions
};

const levelNames = {
    1: '🟢 Fondo de Emergencia',
    2: '🔵 Contabilidad y Nómina',
    3: '🟣 Estados Financieros',
    4: '🔴 Cálculos Avanzados'
};

const levelColors = {
    1: '#10B981',
    2: '#3B82F6',
    3: '#8B5CF6',
    4: '#EF4444'
};

// ===== UTILIDADES =====

function deepCloneQuestions(arr) {
    try {
        return JSON.parse(JSON.stringify(arr));
    } catch (e) {
        console.warn('Error al clonar preguntas, usando array original.');
        return arr;
    }
}

function safeLocalGet(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw !== null ? raw : fallback;
    } catch (e) {
        console.warn('localStorage no disponible, usando valor por defecto para', key);
        return fallback;
    }
}

function safeLocalSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', key);
        return false;
    }
}

// ===== SISTEMA DE SONIDO =====
function playSound(type) {
    const alwaysPlay = ['correct', 'incorrect', 'levelup', 'levelstart', 'achievement', 'powerup'];
    if (!alwaysPlay.includes(type) && state.mode === 'normal') return;
    if (window.effectsManager) {
        window.effectsManager.playSound(type);
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    loadUnlockedLevels();
    setupSplashScreen();
    loadBadges();
    loadLeaderboard();
    setupPowerups();
    createSpeedBonusToast();
    updateLevelStatusDisplay();
    if (typeof injectRabbitSVGs === 'function') injectRabbitSVGs();
});

// ===== SISTEMA DE NIVELES BLOQUEADOS =====

function loadUnlockedLevels() {
    const saved = safeLocalGet('conti_unlocked_levels', null);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.unlockedLevels = { ...state.unlockedLevels, ...parsed };
        } catch (e) {
            console.warn('No se pudo leer niveles desbloqueados, usando valores por defecto.');
        }
    }
}

function saveUnlockedLevels() {
    safeLocalSet('conti_unlocked_levels', JSON.stringify(state.unlockedLevels));
}

function unlockNextLevel(currentLevel) {
    const nextLevel = currentLevel + 1;
    if (nextLevel <= 4 && !state.unlockedLevels[nextLevel]) {
        state.unlockedLevels[nextLevel] = true;
        saveUnlockedLevels();
        updateLevelStatusDisplay();
        console.log('🔓 Nivel ' + nextLevel + ' desbloqueado.');
    }
}

function updateLevelStatusDisplay() {
    for (let i = 2; i <= 4; i++) {
        const statusEl = document.getElementById('status-level-' + i);
        if (statusEl) {
            if (state.unlockedLevels[i]) {
                statusEl.textContent = '✅ Disponible';
                statusEl.style.color = '#10B981';
            } else {
                statusEl.textContent = '🔒 Bloqueado';
                statusEl.style.color = '#94A3B8';
            }
        }
    }
}

function createSpeedBonusToast() {
    if (document.getElementById('speed-bonus-toast')) return;
    const toast = document.createElement('div');
    toast.className = 'speed-bonus-toast';
    toast.id = 'speed-bonus-toast';
    document.body.appendChild(toast);
}

function showSpeedBonus(points) {
    const toast = document.getElementById('speed-bonus-toast');
    if (!toast) return;
    toast.textContent = `⚡ ¡Velocidad bonus! +${points} pts`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.add('hide'), 1500);
    setTimeout(() => { toast.classList.remove('show', 'hide'); }, 2000);
}

function triggerVisualCoinsFromElement(element, count = 12) {
    if (window.effectsManager) {
        window.effectsManager.triggerCoinExplosionFromElement(element, count);
    }
}

function setupSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    setTimeout(() => {
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
            console.warn('⏰ Fallback: Splash screen ocultado por timeout de seguridad (60s).');
            splashScreen.classList.add('hidden');
        }
    }, 60000);
}

function setupPowerups() {
    document.getElementById('powerup-fifty')?.addEventListener('click', () => usePowerup('fifty'));
    document.getElementById('powerup-time')?.addEventListener('click', () => usePowerup('time'));
    document.getElementById('powerup-freeze')?.addEventListener('click', () => usePowerup('freeze'));
    document.getElementById('powerup-hint')?.addEventListener('click', () => usePowerup('hint'));
}

// ===== NAVEGACIÓN =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) { 
        screen.classList.add('active'); 
        screen.classList.add('screen-expand'); 
        setTimeout(() => screen.classList.remove('screen-expand'), 500); 
    }
    if (screenId === 'screen-badges') loadBadges();
    if (screenId === 'screen-leaderboard') loadLeaderboard();
    if (screenId === 'screen-welcome') updateLevelStatusDisplay();
    if (typeof injectRabbitSVGs === 'function') setTimeout(injectRabbitSVGs, 50);
}

function selectMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-card').forEach(card => card.classList.remove('selected'));
    document.getElementById(`mode-${mode}`)?.classList.add('selected');
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.style.display = mode === 'timed' ? 'flex' : 'none';
    updatePowerupButtons();
}

// ===== INICIO DEL JUEGO =====
function startGame() {
    if (window.effectsManager) window.effectsManager.ensureAudio();
    state.score = 0; state.levelScore = 0; state.lives = 3; state.streak = 0; state.maxStreak = 0;
    state.currentQuestion = 0; state.currentLevel = 1; state.answeredCorrectly = {}; state.topicScores = {};
    state.isFrozen = false; state.powerupsUsedThisLevel = false; state.levelPerfect = true;
    state.levelStars = {};
    if (state._freezeTimeout) clearTimeout(state._freezeTimeout);
    state._freezeTimeout = null;
    document.body.className = 'level-1';
    startLevel(1);
}

function startLevel(levelNum) {
    if (!state.unlockedLevels[levelNum]) {
        console.warn('Nivel ' + levelNum + ' bloqueado. No se puede iniciar.');
        return;
    }
    
    state.currentLevel = levelNum; state.currentQuestion = 0; state.lives = 3; state.streak = 0;
    state.levelScore = 0; state.isFrozen = false; state.powerupsUsedThisLevel = false; state.levelPerfect = true;
    state.bonusQuestionActive = false; state.correctInLevel = 0;
    if (state._freezeTimeout) clearTimeout(state._freezeTimeout);
    state._freezeTimeout = null;
    
    document.body.className = `level-${levelNum}`;
    
    const rawQuestions = levelQuestionsMap[levelNum] || fondoEmergenciaQuestions;
    
    // Nivel 1 (Fondo de Emergencia): 5 del Grupo A + 5 del Grupo B
    if (levelNum === 1) {
        const grupoA = shuffleArray(deepCloneQuestions(rawQuestions).slice(0, 17)).slice(0, 5);
        const grupoB = shuffleArray(deepCloneQuestions(rawQuestions).slice(17, 32)).slice(0, 5);
        state.questions = [...grupoA, ...grupoB];
    } else {
        state.questions = shuffleArray(deepCloneQuestions(rawQuestions)).slice(0, 10);
    }
    
    if (Math.random() < 0.33 && levelNum >= 2) {
        const bonusIndex = Math.floor(Math.random() * state.questions.length);
        state.questions[bonusIndex].isBonus = true;
        state.questions[bonusIndex].originalPoints = state.questions[bonusIndex].points;
        state.questions[bonusIndex].points = state.questions[bonusIndex].points * 2;
        state.bonusQuestionActive = true;
    }
    
    state.totalQuestions = state.questions.length;
    updatePowerupButtons();
    updateLevelDisplay(); updateScore(); updateLives(); updateStreak(); updateProgress();
    showScreen('screen-question');
    updateRabbitReaction('thinking');
    playSound('levelstart');
    loadQuestion();
}

function goToNextLevel() {
    const nextLevel = state.currentLevel + 1;
    if (nextLevel <= 4 && state.unlockedLevels[nextLevel]) {
        startLevel(nextLevel);
    } else if (nextLevel > 4) {
        showFinalResults();
    } else {
        console.warn('Nivel ' + nextLevel + ' bloqueado.');
        showScreen('screen-welcome');
    }
}

function updateLevelDisplay() {
    const ld = document.getElementById('level-display');
    if (!ld) return;
    ld.textContent = `Nivel ${state.currentLevel}`;
    ld.style.background = levelColors[state.currentLevel] || '#10B981';
}

function shuffleArray(array) { const arr = [...array]; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// ===== REACCIONES DEL CONEJO =====
function updateRabbitReaction(reaction) {
    document.querySelectorAll('.rabbit-svg').forEach(rabbit => {
        rabbit.className = 'rabbit-svg';
        void rabbit.offsetWidth;
        rabbit.className = 'rabbit-svg ' + reaction;
    });
    
    const speech = document.getElementById('question-speech');
    const messages = {
        'thinking': [
            '¡Piensa bien tu respuesta! 🤔', 'Tú puedes hacerlo 💪', 'Analiza con cuidado 📊',
            'Confío en tu razonamiento 🧠', 'Lee cada opción con atención 👀',
            '¿Cuál será la correcta? 🤓', 'Tómate tu tiempo ⏳', 'Confía en lo que sabes 📚'
        ],
        'nervous': [
            '¡El tiempo se acaba! ⏰', '¡Rápido, confía en ti! 😰', '¡No te congeles! ❄️',
            '¡Elige ya, tú sabes! ⚡', '¡Últimos segundos! 🚨', '¡Vamos, no te detengas! 🏃'
        ],
        'bored': [
            '¡Despierta, campeón! ☕', '¡Vamos, tú puedes! 😴', '¡No te duermas en clase! 💤',
            '¡Espabila esa mente! 🧃', '¡Que no decaiga el ánimo! 🎈', '¿Necesitas un café virtual? ☕✨'
        ],
        'impressed': [
            '¡Impresionante racha! 🤩', '¡Eres increíble! 🌟', '¡Qué genio financiero! 🧠',
            '¡Nadie te para hoy! 🔥', '¡Estás arrasando! 💥', '¡Eres una máquina! ⚙️💨',
            '¡Conti Conti está orgulloso! 🐰✨'
        ],
        'celebrating': [
            '¡Perfecto, nivel impecable! 🥳', '¡Eres el orgullo de Contabilidad! 🎉',
            '¡Nivel superado con honores! 🏆', '¡Así se hace, crack! 🌟',
            '¡Cada vez más cerca de la cima! ⛰️', '¡Qué satisfacción da aprender! 🎓✨'
        ],
        'deep-think': [
            '¡Nivel experto activado! 🔬', '¡Piensa profundamente! 🧐', '¡Confía en tus cálculos! 📐',
            'Esto es para mentes brillantes 💡', '¡Activa tu modo calculadora! 🧮', 'Los números no mienten 🔢'
        ],
        'confident': [
            '¡Eliminamos dos, ahora es fácil! 😎', '¡El 50/50 te respalda! ✨',
            '¡Tú tienes el control! 🕶️', '¡Camino despejado hacia el éxito! 🛤️',
            '¡Ahora solo quedan las buenas! ✅', '¡Con esta ayuda es pan comido! 🍞'
        ],
        'frozen': [
            '¡Tiempo congelado! 🥶', '¡Relájate y piensa tranquilo! ❄️', '¡Sin prisa, el reloj se detuvo! ⛄',
            '¡Respira hondo, tienes tiempo! 🌬️', '¡Aprovecha estos segundos extra! ⏸️', '¡El frío te da claridad mental! 🧊'
        ],
        'determined': [
            '¡Ahora sí, con todo! 😤', '¡Esta no la fallo! 💪🔥', '¡Con más ganas que nunca! 🦾',
            '¡A corregir el rumbo! 🧭', '¡El error me hizo más fuerte! ⚡', '¡Voy con todo en esta! 🎯',
            'Cada error es una lección aprendida 📚', '¡Los genios también se equivocan y aprenden! 🧠💡'
        ],
        'graduate': [
            '¡Lo lograste, eres un crack! 🎓', '¡Graduado con honores financieros! 🏅',
            '¡Conti Conti te admira! 👨‍🎓🐰', '¡Tu futuro financiero es brillante! 💰✨',
            '¡De estudiante a MAESTRO! 🧠👑', '¡Hoy celebras tu conocimiento! 🎉📚'
        ],
        'correct': [
            '¡Respuesta correcta! ✨', '¡Bien hecho! 🌟', '¡Así se hace! 💪',
            '¡Esa es la actitud! 🎯', '¡Vas por buen camino! 🛤️'
        ],
        'incorrect': [
            '¡No era esa, pero no pasa nada! 💪', '¡Aprender es equivocarse! 📚',
            '¡Revisa la explicación! 👀', '¡La próxima la tienes! 🎯',
            '¡Error detectado, conocimiento ganado! 🧠'
        ]
    };
    
    const list = messages[reaction] || messages['thinking'];
    if (speech) {
        speech.textContent = list[Math.floor(Math.random() * list.length)];
        speech.className = 'character-speech state-' + reaction;
        speech.style.animation = 'none';
        speech.offsetHeight;
        speech.style.animation = 'speechBubbleIn 0.4s ease-out';
    }
}

// ===== CARGA DE PREGUNTAS =====
function loadQuestion() {
    if (state.currentQuestion >= state.totalQuestions) { endLevel(); return; }
    
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    if (state._boredTimeout) clearTimeout(state._boredTimeout);
    if (state._freezeTimeout) clearTimeout(state._freezeTimeout);
    state._freezeTimeout = null;
    state.isFrozen = false;
    
    state.questionStartTime = Date.now();
    
    const question = state.questions[state.currentQuestion];
    const optionsGrid = document.getElementById('options-grid');
    const matchingContainer = document.getElementById('matching-container');
    const dragContainer = document.getElementById('drag-container');
    const sliderContainer = document.getElementById('slider-container');
    const feedbackBox = document.getElementById('feedback-box');
    const btnNext = document.getElementById('btn-next');
    
    if (optionsGrid) { optionsGrid.innerHTML = ''; optionsGrid.style.display = 'none'; }
    if (matchingContainer) { matchingContainer.innerHTML = ''; matchingContainer.style.display = 'none'; }
    if (dragContainer) { dragContainer.innerHTML = ''; dragContainer.style.display = 'none'; }
    if (sliderContainer) { sliderContainer.innerHTML = ''; sliderContainer.style.display = 'none'; }
    if (feedbackBox) { feedbackBox.className = 'feedback-box'; feedbackBox.innerHTML = ''; }
    if (btnNext) btnNext.style.display = 'none';
    
    const qImg = document.getElementById('question-image');
    if (qImg) qImg.style.display = 'none';
    
    const qText = document.getElementById('question-text');
    if (qText) qText.textContent = question.question;
    
    if (state.currentLevel === 4) updateRabbitReaction('deep-think');
    else updateRabbitReaction('thinking');
    
    switch (question.type) {
        case 'multiple': loadMultipleChoice(question); break;
        case 'matching': loadMatching(question); break;
        case 'slider': loadSlider(question); break;
        case 'drag': loadDrag(question); break;
    }
    
    if (state.mode === 'timed') startTimer();
    updateProgress();
    
    if (question.isBonus && optionsGrid && optionsGrid.style.display === 'flex') {
        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.add('bonus-question'));
    }
}

// ===== TIPOS DE PREGUNTAS =====
function loadMultipleChoice(question) {
    const optionsGrid = document.getElementById('options-grid');
    if (!optionsGrid) return;
    optionsGrid.style.display = 'flex';
    const indices = question.options.map((_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    question._shuffledIndices = shuffledIndices;
    
    shuffledIndices.forEach((originalIndex) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (question.isBonus) btn.classList.add('bonus-question');
        btn.textContent = question.options[originalIndex];
        btn.dataset.originalIndex = originalIndex;
        btn.addEventListener('click', () => checkMultipleAnswer(originalIndex, question));
        optionsGrid.appendChild(btn);
    });
}

function loadMatching(question) {
    const matchingContainer = document.getElementById('matching-container');
    if (!matchingContainer) return;
    matchingContainer.style.display = 'grid';
    let selectedLeft = null;
    const matches = {};
    const leftItems = shuffleArray(question.pairs.map(p => ({ id: p.id, text: p.left })));
    const rightItems = shuffleArray(question.pairs.map(p => ({ id: p.id, text: p.right })));
    
    leftItems.forEach(item => {
        const div = document.createElement('div'); div.className = 'matching-item'; div.textContent = item.text;
        div.dataset.pairId = item.id; div.dataset.side = 'left';
        div.addEventListener('click', function() {
            if (this.classList.contains('matched')) return;
            if (window.effectsManager) window.effectsManager.ensureAudio();
            document.querySelectorAll('.matching-item[data-side="left"]').forEach(el => { if (!el.classList.contains('matched')) el.classList.remove('selected'); });
            this.classList.add('selected'); selectedLeft = this;
        });
        matchingContainer.appendChild(div);
    });
    
    rightItems.forEach(item => {
        const div = document.createElement('div'); div.className = 'matching-item'; div.textContent = item.text;
        div.dataset.pairId = item.id; div.dataset.side = 'right';
        div.addEventListener('click', function() {
            if (this.classList.contains('matched')) return;
            if (window.effectsManager) window.effectsManager.ensureAudio();
            if (selectedLeft && !this.classList.contains('matched')) {
                if (selectedLeft.dataset.pairId === this.dataset.pairId) {
                    selectedLeft.classList.add('matched'); this.classList.add('matched');
                    matches[this.dataset.pairId] = true; selectedLeft = null;
                    if (Object.keys(matches).length === question.pairs.length) {
                        clearInterval(state.timerInterval);
                        state.timerInterval = null;
                        showFeedback(`¡Perfecto! ${question.explanation || 'Emparejaste todos los conceptos correctamente.'}`, 'correct');
                        triggerVisualCoinsFromElement(matchingContainer, 16);
                        handleCorrectAnswer(question.points);
                    }
                } else {
                    const leftEl = selectedLeft;
                    leftEl.style.borderColor = 'var(--rojo-alerta)'; this.style.borderColor = 'var(--rojo-alerta)';
                    setTimeout(() => { leftEl.style.borderColor = '#CBD5E1'; this.style.borderColor = '#CBD5E1'; leftEl.classList.remove('selected'); }, 500);
                    selectedLeft = null;
                }
            }
        });
        matchingContainer.appendChild(div);
    });
}

function loadSlider(question) {
    const sliderContainer = document.getElementById('slider-container');
    if (!sliderContainer) return;
    sliderContainer.style.display = 'block';
    
    const valueDisplay = document.createElement('div'); valueDisplay.className = 'slider-value';
    valueDisplay.textContent = question.min; valueDisplay.id = 'slider-value-display';
    
    const track = document.createElement('div'); track.className = 'slider-track';
    const fill = document.createElement('div'); fill.className = 'slider-fill'; fill.style.width = '0%';
    
    const input = document.createElement('input'); input.type = 'range'; input.className = 'slider-input';
    input.min = question.min; input.max = question.max; input.step = '0.1'; input.value = question.min;
    
    input.addEventListener('input', () => {
        fill.style.width = `${((input.value - question.min) / (question.max - question.min)) * 100}%`;
        valueDisplay.textContent = input.value;
    });
    
    track.appendChild(fill); track.appendChild(input);
    
    const submitBtn = document.createElement('button'); submitBtn.className = 'main-btn';
    submitBtn.textContent = 'Confirmar Respuesta ✅';
    submitBtn.addEventListener('click', () => {
        if (window.effectsManager) window.effectsManager.ensureAudio();
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        const userAnswer = parseFloat(input.value);
        if (Math.abs(userAnswer - question.correctAnswer) <= question.tolerance) {
            showFeedback(`¡Correcto! ${question.explanation}`, 'correct');
            triggerVisualCoinsFromElement(submitBtn, 14);
            handleCorrectAnswer(question.points);
        } else {
            showFeedback(`Incorrecto. ${question.explanation}`, 'incorrect');
            handleIncorrectAnswer(question);
        }
    });
    
    sliderContainer.appendChild(valueDisplay); sliderContainer.appendChild(track); sliderContainer.appendChild(submitBtn);
}

function loadDrag(question) {
    const dragContainer = document.getElementById('drag-container');
    if (!dragContainer) return;
    dragContainer.style.display = 'flex';
    
    question.items.forEach((item, index) => {
        const dropZone = document.createElement('div'); dropZone.className = 'drop-zone';
        dropZone.textContent = `${index + 1}. Soltar aquí`; dropZone.dataset.index = index;
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            if (window.effectsManager) window.effectsManager.ensureAudio();
            e.preventDefault(); dropZone.classList.remove('drag-over');
            const draggedIndex = e.dataTransfer.getData('text/plain');
            dropZone.textContent = `${index + 1}. ${question.items[draggedIndex]}`;
            dropZone.dataset.filled = draggedIndex;
            checkDragComplete(question);
        });
        dragContainer.appendChild(dropZone);
    });
    
    const itemsContainer = document.createElement('div');
    itemsContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;';
    
    shuffleArray(question.items).forEach((item) => {
        const draggable = document.createElement('div'); draggable.className = 'draggable-item';
        draggable.textContent = item; draggable.draggable = true;
        draggable.dataset.originalIndex = question.items.indexOf(item);
        draggable.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', draggable.dataset.originalIndex); draggable.style.opacity = '0.5'; });
        draggable.addEventListener('dragend', () => { draggable.style.opacity = '1'; });
        enableTouchDragForItem(draggable, question);
        itemsContainer.appendChild(draggable);
    });
    
    dragContainer.appendChild(itemsContainer);
}

function enableTouchDragForItem(draggable, question) {
    draggable.addEventListener('touchstart', () => { if (window.effectsManager) window.effectsManager.ensureAudio(); }, { passive: true });
    draggable.addEventListener('touchmove', (e) => {
        if (draggable.style.pointerEvents === 'none') return;
        e.preventDefault();
        const touch = e.touches[0];
        document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = el && el.closest ? el.closest('.drop-zone') : null;
        if (zone && !zone.dataset.filled) zone.classList.add('drag-over');
    }, { passive: false });
    draggable.addEventListener('touchend', (e) => {
        if (draggable.style.pointerEvents === 'none') return;
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = el && el.closest ? el.closest('.drop-zone') : null;
        document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
        if (window.effectsManager) { window.effectsManager.playSound('coin'); }
        if (zone && !zone.dataset.filled) {
            const index = parseInt(zone.dataset.index, 10);
            zone.textContent = `${index + 1}. ${question.items[draggable.dataset.originalIndex]}`;
            zone.dataset.filled = draggable.dataset.originalIndex;
            draggable.style.opacity = '0.3';
            draggable.style.pointerEvents = 'none';
            if (window.effectsManager) {
                const rect = zone.getBoundingClientRect();
                window.effectsManager.triggerExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.5, '#93C5FD');
            }
            checkDragComplete(question);
        }
    });
}

function checkDragComplete(question) {
    const dragContainer = document.getElementById('drag-container');
    const dropZones = document.querySelectorAll('.drop-zone');
    let allFilled = true, allCorrect = true;
    dropZones.forEach((zone, index) => { if (!zone.dataset.filled) allFilled = false; else if (parseInt(zone.dataset.filled) !== index) allCorrect = false; });
    if (allFilled) { 
        clearInterval(state.timerInterval); state.timerInterval = null;
        if (allCorrect) { showFeedback(`¡Excelente orden! ${question.explanation || ''}`, 'correct'); triggerVisualCoinsFromElement(dragContainer, 16); handleCorrectAnswer(question.points); }
        else { showFeedback('Orden incorrecto. Revisa el flujo lógico de los procesos financieros.', 'incorrect'); handleIncorrectAnswer(question); }
    }
}

// ===== MANEJO DE RESPUESTAS =====
function checkMultipleAnswer(originalIndex, question) {
    if (window.effectsManager) window.effectsManager.ensureAudio();
    const options = document.querySelectorAll('.option-btn');
    options.forEach(btn => btn.disabled = true);
    const shuffledIndices = question._shuffledIndices;
    const correctDisplayIndex = shuffledIndices.indexOf(question.correct);
    let clickedDisplayIndex = -1;
    options.forEach((btn, i) => { if (parseInt(btn.dataset.originalIndex) === originalIndex) clickedDisplayIndex = i; });
    const responseTime = (Date.now() - state.questionStartTime) / 1000;
    clearInterval(state.timerInterval); state.timerInterval = null;
    if (originalIndex === question.correct) {
        if (options[clickedDisplayIndex]) options[clickedDisplayIndex].classList.add('correct');
        let totalPoints = question.points; let coinCount = 12;
        if (responseTime < 3) { const speedBonus = Math.round(question.points * 0.5); totalPoints += speedBonus; coinCount += 8; showSpeedBonus(speedBonus); }
        if (options[clickedDisplayIndex]) { triggerVisualCoinsFromElement(options[clickedDisplayIndex], coinCount); }
        const bonusMsg = question.isBonus ? ' 🎁 ¡PREGUNTA BONUS! Puntuación DOBLE.' : '';
        showFeedback(`¡Correcto! ${question.explanation}${bonusMsg}`, question.isBonus ? 'bonus' : 'correct');
        handleCorrectAnswer(totalPoints);
    } else {
        if (options[clickedDisplayIndex]) options[clickedDisplayIndex].classList.add('incorrect');
        if (options[correctDisplayIndex]) options[correctDisplayIndex].classList.add('correct');
        showFeedback(`Incorrecto. ${question.explanation}`, 'incorrect');
        handleIncorrectAnswer(question);
    }
}

function handleCorrectAnswer(points) {
    if (state._boredTimeout) clearTimeout(state._boredTimeout);
    state.score += points; state.levelScore += points; state.streak++; state.correctInLevel++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    const question = state.questions[state.currentQuestion];
    if (question && question.topic) { if (!state.topicScores[question.topic]) state.topicScores[question.topic] = { correct: 0, total: 0 }; state.topicScores[question.topic].correct++; state.topicScores[question.topic].total++; }
    updateScore(); updateStreak();
    playSound('correct'); if (window.effectsManager) window.effectsManager.triggerConfetti();
    const responseTime = (Date.now() - state.questionStartTime) / 1000;
    if (responseTime < 3 && window.effectsManager) { window.effectsManager.triggerScreenFlash(180); }
    updateRabbitReaction('correct');
    if (state.streak >= 5) { document.getElementById('streak-display')?.classList.add('on-fire'); if (window.effectsManager) window.effectsManager.triggerCoinRain(); setTimeout(() => updateRabbitReaction('impressed'), 350); }
    else if (state.streak >= 3) { if (window.effectsManager) window.effectsManager.triggerCoinRain(); setTimeout(() => updateRabbitReaction('impressed'), 350); }
    const btnNext = document.getElementById('btn-next'); if (btnNext) btnNext.style.display = 'block';
    checkBadges();
}

function handleIncorrectAnswer(question) {
    if (state._boredTimeout) clearTimeout(state._boredTimeout);
    state.lives--; state.streak = 0; state.levelPerfect = false;
    document.getElementById('streak-display')?.classList.remove('on-fire');
    if (question && question.topic) { if (!state.topicScores[question.topic]) state.topicScores[question.topic] = { correct: 0, total: 0 }; state.topicScores[question.topic].total++; }
    updateLives(); updateStreak();
    playSound('incorrect');
    updateRabbitReaction('incorrect');
    if (state.lives <= 0) { setTimeout(() => updateRabbitReaction('determined'), 350); setTimeout(() => endLevel(), 1500); }
    else { setTimeout(() => updateRabbitReaction('determined'), 350); }
    const btnNext = document.getElementById('btn-next'); if (btnNext) btnNext.style.display = 'block';
}

function showFeedback(message, type) { const fb = document.getElementById('feedback-box'); if (!fb) return; fb.textContent = message; fb.className = `feedback-box ${type}`; }

function nextQuestion() {
    clearInterval(state.timerInterval); state.timerInterval = null;
    state.isFrozen = false; if (state._freezeTimeout) clearTimeout(state._freezeTimeout); state._freezeTimeout = null;
    state.currentQuestion++; document.getElementById('streak-display')?.classList.remove('on-fire');
    loadQuestion();
}

// ===== FIN DE NIVEL =====
function endLevel() {
    clearInterval(state.timerInterval); state.timerInterval = null;
    if (state._boredTimeout) clearTimeout(state._boredTimeout);
    if (state._freezeTimeout) clearTimeout(state._freezeTimeout); state._freezeTimeout = null; state.isFrozen = false;
    const totalQ = state.totalQuestions || 10;
    const starCount = state.levelPerfect ? 3 : (state.correctInLevel >= totalQ * 0.7 ? 2 : 1);
    state.levelStars[state.currentLevel] = starCount;
    unlockNextLevel(state.currentLevel);
    if (state.levelPerfect && state.lives === 3 && !state.badges.perfectScore) { state.badges.perfectScore = true; playSound('achievement'); if (window.effectsManager) window.effectsManager.triggerFireworks(); setTimeout(() => { if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Puntaje Perfecto!', { icon: '💯', bg: 'linear-gradient(135deg, #FFD700, #FFA500)', duration: 3500 }); }, 300); saveBadges(); }
    if (state.lives === 3 && !state.badges.survivor) { state.badges.survivor = true; playSound('achievement'); if (window.effectsManager) window.effectsManager.triggerFireworks(); setTimeout(() => { if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Sobreviviente!', { icon: '🛡️', bg: 'linear-gradient(135deg, #10B981, #059669)', duration: 3500 }); }, 300); saveBadges(); }
    if (!state.powerupsUsedThisLevel && !state.badges.noPowerups) { state.badges.noPowerups = true; playSound('achievement'); if (window.effectsManager) window.effectsManager.triggerFireworks(); setTimeout(() => { if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Poder Natural!', { icon: '💪', bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', duration: 3500 }); }, 300); saveBadges(); }
    if (state.currentLevel < 4) {
        const transTitle = document.getElementById('transition-title'); const transSpeech = document.getElementById('transition-speech'); const lvlScoreDisp = document.getElementById('level-score-display');
        if (transTitle) transTitle.textContent = `${levelNames[state.currentLevel]} Completado`;
        if (transSpeech) transSpeech.textContent = `¡Excelente! Nivel ${state.currentLevel} superado 🎉`;
        if (lvlScoreDisp) lvlScoreDisp.textContent = state.levelScore;
        let starsHTML = '<div class="star-rating">'; for (let i = 1; i <= 3; i++) { starsHTML += `<span class="star ${i <= starCount ? 'earned' : ''}">⭐</span>`; } starsHTML += '</div>';
        const scoreCard = document.querySelector('#screen-level-transition .share-card');
        if (scoreCard && !document.getElementById('level-stars')) { const starsDiv = document.createElement('div'); starsDiv.id = 'level-stars'; starsDiv.innerHTML = starsHTML; scoreCard.appendChild(starsDiv); }
        else if (document.getElementById('level-stars')) { document.getElementById('level-stars').innerHTML = starsHTML; }
        const btnNextLevel = document.getElementById('btn-next-level'); if (btnNextLevel) btnNextLevel.textContent = `Siguiente: ${levelNames[state.currentLevel + 1]} ➡️`;
        updateRabbitReaction(state.levelPerfect ? 'celebrating' : 'thinking'); showScreen('screen-level-transition'); playSound('levelup');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        if (window.effectsManager) { window.effectsManager.triggerConfetti(2000, 2); setTimeout(() => { if (window.effectsManager) window.effectsManager.triggerConfetti(1500, 1.5); }, 800); }
    } else { updateRabbitReaction('graduate'); showFinalResults(); playSound('levelup'); if (window.effectsManager) window.effectsManager.triggerFireworks(); }
}

function showFinalResults() {
    const finalScore = document.getElementById('final-score'); if (finalScore) finalScore.textContent = state.score;
    const topicAnalysis = document.getElementById('topic-analysis');
    if (topicAnalysis) {
        topicAnalysis.innerHTML = '';
        const topicNames = { 'presupuesto':'Presupuesto','ahorro':'Ahorro','inversion':'Inversión','credito':'Crédito','contabilidad':'Contabilidad','finanzas':'Finanzas','fondo-emergencia':'Fondo de Emergencia','tributacion':'Tributación','nomina':'Nómina','estados-financieros':'Estados Financieros','analisis-financiero':'Análisis Financiero','inventario':'Inventarios','matematica-financiera':'Matemática Financiera' };
        const topicColors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#E63946','#6366F1','#14B8A6','#F97316','#84CC16']; let colorIndex = 0;
        for (const [topic, scores] of Object.entries(state.topicScores)) { const percentage = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0; const bar = document.createElement('div'); bar.className = 'topic-bar'; bar.innerHTML = `<span class="topic-label">${topicNames[topic]||topic}</span><div class="topic-progress"><div class="topic-fill" style="width:${percentage}%;background:${topicColors[colorIndex]}"></div></div><span class="topic-score">${percentage}%</span>`; topicAnalysis.appendChild(bar); colorIndex = (colorIndex + 1) % topicColors.length; }
    }
    const shareBadges = document.getElementById('share-badges'); if (shareBadges) { shareBadges.innerHTML = ''; for (const [badge, unlocked] of Object.entries(state.badges)) { if (unlocked) { const badgeEl = document.createElement('span'); badgeEl.className = 'share-badge'; badgeEl.textContent = getBadgeIcon(badge); shareBadges.appendChild(badgeEl); } } }
    const speech = document.getElementById('result-character-speech'); const maxScore = 7000;
    if (speech) { if (state.score >= maxScore * 0.9) speech.textContent = '¡Rendimiento excepcional! Conti Conti te admira. 🏆🐰'; else if (state.score >= maxScore * 0.7) speech.textContent = '¡Excelente resultado! Bases muy sólidas. 👏🐰'; else if (state.score >= maxScore * 0.4) speech.textContent = '¡Buen esfuerzo! Sigue practicando. 📚🐰'; else speech.textContent = '¡El aprendizaje es un camino diario! 💡🐰'; }
    showScreen('screen-results'); if (window.effectsManager) window.effectsManager.triggerFireworks(); saveToLeaderboard();
}

function restartGame() { clearInterval(state.timerInterval); state.timerInterval = null; if (state._freezeTimeout) clearTimeout(state._freezeTimeout); state._freezeTimeout = null; state.isFrozen = false; state.currentQuestion = 0; state.score = 0; state.levelScore = 0; state.lives = 3; state.streak = 0; state.currentLevel = 1; state.powerupsUsedThisLevel = false; state.levelPerfect = true; state.levelStars = {}; state.bonusQuestionActive = false; state.correctInLevel = 0; document.body.className = 'level-1'; document.getElementById('streak-display')?.classList.remove('on-fire'); updateScore(); updateLives(); updateStreak(); updateProgress(); updateLevelDisplay(); startGame(); }
function goToFinalScreen() { updateRabbitReaction('graduate'); showScreen('screen-final'); if (window.effectsManager) window.effectsManager.triggerFireworks(); }

// ===== POWER-UPS =====
function usePowerup(type) {
    if (state.powerups[type] <= 0) return; if (state.currentQuestion >= state.totalQuestions) return; if ((type === 'time' || type === 'freeze') && state.mode !== 'timed') return;
    state.powerups[type]--; state.powerupsUsedThisLevel = true; updatePowerupButtons(); playSound('powerup');
    const btn = document.getElementById(`powerup-${type}`); if (btn) { btn.classList.add('flash'); setTimeout(() => btn.classList.remove('flash'), 300); }
    switch (type) { case 'fifty': applyFiftyFifty(); updateRabbitReaction('confident'); break; case 'time': if (state.mode === 'timed') { state.timer += 15; state._timerTotalTime += 15; updateTimerDisplay(); } break; case 'freeze': if (state._freezeTimeout) clearTimeout(state._freezeTimeout); state.isFrozen = true; updateRabbitReaction('frozen'); const td = document.getElementById('timer-display'); if (td) td.style.backgroundColor = '#10B981'; state._freezeTimeout = setTimeout(() => { state.isFrozen = false; state._freezeTimeout = null; updateRabbitReaction('thinking'); if (td) td.style.backgroundColor = 'var(--azul-oscuro)'; }, 10000); break; case 'hint': applyHint(); break; }
}
function applyFiftyFifty() { const question = state.questions[state.currentQuestion]; if (!question || question.type !== 'multiple') return; const options = document.querySelectorAll('.option-btn'); const shuffledIndices = question._shuffledIndices; const correctDisplayIndex = shuffledIndices.indexOf(question.correct); const incorrectIndexes = []; options.forEach((btn, i) => { if (i !== correctDisplayIndex) incorrectIndexes.push(i); }); shuffleArray(incorrectIndexes).slice(0, 2).forEach(index => { if (options[index]) { options[index].style.opacity = '0.3'; options[index].style.pointerEvents = 'none'; } }); }
function applyHint() { const question = state.questions[state.currentQuestion]; if (!question) return; const fb = document.getElementById('feedback-box'); if (!fb) return; const hintText = question.hint ? question.hint : (question.explanation ? question.explanation.split('.')[0] + '.' : 'Analiza cada opción con calma, ¡tú puedes lograrlo!'); fb.textContent = `💡 Pista: ${hintText}`; fb.className = 'feedback-box correct'; }

// ===== TEMPORIZADOR DE PRECISIÓN =====
function startTimer() {
    clearInterval(state.timerInterval); state.timerInterval = null;
    if (state.currentLevel === 1) state.timer = 30; else if (state.currentLevel === 2) state.timer = 25; else state.timer = 20;
    state._timerStartTime = Date.now(); state._timerTotalTime = state.timer; updateTimerDisplay();
    const timerDisplay = document.getElementById('timer-display'); if (timerDisplay) timerDisplay.classList.remove('warning');
    state.timerInterval = setInterval(() => { if (state.isFrozen) return; const elapsed = Math.floor((Date.now() - state._timerStartTime) / 1000); state.timer = state._timerTotalTime - elapsed; if (state.timer < 0) state.timer = 0; updateTimerDisplay(); if (state.timer <= 5 && state.timer > 0) { if (timerDisplay) timerDisplay.classList.add('warning'); updateRabbitReaction('nervous'); if (window.effectsManager) { window.effectsManager.playTick(); } } if (state.timer <= 0) { clearInterval(state.timerInterval); state.timerInterval = null; if (timerDisplay) timerDisplay.classList.remove('warning'); if (window.effectsManager) { window.effectsManager.playIncorrectFallback(); } showFeedback(`¡Tiempo agotado! ${state.questions[state.currentQuestion].explanation}`, 'incorrect'); handleIncorrectAnswer(state.questions[state.currentQuestion]); } }, 200);
    state._boredTimeout = setTimeout(() => { const nextBtn = document.getElementById('btn-next'); if (state.currentQuestion < state.totalQuestions && (!nextBtn || nextBtn.style.display === 'none')) { updateRabbitReaction('bored'); } }, 15000);
}
function updateTimerDisplay() { const td = document.getElementById('timer-display'); if (td) td.textContent = `⏱️ ${state.timer}s`; }

// ===== UI UPDATES =====
function updateScore() { const badge = document.getElementById('score-badge'); if (!badge) return; badge.textContent = `⭐ ${state.score} pts`; badge.classList.add('pop'); setTimeout(() => badge.classList.remove('pop'), 300); if (window.effectsManager && typeof window.effectsManager.triggerScoreBadgeFlash === 'function') { window.effectsManager.triggerScoreBadgeFlash(); } }
function updateLives() { const display = document.getElementById('lives-display'); if (!display) return; let hearts = ''; for (let i = 0; i < 3; i++) hearts += i < state.lives ? '❤️' : '🖤'; display.textContent = hearts; }
function updateStreak() { const sd = document.getElementById('streak-display'); if (sd) sd.textContent = `🔥 ${state.streak}`; }
function updateProgress() { const pf = document.getElementById('progress-fill'); if (pf) pf.style.width = `${(state.currentQuestion / state.totalQuestions) * 100}%`; }
function updatePowerupButtons() { ['fifty','time','freeze','hint'].forEach(type => { const btn = document.getElementById(`powerup-${type}`); if (!btn) return; const small = btn.querySelector('small'); if (small) small.textContent = `(${state.powerups[type]})`; const isTimePowerupInNormalMode = (type === 'time' || type === 'freeze') && state.mode !== 'timed'; btn.disabled = state.powerups[type] <= 0 || isTimePowerupInNormalMode; }); }

// ===== INSIGNIAS =====
function checkBadges() {
    if (state.score >= 2000 && !state.badges.financierPro) { state.badges.financierPro = true; playSound('achievement'); if (window.effectsManager) window.effectsManager.triggerFireworks(); setTimeout(() => { if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Financiero Pro!', { icon: '🏆', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', duration: 3500 }); }, 300); saveBadges(); }
    if (state.streak >= 5 && !state.badges.streaker) { state.badges.streaker = true; playSound('achievement'); if (window.effectsManager) window.effectsManager.triggerFireworks(); setTimeout(() => { if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Rachador!', { icon: '🔥', bg: 'linear-gradient(135deg, #EF4444, #DC2626)', duration: 3500 }); }, 300); saveBadges(); }
    if (state.mode === 'timed' && (Date.now() - state.questionStartTime) < 3000 && !state.badges.speedDemon) { state.badges.speedDemon = true; playSound('achievement'); if (window.effectsManager) window.effectsManager.triggerFireworks(); setTimeout(() => { if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Velocista!', { icon: '⚡', bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', duration: 3500 }); }, 300); saveBadges(); }
}
function getBadgeIcon(badge) { const icons = { perfectScore:'💯',speedDemon:'⚡',survivor:'🛡️',streaker:'🔥',financierPro:'🏆',noPowerups:'💪' }; return icons[badge] || '🏅'; }
function getBadgeName(badge) { const names = { perfectScore:'Puntaje Perfecto',speedDemon:'Velocista',survivor:'Sobreviviente',streaker:'Rachador',financierPro:'Financiero Pro',noPowerups:'Poder Natural' }; return names[badge] || badge; }
function loadBadges() { const saved = safeLocalGet('conti_badges', null); if (saved) { try { state.badges = { ...state.badges, ...JSON.parse(saved) }; } catch (e) { console.warn('No se pudo leer conti_badges guardado, se ignora.'); } } const grid = document.getElementById('badges-grid'); if (!grid) return; grid.innerHTML = ''; for (const [badge, unlocked] of Object.entries(state.badges)) { const el = document.createElement('div'); el.className = `badge-item ${unlocked ? 'unlocked' : ''}`; el.innerHTML = `<div class="badge-icon">${getBadgeIcon(badge)}</div><div class="badge-name">${getBadgeName(badge)}</div>`; grid.appendChild(el); } }
function saveBadges() { safeLocalSet('conti_badges', JSON.stringify(state.badges)); }

// ===== LEADERBOARD =====
function showNamePromptModal(onSubmit) {
    const overlay = document.createElement('div'); overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:3000;display:flex;align-items:center;justify-content:center;font-family:Poppins,sans-serif;padding:20px;box-sizing:border-box;';
    const box = document.createElement('div'); box.style.cssText = 'background:white;padding:26px 24px;border-radius:18px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.32);';
    box.innerHTML = '<div style="font-weight:800;font-size:1.15rem;margin-bottom:8px;color:#1E293B;">¡Buen trabajo! 🎉</div><div style="margin-bottom:16px;color:#64748B;font-size:0.9rem;">Ingresa tu nombre para el ranking</div><input id="conti-name-input" type="text" maxlength="20" placeholder="Jugador" style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid #CBD5E1;margin-bottom:16px;font-family:inherit;font-size:1rem;box-sizing:border-box;outline:none;"><div style="display:flex;gap:10px;justify-content:center;"><button id="conti-name-skip" style="flex:1;padding:11px 0;border-radius:10px;border:none;background:#E2E8F0;color:#334155;font-weight:700;cursor:pointer;font-family:inherit;">Omitir</button><button id="conti-name-ok" style="flex:1;padding:11px 0;border-radius:10px;border:none;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:white;font-weight:700;cursor:pointer;font-family:inherit;">Guardar</button></div>';
    overlay.appendChild(box); document.body.appendChild(overlay); const input = box.querySelector('#conti-name-input'); input.focus();
    const close = (value) => { overlay.remove(); onSubmit(value); };
    box.querySelector('#conti-name-ok').addEventListener('click', () => close(input.value.trim() || 'Jugador')); box.querySelector('#conti-name-skip').addEventListener('click', () => close(null)); input.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(input.value.trim() || 'Jugador'); }); document.addEventListener('keydown', function escapeHandler(e) { if (e.key === 'Escape') { close(null); document.removeEventListener('keydown', escapeHandler); } });
}
function saveToLeaderboard() { showNamePromptModal((playerName) => { if (!playerName) return; const leaderboard = JSON.parse(safeLocalGet('conti_leaderboard', '[]')); leaderboard.push({ name: playerName, score: state.score, badges: Object.values(state.badges).filter(Boolean).length, date: new Date().toLocaleDateString() }); leaderboard.sort((a, b) => b.score - a.score); safeLocalSet('conti_leaderboard', JSON.stringify(leaderboard.slice(0, 20))); loadLeaderboard(); }); }
function loadLeaderboard() { let leaderboard = []; try { leaderboard = JSON.parse(safeLocalGet('conti_leaderboard', '[]')); } catch (e) { console.warn('No se pudo leer conti_leaderboard guardado, se ignora.'); } const tbody = document.getElementById('leaderboard-body'); if (!tbody) return; tbody.innerHTML = ''; leaderboard.forEach((entry, index) => { const row = document.createElement('tr'); row.innerHTML = `<td class="${index < 3 ? `rank-${index+1}` : ''}">${index+1}</td><td>${entry.name}</td><td>${entry.score} pts</td><td>${'🏅'.repeat(entry.badges)}</td>`; tbody.appendChild(row); }); }
function shareResults() { const text = `🎉 ¡Acabo de conseguir ${state.score} puntos en ContiChallenge: Desafío Contable y Financiero! ¿Puedes superarme? 🏆`; if (navigator.share) { navigator.share({ title: 'ContiChallenge', text, url: window.location.href }).catch(() => {}); } else { navigator.clipboard.writeText(text).then(() => { if (window.effectsManager) { window.effectsManager.triggerToast('¡Copiado! Compártelo donde quieras.', { icon: '📋', duration: 2500 }); } }).catch(() => { if (window.effectsManager) { window.effectsManager.triggerToast('No se pudo copiar automáticamente.', { icon: '⚠️', duration: 2500 }); } }); } }
