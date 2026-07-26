
/**
 * ============================================================
 * ContiEffectsManager v4.1 — Producción
 * Efectos visuales (Canvas 2D) + Sonidos (Web Audio API, motor mejorado) + Toasts
 * Para "Conti Conti - Desafío Financiero"
 * ============================================================
 *
 * Novedades v4.1 sobre v4.0:
 *   - Nuevo método triggerScoreBadgeFlash(): micro-destello en el badge
 *     de puntuación cuando "recibe" monedas (ultra-pop + partículas doradas)
 *
 * Novedades v4.0 sobre v3.0:
 *   - Bus de audio: masterGain -> compressor -> destination (evita clipping)
 *   - Envolventes ADSR reales en vez de simples rampas
 *   - Osciladores en capas (detune) para timbres más ricos
 *   - Filtros (lowpass/highpass) con barridos para carácter percusivo
 *   - Generador de ruido blanco filtrado para impactos/explosiones
 *   - Reverb algorítmico (impulse response generada por código, sin archivos)
 *   - Variación aleatoria de pitch/timing en sonidos repetitivos
 *
 * API pública 100% compatible con versiones anteriores (playSound, triggerToast,
 * triggerCoinExplosion, etc. no cambian su firma).
 *
 * Uso:
 *   const fx = new ContiEffectsManager({
 *       canvasId: 'effects-canvas',
 *       scoreBadgeId: 'score-badge',
 *       maxParticles: 300,
 *       masterVolume: 0.8
 *   });
 *   fx.triggerCoinExplosion(400, 300, 15);
 *   fx.triggerToast('¡Nueva insignia!', { icon: '🏆' });
 */

class ContiEffectsManager {

    constructor(config = {}) {
        // Canvas
        this.canvas = document.getElementById(config.canvasId || 'effects-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        if (this.canvas) {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }

        // Score badge (las monedas vuelan hacia él)
        this.scoreBadge = config.scoreBadgeId
            ? document.getElementById(config.scoreBadgeId)
            : null;

        // Configuración
        this.maxParticles = config.maxParticles || 300;
        this.masterVolume = Math.min(1, Math.max(0, config.masterVolume ?? 0.8));

        // Estado interno
        this.particles = [];
        this.floatingTexts = [];
        this.animationId = null;
        this.isRunning = false;

        // Audio engine (se crea de forma perezosa en ensureAudio())
        this.audioCtx = null;
        this.masterGain = null;
        this.compressor = null;
        this.reverbNode = null;
        this.reverbWetGain = null;
        this.reverbDryGain = null;
        this.noiseBuffer = null;

        // Paletas de colores
        this.colors = {
            coin:     ['#FFD700', '#FFA500', '#FFC107', '#FFB300', '#F59E0B', '#FFF8DC'],
            confetti: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF', '#FF8A5C', '#3B82F6', '#F472B6', '#84CC16', '#F97316'],
            firework: ['#FF4500', '#FFD700', '#FF6347', '#FFA500', '#FFFFFF', '#FF1493', '#00FF88'],
            magic:    ['#A78BFA', '#818CF8', '#C4B5FD', '#6366F1', '#DDD6FE'],
        };

        // Exponer al scope global
        window.effectsManager = this;

        // Arrancar loop de animación
        this.startLoop();

        console.log('🎨 ContiEffectsManager v4.1 listo | Partículas máx:', this.maxParticles, '| Volumen:', this.masterVolume);
    }

    // ================================================================
    //  CANVAS — Gestión del lienzo
    // ================================================================

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startLoop() {
        if (this.isRunning || !this.canvas) return;
        this.isRunning = true;
        const loop = () => {
            if (!this.isRunning) return;
            this._update();
            this._draw();
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    stopLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    _update() {
        // Partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.rotation += p.rotationSpeed;
            p.life -= p.decay;

            // Atracción al score badge (solo monedas en fase final)
            if (p.attractTo && this.scoreBadge && p.life < p.maxLife * 0.6) {
                const r = this.scoreBadge.getBoundingClientRect();
                const tx = r.left + r.width / 2;
                const ty = r.top + r.height / 2;
                const dx = tx - p.x;
                const dy = ty - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                p.vx += (dx / dist) * 0.1;
                p.vy += (dy / dist) * 0.1;
            }

            if (p.life <= 0 || p.y > this.canvas.height + 120 || p.x < -120 || p.x > this.canvas.width + 120) {
                this.particles.splice(i, 1);
            }
        }

        // Limitar a máximo
        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }

        // Textos flotantes
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life -= ft.decay;
            ft.alpha = Math.max(0, ft.life / ft.maxLife);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    _draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Partículas
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.scale(p.scale, p.scale);

            switch (p.type) {
                case 'coin':
                    this._drawCoin(ctx, p);
                    break;
                case 'confetti':
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                    break;
                case 'circle':
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'star':
                    this._drawStar(ctx, p);
                    break;
                default:
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
            ctx.restore();
        }

        // Textos flotantes
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `${ft.fontWeight} ${ft.fontSize}px 'Poppins', sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 6;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    _drawCoin(ctx, p) {
        const grad = ctx.createRadialGradient(0, 0, p.size * 0.15, 0, 0, p.size);
        grad.addColorStop(0, '#FFFDE7');
        grad.addColorStop(0.45, '#FFD700');
        grad.addColorStop(1, '#B8860B');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#8B6914';
        ctx.font = `bold ${p.size * 1.3}px 'Poppins', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
    }

    _drawStar(ctx, p) {
        const spikes = 5;
        const outerR = p.size;
        const innerR = p.size * 0.4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const sx = Math.cos(angle) * radius;
            const sy = Math.sin(angle) * radius;
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
    }

    // ================================================================
    //  API PÚBLICA — EFECTOS VISUALES
    // ================================================================

    triggerCoinExplosion(x, y, count = 12) {
        if (!this.canvas) return;
        count = Math.min(count, 40);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 9;
            this.particles.push({
                type: 'coin',
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 5,
                gravity: 0.18,
                friction: 0.985,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.35,
                scale: 0.55 + Math.random() * 0.9,
                size: 10 + Math.random() * 9,
                life: 1,
                maxLife: 1,
                decay: 0.005 + Math.random() * 0.01,
                color: this.colors.coin[Math.floor(Math.random() * this.colors.coin.length)],
                attractTo: true,
            });
        }
    }

    triggerExplosion(x, y, scale = 1.0, color = '#FFD700') {
        if (!this.canvas) return;
        const count = Math.floor(22 * scale);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 7) * scale;
            this.particles.push({
                type: 'circle',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.12,
                friction: 0.955,
                rotation: 0,
                rotationSpeed: 0,
                scale: 0.45 + Math.random() * 0.85,
                size: 3 + Math.random() * 9 * scale,
                life: 1,
                maxLife: 1,
                decay: 0.014 + Math.random() * 0.022,
                color: color,
                attractTo: false,
            });
        }
    }

    triggerConfetti(duration = 2500, density = 3) {
        if (!this.canvas) return;
        const startTime = performance.now();
        const colors = this.colors.confetti;

        const spawn = (now) => {
            if (now - startTime > duration) return;
            for (let i = 0; i < density; i++) {
                this.particles.push({
                    type: 'confetti',
                    x: Math.random() * this.canvas.width,
                    y: -25,
                    vx: (Math.random() - 0.5) * 5,
                    vy: 2 + Math.random() * 5,
                    gravity: 0.06,
                    friction: 0.994,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.25,
                    scale: 0.7 + Math.random() * 1.3,
                    size: 8 + Math.random() * 14,
                    life: 1,
                    maxLife: 1,
                    decay: 0.003 + Math.random() * 0.006,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    attractTo: false,
                });
            }
            requestAnimationFrame(spawn);
        };
        requestAnimationFrame(spawn);
    }

    triggerFireworks(count = 3) {
        if (!this.canvas) return;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const x = this.canvas.width * (0.2 + Math.random() * 0.6);
                const y = this.canvas.height * (0.12 + Math.random() * 0.28);
                this._burstFirework(x, y);
            }, i * 350 + Math.random() * 250);
        }
    }

    _burstFirework(x, y) {
        const colors = this.colors.firework;
        const count = 45 + Math.floor(Math.random() * 35);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            this.particles.push({
                type: 'star',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.09,
                friction: 0.965,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.12,
                scale: 0.35 + Math.random() * 0.7,
                size: 4 + Math.random() * 7,
                life: 1,
                maxLife: 1,
                decay: 0.009 + Math.random() * 0.016,
                color: colors[Math.floor(Math.random() * colors.length)],
                attractTo: false,
            });
        }
    }

    triggerFloatingText(x, y, text, options = {}) {
        if (!this.canvas) return;
        this.floatingTexts.push({
            x, y, text,
            vy: -1.6,
            life: 1,
            maxLife: 1,
            decay: 0.011,
            alpha: 1,
            color: options.color || '#FFD700',
            fontSize: options.fontSize || 28,
            fontWeight: options.fontWeight || '800',
        });
    }

    triggerCoinRain() {
        if (!this.canvas) return;
        const count = 30;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.particles.push({
                    type: 'coin',
                    x: Math.random() * this.canvas.width,
                    y: -35,
                    vx: (Math.random() - 0.5) * 3.5,
                    vy: 3 + Math.random() * 6,
                    gravity: 0.14,
                    friction: 0.994,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.25,
                    scale: 0.45 + Math.random() * 0.55,
                    size: 7 + Math.random() * 7,
                    life: 1,
                    maxLife: 1,
                    decay: 0.004 + Math.random() * 0.007,
                    color: this.colors.coin[Math.floor(Math.random() * this.colors.coin.length)],
                    attractTo: false,
                });
            }, i * 45);
        }
    }

    triggerScreenFlash(duration = 200) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: white; z-index: 998; pointer-events: none;
            opacity: 0.55; transition: opacity ${duration}ms ease-out;
        `;
        document.body.appendChild(flash);
        requestAnimationFrame(() => { flash.style.opacity = '0'; });
        setTimeout(() => flash.remove(), duration + 60);
    }

    /**
     * NUEVO v4.1: Micro-destello en el score-badge cuando "recibe" puntos.
     * Combina la clase CSS 'ultra-pop' con una pequeña ráfaga de partículas
     * doradas alrededor del badge.
     */
    triggerScoreBadgeFlash() {
        if (!this.scoreBadge) return;
        
        // Animación CSS de ultra-pop
        this.scoreBadge.classList.add('ultra-pop');
        setTimeout(() => this.scoreBadge.classList.remove('ultra-pop'), 600);
        
        // Pequeño destello de partículas doradas alrededor
        const rect = this.scoreBadge.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.particles.push({
                type: 'circle',
                x: cx,
                y: cy,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                gravity: 0,
                friction: 0.9,
                rotation: 0,
                rotationSpeed: 0,
                scale: 0.5,
                size: 3 + Math.random() * 2,
                life: 1,
                maxLife: 1,
                decay: 0.035,
                color: '#FFD700',
                attractTo: false,
            });
        }
    }

    // ================================================================
    //  API PÚBLICA — SISTEMA DE TOASTS
    // ================================================================

    triggerToast(message, options = {}) {
        const {
            icon = '🎉',
            bg = 'linear-gradient(135deg, #1E3A63, #2563EB)',
            duration = 3000,
            position = 'top'
        } = options;

        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed; left: 50%; transform: translateX(-50%);
                z-index: 2000; display: flex; flex-direction: column;
                gap: 12px; pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        container.style.top = position === 'center' ? '40%' : '8%';

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${bg}; color: white; padding: 15px 26px;
            border-radius: 18px; font-weight: 700; font-size: 0.95rem;
            font-family: 'Poppins', sans-serif; text-align: center;
            box-shadow: 0 14px 35px rgba(0,0,0,0.28);
            pointer-events: auto;
            animation: toastSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            display: flex; align-items: center; gap: 12px;
            white-space: nowrap; letter-spacing: 0.3px;
        `;
        toast.innerHTML = `<span style="font-size:1.6rem; line-height:1">${icon}</span> ${message}`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.4s ease-in forwards';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // ================================================================
    //  MOTOR DE AUDIO — Infraestructura (v4.0)
    // ================================================================

    /**
     * Crea (si hace falta) el AudioContext y el bus maestro:
     *   fuentes -> masterGain -> compressor -> destination
     * y una rama paralela de reverb: masterGain -> reverbWet -> convolver -> compressor
     */
    ensureAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // Bus maestro
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 1;

            this.compressor = this.audioCtx.createDynamicsCompressor();
            this.compressor.threshold.value = -18;
            this.compressor.knee.value = 20;
            this.compressor.ratio.value = 4;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // Rama seca (dry)
            this.reverbDryGain = this.audioCtx.createGain();
            this.reverbDryGain.gain.value = 1;

            // Rama de reverb (wet), con impulse response generada por código
            this.reverbNode = this.audioCtx.createConvolver();
            this.reverbNode.buffer = this._buildImpulseResponse(1.6, 2.2);
            this.reverbWetGain = this.audioCtx.createGain();
            this.reverbWetGain.gain.value = 0.22; // cantidad de reverb por defecto

            this.masterGain.connect(this.reverbDryGain);
            this.reverbDryGain.connect(this.compressor);

            this.masterGain.connect(this.reverbNode);
            this.reverbNode.connect(this.reverbWetGain);
            this.reverbWetGain.connect(this.compressor);

            this.compressor.connect(this.audioCtx.destination);

            // Buffer de ruido blanco reutilizable (para percusión/explosiones)
            this.noiseBuffer = this._buildNoiseBuffer(1.0);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    /** Genera una impulse response sintética para el ConvolverNode (sin archivos externos) */
    _buildImpulseResponse(duration = 1.5, decay = 2.0) {
        const rate = this.audioCtx.sampleRate;
        const length = Math.max(1, Math.floor(rate * duration));
        const impulse = this.audioCtx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    }

    /** Genera un buffer de ruido blanco de la duración indicada (en segundos) */
    _buildNoiseBuffer(duration = 1.0) {
        const rate = this.audioCtx.sampleRate;
        const length = Math.max(1, Math.floor(rate * duration));
        const buffer = this.audioCtx.createBuffer(1, length, rate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /**
     * Aplica una envolvente ADSR a un AudioParam de ganancia.
     * @param {AudioParam} gainParam
     * @param {number} startTime
     * @param {Object} env - { peak, attack, decay, sustain, sustainTime, release }
     */
    _applyADSR(gainParam, startTime, env) {
        const { peak, attack = 0.01, decay = 0.1, sustain = 0.4, sustainTime = 0.05, release = 0.2 } = env;
        const t = startTime;
        gainParam.cancelScheduledValues(t);
        gainParam.setValueAtTime(0.0001, t);
        gainParam.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + attack);
        gainParam.exponentialRampToValueAtTime(Math.max(peak * sustain, 0.0001), t + attack + decay);
        gainParam.setValueAtTime(Math.max(peak * sustain, 0.0001), t + attack + decay + sustainTime);
        gainParam.exponentialRampToValueAtTime(0.0001, t + attack + decay + sustainTime + release);
        return t + attack + decay + sustainTime + release;
    }

    /**
     * Crea un oscilador conectado (opcionalmente) a un filtro y a una ganancia propia,
     * mezclado hacia el masterGain. Devuelve { osc, gain, filter } para configurarlo.
     */
    _createVoice({ type = 'sine', detune = 0, filterType = null, filterFreq = null, filterQ = 0.7 } = {}) {
        const osc = this.audioCtx.createOscillator();
        osc.type = type;
        osc.detune.value = detune;

        const voiceGain = this.audioCtx.createGain();
        voiceGain.gain.value = 0.0001;

        let outputNode = voiceGain;
        let filter = null;
        if (filterType) {
            filter = this.audioCtx.createBiquadFilter();
            filter.type = filterType;
            filter.frequency.value = filterFreq || 1000;
            filter.Q.value = filterQ;
            osc.connect(filter);
            filter.connect(voiceGain);
        } else {
            osc.connect(voiceGain);
        }
        voiceGain.connect(this.masterGain);

        return { osc, gain: voiceGain, filter };
    }

    /** Reproduce un golpe de ruido filtrado (para monedas, explosiones, incorrecto, etc.) */
    _playNoiseHit({ filterType = 'bandpass', freqStart, freqEnd, q = 1, peak = 0.3, duration = 0.25, delay = 0 } = {}) {
        const now = this.audioCtx.currentTime + delay;
        const src = this.audioCtx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = filterType;
        filter.Q.value = q;
        filter.frequency.setValueAtTime(freqStart, now);
        if (freqEnd !== undefined) {
            filter.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), now + duration);
        }

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(peak * this.masterVolume, 0.0001), now + Math.min(0.02, duration * 0.15));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        src.start(now);
        src.stop(now + duration + 0.05);
    }

    // ================================================================
    //  API PÚBLICA — SONIDOS (v4.0, motor mejorado)
    // ================================================================

    /**
     * 🔊 Reproduce sonido sintetizado con motor de capas + ADSR + filtros + ruido + reverb
     * @param {string} type - 'correct'|'incorrect'|'levelup'|'levelstart'|'achievement'|'powerup'|'tick'|'coin'|'explosion'
     */
    playSound(type) {
        this.ensureAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const vol = this.masterVolume;
        // Pequeña variación aleatoria para que sonidos repetidos no suenen mecánicos
        const jitter = () => (Math.random() - 0.5) * 12; // cents

        switch (type) {
            case 'correct': {
                // Acorde ascendente en capas: dos voces por nota, ligeramente desafinadas
                const notes = [523, 659, 784];
                notes.forEach((freq, i) => {
                    [0, 7].forEach((detuneBase) => {
                        const v = this._createVoice({ type: 'sine', detune: detuneBase + jitter() });
                        v.osc.frequency.value = freq;
                        const start = now + i * 0.07;
                        this._applyADSR(v.gain.gain, start, {
                            peak: 0.14 * vol * (detuneBase === 0 ? 1 : 0.5),
                            attack: 0.01, decay: 0.08, sustain: 0.3, sustainTime: 0.03, release: 0.18,
                        });
                        v.osc.start(start);
                        v.osc.stop(start + 0.35);
                    });
                });
                break;
            }

            case 'incorrect': {
                const v = this._createVoice({ type: 'sawtooth', filterType: 'lowpass', filterFreq: 900 });
                v.osc.frequency.setValueAtTime(200, now);
                v.osc.frequency.exponentialRampToValueAtTime(95, now + 0.38);
                v.filter.frequency.setValueAtTime(900, now);
                v.filter.frequency.exponentialRampToValueAtTime(180, now + 0.4);
                this._applyADSR(v.gain.gain, now, {
                    peak: 0.16 * vol, attack: 0.005, decay: 0.1, sustain: 0.5, sustainTime: 0.05, release: 0.25,
                });
                v.osc.start(now);
                v.osc.stop(now + 0.5);
                // Un poco de ruido grave para dar "peso" al error
                this._playNoiseHit({ filterType: 'lowpass', freqStart: 500, freqEnd: 90, q: 0.8, peak: 0.12, duration: 0.3 });
                break;
            }

            case 'levelup': {
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    [0, 5, -5].forEach((detune) => {
                        const v = this._createVoice({ type: i < 2 ? 'sine' : 'triangle', detune: detune + jitter() });
                        v.osc.frequency.value = freq;
                        const start = now + i * 0.1;
                        this._applyADSR(v.gain.gain, start, {
                            peak: 0.13 * vol * (detune === 0 ? 1 : 0.4),
                            attack: 0.012, decay: 0.12, sustain: 0.35, sustainTime: 0.04, release: 0.3,
                        });
                        v.osc.start(start);
                        v.osc.stop(start + 0.5);
                    });
                });
                break;
            }

            case 'achievement': {
                const notes = [660, 880, 1100, 1320];
                notes.forEach((freq, i) => {
                    const v = this._createVoice({ type: 'triangle', detune: jitter(), filterType: 'highpass', filterFreq: 200 });
                    v.osc.frequency.value = freq;
                    const start = now + i * 0.09;
                    this._applyADSR(v.gain.gain, start, {
                        peak: 0.15 * vol, attack: 0.01, decay: 0.1, sustain: 0.4, sustainTime: 0.04, release: 0.28,
                    });
                    v.osc.start(start);
                    v.osc.stop(start + 0.45);
                });
                // Un brillo de "campana" superpuesto
                const bell = this._createVoice({ type: 'sine', detune: 1200 });
                bell.osc.frequency.value = 1760;
                this._applyADSR(bell.gain.gain, now + 0.3, { peak: 0.06 * vol, attack: 0.005, decay: 0.3, sustain: 0.1, sustainTime: 0.1, release: 0.4 });
                bell.osc.start(now + 0.3);
                bell.osc.stop(now + 1.0);
                break;
            }

            case 'powerup': {
                const v = this._createVoice({ type: 'sine', filterType: 'lowpass', filterFreq: 2500 });
                v.osc.frequency.setValueAtTime(440, now);
                v.osc.frequency.exponentialRampToValueAtTime(1046, now + 0.15);
                this._applyADSR(v.gain.gain, now, {
                    peak: 0.15 * vol, attack: 0.008, decay: 0.08, sustain: 0.4, sustainTime: 0.05, release: 0.2,
                });
                v.osc.start(now);
                v.osc.stop(now + 0.35);
                break;
            }

            case 'tick': {
                const v = this._createVoice({ type: 'sine', detune: jitter() });
                v.osc.frequency.value = 1000;
                this._applyADSR(v.gain.gain, now, {
                    peak: 0.07 * vol, attack: 0.002, decay: 0.02, sustain: 0.1, sustainTime: 0.01, release: 0.03,
                });
                v.osc.start(now);
                v.osc.stop(now + 0.07);
                break;
            }

            case 'coin': {
                // Tono metálico + click de ruido agudo para simular impacto de metal
                const v = this._createVoice({ type: 'sine', filterType: 'highpass', filterFreq: 600 });
                v.osc.frequency.setValueAtTime(1400, now);
                v.osc.frequency.setValueAtTime(1800, now + 0.04);
                this._applyADSR(v.gain.gain, now, {
                    peak: 0.11 * vol, attack: 0.002, decay: 0.05, sustain: 0.2, sustainTime: 0.02, release: 0.08,
                });
                v.osc.start(now);
                v.osc.stop(now + 0.16);
                this._playNoiseHit({ filterType: 'highpass', freqStart: 3500, freqEnd: 6000, q: 0.6, peak: 0.08, duration: 0.06 });
                break;
            }

            case 'explosion': {
                // Cuerpo grave con oscilador + ruido de impacto amplio con barrido lowpass
                const v = this._createVoice({ type: 'sawtooth', filterType: 'lowpass', filterFreq: 800 });
                v.osc.frequency.setValueAtTime(160, now);
                v.osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);
                v.filter.frequency.setValueAtTime(800, now);
                v.filter.frequency.exponentialRampToValueAtTime(60, now + 0.55);
                this._applyADSR(v.gain.gain, now, {
                    peak: 0.2 * vol, attack: 0.003, decay: 0.2, sustain: 0.4, sustainTime: 0.1, release: 0.3,
                });
                v.osc.start(now);
                v.osc.stop(now + 0.6);
                this._playNoiseHit({ filterType: 'lowpass', freqStart: 2500, freqEnd: 120, q: 0.9, peak: 0.3, duration: 0.5 });
                break;
            }

            case 'levelstart': {
                // Swoosh ascendente (ruido con barrido highpass) + tono breve
                // que marca el arranque de nivel, distinto del acorde de 'levelup'.
                this._playNoiseHit({ filterType: 'highpass', freqStart: 200, freqEnd: 4000, q: 0.7, peak: 0.14, duration: 0.35 });
                const v = this._createVoice({ type: 'triangle', filterType: 'lowpass', filterFreq: 3000 });
                v.osc.frequency.setValueAtTime(330, now);
                v.osc.frequency.exponentialRampToValueAtTime(660, now + 0.25);
                this._applyADSR(v.gain.gain, now + 0.05, {
                    peak: 0.13 * vol, attack: 0.02, decay: 0.1, sustain: 0.3, sustainTime: 0.04, release: 0.2,
                });
                v.osc.start(now + 0.05);
                v.osc.stop(now + 0.45);
                break;
            }

            default:
                break;
        }
    }

    /** Ajusta la cantidad de reverb global (0 = seco, 1 = muy húmedo) */
    setReverbAmount(amount) {
        this.ensureAudio();
        if (this.reverbWetGain) {
            this.reverbWetGain.gain.value = Math.min(1, Math.max(0, amount));
        }
    }

    // ================================================================
    //  CONVENIENCIA — Integración con app.js
    // ================================================================

    triggerCoinExplosionFromElement(element, count = 12) {
        if (!element || !this.canvas) return;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        this.triggerCoinExplosion(x, y, count);
        this.playSound('coin');
    }

    setScoreBadge(elementOrId) {
        if (typeof elementOrId === 'string') {
            this.scoreBadge = document.getElementById(elementOrId);
        } else {
            this.scoreBadge = elementOrId;
        }
    }
}

// ================================================================
//  INICIALIZACIÓN AUTOMÁTICA
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!window.effectsManager) {
        window.effectsManager = new ContiEffectsManager({
            canvasId: 'effects-canvas',
            scoreBadgeId: 'score-badge',
            maxParticles: 300,
            masterVolume: 0.8,
        });
    }
});
```

---

📊 PLAN COMPLETO — RESUMEN FINAL

# Archivo Versión Mejoras realizadas
1 rabbit-svg.js v2.0 ✅ Conejo rediseñado con orejas articuladas (base + punta), cuerpo redondeado, mejillas, nariz corazón, bigotes, patas con almohadillas
2 styles.css — ✅ 12 estados del conejo con animaciones de puntas doblables, brillo dorado en acierto, orejas caídas en error, keyframes nuevos
3 app.js v3.2 ✅ Flash blanco en aciertos rápidos, destello en score-badge, sonido+explosión en drag táctil, doble confeti en transición de niveles
4 effects.js v4.1 ✅ Nuevo método triggerScoreBadgeFlash()

---

🚀 SECUENCIA DE CARGA CORRECTA EN index.html

Verifica que los scripts estén en este orden al final del <body>:

```html
<script src="rabbit-svg.js"></script>
<script src="effects.js"></script>
<script src="app.js"></script>
