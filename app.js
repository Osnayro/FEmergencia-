
/**
 * ============================================================
 * ContiGame Engine v3.5.0 — Producción
 * Lógica del juego, control de estado y flujos financieros
 * Para "ContiLab: Desafío Contable y Financiero"
 * ============================================================
 *
 * Cambios v3.5.0 sobre v3.4.2:
 *   - MEJORA: Sistema de niveles bloqueados progresivamente.
 *     Solo el Nivel 1 está disponible al inicio. Los niveles 2, 3 y 4
 *     se desbloquean al completar el nivel anterior. El progreso se
 *     guarda en localStorage.
 *   - MEJORA: Preguntas de ahorro (ID 2 y ID 7) reemplazadas por
 *     preguntas de contabilidad a nivel de bachillerato:
 *       ID 2 (nuevo): Objetivo principal de la contabilidad.
 *       ID 7 (nuevo): ¿Qué son las cuentas contables?
 *   - MEJORA: Frase inspiradora en el splash screen durante la carga:
 *     "El fondo de emergencia no es para ganar dinero; es para comprar tranquilidad."
 *
 * Cambios v3.4.2 sobre v3.4.1:
 *   - FIX CRÍTICO: El power-up de congelar (❄️) ahora se limpia
 *     correctamente al cambiar de pregunta.
 *   - FIX: _freezeTimeout en estado global.
 *
 * Cambios v3.4.1 sobre v3.4:
 *   - ROBUSTEZ: Limpieza de _boredTimeout en handleCorrectAnswer()
 *     e handleIncorrectAnswer().
 *   - ROBUSTEZ: Modal de nombre cierra con Escape.
 *
 * Cambios v3.4 sobre v3.3:
 *   - FIX CRÍTICO: Temporizador se reinicia correctamente en cada pregunta.
 *   - FIX: nextQuestion() limpia intervalo anterior.
 *
 * Cambios v3.3 sobre v3.2:
 *   - MEJORA PEDAGÓGICA: Propiedad 'hint' independiente en las 46 preguntas.
 *   - MEJORA PEDAGÓGICA: Nueva pregunta ID 411 con haber no imponible.
 *   - MEJORA PEDAGÓGICA: Estado 'sad' eliminado. Growth Mindset.
 *   - MEJORA PEDAGÓGICA: Aclaración de montos netos en preguntas de IVA.
 *   - MEJORA SENSORIAL: Flash blanco, destello score-badge, sonido+explosión drag.
 *   - CORRECCIÓN: Muletillas festivas eliminadas del Nivel 1.
 *   - CORRECCIÓN: Error ortográfico "classifies" → "clasifica" (ID 207).
 *   - FIX: clonado profundo, cálculo de estrellas, applyHint, localStorage.
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
    // Niveles desbloqueados (guardados en localStorage)
    unlockedLevels: {
        1: true,
        2: false,
        3: false,
        4: false
    }
};

// ===== BANCO DE PREGUNTAS =====
const generalQuestions = [
    {
        id: 1, topic: 'presupuesto', type: 'multiple',
        question: '¿Qué es un presupuesto?',
        options: ['Un plan de gastos e ingresos', 'Un tipo de impuesto', 'Una cuenta bancaria', 'Un préstamo'],
        correct: 0,
        explanation: 'Un presupuesto es un plan financiero que estima ingresos y gastos en un período determinado.',
        hint: 'Piensa en una herramienta que te ayuda a planificar en qué gastarás tu dinero antes de recibirlo.',
        points: 100
    },
    {
        id: 2, topic: 'contabilidad', type: 'multiple',
        question: '¿Cuál es el objetivo principal de la contabilidad?',
        options: ['Registrar, clasificar y resumir las operaciones financieras', 'Calcular impuestos exclusivamente', 'Contratar personal para la empresa', 'Diseñar estrategias de marketing'],
        correct: 0,
        explanation: 'La contabilidad tiene como objetivo registrar, clasificar y resumir las operaciones financieras de una entidad para facilitar la toma de decisiones.',
        hint: 'No se limita solo a impuestos ni a contratación. Piensa en el proceso completo de la información financiera.',
        points: 100
    },
    {
        id: 3, topic: 'inversion', type: 'multiple',
        question: '¿Qué significa "diversificar" en inversiones?',
        options: ['Invertir en diferentes activos para reducir riesgo', 'Poner todo el dinero en una sola acción', 'Retirar todo el dinero del banco', 'Solo invertir en bienes raíces'],
        correct: 0,
        explanation: 'Diversificar es distribuir las inversiones en distintos activos para minimizar el riesgo de pérdida.',
        hint: 'Es lo opuesto a "poner todos los huevos en la misma canasta".',
        points: 100
    },
    {
        id: 4, topic: 'credito', type: 'multiple',
        question: '¿Qué es el historial crediticio?',
        options: ['Un registro de cómo has manejado tus deudas', 'El saldo de tu cuenta bancaria', 'Una lista de tus inversiones', 'Tu declaración de impuestos'],
        correct: 0,
        explanation: 'El historial crediticio muestra tu comportamiento de pago de deudas y determina tu puntaje crediticio.',
        hint: 'Es como tu "hoja de vida financiera" que los bancos revisan antes de prestarte dinero.',
        points: 100
    },
    {
        id: 5, topic: 'contabilidad', type: 'multiple',
        question: 'En contabilidad, ¿qué representa el "activo"?',
        options: ['Bienes y derechos de una empresa', 'Las deudas de la empresa', 'Las ganancias del año', 'Los gastos mensuales'],
        correct: 0,
        explanation: 'El activo son todos los bienes y derechos que posee una empresa o persona.',
        hint: 'Es todo lo que tiene valor y pertenece a la empresa: dinero, edificios, vehículos, cuentas por cobrar.',
        points: 100
    },
    {
        id: 6, topic: 'presupuesto', type: 'matching',
        question: 'Empareja los conceptos con sus definiciones:',
        pairs: [
            { left: 'Ingreso', right: 'Dinero recibido', id: 1 },
            { left: 'Gasto', right: 'Dinero desembolsado', id: 2 },
            { left: 'Ahorro', right: 'Dinero reservado', id: 3 },
            { left: 'Inversión', right: 'Dinero que genera más dinero', id: 4 }
        ],
        hint: 'Relaciona cada término con lo que representa: entrada, salida, reserva o crecimiento del dinero.',
        points: 200
    },
    {
        id: 7, topic: 'contabilidad', type: 'multiple',
        question: '¿Qué son las cuentas contables?',
        options: ['Registros donde se anotan los aumentos y disminuciones de cada elemento del patrimonio', 'Documentos legales para pagar impuestos', 'Listas de empleados de una empresa', 'Contratos con proveedores'],
        correct: 0,
        explanation: 'Las cuentas contables son registros individuales donde se anotan los movimientos (aumentos y disminuciones) de cada elemento del activo, pasivo, patrimonio, ingresos y gastos.',
        hint: 'Cada elemento del patrimonio tiene su propio registro donde se anotan sus cambios.',
        points: 150
    },
    {
        id: 8, topic: 'credito', type: 'multiple',
        question: '¿Qué es mejor para tu salud financiera?',
        options: ['Pagar el total de la tarjeta de crédito cada mes', 'Pagar solo el mínimo requerido', 'Tener muchas tarjetas de crédito', 'Usar el crédito para gastos diarios'],
        correct: 0,
        explanation: 'Pagar el total cada mes evita intereses y mantiene un buen historial crediticio.',
        hint: 'Los intereses de las tarjetas de crédito son muy altos. ¿Qué opción evita pagarlos?',
        points: 100
    },
    {
        id: 9, topic: 'contabilidad', type: 'multiple',
        question: 'La ecuación contable fundamental es:',
        options: ['Activo = Pasivo + Patrimonio', 'Activo = Ingresos - Gastos', 'Pasivo = Activo + Patrimonio', 'Patrimonio = Activo - Ingresos'],
        correct: 0,
        explanation: 'Activo = Pasivo + Patrimonio es la base de la contabilidad por partida doble.',
        hint: 'Recuerda qué elementos financian los bienes que tiene la empresa: deudas con terceros y aportes de los dueños.',
        points: 100
    },
    {
        id: 10, topic: 'finanzas', type: 'drag',
        question: 'Ordena los pasos para crear un plan financiero saludable:',
        items: ['Analizar ingresos y gastos', 'Establecer metas financieras', 'Crear un presupuesto', 'Ahorrar e invertir regularmente', 'Revisar y ajustar periódicamente'],
        hint: 'Primero debes saber cuánto ganas y gastas, luego fijar objetivos, y finalmente hacer seguimiento.',
        points: 200
    },
    {
        id: 11, topic: 'presupuesto', type: 'multiple',
        question: '¿Qué es un gasto hormiga?',
        options: ['Pequeños gastos diarios que suman grandes cantidades', 'Gastos en insecticidas', 'Grandes compras planificadas', 'Inversiones pequeñas'],
        correct: 0,
        explanation: 'Los gastos hormiga son pequeñas compras frecuentes que parecen insignificantes pero suman mucho al mes.',
        hint: 'Son esos pequeños gustos diarios que parecen inofensivos pero que al final del mes suman una cantidad sorprendente.',
        points: 100
    },
    {
        id: 12, topic: 'inversion', type: 'multiple',
        question: '¿Qué es el interés compuesto?',
        options: ['Intereses que generan más intereses con el tiempo', 'Un tipo de impuesto financiero', 'El interés que cobra el banco', 'Una comisión por inversión'],
        correct: 0,
        explanation: 'El interés compuesto hace que tu dinero crezca exponencialmente al reinvertir las ganancias.',
        hint: 'Es como una bola de nieve: los intereses ganados se suman al capital y generan nuevos intereses.',
        points: 100
    }
];

// Nivel 1: Fondo de Emergencia
const fondoEmergenciaQuestions = [
    { id: 101, topic: 'fondo-emergencia', type: 'multiple', question: '¿Qué es un fondo de emergencia?', options: ['Dinero para comprar regalos', 'Un ahorro destinado a cubrir gastos inesperados', 'Un préstamo bancario', 'Dinero para vacaciones'], correct: 1, explanation: 'Es un ahorro destinado a cubrir gastos inesperados como urgencias médicas o reparaciones.', hint: 'Piensa en un dinero guardado exclusivamente para momentos difíciles e inesperados, no para gustos.', points: 100 },
    { id: 102, topic: 'fondo-emergencia', type: 'multiple', question: '¿Cuál de estas situaciones corresponde a una emergencia?', options: ['Hospitalización inesperada', 'Comprar ropa', 'Ir al cine', 'Comprar un celular nuevo'], correct: 0, explanation: 'Una emergencia de salud no se planifica y requiere fondos inmediatos.', hint: 'Una emergencia es algo urgente que no puedes posponer y que afecta tu salud o seguridad.', points: 100 },
    { id: 103, topic: 'fondo-emergencia', type: 'multiple', question: '¿Para qué sirve un fondo de emergencia?', options: ['Comprar cosas por impulso', 'Ahorrar para vacaciones', 'Cubrir gastos inesperados sin endeudarse', 'Comprar tecnología'], correct: 2, explanation: 'Te protege de pedir préstamos con intereses altos cuando surgen imprevistos.', hint: 'Su propósito es evitar que un imprevisto te obligue a adquirir deudas costosas.', points: 100 },
    { id: 104, topic: 'fondo-emergencia', type: 'multiple', question: '¿Cuándo es recomendable ahorrar?', options: ['Solo cuando sobra dinero', 'Todos los meses', 'Una vez al año', 'Nunca'], correct: 1, explanation: 'El ahorro es un hábito constante que se planifica cada mes, sin importar el monto.', hint: 'La constancia es más importante que la cantidad. No esperes a que "sobre" dinero para empezar.', points: 100 },
    { id: 105, topic: 'fondo-emergencia', type: 'multiple', question: 'Si se rompe el refrigerador de tu casa, ¿qué sería lo más recomendable?', options: ['Pedir un préstamo', 'Esperar varios meses', 'Utilizar el fondo de emergencia', 'No hacer nada'], correct: 2, explanation: 'Es una urgencia doméstica para la cual está diseñado este fondo.', hint: 'Para eso creaste el fondo de emergencia: para resolver problemas sin endeudarte.', points: 100 },
    { id: 106, topic: 'fondo-emergencia', type: 'multiple', question: '¿Cuál de estas opciones NO corresponde a una emergencia?', options: ['Una operación médica', 'Una reparación urgente', 'Comprar el último modelo de celular', 'Reparar una fuga de agua'], correct: 2, explanation: 'Cambiar de teléfono por gusto es un deseo, no una emergencia.', hint: 'Diferencia entre lo que es urgente y necesario versus lo que es un simple deseo de consumo.', points: 100 },
    { id: 107, topic: 'fondo-emergencia', type: 'multiple', question: '¿Qué documento permite conocer cómo se distribuye el sueldo de un trabajador?', options: ['Factura', 'Boleta', 'Planilla de remuneraciones', 'Balance general'], correct: 2, explanation: 'En la planilla de remuneraciones se detallan los haberes, descuentos y líquido a pagar.', hint: 'Es el documento que detalla todos los ingresos y descuentos que aplican al sueldo de un trabajador.', points: 100 },
    { id: 108, topic: 'fondo-emergencia', type: 'multiple', question: '¿Qué representa el sueldo líquido?', options: ['El sueldo antes de descuentos', 'El dinero destinado a la AFP', 'El dinero que finalmente recibe el trabajador', 'Los impuestos'], correct: 2, explanation: 'Es el monto real entregado al trabajador después de aplicar todos los descuentos legales.', hint: 'Es el dinero que efectivamente llega a tu bolsillo después de todas las retenciones.', points: 100 },
    { id: 109, topic: 'fondo-emergencia', type: 'multiple', question: '¿Por qué la planilla de remuneraciones puede ayudar a crear un fondo de emergencia?', options: ['Porque aumenta el sueldo', 'Porque elimina gastos', 'Porque permite saber cuánto dinero recibe una persona y cuánto puede ahorrar', 'Porque evita pagar impuestos'], correct: 2, explanation: 'Saber tus ingresos exactos permite calcular tu capacidad de ahorro mensual.', hint: 'Conocer con precisión cuánto dinero recibes es el primer paso para planificar cuánto puedes ahorrar.', points: 100 },
    { id: 110, topic: 'fondo-emergencia', type: 'multiple', question: '¿Cuál de las siguientes especialidades enseña sobre remuneraciones, educación financiera, administración y contabilidad?', options: ['🍳 Gastronomía', '👶 Atención de Párvulos', '📊 Contabilidad', '🥫 Elaboración Industrial de Alimentos', '⚡ Electrónica'], correct: 2, explanation: 'Contabilidad entrega las herramientas para administrar el dinero y las organizaciones.', hint: 'Es la especialidad que se enfoca en registrar, analizar y gestionar la información financiera.', points: 100 },
    { id: 111, topic: 'fondo-emergencia', type: 'multiple', question: '¿Cuántos meses de gastos debe cubrir idealmente un fondo de emergencia?', options: ['1 mes', '2 meses', 'De 3 a 6 meses', '12 meses o más'], correct: 2, explanation: 'Los expertos recomiendan cubrir entre 3 y 6 meses de gastos básicos.', hint: 'No es solo un mes, pero tampoco necesitas un año completo. Busca el rango intermedio recomendado.', points: 100 },
    { id: 112, topic: 'fondo-emergencia', type: 'multiple', question: '¿Dónde es mejor guardar el dinero del fondo de emergencia?', options: ['En una alcancía en casa', 'Invertido en acciones', 'En una cuenta de ahorro de fácil acceso', 'Prestado a un familiar'], correct: 2, explanation: 'Debe estar disponible rápidamente y sin riesgo de pérdida.', hint: 'Necesitas que el dinero esté seguro pero accesible de inmediato cuando surja la emergencia.', points: 100 },
    { id: 113, topic: 'fondo-emergencia', type: 'multiple', question: '¿Qué característica debe tener un fondo de emergencia?', options: ['Alta rentabilidad', 'Liquidez inmediata', 'Plazo fijo a 5 años', 'Inversión en criptomonedas'], correct: 1, explanation: 'La liquidez permite disponer del dinero en el momento exacto de la emergencia.', hint: 'En una emergencia no puedes esperar días para retirar tu dinero. Necesitas que esté disponible al instante.', points: 100 },
    { id: 114, topic: 'fondo-emergencia', type: 'multiple', question: 'Si ganas $500.000 mensuales, ¿cuánto deberías tener idealmente en tu fondo de emergencia?', options: ['$100.000', '$500.000', 'Entre $1.500.000 y $3.000.000', '$10.000.000'], correct: 2, explanation: 'Equivale a 3-6 meses de gastos. Si tus gastos son $500.000, necesitas entre $1.5 y $3 millones.', hint: 'Multiplica tus gastos mensuales por el número de meses recomendado (entre 3 y 6).', points: 100 },
    { id: 115, topic: 'fondo-emergencia', type: 'multiple', question: '¿Cuál es el primer paso para crear un fondo de emergencia?', options: ['Calcular los gastos mensuales básicos', 'Pedir un préstamo', 'Invertir en la bolsa', 'Gastar menos en entretención'], correct: 0, explanation: 'Primero debes saber cuánto necesitas para cubrir tus gastos esenciales.', hint: 'Antes de ahorrar, necesitas saber exactamente cuánto gastas en lo esencial cada mes.', points: 100 }
];

// Nivel 2: Contabilidad y Nómina
const nivel2Questions = [
    { id: 201, topic: 'contabilidad', type: 'multiple', question: 'Si una empresa cobra $500 en efectivo por un servicio realizado, ¿cuál es el registro contable correcto?', options: ['Cargar (Débito) a Caja y Abonar (Crédito) a Ingresos por Servicios', 'Cargar a Ingresos por Servicios y Abonar a Caja', 'Cargar a Banco y Abonar a Cuentas por Cobrar', 'Cargar a Gastos Generales y Abonar a Caja'], correct: 0, explanation: 'El dinero entra a la empresa (Activo aumenta por el Debe en Caja) y se reconoce la venta (Ingreso aumenta por el Haber).', hint: 'Cuando recibes efectivo por un servicio, ¿qué cuenta de Activo aumenta y qué cuenta de Ingreso se reconoce?', points: 150 },
    { id: 202, topic: 'contabilidad', type: 'multiple', question: '¿Qué ocurre en la ecuación contable cuando una empresa compra mercancía al contado?', options: ['Aumenta un Activo (Inventario) y disminuye otro Activo (Caja)', 'Aumenta un Activo y aumenta un Pasivo', 'Disminuye el Patrimonio y aumenta el Pasivo', 'Aumenta el Pasivo y disminuye el Activo'], correct: 0, explanation: 'Es un intercambio de activos: ingresa Inventario y sale Efectivo/Caja por el mismo valor.', hint: 'Al pagar al contado, no generas deuda. Solo intercambias un tipo de activo por otro.', points: 150 },
    { id: 203, topic: 'tributacion', type: 'multiple', question: 'En el cálculo del IVA sobre ventas netas, ¿qué representa el Débito Fiscal?', options: ['El IVA cobrado a los clientes en las ventas de la empresa', 'El IVA pagado a los proveedores al comprar insumos', 'El impuesto sobre la renta que se paga a fin de año', 'Un dinero que la administración tributaria le debe a la empresa'], correct: 0, explanation: 'El Débito Fiscal es el IVA recaudado de las ventas. Representa un pasivo con el fisco.', hint: 'Es el IVA que tus clientes te pagan a ti y que luego debes entregar al fisco.', points: 150 },
    { id: 204, topic: 'tributacion', type: 'multiple', question: 'Si en un mes generas $200 de Débito Fiscal (sobre ventas netas) y pagaste $120 de Crédito Fiscal, ¿cuánto debes pagar al fisco?', options: ['$80', '$320', '$120', '$0 (Queda saldo a favor)'], correct: 0, explanation: 'Impuesto a pagar = Débito Fiscal ($200) menos Crédito Fiscal ($120) = $80.', hint: 'Al IVA que cobraste en tus ventas réstale el IVA que pagaste en tus compras.', points: 150 },
    { id: 205, topic: 'nomina', type: 'multiple', question: '¿Cuál es la diferencia entre el Sueldo Bruto y el Sueldo Líquido?', options: ['El Sueldo Bruto es el total pactado; el Líquido es lo que recibe el trabajador tras descuentos de ley', 'El Sueldo Líquido es antes de impuestos y el Bruto es después', 'El Sueldo Bruto se paga en efectivo y el Líquido mediante cheque', 'Son exactamente el mismo monto'], correct: 0, explanation: 'El Sueldo Bruto incluye todos los haberes. Al restarle las retenciones legales se obtiene el Sueldo Líquido.', hint: 'Uno es el monto antes de descuentos y el otro es lo que efectivamente recibes en tu cuenta bancaria.', points: 150 },
    { id: 206, topic: 'contabilidad', type: 'multiple', question: '¿Cuál de las siguientes cuentas es de naturaleza ACREEDORA (aumenta por el Haber)?', options: ['Cuentas por Pagar (Pasivo)', 'Caja Chica (Activo)', 'Gastos de Arriendo (Gasto)', 'Banco (Activo)'], correct: 0, explanation: 'Las cuentas de Pasivo, Patrimonio e Ingresos nacen y aumentan por el Haber.', hint: 'Las deudas y obligaciones aumentan por el Haber. ¿Cuál de estas opciones es una deuda?', points: 150 },
    { id: 207, topic: 'contabilidad', type: 'multiple', question: '¿Para qué sirve el Libro Mayor en la contabilidad diaria?', options: ['Para agrupar los saldos individuales y movimientos de cada cuenta contable', 'Para anotar las facturas del día en orden cronológico', 'Para calcular el sueldo de los trabajadores', 'Para pagar los impuestos directamente'], correct: 0, explanation: 'El Libro Mayor clasifica las operaciones por cada cuenta específica para conocer su saldo.', hint: 'Mientras el Libro Diario registra cronológicamente, este libro agrupa por cuentas individuales.', points: 150 },
    { id: 208, topic: 'contabilidad', type: 'multiple', question: 'Se compra un equipo de oficina por $1.000 a crédito firmando una letra. ¿Qué cuenta de pasivo aumenta?', options: ['Documentos por Pagar', 'Cuentas por Cobrar', 'Capital Social', 'Gastos Operativos'], correct: 0, explanation: 'Al existir un compromiso formal respaldado por un documento, la deuda se registra en Documentos por Pagar.', hint: 'Al firmar un documento que respalda la deuda, usas una cuenta específica de pasivo diferente a "Cuentas por Pagar".', points: 150 },
    { id: 209, topic: 'nomina', type: 'multiple', question: '¿Qué representan los "Haberes No Imponibles" en una planilla de remuneraciones?', options: ['Asignaciones que no sufren descuentos legales, como la movilización o colación', 'El sueldo base antes de calcular las horas extras', 'Los préstamos que la empresa le otorga al trabajador', 'Los impuestos cobrados directamente por el gobierno'], correct: 0, explanation: 'Son compensaciones por gastos de trabajo sobre los cuales no se aplican retenciones.', hint: 'Son montos que se pagan al trabajador pero sobre los cuales no se calculan impuestos ni cotizaciones.', points: 150 },
    { id: 210, topic: 'contabilidad', type: 'multiple', question: '¿Cuál es el principio contable de la "Partida Doble"?', options: ['No hay deudor sin acreedor: la suma del Debe debe ser igual a la suma del Haber', 'Todas las compras se deben hacer por duplicado', 'Los impuestos se pagan dos veces al año', 'Las ganancias siempre deben duplicar a las pérdidas'], correct: 0, explanation: 'La partida doble garantiza el equilibrio patrimonial en todo asiento contable.', hint: 'Cada transacción afecta al menos dos cuentas y los totales del Debe y Haber siempre deben coincidir.', points: 150 }
];

// Nivel 3: Estados Financieros
const nivel3Questions = [
    { id: 301, topic: 'estados-financieros', type: 'multiple', question: '¿Qué fórmula se utiliza para determinar la Utilidad Bruta en el Estado de Resultados?', options: ['Ventas Netas - Costo de Ventas', 'Ingresos Totales - Gastos Administrativos', 'Activo Total - Pasivo Total', 'Utilidad Neta + Impuestos'], correct: 0, explanation: 'La Utilidad Bruta mide la ganancia directa generada por la venta de productos antes de restar los gastos operativos.', hint: 'Solo considera el ingreso por ventas y el costo directo de lo vendido, sin incluir gastos administrativos.', points: 200 },
    { id: 302, topic: 'analisis-financiero', type: 'slider', question: 'Si una empresa tiene $15.000 de Activo Corriente y $5.000 de Pasivo Corriente, ¿cuál es su Razón de Liquidez Corriente?', min: 0, max: 5, correctAnswer: 3, tolerance: 0, explanation: 'Razón Corriente = $15.000 / $5.000 = 3. La empresa posee $3 en activos líquidos por cada $1 de deuda.', hint: 'Divide el Activo Corriente entre el Pasivo Corriente. El resultado indica cuántos pesos tienes por cada peso que debes.', points: 200 },
    { id: 303, topic: 'inventario', type: 'multiple', question: 'En un período con precios al alza, ¿qué ocurre al aplicar el método PEPS (FIFO)?', options: ['El Costo de Ventas es menor y la Utilidad Bruta se presenta más alta', 'El Costo de Ventas es mayor y la Utilidad Bruta disminuye', 'No hay ningún impacto en los estados financieros', 'El valor del inventario final resulta infravalorado'], correct: 0, explanation: 'Al vender primero los artículos antiguos (más baratos), el Costo de Ventas baja y la Utilidad sube.', hint: 'PEPS significa "Primero en Entrar, Primero en Salir". Si los precios suben, ¿qué pasa con los productos más antiguos?', points: 200 },
    { id: 304, topic: 'estados-financieros', type: 'multiple', question: '¿Cómo se clasifican las deudas que la empresa debe pagar en un plazo menor a 12 meses?', options: ['Pasivo Corriente (o a Corto Plazo)', 'Pasivo No Corriente (o a Largo Plazo)', 'Patrimonio Neto', 'Activo Intangible'], correct: 0, explanation: 'Todas las obligaciones exigibles en un plazo máximo de un año forman parte del Pasivo Corriente.', hint: 'Si vence dentro del año, se clasifica como corriente o de corto plazo.', points: 200 },
    { id: 305, topic: 'analisis-financiero', type: 'multiple', question: '¿Qué representa el Capital de Trabajo de una organización?', options: ['Los recursos disponibles para operar (Activo Corriente - Pasivo Corriente)', 'El total de las aportaciones de los socios', 'El valor de los edificios y maquinaria', 'El total de créditos solicitados a los bancos'], correct: 0, explanation: 'El Capital de Trabajo Neto indica la liquidez excedente para continuar operando.', hint: 'Es la diferencia entre lo que tienes disponible a corto plazo y lo que debes pagar a corto plazo.', points: 200 },
    { id: 306, topic: 'estados-financieros', type: 'multiple', question: '¿Qué es la Depreciación Acumulada dentro del Balance General?', options: ['Una cuenta reguladora del activo que refleja la pérdida de valor de los bienes de uso', 'Un gasto que requiere salida directa de dinero', 'Una deuda a largo plazo con proveedores', 'Una reserva de dinero en efectivo'], correct: 0, explanation: 'Reduce el valor en libros de los activos fijos debido al desgaste, uso o tiempo.', hint: 'No es un gasto en efectivo, sino el reconocimiento contable del desgaste de equipos y maquinaria.', points: 200 },
    { id: 307, topic: 'inventario', type: 'multiple', question: '¿En qué consiste el método del Promedio Ponderado para el control de inventarios?', options: ['Calcula un costo unitario medio dividiendo el costo total entre las unidades en existencia', 'Asigna el costo de las últimas unidades compradas a las primeras salidas', 'Aplica un valor estimado al azar', 'Utiliza únicamente el precio de venta al público'], correct: 0, explanation: 'El promedio ponderado suaviza las variaciones de precios recalculando el costo medio tras cada compra.', hint: 'Mezcla todos los costos y los divide entre el total de unidades para obtener un costo uniforme.', points: 200 },
    { id: 308, topic: 'estados-financieros', type: 'multiple', question: 'Si una empresa reporta Ventas de $50.000 y Utilidad Neta de $10.000, ¿cuál es su Margen Neto?', options: ['20%', '50%', '5%', '10%'], correct: 0, explanation: 'Margen Neto = ($10.000 / $50.000) × 100 = 20%.', hint: 'Divide la Utilidad Neta entre las Ventas y multiplica por 100 para obtener el porcentaje.', points: 200 },
    { id: 309, topic: 'analisis-financiero', type: 'multiple', question: '¿Cuál es la diferencia entre el Estado de Resultados y el Balance General?', options: ['El Estado de Resultados mide el desempeño durante un período; el Balance muestra la situación a una fecha', 'El Balance mide el rendimiento anual y el Estado de Resultados solo la liquidez', 'Ambos reportes muestran exactamente la misma información', 'El Estado de Resultados es interno y el Balance solo para entidades tributarias'], correct: 0, explanation: 'El Estado de Resultados es dinámico (flujos) y el Balance General es estático (foto a una fecha).', hint: 'Uno es como una película (muestra lo que pasó durante un tiempo) y el otro es como una fotografía (muestra un momento).', points: 200 },
    { id: 310, topic: 'estados-financieros', type: 'multiple', question: '¿A qué grupo pertenecen el arriendo del local y los sueldos administrativos en el Estado de Resultados?', options: ['Gastos Operativos (Administración y Ventas)', 'Costo Directo de Ventas', 'Ingresos Extraordinarios', 'Pasivos a Largo Plazo'], correct: 0, explanation: 'Son desembolsos necesarios para la gestión operativa, clasificados como Gastos Operativos.', hint: 'No son el costo directo de fabricar el producto, sino los gastos necesarios para administrar el negocio.', points: 200 }
];

// Nivel 4: Cálculos Avanzados
const nivelAvanzadoQuestions = [
    { id: 401, topic: 'contabilidad', type: 'multiple', question: 'Activo Total = $45.000, Pasivo Total = $18.000. Si los socios aportan $5.000 más, ¿nuevo Patrimonio?', options: ['$32.000', '$27.000', '$22.000', '$50.000'], correct: 0, explanation: 'Patrimonio Inicial = $45.000 - $18.000 = $27.000. Con aporte: $27.000 + $5.000 = $32.000.', hint: 'Usa la ecuación contable fundamental: Activo = Pasivo + Patrimonio. Luego suma el nuevo aporte.', points: 250 },
    { id: 402, topic: 'tributacion', type: 'multiple', question: 'Ventas netas por $1.000 (más 16% IVA) y compras netas por $600 (más 16% IVA). ¿IVA a pagar?', options: ['$64', '$160', '$96', '$256'], correct: 0, explanation: 'Débito Fiscal = $1.000 × 0,16 = $160. Crédito Fiscal = $600 × 0,16 = $96. IVA = $160 - $96 = $64.', hint: 'Calcula el IVA por separado para ventas y compras sobre los montos netos, luego réstalos.', points: 250 },
    { id: 403, topic: 'estados-financieros', type: 'multiple', question: 'Maquinaria de $12.000, vida útil 5 años, valor residual $2.000. ¿Valor en libros al año 2?', options: ['$8.000', '$10.000', '$4.000', '$6.000'], correct: 0, explanation: 'Depreciación anual = ($12.000 - $2.000) / 5 = $2.000. Año 2: $12.000 - $4.000 = $8.000.', hint: 'Resta el valor residual, divide entre los años de vida útil, y multiplica por los años transcurridos.', points: 250 },
    { id: 404, topic: 'analisis-financiero', type: 'slider', question: 'Activo Corriente = $18.000, Inventario = $6.000, Pasivo Corriente = $8.000. ¿Prueba Ácida?', min: 0, max: 5, correctAnswer: 1.5, tolerance: 0.1, explanation: 'Prueba Ácida = ($18.000 - $6.000) / $8.000 = $12.000 / $8.000 = 1,5.', hint: 'A los Activos Corrientes réstales el Inventario (no es líquido) y divide entre el Pasivo Corriente.', points: 250 },
    { id: 405, topic: 'estados-financieros', type: 'multiple', question: 'Ventas $80.000, Costo $50.000, Gastos Operativos $18.000. ¿Margen Operativo?', options: ['15%', '37,5%', '22,5%', '62,5%'], correct: 0, explanation: 'Utilidad Operativa = $80.000 - $50.000 - $18.000 = $12.000. Margen = ($12.000 / $80.000) × 100 = 15%.', hint: 'Resta todos los costos y gastos operativos de las ventas, luego divide el resultado entre las ventas.', points: 250 },
    { id: 406, topic: 'nomina', type: 'multiple', question: 'Sueldo Base $800, horas extras $150, retenciones 10% del total imponible. ¿Sueldo Líquido?', options: ['$855', '$720', '$800', '$950'], correct: 0, explanation: 'Total Imponible = $800 + $150 = $950. Retenciones = $95. Líquido = $950 - $95 = $855.', hint: 'Suma el sueldo base y las horas extras, calcula el 10% de retención y réstalo del total.', points: 250 },
    { id: 407, topic: 'inventarios', type: 'multiple', question: 'Inventario inicial: 10u a $10. Compra: 20u a $13. Venta: 15u. ¿Costo PEPS?', options: ['$165', '$195', '$150', '$180'], correct: 0, explanation: 'PEPS: 10u × $10 = $100 + 5u × $13 = $65. Total = $165.', hint: 'Las primeras unidades en entrar son las primeras en salir. Usa primero las de $10 y completa con las de $13.', points: 250 },
    { id: 408, topic: 'inventarios', type: 'multiple', question: 'Mismos datos (10u a $10, 20u a $13). ¿Costo Promedio Ponderado unitario?', options: ['$12,00', '$11,50', '$13,00', '$10,00'], correct: 0, explanation: 'Costo Total = $360. Unidades = 30. Promedio = $360 / 30 = $12,00.', hint: 'Suma el costo total de todas las unidades disponibles y divídelo entre el número total de unidades.', points: 250 },
    { id: 409, topic: 'matematica-financiera', type: 'multiple', question: 'Préstamo de $5.000 al 12% anual simple, a 6 meses. ¿Total a pagar?', options: ['$5.300', '$5.600', '$5.120', '$6.000'], correct: 0, explanation: 'Interés = $5.000 × 0,12 × (6/12) = $300. Total = $5.300.', hint: 'Con interés simple, calcula el interés anual y ajústalo al período de 6 meses (la mitad del año).', points: 250 },
    { id: 410, topic: 'analisis-financiero', type: 'multiple', question: 'Activos Corrientes $25.000, Pasivos Corrientes $15.000. ¿Capital de Trabajo Neto?', options: ['$10.000', '$40.000', '1,66', '$15.000'], correct: 0, explanation: 'Capital de Trabajo = $25.000 - $15.000 = $10.000.', hint: 'Es una resta simple: lo que tienes disponible a corto plazo menos lo que debes a corto plazo.', points: 250 },
    { id: 411, topic: 'nomina', type: 'multiple', question: 'Sueldo Base $1.000, horas extras $200, asignación de movilización $80 (no imponible). Retenciones 12% del total imponible. ¿Sueldo Líquido?', options: ['$1.056', '$1.136', '$1.200', '$1.280'], correct: 1, explanation: 'Total Imponible = $1.000 + $200 = $1.200 (la movilización es no imponible). Retenciones = $1.200 × 0,12 = $144. Líquido = $1.200 - $144 + $80 = $1.136.', hint: 'Recuerda que las asignaciones de movilización y colación son haberes no imponibles: no se les aplica el porcentaje de retención.', points: 250 }
];

// Mapa de niveles
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

// ===== SISTEMA DE SONIDO (Delega en ContiEffectsManager) =====
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
            console.warn('⏰ Fallback: Splash screen ocultado por timeout de seguridad.');
            splashScreen.classList.add('hidden');
        }
    }, 15000);
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
    // Verificar si el nivel está desbloqueado
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
    state.questions = shuffleArray(deepCloneQuestions(rawQuestions)).slice(0, 10);
    
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
    // Verificar si el siguiente nivel está desbloqueado
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
            '¡Piensa bien tu respuesta! 🤔',
            'Tú puedes hacerlo 💪',
            'Analiza con cuidado 📊',
            'Confío en tu razonamiento 🧠',
            'Lee cada opción con atención 👀',
            '¿Cuál será la correcta? 🤓',
            'Tómate tu tiempo ⏳',
            'Confía en lo que sabes 📚'
        ],
        'nervous': [
            '¡El tiempo se acaba! ⏰',
            '¡Rápido, confía en ti! 😰',
            '¡No te congeles! ❄️',
            '¡Elige ya, tú sabes! ⚡',
            '¡Últimos segundos! 🚨',
            '¡Vamos, no te detengas! 🏃'
        ],
        'bored': [
            '¡Despierta, campeón! ☕',
            '¡Vamos, tú puedes! 😴',
            '¡No te duermas en clase! 💤',
            '¡Espabila esa mente! 🧃',
            '¡Que no decaiga el ánimo! 🎈',
            '¿Necesitas un café virtual? ☕✨'
        ],
        'impressed': [
            '¡Impresionante racha! 🤩',
            '¡Eres increíble! 🌟',
            '¡Qué genio financiero! 🧠',
            '¡Nadie te para hoy! 🔥',
            '¡Estás arrasando! 💥',
            '¡Eres una máquina! ⚙️💨',
            '¡Conti Conti está orgulloso! 🐰✨'
        ],
        'celebrating': [
            '¡Perfecto, nivel impecable! 🥳',
            '¡Eres el orgullo de Contabilidad! 🎉',
            '¡Nivel superado con honores! 🏆',
            '¡Así se hace, crack! 🌟',
            '¡Cada vez más cerca de la cima! ⛰️',
            '¡Qué satisfacción da aprender! 🎓✨'
        ],
        'deep-think': [
            '¡Nivel experto activado! 🔬',
            '¡Piensa profundamente! 🧐',
            '¡Confía en tus cálculos! 📐',
            'Esto es para mentes brillantes 💡',
            '¡Activa tu modo calculadora! 🧮',
            'Los números no mienten 🔢'
        ],
        'confident': [
            '¡Eliminamos dos, ahora es fácil! 😎',
            '¡El 50/50 te respalda! ✨',
            '¡Tú tienes el control! 🕶️',
            '¡Camino despejado hacia el éxito! 🛤️',
            '¡Ahora solo quedan las buenas! ✅',
            '¡Con esta ayuda es pan comido! 🍞'
        ],
        'frozen': [
            '¡Tiempo congelado! 🥶',
            '¡Relájate y piensa tranquilo! ❄️',
            '¡Sin prisa, el reloj se detuvo! ⛄',
            '¡Respira hondo, tienes tiempo! 🌬️',
            '¡Aprovecha estos segundos extra! ⏸️',
            '¡El frío te da claridad mental! 🧊'
        ],
        'determined': [
            '¡Ahora sí, con todo! 😤',
            '¡Esta no la fallo! 💪🔥',
            '¡Con más ganas que nunca! 🦾',
            '¡A corregir el rumbo! 🧭',
            '¡El error me hizo más fuerte! ⚡',
            '¡Voy con todo en esta! 🎯',
            'Cada error es una lección aprendida 📚',
            '¡Los genios también se equivocan y aprenden! 🧠💡'
        ],
        'graduate': [
            '¡Lo lograste, eres un crack! 🎓',
            '¡Graduado con honores financieros! 🏅',
            '¡Conti Conti te admira! 👨‍🎓🐰',
            '¡Tu futuro financiero es brillante! 💰✨',
            '¡De estudiante a MAESTRO! 🧠👑',
            '¡Hoy celebras tu conocimiento! 🎉📚'
        ],
        'correct': [
            '¡Respuesta correcta! ✨',
            '¡Bien hecho! 🌟',
            '¡Así se hace! 💪',
            '¡Esa es la actitud! 🎯',
            '¡Vas por buen camino! 🛤️'
        ],
        'incorrect': [
            '¡No era esa, pero no pasa nada! 💪',
            '¡Aprender es equivocarse! 📚',
            '¡Revisa la explicación! 👀',
            '¡La próxima la tienes! 🎯',
            '¡Error detectado, conocimiento ganado! 🧠'
        ]
    };
    
    const list = messages[reaction] || messages['thinking'];
    if (speech) speech.textContent = list[Math.floor(Math.random() * list.length)];
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
    draggable.addEventListener('touchstart', () => {
        if (window.effectsManager) window.effectsManager.ensureAudio();
    }, { passive: true });

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
        
        if (window.effectsManager) {
            window.effectsManager.playSound('coin');
        }
        
        if (zone && !zone.dataset.filled) {
            const index = parseInt(zone.dataset.index, 10);
            zone.textContent = `${index + 1}. ${question.items[draggable.dataset.originalIndex]}`;
            zone.dataset.filled = draggable.dataset.originalIndex;
            draggable.style.opacity = '0.3';
            draggable.style.pointerEvents = 'none';
            
            if (window.effectsManager) {
                const rect = zone.getBoundingClientRect();
                window.effectsManager.triggerExplosion(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    0.5, '#93C5FD'
                );
            }
            
            checkDragComplete(question);
        }
    });
}

function checkDragComplete(question) {
    const dragContainer = document.getElementById('drag-container');
    const dropZones = document.querySelectorAll('.drop-zone');
    let allFilled = true, allCorrect = true;
    dropZones.forEach((zone, index) => {
        if (!zone.dataset.filled) allFilled = false;
        else if (parseInt(zone.dataset.filled) !== index) allCorrect = false;
    });
    if (allFilled) { 
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        if (allCorrect) {
            showFeedback(`¡Excelente orden! ${question.explanation || ''}`, 'correct');
            triggerVisualCoinsFromElement(dragContainer, 16);
            handleCorrectAnswer(question.points); 
        } else {
            showFeedback(`Orden incorrecto. Revisa el flujo lógico de los procesos financieros.`, 'incorrect');
            handleIncorrectAnswer(question); 
        }
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
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    
    if (originalIndex === question.correct) {
        if (options[clickedDisplayIndex]) options[clickedDisplayIndex].classList.add('correct');
        let totalPoints = question.points;
        let coinCount = 12;
        
        if (responseTime < 3) {
            const speedBonus = Math.round(question.points * 0.5);
            totalPoints += speedBonus;
            coinCount += 8;
            showSpeedBonus(speedBonus);
        }
        
        if (options[clickedDisplayIndex]) {
            triggerVisualCoinsFromElement(options[clickedDisplayIndex], coinCount);
        }
        
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
    
    state.score += points;
    state.levelScore += points;
    state.streak++;
    state.correctInLevel++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
    
    const question = state.questions[state.currentQuestion];
    if (question && question.topic) {
        if (!state.topicScores[question.topic]) state.topicScores[question.topic] = { correct: 0, total: 0 };
        state.topicScores[question.topic].correct++;
        state.topicScores[question.topic].total++;
    }
    
    updateScore(); updateStreak();
    
    playSound('correct');
    if (window.effectsManager) window.effectsManager.triggerConfetti();
    
    const responseTime = (Date.now() - state.questionStartTime) / 1000;
    if (responseTime < 3 && window.effectsManager) {
        window.effectsManager.triggerScreenFlash(180);
    }
    
    updateRabbitReaction('correct');
    if (state.streak >= 5) {
        document.getElementById('streak-display')?.classList.add('on-fire');
        if (window.effectsManager) window.effectsManager.triggerCoinRain();
        setTimeout(() => updateRabbitReaction('impressed'), 350);
    } else if (state.streak >= 3) {
        if (window.effectsManager) window.effectsManager.triggerCoinRain();
        setTimeout(() => updateRabbitReaction('impressed'), 350);
    }
    
    const btnNext = document.getElementById('btn-next');
    if (btnNext) btnNext.style.display = 'block';
    checkBadges();
}

function handleIncorrectAnswer(question) {
    if (state._boredTimeout) clearTimeout(state._boredTimeout);
    
    state.lives--; state.streak = 0; state.levelPerfect = false;
    document.getElementById('streak-display')?.classList.remove('on-fire');
    
    if (question && question.topic) {
        if (!state.topicScores[question.topic]) state.topicScores[question.topic] = { correct: 0, total: 0 };
        state.topicScores[question.topic].total++;
    }
    
    updateLives(); updateStreak();
    
    playSound('incorrect');
    
    updateRabbitReaction('incorrect');
    if (state.lives <= 0) {
        setTimeout(() => updateRabbitReaction('determined'), 350);
        setTimeout(() => endLevel(), 1500);
    } else {
        setTimeout(() => updateRabbitReaction('determined'), 350);
    }
    
    const btnNext = document.getElementById('btn-next');
    if (btnNext) btnNext.style.display = 'block';
}

function showFeedback(message, type) {
    const fb = document.getElementById('feedback-box');
    if (!fb) return;
    fb.textContent = message;
    fb.className = `feedback-box ${type}`;
}

function nextQuestion() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.isFrozen = false;
    if (state._freezeTimeout) clearTimeout(state._freezeTimeout);
    state._freezeTimeout = null;
    
    state.currentQuestion++;
    document.getElementById('streak-display')?.classList.remove('on-fire');
    loadQuestion();
}

// ===== FIN DE NIVEL =====
function endLevel() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    if (state._boredTimeout) clearTimeout(state._boredTimeout);
    if (state._freezeTimeout) clearTimeout(state._freezeTimeout);
    state._freezeTimeout = null;
    state.isFrozen = false;
    
    const totalQ = state.totalQuestions || 10;
    const starCount = state.levelPerfect ? 3 : (state.correctInLevel >= totalQ * 0.7 ? 2 : 1);
    state.levelStars[state.currentLevel] = starCount;
    
    // Desbloquear el siguiente nivel
    unlockNextLevel(state.currentLevel);
    
    if (state.levelPerfect && state.lives === 3 && !state.badges.perfectScore) {
        state.badges.perfectScore = true;
        playSound('achievement');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        setTimeout(() => {
            if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Puntaje Perfecto!', { icon: '💯', bg: 'linear-gradient(135deg, #FFD700, #FFA500)', duration: 3500 });
        }, 300);
        saveBadges();
    }
    if (state.lives === 3 && !state.badges.survivor) {
        state.badges.survivor = true;
        playSound('achievement');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        setTimeout(() => {
            if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Sobreviviente!', { icon: '🛡️', bg: 'linear-gradient(135deg, #10B981, #059669)', duration: 3500 });
        }, 300);
        saveBadges();
    }
    if (!state.powerupsUsedThisLevel && !state.badges.noPowerups) {
        state.badges.noPowerups = true;
        playSound('achievement');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        setTimeout(() => {
            if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Poder Natural!', { icon: '💪', bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', duration: 3500 });
        }, 300);
        saveBadges();
    }
    
    if (state.currentLevel < 4) {
        const transTitle = document.getElementById('transition-title');
        const transSpeech = document.getElementById('transition-speech');
        const lvlScoreDisp = document.getElementById('level-score-display');
        
        if (transTitle) transTitle.textContent = `${levelNames[state.currentLevel]} Completado`;
        if (transSpeech) transSpeech.textContent = `¡Excelente! Nivel ${state.currentLevel} superado 🎉`;
        if (lvlScoreDisp) lvlScoreDisp.textContent = state.levelScore;
        
        let starsHTML = '<div class="star-rating">';
        for (let i = 1; i <= 3; i++) {
            starsHTML += `<span class="star ${i <= starCount ? 'earned' : ''}">⭐</span>`;
        }
        starsHTML += '</div>';
        const scoreCard = document.querySelector('#screen-level-transition .share-card');
        if (scoreCard && !document.getElementById('level-stars')) {
            const starsDiv = document.createElement('div');
            starsDiv.id = 'level-stars';
            starsDiv.innerHTML = starsHTML;
            scoreCard.appendChild(starsDiv);
        } else if (document.getElementById('level-stars')) {
            document.getElementById('level-stars').innerHTML = starsHTML;
        }
        
        const btnNextLevel = document.getElementById('btn-next-level');
        if (btnNextLevel) btnNextLevel.textContent = `Siguiente: ${levelNames[state.currentLevel + 1]} ➡️`;
        
        updateRabbitReaction(state.levelPerfect ? 'celebrating' : 'thinking');
        showScreen('screen-level-transition');
        playSound('levelup');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        
        if (window.effectsManager) {
            window.effectsManager.triggerConfetti(2000, 2);
            setTimeout(() => {
                if (window.effectsManager) window.effectsManager.triggerConfetti(1500, 1.5);
            }, 800);
        }
    } else {
        updateRabbitReaction('graduate');
        showFinalResults();
        playSound('levelup');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
    }
}

function showFinalResults() {
    const finalScore = document.getElementById('final-score');
    if (finalScore) finalScore.textContent = state.score;
    
    const topicAnalysis = document.getElementById('topic-analysis');
    if (topicAnalysis) {
        topicAnalysis.innerHTML = '';
        
        const topicNames = {
            'presupuesto': 'Presupuesto', 'ahorro': 'Ahorro', 'inversion': 'Inversión', 'credito': 'Crédito',
            'contabilidad': 'Contabilidad', 'finanzas': 'Finanzas', 'fondo-emergencia': 'Fondo de Emergencia',
            'tributacion': 'Tributación', 'nomina': 'Nómina', 'estados-financieros': 'Estados Financieros',
            'analisis-financiero': 'Análisis Financiero', 'inventario': 'Inventarios',
            'matematica-financiera': 'Matemática Financiera'
        };
        
        const topicColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#E63946', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];
        let colorIndex = 0;
        
        for (const [topic, scores] of Object.entries(state.topicScores)) {
            const percentage = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
            const bar = document.createElement('div'); bar.className = 'topic-bar';
            bar.innerHTML = `<span class="topic-label">${topicNames[topic] || topic}</span><div class="topic-progress"><div class="topic-fill" style="width:${percentage}%;background:${topicColors[colorIndex]}"></div></div><span class="topic-score">${percentage}%</span>`;
            topicAnalysis.appendChild(bar);
            colorIndex = (colorIndex + 1) % topicColors.length;
        }
    }
    
    const shareBadges = document.getElementById('share-badges');
    if (shareBadges) {
        shareBadges.innerHTML = '';
        for (const [badge, unlocked] of Object.entries(state.badges)) {
            if (unlocked) {
                const badgeEl = document.createElement('span'); badgeEl.className = 'share-badge';
                badgeEl.textContent = getBadgeIcon(badge);
                shareBadges.appendChild(badgeEl);
            }
        }
    }
    
    const speech = document.getElementById('result-character-speech');
    const maxScore = 7000;
    if (speech) {
        if (state.score >= maxScore * 0.9) speech.textContent = '¡Rendimiento excepcional! Conti Conti te admira. 🏆🐰';
        else if (state.score >= maxScore * 0.7) speech.textContent = '¡Excelente resultado! Bases muy sólidas. 👏🐰';
        else if (state.score >= maxScore * 0.4) speech.textContent = '¡Buen esfuerzo! Sigue practicando. 📚🐰';
        else speech.textContent = '¡El aprendizaje es un camino diario! 💡🐰';
    }
    
    showScreen('screen-results');
    if (window.effectsManager) window.effectsManager.triggerFireworks();
    saveToLeaderboard();
}

function restartGame() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    if (state._freezeTimeout) clearTimeout(state._freezeTimeout);
    state._freezeTimeout = null;
    state.isFrozen = false;
    state.currentQuestion = 0; state.score = 0; state.levelScore = 0; state.lives = 3;
    state.streak = 0; state.currentLevel = 1; state.powerupsUsedThisLevel = false; state.levelPerfect = true;
    state.levelStars = {}; state.bonusQuestionActive = false; state.correctInLevel = 0;
    document.body.className = 'level-1';
    document.getElementById('streak-display')?.classList.remove('on-fire');
    updateScore(); updateLives(); updateStreak(); updateProgress(); updateLevelDisplay();
    startGame();
}

function goToFinalScreen() {
    updateRabbitReaction('graduate');
    showScreen('screen-final');
    if (window.effectsManager) window.effectsManager.triggerFireworks();
}

// ===== POWER-UPS =====
function usePowerup(type) {
    if (state.powerups[type] <= 0) return;
    if (state.currentQuestion >= state.totalQuestions) return;
    if ((type === 'time' || type === 'freeze') && state.mode !== 'timed') return;
    
    state.powerups[type]--;
    state.powerupsUsedThisLevel = true;
    updatePowerupButtons();
    playSound('powerup');
    
    const btn = document.getElementById(`powerup-${type}`);
    if (btn) { btn.classList.add('flash'); setTimeout(() => btn.classList.remove('flash'), 300); }
    
    switch (type) {
        case 'fifty': applyFiftyFifty(); updateRabbitReaction('confident'); break;
        case 'time': if (state.mode === 'timed') { state.timer += 15; updateTimerDisplay(); } break;
        case 'freeze': 
            if (state._freezeTimeout) clearTimeout(state._freezeTimeout);
            state.isFrozen = true; 
            updateRabbitReaction('frozen');
            const td = document.getElementById('timer-display');
            if (td) td.style.backgroundColor = '#10B981';
            state._freezeTimeout = setTimeout(() => { 
                state.isFrozen = false; 
                state._freezeTimeout = null;
                updateRabbitReaction('thinking'); 
                if (td) td.style.backgroundColor = 'var(--azul-oscuro)'; 
            }, 10000);
            break;
        case 'hint': applyHint(); break;
    }
}

function applyFiftyFifty() {
    const question = state.questions[state.currentQuestion];
    if (!question || question.type !== 'multiple') return;
    const options = document.querySelectorAll('.option-btn');
    const shuffledIndices = question._shuffledIndices;
    const correctDisplayIndex = shuffledIndices.indexOf(question.correct);
    const incorrectIndexes = [];
    options.forEach((btn, i) => { if (i !== correctDisplayIndex) incorrectIndexes.push(i); });
    shuffleArray(incorrectIndexes).slice(0, 2).forEach(index => { 
        if (options[index]) {
            options[index].style.opacity = '0.3'; 
            options[index].style.pointerEvents = 'none'; 
        }
    });
}

function applyHint() {
    const question = state.questions[state.currentQuestion];
    if (!question) return;
    const fb = document.getElementById('feedback-box');
    if (!fb) return;
    
    const hintText = question.hint
        ? question.hint
        : (question.explanation
            ? question.explanation.split('.')[0] + '.'
            : 'Analiza cada opción con calma, ¡tú puedes lograrlo!');
    
    fb.textContent = `💡 Pista: ${hintText}`;
    fb.className = 'feedback-box correct';
}

// ===== TEMPORIZADOR =====
function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    
    if (state.currentLevel === 1) state.timer = 30;
    else if (state.currentLevel === 2) state.timer = 25;
    else state.timer = 20;
    
    updateTimerDisplay();
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.classList.remove('warning');
    
    state.timerInterval = setInterval(() => {
        if (state.isFrozen) return;
        state.timer--;
        updateTimerDisplay();
        
        if (state.timer <= 5 && state.timer > 0) {
            if (timerDisplay) timerDisplay.classList.add('warning');
            updateRabbitReaction('nervous');
            if (window.effectsManager) {
                window.effectsManager.playTick();
            }
        }
        if (state.timer <= 0) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            if (timerDisplay) timerDisplay.classList.remove('warning');
            showFeedback(`¡Tiempo agotado! ${state.questions[state.currentQuestion].explanation}`, 'incorrect');
            handleIncorrectAnswer(state.questions[state.currentQuestion]);
        }
    }, 1000);
    
    state._boredTimeout = setTimeout(() => {
        const nextBtn = document.getElementById('btn-next');
        if (state.currentQuestion < state.totalQuestions && (!nextBtn || nextBtn.style.display === 'none')) {
            updateRabbitReaction('bored');
        }
    }, 15000);
}

function updateTimerDisplay() {
    const td = document.getElementById('timer-display');
    if (td) td.textContent = `⏱️ ${state.timer}s`;
}

// ===== UI UPDATES =====
function updateScore() {
    const badge = document.getElementById('score-badge');
    if (!badge) return;
    badge.textContent = `⭐ ${state.score} pts`;
    badge.classList.add('pop');
    setTimeout(() => badge.classList.remove('pop'), 300);
    
    if (window.effectsManager && typeof window.effectsManager.triggerScoreBadgeFlash === 'function') {
        window.effectsManager.triggerScoreBadgeFlash();
    }
}

function updateLives() {
    const display = document.getElementById('lives-display');
    if (!display) return;
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < state.lives ? '❤️' : '🖤';
    display.textContent = hearts;
}

function updateStreak() {
    const sd = document.getElementById('streak-display');
    if (sd) sd.textContent = `🔥 ${state.streak}`;
}

function updateProgress() {
    const pf = document.getElementById('progress-fill');
    if (pf) pf.style.width = `${(state.currentQuestion / state.totalQuestions) * 100}%`;
}

function updatePowerupButtons() {
    ['fifty', 'time', 'freeze', 'hint'].forEach(type => {
        const btn = document.getElementById(`powerup-${type}`);
        if (!btn) return;
        const small = btn.querySelector('small');
        if (small) small.textContent = `(${state.powerups[type]})`;
        
        const isTimePowerupInNormalMode = (type === 'time' || type === 'freeze') && state.mode !== 'timed';
        btn.disabled = state.powerups[type] <= 0 || isTimePowerupInNormalMode;
    });
}

// ===== INSIGNIAS =====
function checkBadges() {
    if (state.score >= 2000 && !state.badges.financierPro) {
        state.badges.financierPro = true;
        playSound('achievement');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        setTimeout(() => {
            if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Financiero Pro!', { icon: '🏆', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', duration: 3500 });
        }, 300);
        saveBadges();
    }
    if (state.streak >= 5 && !state.badges.streaker) {
        state.badges.streaker = true;
        playSound('achievement');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        setTimeout(() => {
            if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Rachador!', { icon: '🔥', bg: 'linear-gradient(135deg, #EF4444, #DC2626)', duration: 3500 });
        }, 300);
        saveBadges();
    }
    if (state.mode === 'timed' && (Date.now() - state.questionStartTime) < 3000 && !state.badges.speedDemon) {
        state.badges.speedDemon = true;
        playSound('achievement');
        if (window.effectsManager) window.effectsManager.triggerFireworks();
        setTimeout(() => {
            if (window.effectsManager) window.effectsManager.triggerToast('¡Nueva insignia: Velocista!', { icon: '⚡', bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', duration: 3500 });
        }, 300);
        saveBadges();
    }
}

function getBadgeIcon(badge) {
    const icons = { perfectScore: '💯', speedDemon: '⚡', survivor: '🛡️', streaker: '🔥', financierPro: '🏆', noPowerups: '💪' };
    return icons[badge] || '🏅';
}

function getBadgeName(badge) {
    const names = { perfectScore: 'Puntaje Perfecto', speedDemon: 'Velocista', survivor: 'Sobreviviente', streaker: 'Rachador', financierPro: 'Financiero Pro', noPowerups: 'Poder Natural' };
    return names[badge] || badge;
}

function loadBadges() {
    const saved = safeLocalGet('conti_badges', null);
    if (saved) {
        try {
            state.badges = { ...state.badges, ...JSON.parse(saved) };
        } catch (e) {
            console.warn('No se pudo leer conti_badges guardado, se ignora.');
        }
    }
    const grid = document.getElementById('badges-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const [badge, unlocked] of Object.entries(state.badges)) {
        const el = document.createElement('div'); el.className = `badge-item ${unlocked ? 'unlocked' : ''}`;
        el.innerHTML = `<div class="badge-icon">${getBadgeIcon(badge)}</div><div class="badge-name">${getBadgeName(badge)}</div>`;
        grid.appendChild(el);
    }
}

function saveBadges() {
    safeLocalSet('conti_badges', JSON.stringify(state.badges));
}

// ===== LEADERBOARD =====

function showNamePromptModal(onSubmit) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
        z-index: 3000; display: flex; align-items: center; justify-content: center;
        font-family: 'Poppins', sans-serif; padding: 20px; box-sizing: border-box;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
        background: white; padding: 26px 24px; border-radius: 18px;
        max-width: 340px; width: 100%; text-align: center;
        box-shadow: 0 20px 50px rgba(0,0,0,0.32);
    `;
    box.innerHTML = `
        <div style="font-weight:800;font-size:1.15rem;margin-bottom:8px;color:#1E293B;">¡Buen trabajo! 🎉</div>
        <div style="margin-bottom:16px;color:#64748B;font-size:0.9rem;">Ingresa tu nombre para el ranking</div>
        <input id="conti-name-input" type="text" maxlength="20" placeholder="Jugador"
            style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid #CBD5E1;
                   margin-bottom:16px;font-family:inherit;font-size:1rem;box-sizing:border-box;outline:none;">
        <div style="display:flex;gap:10px;justify-content:center;">
            <button id="conti-name-skip" style="flex:1;padding:11px 0;border-radius:10px;border:none;
                background:#E2E8F0;color:#334155;font-weight:700;cursor:pointer;font-family:inherit;">Omitir</button>
            <button id="conti-name-ok" style="flex:1;padding:11px 0;border-radius:10px;border:none;
                background:linear-gradient(135deg, #2563EB, #1D4ED8);color:white;font-weight:700;
                cursor:pointer;font-family:inherit;">Guardar</button>
        </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const input = box.querySelector('#conti-name-input');
    input.focus();

    const close = (value) => {
        overlay.remove();
        onSubmit(value);
    };

    box.querySelector('#conti-name-ok').addEventListener('click', () => close(input.value.trim() || 'Jugador'));
    box.querySelector('#conti-name-skip').addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') close(input.value.trim() || 'Jugador');
    });
    
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            close(null);
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

function saveToLeaderboard() {
    showNamePromptModal((playerName) => {
        if (!playerName) return;
        const leaderboard = JSON.parse(safeLocalGet('conti_leaderboard', '[]'));
        leaderboard.push({ name: playerName, score: state.score, badges: Object.values(state.badges).filter(Boolean).length, date: new Date().toLocaleDateString() });
        leaderboard.sort((a, b) => b.score - a.score);
        safeLocalSet('conti_leaderboard', JSON.stringify(leaderboard.slice(0, 20)));
        loadLeaderboard();
    });
}

function loadLeaderboard() {
    let leaderboard = [];
    try {
        leaderboard = JSON.parse(safeLocalGet('conti_leaderboard', '[]'));
    } catch (e) {
        console.warn('No se pudo leer conti_leaderboard guardado, se ignora.');
    }
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="${index < 3 ? `rank-${index+1}` : ''}">${index+1}</td><td>${entry.name}</td><td>${entry.score} pts</td><td>${'🏅'.repeat(entry.badges)}</td>`;
        tbody.appendChild(row);
    });
}

// ===== COMPARTIR =====
function shareResults() {
    const text = `🎉 ¡Acabo de conseguir ${state.score} puntos en ContiLab: Desafío Contable y Financiero! ¿Puedes superarme? 🏆`;
    if (navigator.share) {
        navigator.share({ title: 'ContiLab', text, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            if (window.effectsManager) {
                window.effectsManager.triggerToast('¡Copiado! Compártelo donde quieras.', { icon: '📋', duration: 2500 });
            }
        }).catch(() => {
            if (window.effectsManager) {
                window.effectsManager.triggerToast('No se pudo copiar automáticamente.', { icon: '⚠️', duration: 2500 });
            }
        });
    }
}
