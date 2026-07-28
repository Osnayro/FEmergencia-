
/**
 * ============================================================
 * rabbit-svg.js v2.0 — Conejo Conti Conti Rediseñado
 * Orejas articuladas (2 segmentos), rostro expresivo,
 * cuerpo redondeado tipo "peluche adorable".
 * Para "ContiLab: Desafío Contable y Financiero"
 * ============================================================
 *
 * NOVEDADES v2.0:
 *   - Orejas con 2 partes: base (anclada a la cabeza) + punta (móvil)
 *   - La punta se dobla independientemente para expresiones más realistas
 *   - Cabeza más grande con mejillas sonrosadas
 *   - Ojos con brillo doble (pupila + destello)
 *   - Nariz en forma de corazón
 *   - Bigotes
 *   - Cuerpo tipo "huevo" suave con patitas y brazos
 *   - Todos los estados especiales conservados (estrellas, lágrimas,
 *     gafas, fuego, birrete, cristal de hielo, interrogación)
 *
 * Uso: Agrega <div class="rabbit-svg-container"></div> en cada
 * pantalla donde necesites el conejo. Este script lo inyecta.
 */

const RABBIT_SVG_TEMPLATE = `
<svg class="rabbit-svg thinking" viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
    
    <!-- ===== SOMBRA EN EL SUELO ===== -->
    <ellipse class="shadow" cx="70" cy="148" rx="38" ry="10" fill="#E2E8F0" opacity="0.55"/>

    <!-- ===== PATAS TRASERAS ===== -->
    <ellipse class="foot foot-left" cx="48" cy="140" rx="14" ry="8" fill="#F0F0F0"/>
    <ellipse class="foot foot-right" cx="92" cy="140" rx="14" ry="8" fill="#F0F0F0"/>
    
    <!-- Almohadillas -->
    <ellipse cx="48" cy="138" rx="6" ry="4" fill="#FFCDD2"/>
    <ellipse cx="92" cy="138" rx="6" ry="4" fill="#FFCDD2"/>

    <!-- ===== BRAZOS (a los costados) ===== -->
    <ellipse class="arm arm-left" cx="28" cy="110" rx="10" ry="16" fill="#F5F5F5" transform="rotate(15, 28, 110)"/>
    <ellipse class="arm arm-right" cx="112" cy="110" rx="10" ry="16" fill="#F5F5F5" transform="rotate(-15, 112, 110)"/>

    <!-- ===== CUERPO PRINCIPAL (forma de huevo) ===== -->
    <ellipse class="body" cx="70" cy="108" rx="38" ry="42" fill="#F8F8F8"/>
    
    <!-- Panza blanca -->
    <ellipse class="belly" cx="70" cy="115" rx="22" ry="28" fill="#FFFFFF"/>

    <!-- ===== OREJA IZQUIERDA (2 segmentos) ===== -->
    <g class="ear-group ear-group-left">
        <!-- Base de la oreja (anclada a la cabeza) -->
        <ellipse class="ear-base ear-base-left" cx="46" cy="40" rx="9" ry="16" fill="#F5F5F5"/>
        <ellipse class="ear-base-inner ear-base-inner-left" cx="46" cy="40" rx="5.5" ry="12" fill="#FFCDD2"/>
        
        <!-- Punta de la oreja (móvil, se dobla) -->
        <g class="ear-tip-group ear-tip-group-left" style="transform-origin: 46px 32px;">
            <ellipse class="ear-tip ear-tip-left" cx="46" cy="18" rx="8" ry="16" fill="#F5F5F5"/>
            <ellipse class="ear-tip-inner ear-tip-inner-left" cx="46" cy="18" rx="5" ry="12" fill="#FFCDD2"/>
        </g>
    </g>

    <!-- ===== OREJA DERECHA (2 segmentos) ===== -->
    <g class="ear-group ear-group-right">
        <!-- Base de la oreja (anclada a la cabeza) -->
        <ellipse class="ear-base ear-base-right" cx="94" cy="40" rx="9" ry="16" fill="#F5F5F5"/>
        <ellipse class="ear-base-inner ear-base-inner-right" cx="94" cy="40" rx="5.5" ry="12" fill="#FFCDD2"/>
        
        <!-- Punta de la oreja (móvil, se dobla) -->
        <g class="ear-tip-group ear-tip-group-right" style="transform-origin: 94px 32px;">
            <ellipse class="ear-tip ear-tip-right" cx="94" cy="18" rx="8" ry="16" fill="#F5F5F5"/>
            <ellipse class="ear-tip-inner ear-tip-inner-right" cx="94" cy="18" rx="5" ry="12" fill="#FFCDD2"/>
        </g>
    </g>

    <!-- ===== CABEZA ===== -->
    <ellipse class="head" cx="70" cy="58" rx="32" ry="30" fill="#F8F8F8"/>
    
    <!-- Mejillas sonrosadas -->
    <ellipse class="cheek cheek-left" cx="48" cy="66" rx="8" ry="5" fill="#FFCDD2" opacity="0.6"/>
    <ellipse class="cheek cheek-right" cx="92" cy="66" rx="8" ry="5" fill="#FFCDD2" opacity="0.6"/>

    <!-- Ojo izquierdo -->
    <g class="eye eye-left">
        <ellipse cx="57" cy="55" rx="5" ry="6" fill="#1E293B"/>
        <circle class="eye-pupil eye-pupil-left" cx="58" cy="53" r="2.2" fill="white"/>
        <circle class="eye-sparkle eye-sparkle-left" cx="56" cy="57" r="1" fill="white" opacity="0.7"/>
    </g>

    <!-- Ojo derecho -->
    <g class="eye eye-right">
        <ellipse cx="83" cy="55" rx="5" ry="6" fill="#1E293B"/>
        <circle class="eye-pupil eye-pupil-right" cx="84" cy="53" r="2.2" fill="white"/>
        <circle class="eye-sparkle eye-sparkle-right" cx="82" cy="57" r="1" fill="white" opacity="0.7"/>
    </g>

    <!-- Nariz (corazón) -->
    <g class="nose">
        <path d="M70 64 C68 61, 64 61, 64 64 C64 67, 70 71, 70 71 C70 71, 76 67, 76 64 C76 61, 72 61, 70 64Z" fill="#FF8A80"/>
    </g>

    <!-- Boca -->
    <path class="mouth" d="M65 73 Q70 79 75 73" stroke="#64748B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    
    <!-- Bigotes -->
    <g class="whiskers">
        <line x1="30" y1="62" x2="52" y2="68" stroke="#CBD5E1" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="28" y1="70" x2="50" y2="72" stroke="#CBD5E1" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="110" y1="62" x2="88" y2="68" stroke="#CBD5E1" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="112" y1="70" x2="90" y2="72" stroke="#CBD5E1" stroke-width="1.2" stroke-linecap="round"/>
    </g>

    <!-- ===== ELEMENTOS DE ESTADOS ESPECIALES (ocultos por defecto) ===== -->
    
    <!-- Estrellas en ojos (impresionado) -->
    <g class="eye-star-group" opacity="0">
        <polygon class="eye-star" points="57,48 58.5,52 63,52 59.5,55 61,59 57,56.5 53,59 54.5,55 51,52 55.5,52" fill="#FFD700"/>
        <polygon class="eye-star" points="83,48 84.5,52 89,52 85.5,55 87,59 83,56.5 79,59 80.5,55 77,52 81.5,52" fill="#FFD700"/>
    </g>

    <!-- Lágrimas (triste) -->
    <g class="tear-group" opacity="0">
        <ellipse class="tear" cx="53" cy="72" rx="2.5" ry="4" fill="#60A5FA"/>
        <ellipse class="tear" cx="87" cy="72" rx="2.5" ry="4" fill="#60A5FA"/>
    </g>

    <!-- Signo de interrogación (pensando profundo) -->
    <text class="question-mark" x="100" y="22" font-size="22" fill="#8B5CF6" font-weight="900" opacity="0">?</text>

    <!-- Gafas de sol (confiado) -->
    <g class="sunglasses-group" opacity="0">
        <rect class="sunglasses" x="46" y="48" width="20" height="11" rx="4" fill="#1E293B"/>
        <rect class="sunglasses" x="74" y="48" width="20" height="11" rx="4" fill="#1E293B"/>
        <line x1="66" y1="53" x2="74" y2="53" stroke="#1E293B" stroke-width="2"/>
        <line x1="46" y1="51" x2="36" y2="47" stroke="#1E293B" stroke-width="2"/>
        <line x1="94" y1="51" x2="104" y2="47" stroke="#1E293B" stroke-width="2"/>
    </g>

    <!-- Cristal de hielo (congelado) -->
    <g class="ice-crystal-group" opacity="0">
        <polygon class="ice-crystal" points="105,18 107,24 113,26 107,28 105,34 103,28 97,26 103,24" fill="#BFDBFE" stroke="#93C5FD" stroke-width="1"/>
    </g>

    <!-- Fuego en ojos (determinado) -->
    <g class="eye-fire-group" opacity="0">
        <ellipse class="eye-fire" cx="57" cy="55" rx="8" ry="9" fill="none" stroke="#FF4500" stroke-width="2"/>
        <ellipse class="eye-fire" cx="83" cy="55" rx="8" ry="9" fill="none" stroke="#FF4500" stroke-width="2"/>
    </g>

    <!-- Birrete de graduación -->
    <g class="graduation-cap-group" opacity="0" transform="translate(58, 14)">
        <polygon points="0,10 16,2 32,10 16,5" fill="#1E293B"/>
        <rect x="14" y="0" width="4" height="6" fill="#FFD700"/>
        <line x1="30" y1="6" x2="38" y2="0" stroke="#1E293B" stroke-width="1.5"/>
        <circle cx="38" cy="0" r="2" fill="#FFD700"/>
    </g>

</svg>
`;

/**
 * Inyecta el SVG del conejo en todos los contenedores con clase
 * .rabbit-svg-container que estén vacíos.
 * Se llama al cargar la página y también desde showScreen() en app.js
 * para asegurar que cada pantalla tenga su conejo.
 */
function injectRabbitSVGs() {
    document.querySelectorAll('.rabbit-svg-container').forEach(container => {
        if (!container.querySelector('.rabbit-svg')) {
            container.innerHTML = RABBIT_SVG_TEMPLATE;
        }
    });
}

// Inyectar al cargar la página
document.addEventListener('DOMContentLoaded', injectRabbitSVGs);
