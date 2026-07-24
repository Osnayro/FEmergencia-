
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
    isFrozen: false,
    questions: [],
    answeredCorrectly: {},
    powerups: {
        fifty: 3,
        time: 2,
        freeze: 1
    },
    powerupsUsedThisLevel: false,
    levelPerfect: true,
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

// Preguntas de Fondo de Emergencia (Nivel 1)
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

// ===== BANCO NIVEL 2: CONTABILIDAD Y NÓMINA =====
const nivel2Questions = [
    {
        id: 201,
        topic: 'contabilidad',
        type: 'multiple',
        question: 'Si una empresa cobra $500 en efectivo por un servicio realizado, ¿cuál es el registro contable correcto?',
        options: [
            'Cargar (Débito) a Caja y Abonar (Crédito) a Ingresos por Servicios',
            'Cargar a Ingresos por Servicios y Abonar a Caja',
            'Cargar a Banco y Abonar a Cuentas por Cobrar',
            'Cargar a Gastos Generales y Abonar a Caja'
        ],
        correct: 0,
        explanation: 'El dinero entra a la empresa (Activo aumenta por el Debe en Caja) y se reconoce la venta (Ingreso aumenta por el Haber).',
        points: 150
    },
    {
        id: 202,
        topic: 'contabilidad',
        type: 'multiple',
        question: '¿Qué ocurre en la ecuación contable cuando una empresa compra mercancía al contado?',
        options: [
            'Aumenta un Activo (Inventario) y disminuye otro Activo (Caja)',
            'Aumenta un Activo y aumenta un Pasivo',
            'Disminuye el Patrimonio y aumenta el Pasivo',
            'Aumenta el Pasivo y disminuye el Activo'
        ],
        correct: 0,
        explanation: 'Es un intercambio de activos: ingresa Inventario y sale Efectivo/Caja por el mismo valor, manteniendo el equilibrio.',
        points: 150
    },
    {
        id: 203,
        topic: 'tributacion',
        type: 'multiple',
        question: 'En el cálculo del Impuesto al Valor Agregado (IVA), ¿qué representa el Débito Fiscal?',
        options: [
            'El IVA cobrado a los clientes en las ventas de la empresa',
            'El IVA pagado a los proveedores al comprar insumos',
            'El impuesto sobre la renta que se paga a fin de año',
            'Un dinero que la administración tributaria le debe a la empresa'
        ],
        correct: 0,
        explanation: 'El Débito Fiscal es el IVA recaudado de las ventas. Representa un pasivo (deuda) con el fisco hasta su declaración.',
        points: 150
    },
    {
        id: 204,
        topic: 'tributacion',
        type: 'multiple',
        question: 'Si en un mes generas $200 de Débito Fiscal y pagaste $120 de Crédito Fiscal, ¿cuánto debes pagar al fisco?',
        options: [
            '$80',
            '$320',
            '$120',
            '$0 (Queda saldo a favor)'
        ],
        correct: 0,
        explanation: 'Impuesto a pagar = Débito Fiscal ($200) menos Crédito Fiscal ($120) = $80.',
        points: 150
    },
    {
        id: 205,
        topic: 'nomina',
        type: 'multiple',
        question: '¿Cuál es la diferencia entre el Sueldo Bruto y el Sueldo Líquido en la liquidación de sueldo?',
        options: [
            'El Sueldo Bruto es el total pactado; el Líquido es lo que recibe el trabajador tras descuentos de ley',
            'El Sueldo Líquido es antes de impuestos y el Bruto es después de impuestos',
            'El Sueldo Bruto se paga en efectivo y el Líquido mediante cheque',
            'Son exactamente el mismo monto expresado en diferentes monedas'
        ],
        correct: 0,
        explanation: 'El Sueldo Bruto incluye todos los haberes. Al restarle las retenciones legales (salud, pensiones) se obtiene el Sueldo Líquido.',
        points: 150
    },
    {
        id: 206,
        topic: 'contabilidad',
        type: 'multiple',
        question: '¿Cuál de las siguientes cuentas es de naturaleza ACREEDORA (aumenta por el Haber)?',
        options: [
            'Cuentas por Pagar (Pasivo)',
            'Caja Chica (Activo)',
            'Gastos de Arriendo (Gasto)',
            'Banco (Activo)'
        ],
        correct: 0,
        explanation: 'Las cuentas de Pasivo, Patrimonio e Ingresos nacen y aumentan por el Haber (Acreedoras).',
        points: 150
    },
    {
        id: 207,
        topic: 'contabilidad',
        type: 'multiple',
        question: '¿Para qué sirve el Libro Mayor en la contabilidad diaria?',
        options: [
            'Para agrupar los saldos individuales y movimientos de cada cuenta contable',
            'Para anotar las facturas del día en orden cronológico sin importar la cuenta',
            'Para calcular el sueldo de los trabajadores al final del mes',
            'Para pagar los impuestos directamente a la oficina tributaria'
        ],
        correct: 0,
        explanation: 'El Libro Mayor clasifica las operaciones por cada cuenta específica (Caja, Banco, Ventas) para conocer su saldo.',
        points: 150
    },
    {
        id: 208,
        topic: 'contabilidad',
        type: 'multiple',
        question: 'Se compra un equipo de oficina por $1.000 a crédito firmando una letra. ¿Qué cuenta de pasivo aumenta?',
        options: [
            'Documentos por Pagar',
            'Cuentas por Cobrar',
            'Capital Social',
            'Gastos Operativos'
        ],
        correct: 0,
        explanation: 'Al existir un compromiso formal respaldado por un documento (letra/pagaré), la deuda se registra en Documentos por Pagar.',
        points: 150
    },
    {
        id: 209,
        topic: 'nomina',
        type: 'multiple',
        question: '¿Qué representan los "Haberes No Imponibles" en una planilla de remuneraciones?',
        options: [
            'Asignaciones que no sufren descuentos legales, como la movilización o colación',
            'El sueldo base antes de calcular las horas extras',
            'Los préstamos que la empresa le otorga al trabajador',
            'Los impuestos cobrados directamente por el gobierno'
        ],
        correct: 0,
        explanation: 'Son compensaciones por gastos de trabajo (transporte, alimentación) sobre los cuales no se aplican retenciones de pensión o salud.',
        points: 150
    },
    {
        id: 210,
        topic: 'contabilidad',
        type: 'multiple',
        question: '¿Cuál es el principio contable de la "Partida Doble"?',
        options: [
            'No hay deudor sin acreedor: la suma del Debe debe ser igual a la suma del Haber',
            'Todas las compras se deben hacer por duplicado',
            'Los impuestos se pagan dos veces al año',
            'Las ganancias siempre deben duplicar a las pérdidas'
        ],
        correct: 0,
        explanation: 'La partida doble garantiza el equilibrio patrimonial: en todo asiento la suma de los débitos equivale a la de los créditos.',
        points: 150
    }
];

// ===== BANCO NIVEL 3: ESTADOS FINANCIEROS Y ANÁLISIS =====
const nivel3Questions = [
    {
        id: 301,
        topic: 'estados-financieros',
        type: 'multiple',
        question: '¿Qué fórmula se utiliza para determinar la Utilidad Bruta en el Estado de Resultados?',
        options: [
            'Ventas Netas - Costo de Ventas',
            'Ingresos Totales - Gastos Administrativos',
            'Activo Total - Pasivo Total',
            'Utilidad Neta + Impuestos'
        ],
        correct: 0,
        explanation: 'La Utilidad Bruta mide la ganancia directa generada por la venta de productos antes de restar los gastos operativos.',
        points: 200
    },
    {
        id: 302,
        topic: 'analisis-financiero',
        type: 'slider',
        question: 'Si una empresa tiene $15.000 de Activo Corriente y $5.000 de Pasivo Corriente, ¿cuál es su Razón de Liquidez Corriente?',
        min: 0,
        max: 5,
        correctAnswer: 3,
        tolerance: 0,
        explanation: 'Razón Corriente = Activo Corriente / Pasivo Corriente ($15.000 / $5.000 = 3). Muestra que la empresa posee $3 en activos líquidos por cada $1 de deuda a corto plazo.',
        points: 200
    },
    {
        id: 303,
        topic: 'inventario',
        type: 'multiple',
        question: 'En un período con precios al alza (inflación), ¿qué ocurre al aplicar el método de inventario PEPS (FIFO)?',
        options: [
            'El Costo de Ventas es menor y la Utilidad Bruta se presenta más alta',
            'El Costo de Ventas es mayor y la Utilidad Bruta disminuye',
            'No hay ningún impacto en los estados financieros',
            'El valor del inventario final resulta infravalorado'
        ],
        correct: 0,
        explanation: 'Al vender primero los artículos antiguos (más baratos), el Costo de Ventas baja y la Utilidad calculada aumenta.',
        points: 200
    },
    {
        id: 304,
        topic: 'estados-financieros',
        type: 'multiple',
        question: '¿Cómo se clasifican las deudas que la empresa debe pagar en un plazo menor a 12 meses?',
        options: [
            'Pasivo Corriente (o a Corto Plazo)',
            'Pasivo No Corriente (o a Largo Plazo)',
            'Patrimonio Neto',
            'Activo Intangible'
        ],
        correct: 0,
        explanation: 'Todas las obligaciones exigibles en un plazo máximo de un año forman parte del Pasivo Corriente.',
        points: 200
    },
    {
        id: 305,
        topic: 'analisis-financiero',
        type: 'multiple',
        question: '¿Qué representa el Capital de Trabajo de una organización?',
        options: [
            'Los recursos disponibles para operar en el día a día (Activo Corriente - Pasivo Corriente)',
            'El total de las aportaciones realizadas por los socios al fundar la empresa',
            'El valor monetario de los edificios y maquinaria de la planta',
            'El total de créditos solicitados a los bancos comerciales'
        ],
        correct: 0,
        explanation: 'El Capital de Trabajo Neto indica la liquidez excedente con la que cuenta la empresa para continuar operando activamente.',
        points: 200
    },
    {
        id: 306,
        topic: 'estados-financieros',
        type: 'multiple',
        question: '¿Qué es la Depreciación Acumulada dentro del Balance General?',
        options: [
            'Una cuenta reguladora del activo que refleja la pérdida de valor sufrida por los bienes de uso',
            'Un gasto que requiere salida directa de dinero en efectivo cada mes',
            'Una deuda a largo plazo contratada con los proveedores de maquinaria',
            'Una reserva especial de dinero en efectivo guardada en el banco'
        ],
        correct: 0,
        explanation: 'La Depreciación Acumulada reduce el valor en libros de los activos fijos debido al desgaste, uso o transcurso del tiempo.',
        points: 200
    },
    {
        id: 307,
        topic: 'inventario',
        type: 'multiple',
        question: '¿En qué consiste el método del Promedio Ponderado para el control de inventarios?',
        options: [
            'Calcula un costo unitario medio dividiendo el costo total de los bienes disponibles entre las unidades en existencia',
            'Asigna el costo de las últimas unidades compradas a las primeras salidas',
            'Aplica un valor estimado al azar según el criterio del contador',
            'Utiliza únicamente el precio de venta al público para valorar el inventario final'
        ],
        correct: 0,
        explanation: 'El promedio ponderado suaviza las variaciones de precios recalculando el costo medio ponderado tras cada nueva compra.',
        points: 200
    },
    {
        id: 308,
        topic: 'estados-financieros',
        type: 'multiple',
        question: 'Si una empresa reporta Ventas Totales de $50.000 y una Utilidad Neta de $10.000, ¿cuál es su Margen Neto de Ganancia?',
        options: [
            '20%',
            '50%',
            '5%',
            '10%'
        ],
        correct: 0,
        explanation: 'Margen Neto = (Utilidad Neta / Ventas Totales) * 100 = ($10.000 / $50.000) * 100 = 20%.',
        points: 200
    },
    {
        id: 309,
        topic: 'analisis-financiero',
        type: 'multiple',
        question: '¿Cuál es la diferencia fundamental entre el Estado de Resultados y el Balance General?',
        options: [
            'El Estado de Resultados mide el desempeño durante un período; el Balance muestra la situación a una fecha determinada',
            'El Balance mide el rendimiento anual y el Estado de Resultados solo la liquidez diaria',
            'Ambos reportes muestran exactamente la misma información pero con distinto nombre',
            'El Estado de Resultados es para uso interno y el Balance solo se entrega a las entidades tributarias'
        ],
        correct: 0,
        explanation: 'El Estado de Resultados es dinámico (muestra flujos en un rango de tiempo) y el Balance General es estático (foto a una fecha).',
        points: 200
    },
    {
        id: 310,
        topic: 'estados-financieros',
        type: 'multiple',
        question: '¿A qué grupo dentro del Estado de Resultados pertenecen el arriendo del local comercial y los sueldos del personal de administración?',
        options: [
            'Gastos Operativos (Gastos de Administración y Ventas)',
            'Costo Directo de Ventas',
            'Ingresos Extraordinarios',
            'Pasivos a Largo Plazo'
        ],
        correct: 0,
        explanation: 'Son desembolsos necesarios para la gestión operativa y comercial de la entidad, clasificados como Gastos Operativos.',
        points: 200
    }
];

// ===== BANCO NIVEL 4: CÁLCULOS TÉCNICOS AVANZADOS =====
const nivelAvanzadoQuestions = [
    {
        id: 401,
        topic: 'contabilidad',
        type: 'multiple',
        question: 'Una empresa presenta: Activo Total = $45.000 y Pasivo Total = $18.000. Si los socios aportan $5.000 adicionales en efectivo, ¿cuál es el nuevo saldo del Patrimonio?',
        options: [
            '$32.000',
            '$27.000',
            '$22.000',
            '$50.000'
        ],
        correct: 0,
        explanation: 'Patrimonio Inicial = Activo ($45.000) - Pasivo ($18.000) = $27.000. Al aportar $5.000 más, el Patrimonio aumenta a $32.000 ($27.000 + $5.000).',
        points: 250
    },
    {
        id: 402,
        topic: 'tributacion',
        type: 'multiple',
        question: 'Una empresa vende mercancía por $1.000 neto (más 16% de IVA) y realiza compras gravadas por $600 neto (más 16% de IVA). ¿Cuál es el IVA neto a pagar al fisco?',
        options: [
            '$64',
            '$160',
            '$96',
            '$256'
        ],
        correct: 0,
        explanation: 'Débito Fiscal (Ventas) = $1.000 × 0,16 = $160. Crédito Fiscal (Compras) = $600 × 0,16 = $96. IVA a Pagar = $160 - $96 = $64.',
        points: 250
    },
    {
        id: 403,
        topic: 'estados-financieros',
        type: 'multiple',
        question: 'Se adquiere una maquinaria por $12.000 con una vida útil de 5 años y valor residual de $2.000. Aplicando el método de línea recta, ¿cuál es el valor neto en libros al finalizar el año 2?',
        options: [
            '$8.000',
            '$10.000',
            '$4.000',
            '$6.000'
        ],
        correct: 0,
        explanation: 'Depreciación Anual = ($12.000 - $2.000) / 5 = $2.000/año. En 2 años la depreciación acumulada es $4.000. Valor en Libros = $12.000 - $4.000 = $8.000.',
        points: 250
    },
    {
        id: 404,
        topic: 'analisis-financiero',
        type: 'slider',
        question: 'Una empresa registra Activo Corriente = $18.000, Inventario = $6.000 y Pasivo Corriente = $8.000. ¿Cuál es su valor en la Prueba Ácida (Prueba Rápida)?',
        min: 0,
        max: 5,
        correctAnswer: 1.5,
        tolerance: 0.1,
        explanation: 'Prueba Ácida = (Activo Corriente - Inventario) / Pasivo Corriente = ($18.000 - $6.000) / $8.000 = $12.000 / $8.000 = 1,5.',
        points: 250
    },
    {
        id: 405,
        topic: 'estados-financieros',
        type: 'multiple',
        question: 'Si las Ventas Totales son $80.000, el Costo de Ventas es $50.000 y los Gastos Operativos son $18.000, ¿cuál es el Margen Operativo de la empresa?',
        options: [
            '15%',
            '37,5%',
            '22,5%',
            '62,5%'
        ],
        correct: 0,
        explanation: 'Utilidad Operativa = Ventas ($80.000) - Costo ($50.000) - Gastos ($18.000) = $12.000. Margen Operativo = ($12.000 / $80.000) × 100 = 15%.',
        points: 250
    },
    {
        id: 406,
        topic: 'nomina',
        type: 'multiple',
        question: 'Un trabajador tiene un Sueldo Base de $800. Realiza horas extras valoradas en $150 y sus retenciones de ley suman el 10% del total imponible. ¿Cuál es su Sueldo Líquido a cobrar?',
        options: [
            '$855',
            '$720',
            '$800',
            '$950'
        ],
        correct: 0,
        explanation: 'Total Imponible (Sueldo Bruto) = $800 + $150 = $950. Retenciones (10%) = $95. Sueldo Líquido = $950 - $95 = $855.',
        points: 250
    },
    {
        id: 407,
        topic: 'inventarios',
        type: 'multiple',
        question: 'Inventario inicial: 10 unidades a $10 c/u. Compra 1: 20 unidades a $13 c/u. Se venden 15 unidades. Usando el método PEPS (FIFO), ¿cuál es el valor del Costo de Ventas?',
        options: [
            '$165',
            '$195',
            '$150',
            '$180'
        ],
        correct: 0,
        explanation: 'PEPS vende primero las más antiguas: 10 unidades a $10 ($100) + 5 unidades de la primera compra a $13 ($65). Costo de Ventas = $100 + $65 = $165.',
        points: 250
    },
    {
        id: 408,
        topic: 'inventarios',
        type: 'multiple',
        question: 'Con los mismos datos (Inventario Inicial: 10 u a $10; Compra 1: 20 u a $13), se aplica el método Promedio Ponderado. ¿Cuál es el costo promedio unitario ajustado?',
        options: [
            '$12,00',
            '$11,50',
            '$13,00',
            '$10,00'
        ],
        correct: 0,
        explanation: 'Costo Total = (10 × $10) + (20 × $13) = $100 + $260 = $360. Unidades Totales = 30. Costo Promedio = $360 / 30 = $12,00 por unidad.',
        points: 250
    },
    {
        id: 409,
        topic: 'matematica-financiera',
        type: 'multiple',
        question: 'Se solicita un préstamo comercial de $5.000 a una tasa de interés simple del 12% anual a liquidar en 6 meses. ¿Cuánto se terminará pagando en total al banco?',
        options: [
            '$5.300',
            '$5.600',
            '$5.120',
            '$6.000'
        ],
        correct: 0,
        explanation: 'Interés = Principal × Tasa × Tiempo = $5.000 × 0,12 × (6/12) = $300. Monto Total a devolver = $5.000 + $300 = $5.300.',
        points: 250
    },
    {
        id: 410,
        topic: 'analisis-financiero',
        type: 'multiple',
        question: 'El Balance General de una empresa muestra Activos Corrientes por $25.000 y Pasivos Corrientes por $15.000. ¿A cuánto asciende su Capital de Trabajo Neto?',
        options: [
            '$10.000',
            '$40.000',
            '1,66',
            '$15.000'
        ],
        correct: 0,
        explanation: 'Capital de Trabajo Neto = Activo Corriente - Pasivo Corriente = $25.000 - $15.000 = $10.000.',
        points: 250
    }
];

// Mapa de preguntas por nivel
const levelQuestionsMap = {
    1: fondoEmergenciaQuestions,
    2: nivel2Questions,
    3: nivel3Questions,
    4: nivelAvanzadoQuestions
};

// Nombres de niveles
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
    state.levelScore = 0;
    state.lives = 3;
    state.streak = 0;
    state.maxStreak = 0;
    state.currentQuestion = 0;
    state.currentLevel = 1;
    state.answeredCorrectly = {};
    state.topicScores = {};
    state.isFrozen = false;
    state.powerupsUsedThisLevel = false;
    state.levelPerfect = true;
    
    startLevel(1);
}

function startLevel(levelNum) {
    state.currentLevel = levelNum;
    state.currentQuestion = 0;
    state.lives = 3;
    state.streak = 0;
    state.levelScore = 0;
    state.isFrozen = false;
    state.powerupsUsedThisLevel = false;
    state.levelPerfect = true;
    
    // Ajuste de tiempo por dificultad
    if (state.mode === 'timed') {
        if (levelNum === 1) state.timer = 30;
        else if (levelNum === 2) state.timer = 25;
        else if (levelNum === 3) state.timer = 20;
        else if (levelNum === 4) state.timer = 20;
    }
    
    // Selecciona las preguntas del nivel
    const rawQuestions = levelQuestionsMap[levelNum] || fondoEmergenciaQuestions;
    state.questions = shuffleArray([...rawQuestions]).slice(0, 10);
    state.totalQuestions = state.questions.length;
    
    updateLevelDisplay();
    updateScore();
    updateLives();
    updateStreak();
    updateProgress();
    
    showScreen('screen-question');
    loadQuestion();
}

function goToNextLevel() {
    const nextLevel = state.currentLevel + 1;
    if (nextLevel <= 4) {
        startLevel(nextLevel);
    } else {
        showFinalResults();
    }
}

function updateLevelDisplay() {
    const levelDisplay = document.getElementById('level-display');
    const level = state.currentLevel;
    levelDisplay.textContent = `Nivel ${level}`;
    levelDisplay.style.background = levelColors[level] || '#10B981';
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
        endLevel();
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
    
    const indices = question.options.map((_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    
    question._shuffledIndices = shuffledIndices;
    
    shuffledIndices.forEach((originalIndex) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = question.options[originalIndex];
        btn.dataset.originalIndex = originalIndex;
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
    valueDisplay.textContent = question.min;
    valueDisplay.id = 'slider-value-display';
    
    const track = document.createElement('div');
    track.className = 'slider-track';
    
    const fill = document.createElement('div');
    fill.className = 'slider-fill';
    fill.style.width = '0%';
    
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'slider-input';
    input.min = question.min;
    input.max = question.max;
    input.step = '0.1';
    input.value = question.min;
    
    input.addEventListener('input', () => {
        const percent = ((input.value - question.min) / (question.max - question.min)) * 100;
        fill.style.width = `${percent}%`;
        valueDisplay.textContent = input.value;
    });
    
    track.appendChild(fill);
    track.appendChild(input);
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'main-btn';
    submitBtn.textContent = 'Confirmar Respuesta ✅';
    submitBtn.addEventListener('click', () => {
        const userAnswer = parseFloat(input.value);
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
    
    shuffleArray(question.items).forEach((item) => {
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
    
    const shuffledIndices = question._shuffledIndices;
    const correctDisplayIndex = shuffledIndices.indexOf(question.correct);
    
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
    state.levelScore += points;
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
    state.levelPerfect = false;
    
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
        setTimeout(() => endLevel(), 1500);
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

// ===== FIN DE NIVEL =====
function endLevel() {
    clearInterval(state.timerInterval);
    
    // Verificar insignia de nivel perfecto
    if (state.levelPerfect && state.lives === 3) {
        if (!state.badges.perfectScore) {
            state.badges.perfectScore = true;
            alert('💯 ¡Nueva insignia: Puntaje Perfecto! Completaste un nivel sin errores.');
            saveBadges();
        }
    }
    
    // Verificar insignia de sobreviviente
    if (state.lives === 3 && !state.badges.survivor) {
        state.badges.survivor = true;
        alert('🛡️ ¡Nueva insignia: Sobreviviente! Completaste un nivel sin perder vidas.');
        saveBadges();
    }
    
    // Verificar insignia de poder natural
    if (!state.powerupsUsedThisLevel && !state.badges.noPowerups) {
        state.badges.noPowerups = true;
        alert('💪 ¡Nueva insignia: Poder Natural! Completaste un nivel sin usar power-ups.');
        saveBadges();
    }
    
    if (state.currentLevel < 4) {
        // Mostrar pantalla de transición
        document.getElementById('transition-title').textContent = `${levelNames[state.currentLevel]} Completado`;
        document.getElementById('transition-speech').textContent = `¡Excelente! Has completado el Nivel ${state.currentLevel} 🎉`;
        document.getElementById('level-score-display').textContent = state.levelScore;
        
        const nextBtn = document.getElementById('btn-next-level');
        nextBtn.textContent = `Siguiente: ${levelNames[state.currentLevel + 1]} ➡️`;
        
        showScreen('screen-level-transition');
        launchConfetti();
    } else {
        // Fin del juego
        showFinalResults();
    }
}

function showFinalResults() {
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
        'fondo-emergencia': 'Fondo de Emergencia',
        'tributacion': 'Tributación',
        'nomina': 'Nómina',
        'estados-financieros': 'Estados Financieros',
        'analisis-financiero': 'Análisis Financiero',
        'inventario': 'Inventarios',
        'inventarios': 'Inventarios',
        'matematica-financiera': 'Matemática Financiera'
    };
    
    const topicColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#E63946', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];
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
    const maxScore = 7000;
    if (state.score >= maxScore * 0.9) {
        resultCharacterSpeech.textContent = '¡Puntaje Perfecto! Conti Conti está súper orgulloso. 🏆🐰';
    } else if (state.score >= maxScore * 0.7) {
        resultCharacterSpeech.textContent = '¡Excelente resultado! Tienes bases muy sólidas. 👏🐰';
    } else if (state.score >= maxScore * 0.4) {
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
    state.levelScore = 0;
    state.lives = 3;
    state.streak = 0;
    state.currentLevel = 1;
    state.powerupsUsedThisLevel = false;
    state.levelPerfect = true;
    updateScore();
    updateLives();
    updateStreak();
    updateProgress();
    updateLevelDisplay();
    startGame();
}

// ===== PANTALLA FINAL =====
function goToFinalScreen() {
    showScreen('screen-final');
    launchConfetti();
}

// ===== POWER-UPS =====
function usePowerup(type) {
    if (state.powerups[type] <= 0) return;
    if (state.currentQuestion >= state.totalQuestions) return;
    
    state.powerups[type]--;
    state.powerupsUsedThisLevel = true;
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

// ===== INSIGNIAS =====
function checkBadges() {
    if (state.score >= 2000 && !state.badges.financierPro) {
        state.badges.financierPro = true;
        alert('🏆 ¡Nueva insignia: Financiero Pro! Alcanzaste 2000 puntos.');
        saveBadges();
    }
    if (state.streak >= 5 && !state.badges.streaker) {
        state.badges.streaker = true;
        alert('🔥 ¡Nueva insignia: Rachador! Respondiste 5 correctas seguidas.');
        saveBadges();
    }
    if (state.mode === 'timed' && state.timer >= 25 && !state.badges.speedDemon) {
        state.badges.speedDemon = true;
        alert('⚡ ¡Nueva insignia: Velocista! Respondiste en menos de 5 segundos.');
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