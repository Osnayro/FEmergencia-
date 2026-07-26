
/**
 * ============================================================
 * rabbit-svg.js — Template único del conejo Conti Conti
 * Elimina la duplicación de SVG en el HTML
 * ============================================================
 * 
 * Uso: Agrega <div class="rabbit-svg-container"></div> en cada
 * pantalla donde necesites el conejo. Este script lo inyecta.
 */

const RABBIT_SVG_TEMPLATE = `
<svg class="rabbit-svg thinking" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
    <!-- Sombra -->
    <ellipse cx="60" cy="110" rx="35" ry="12" fill="#E2E8F0" opacity="0.6"/>
    <!-- Cuerpo -->
    <ellipse cx="60" cy="70" rx="30" ry="35" fill="#F5F5F5"/>
    <!-- Ojos -->
    <ellipse class="eye-left" cx="50" cy="60" rx="4" ry="5" fill="#2D3748"/>
    <ellipse class="eye-right" cx="70" cy="60" rx="4" ry="5" fill="#2D3748"/>
    <circle class="eye-pupil" cx="51" cy="58" r="1.5" fill="white"/>
    <circle cx="71" cy="58" r="1.5" fill="white"/>
    <!-- Nariz -->
    <ellipse cx="60" cy="72" rx="6" ry="4" fill="#FFB6C1"/>
    <!-- Boca -->
    <path class="mouth" d="M52 78 Q60 85 68 78" stroke="#2D3748" stroke-width="1.5" fill="none"/>
    <!-- Orejas -->
    <ellipse cx="48" cy="42" rx="8" ry="18" fill="#F5F5F5" class="ear ear-left"/>
    <ellipse cx="48" cy="42" rx="5" ry="13" fill="#FFB6C1" class="ear-inner"/>
    <ellipse cx="72" cy="42" rx="8" ry="18" fill="#F5F5F5" class="ear ear-right"/>
    <ellipse cx="72" cy="42" rx="5" ry="13" fill="#FFB6C1" class="ear-inner"/>
    <!-- Estados especiales (ocultos por defecto vía CSS opacity:0) -->
    <circle class="eye-star" cx="55" cy="55" r="8" fill="none" stroke="#FFD700" stroke-width="2" stroke-dasharray="4,2"/>
    <circle class="eye-star" cx="65" cy="55" r="8" fill="none" stroke="#FFD700" stroke-width="2" stroke-dasharray="4,2"/>
    <circle class="tear" cx="52" cy="72" r="2.5" fill="#60A5FA"/>
    <text class="question-mark" x="80" y="28" font-size="20" fill="#8B5CF6" font-weight="800">?</text>
    <rect class="sunglasses" x="42" y="54" width="36" height="12" rx="4" fill="#1E293B"/>
    <line class="sunglasses" x1="78" y1="58" x2="88" y2="54" stroke="#1E293B" stroke-width="2"/>
    <polygon class="ice-crystal" points="92,22 94,28 100,30 94,32 92,38 90,32 84,30 90,28" fill="#BFDBFE"/>
    <circle class="eye-fire" cx="48" cy="60" r="7" fill="none" stroke="#FF4500" stroke-width="2"/>
    <circle class="eye-fire" cx="72" cy="60" r="7" fill="none" stroke="#FF4500" stroke-width="2"/>
    <g class="graduation-cap" transform="translate(42,12)">
        <polygon points="0,10 18,0 36,10 18,5" fill="#1E293B"/>
        <rect x="16" y="0" width="4" height="6" fill="#FFD700"/>
        <line x1="34" y1="6" x2="42" y2="0" stroke="#1E293B" stroke-width="1.5"/>
        <circle cx="42" cy="0" r="2" fill="#FFD700"/>
    </g>
</svg>
`;

/**
 * Inyecta el SVG del conejo en todos los contenedores con clase
 * .rabbit-svg-container que estén vacíos.
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

// También inyectar cuando se muestre una pantalla nueva
// por si el contenedor se añadió dinámicamente
const originalShowScreen = window.showScreen;
window.showScreen = function(screenId) {
    if (originalShowScreen) originalShowScreen(screenId);
    setTimeout(injectRabbitSVGs, 50);
};
