

/**
 * ============================================================
 * ContiEffectsManager v5.3.0 — Producción
 * Efectos visuales (Canvas 2D) + Sonidos (pistas MP3 + síntesis) + Toasts
 * Para "ContiLab: Desafío Contable y Financiero"
 * ============================================================
 *
 * Novedades v5.3.0 sobre v5.2.1:
 *   - FIX iOS: AudioContext global unificado para playTick().
 *   - FIX iOS: Respaldo playIncorrectFallback() para cuando se agota
 *     el tiempo sin gesto del usuario. Estrategia de 3 capas:
 *       1. Nuevo Audio('sounds/incorrect.mp3')
 *       2. Síntesis con AudioContext global (_playIncorrectWithAudioContext)
 *       3. Silencio (el juego continúa)
 *   - NUEVO: Método initGlobalAudio() para inicializar el AudioContext
 *     global de forma segura y compatible con iOS.
 *
 * Novedades v5.2.1 sobre v5.2:
 *   - FIX: Barra de progreso del splash inicializada en 0%.
 *
 * Novedades v5.2 sobre v5.1:
 *   - MEJORA: playTick() rediseñado con 5 capas de síntesis.
 *
 * Estructura de archivos requerida:
 *   /sounds/splash.mp3, correct.mp3, incorrect.mp3, levelup.mp3,
 *   levelstart.mp3, achievement.mp3, powerup.mp3, coin.mp3, explosion.mp3
 *
 * Nota: tick se genera por síntesis en playTick(). No requiere archivo.
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

        // Score badge
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

        // Sistema de audio con pistas MP3
        this.soundFiles = {
            splash:      'sounds/splash.mp3',
            correct:     'sounds/correct.mp3',
            incorrect:   'sounds/incorrect.mp3',
            levelup:     'sounds/levelup.mp3',
            levelstart:  'sounds/levelstart.mp3',
            achievement: 'sounds/achievement.mp3',
            powerup:     'sounds/powerup.mp3',
            coin:        'sounds/coin.mp3',
            explosion:   'sounds/explosion.mp3',
        };

        // Pool de elementos <audio> reutilizables
        this.audioPool = [];
        this.maxAudioPool = 8;
        this.audioPoolIndex = 0;

        // Buffers precargados
        this.audioBuffers = {};
        this.audioLoaded = false;
        this.audioLoadError = false;
        this.soundsLoadedCount = 0;
        this.soundsTotalCount = Object.keys(this.soundFiles).length;

        // AudioContext global para síntesis (tick y respaldo)
        this.audioCtx = null;
        this.audioCtxReady = false;

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

        // Precargar sonidos
        this._preloadSounds();

        console.log('🎨 ContiEffectsManager v5.3.0 listo | Partículas máx:', this.maxParticles, '| Volumen:', this.masterVolume, '| Audio: MP3 + Síntesis tick + Respaldo iPhone');
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
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.rotation += p.rotationSpeed;
            p.life -= p.decay;

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

        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }

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
            if (i === 0) {
                ctx.moveTo(sx, sy);
            } else {
                ctx.lineTo(sx, sy);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    // ================================================================
    //  SISTEMA DE AUDIO CON PISTAS MP3
    // ================================================================

    _preloadSounds(onProgress) {
        const loaderFill = document.getElementById('loader-fill');
        if (loaderFill) {
            loaderFill.style.width = '0%';
            loaderFill.style.animation = 'none';
        }
        
        for (let i = 0; i < this.maxAudioPool; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = this.masterVolume;
            this.audioPool.push(audio);
        }

        for (const [key, path] of Object.entries(this.soundFiles)) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = path;
            audio.volume = this.masterVolume;

            audio.addEventListener('canplaythrough', () => {
                this.soundsLoadedCount++;
                this.audioBuffers[key] = audio;
                
                if (loaderFill) {
                    const progress = (this.soundsLoadedCount / this.soundsTotalCount) * 100;
                    loaderFill.style.width = progress + '%';
                }
                
                if (onProgress) {
                    onProgress(this.soundsLoadedCount, this.soundsTotalCount);
                }

                if (this.soundsLoadedCount === this.soundsTotalCount) {
                    this.audioLoaded = true;
                    console.log('🔊 Todos los sonidos MP3 precargados correctamente (' + this.soundsTotalCount + ' archivos).');
                    this._showSplashButton();
                }
            }, { once: true });

            audio.addEventListener('error', (err) => {
                this.soundsLoadedCount++;
                console.warn('⚠️ No se pudo cargar el sonido: ' + path + '. El juego continuará sin este sonido.');
                
                if (loaderFill) {
                    const progress = (this.soundsLoadedCount / this.soundsTotalCount) * 100;
                    loaderFill.style.width = progress + '%';
                }
                
                if (onProgress) {
                    onProgress(this.soundsLoadedCount, this.soundsTotalCount);
                }

                if (this.soundsLoadedCount === this.soundsTotalCount && !this.audioLoaded) {
                    this.audioLoadError = true;
                    console.warn('🔇 Algunos sonidos no se cargaron. La app funcionará sin audio.');
                    this._showSplashButton();
                }
            });

            audio.load();
        }
    }

    _showSplashButton() {
        const loaderFill = document.getElementById('loader-fill');
        const skipBtn = document.getElementById('skip-splash-btn');
        const splashScreen = document.getElementById('splash-screen');
        
        if (loaderFill) {
            loaderFill.style.width = '100%';
        }
        
        if (skipBtn) {
            skipBtn.style.display = 'block';
            skipBtn.addEventListener('click', () => {
                this.initGlobalAudio();
                this.playSound('splash');
                if (splashScreen) {
                    splashScreen.classList.add('hidden');
                }
            }, { once: true });
        }
    }

    /**
     * Inicializa un AudioContext global para síntesis de audio (tick y respaldo).
     * Se llama una sola vez durante el primer gesto del usuario.
     * En iOS, esto es obligatorio para que Web Audio API funcione.
     */
    initGlobalAudio() {
        if (this.audioCtxReady) return;
        
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('Web Audio API no disponible en este navegador.');
            return;
        }
        
        try {
            this.audioCtx = new AudioCtx();
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().then(() => {
                    this.audioCtxReady = true;
                    console.log('🔊 AudioContext global inicializado correctamente.');
                }).catch(err => {
                    console.warn('No se pudo reanudar AudioContext:', err);
                });
            } else {
                this.audioCtxReady = true;
                console.log('🔊 AudioContext global inicializado correctamente.');
            }
        } catch (e) {
            console.warn('Error al crear AudioContext:', e);
        }
    }

    playSound(type) {
        if (!this.audioLoaded && !this.audioLoadError) return;
        if (!this.soundFiles[type]) {
            console.warn('Tipo de sonido no reconocido:', type);
            return;
        }

        const sourceAudio = this.audioBuffers[type];
        if (!sourceAudio) return;

        const poolAudio = this.audioPool[this.audioPoolIndex];
        this.audioPoolIndex = (this.audioPoolIndex + 1) % this.maxAudioPool;

        poolAudio.src = this.soundFiles[type];
        poolAudio.volume = this.masterVolume;

        const playPromise = poolAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.debug('🔇 Reproducción de audio bloqueada:', type, '-', err.message);
            });
        }
    }

    /**
     * RESPALDO iPHONE: Reproduce el sonido incorrect cuando se agota el tiempo.
     * Estrategia de 3 capas:
     *   1. Nuevo elemento Audio (independiente del pool)
     *   2. Si falla, síntesis con AudioContext global
     *   3. Si todo falla, silencio (el juego continúa)
     */
    playIncorrectFallback() {
        if (!this.audioLoaded && !this.audioLoadError) return;
        
        // Capa 1: Nuevo elemento Audio
        const audio = new Audio('sounds/incorrect.mp3');
        audio.volume = this.masterVolume;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.debug('🔇 Fallback incorrect capa 1 bloqueado:', err.message);
                // Capa 2: Síntesis con AudioContext global
                this._playIncorrectWithAudioContext();
            });
        }
        
        audio.addEventListener('ended', () => {
            audio.remove();
        });
    }

    /**
     * Capa 2 del respaldo: Sintetiza un tono grave descendente
     * usando el AudioContext global. Similar al sonido incorrect original.
     */
    _playIncorrectWithAudioContext() {
        if (!this.audioCtxReady || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
            return;
        }
        
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const vol = this.masterVolume;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.38);
        
        gain.gain.setValueAtTime(0.00001, now);
        gain.gain.exponentialRampToValueAtTime(0.16 * vol, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }

    playTick() {
        if (!this.audioCtxReady || !this.audioCtx) {
            return;
        }
        
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
            return;
        }
        
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const vol = this.masterVolume;
        const masterGain = ctx.createGain();
        masterGain.gain.value = 1.0;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, now);
        compressor.knee.setValueAtTime(6, now);
        compressor.ratio.setValueAtTime(12, now);
        compressor.attack.setValueAtTime(0.003, now);
        compressor.release.setValueAtTime(0.080, now);
        compressor.connect(masterGain);
        masterGain.connect(ctx.destination);

        const oscClick = ctx.createOscillator();
        const gainClick = ctx.createGain();
        oscClick.type = 'sine';
        oscClick.frequency.setValueAtTime(4500, now);
        oscClick.frequency.exponentialRampToValueAtTime(2200, now + 0.060);
        gainClick.gain.setValueAtTime(0.00001, now);
        gainClick.gain.exponentialRampToValueAtTime(0.45 * vol, now + 0.0005);
        gainClick.gain.exponentialRampToValueAtTime(0.00001, now + 0.080);
        oscClick.connect(gainClick);
        gainClick.connect(compressor);

        const oscRing = ctx.createOscillator();
        const gainRing = ctx.createGain();
        const ringMod = ctx.createOscillator();
        const gainRingMod = ctx.createGain();
        oscRing.type = 'triangle';
        oscRing.frequency.setValueAtTime(820, now);
        oscRing.frequency.exponentialRampToValueAtTime(650, now + 0.150);
        ringMod.type = 'sine';
        ringMod.frequency.setValueAtTime(45, now);
        gainRingMod.gain.setValueAtTime(0.3, now);
        gainRing.gain.setValueAtTime(0.00001, now);
        gainRing.gain.exponentialRampToValueAtTime(0.18 * vol, now + 0.002);
        gainRing.gain.exponentialRampToValueAtTime(0.00001, now + 0.200);
        ringMod.connect(gainRingMod);
        gainRingMod.connect(gainRing.gain);
        oscRing.connect(gainRing);
        gainRing.connect(compressor);

        const oscBody = ctx.createOscillator();
        const gainBody = ctx.createGain();
        oscBody.type = 'sine';
        oscBody.frequency.setValueAtTime(110, now);
        oscBody.frequency.exponentialRampToValueAtTime(95, now + 0.300);
        gainBody.gain.setValueAtTime(0.00001, now);
        gainBody.gain.exponentialRampToValueAtTime(0.22 * vol, now + 0.005);
        gainBody.gain.exponentialRampToValueAtTime(0.00001, now + 0.320);
        oscBody.connect(gainBody);
        gainBody.connect(compressor);

        const bufferSize = Math.floor(ctx.sampleRate * 0.050);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = ((Math.random() * 2 - 1) + (Math.random() * 2 - 1)) * 0.25;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(6200, now);
        noiseFilter.Q.value = 2.5;
        const gainNoise = ctx.createGain();
        gainNoise.gain.setValueAtTime(0.00001, now);
        gainNoise.gain.exponentialRampToValueAtTime(0.12 * vol, now + 0.0005);
        gainNoise.gain.exponentialRampToValueAtTime(0.00001, now + 0.040);
        noise.connect(noiseFilter);
        noiseFilter.connect(gainNoise);
        gainNoise.connect(compressor);

        const oscHarm = ctx.createOscillator();
        const gainHarm = ctx.createGain();
        oscHarm.type = 'sine';
        oscHarm.frequency.setValueAtTime(9000, now);
        oscHarm.frequency.exponentialRampToValueAtTime(7000, now + 0.030);
        gainHarm.gain.setValueAtTime(0.00001, now);
        gainHarm.gain.exponentialRampToValueAtTime(0.08 * vol, now + 0.001);
        gainHarm.gain.exponentialRampToValueAtTime(0.00001, now + 0.050);
        oscHarm.connect(gainHarm);
        gainHarm.connect(compressor);

        oscClick.start(now);
        oscClick.stop(now + 0.100);
        oscRing.start(now);
        oscRing.stop(now + 0.220);
        ringMod.start(now);
        ringMod.stop(now + 0.220);
        oscBody.start(now);
        oscBody.stop(now + 0.350);
        noise.start(now);
        noise.stop(now + 0.050);
        oscHarm.start(now);
        oscHarm.stop(now + 0.060);

        masterGain.gain.setValueAtTime(1.0, now);
        masterGain.gain.setValueAtTime(1.0, now + 0.350);
        masterGain.gain.linearRampToValueAtTime(0.00001, now + 0.400);
    }

    ensureAudio() {
        return;
    }

    isSoundLoaded(type) {
        return !!this.audioBuffers[type];
    }

    getSoundLoadProgress() {
        if (this.soundsTotalCount === 0) return 1;
        return this.soundsLoadedCount / this.soundsTotalCount;
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

    triggerScoreBadgeFlash() {
        if (!this.scoreBadge) return;
        
        this.scoreBadge.classList.add('ultra-pop');
        setTimeout(() => this.scoreBadge.classList.remove('ultra-pop'), 600);
        
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
        toast.innerHTML = '<span style="font-size:1.6rem; line-height:1">' + icon + '</span> ' + message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.4s ease-in forwards';
            setTimeout(() => toast.remove(), 400);
        }, duration);
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

📁 AHORA app.js — CAMBIO EN startTimer()

Solo necesitas cambiar una sección en tu app.js actual. Busca:

```javascript
if (state.timer <= 0) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    if (timerDisplay) timerDisplay.classList.remove('warning');
    showFeedback(`¡Tiempo agotado! ${state.questions[state.currentQuestion].explanation}`, 'incorrect');
    handleIncorrectAnswer(state.questions[state.currentQuestion]);
}
```

Y reemplázala por:

```javascript
if (state.timer <= 0) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    if (timerDisplay) timerDisplay.classList.remove('warning');
    
    // Respaldo iPhone: reproducir incorrect directamente
    if (window.effectsManager) {
        window.effectsManager.playIncorrectFallback();
    }
    
    showFeedback(`¡Tiempo agotado! ${state.questions[state.currentQuestion].explanation}`, 'incorrect');
    handleIncorrectAnswer(state.questions[state.currentQuestion]);
}

/**
 * ============================================================
 * ContiEffectsManager v5.3.0 — Producción
 * Efectos visuales (Canvas 2D) + Sonidos (pistas MP3 + síntesis) + Toasts
 * Para "ContiChallenge: Desafío Contable y Financiero"
 * ============================================================
 *
 * Novedades v5.3.0 sobre v5.2.1:
 *   - FIX iOS: AudioContext global unificado para playTick(). Ya no se
 *     crea un nuevo contexto por cada tick. Se inicializa una sola vez
 *     durante el primer gesto del usuario (clic en "Iniciar Experiencia"
 *     o primera respuesta). Esto resuelve el bloqueo de audio en
 *     Safari/iOS donde Web Audio API requiere interacción del usuario.
 *   - FIX iOS: El sonido 'incorrect' al acabarse el tiempo ahora funciona
 *     correctamente porque el sistema de audio ya está inicializado.
 *   - NUEVO: Método initGlobalAudio() para inicializar el AudioContext
 *     global de forma segura y compatible con iOS.
 *
 * Novedades v5.2.1 sobre v5.2:
 *   - FIX: Barra de progreso del splash inicializada en 0%.
 *
 * Novedades v5.2 sobre v5.1:
 *   - MEJORA: playTick() rediseñado con 5 capas de síntesis.
 *
 * Estructura de archivos requerida:
 *   /sounds/splash.mp3, correct.mp3, incorrect.mp3, levelup.mp3,
 *   levelstart.mp3, achievement.mp3, powerup.mp3, coin.mp3, explosion.mp3
 *
 * Nota: tick se genera por síntesis en playTick(). No requiere archivo.
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

        // Score badge
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

        // Sistema de audio con pistas MP3
        this.soundFiles = {
            splash:      'sounds/splash.mp3',
            correct:     'sounds/correct.mp3',
            incorrect:   'sounds/incorrect.mp3',
            levelup:     'sounds/levelup.mp3',
            levelstart:  'sounds/levelstart.mp3',
            achievement: 'sounds/achievement.mp3',
            powerup:     'sounds/powerup.mp3',
            coin:        'sounds/coin.mp3',
            explosion:   'sounds/explosion.mp3',
        };

        // Pool de elementos <audio> reutilizables
        this.audioPool = [];
        this.maxAudioPool = 8;
        this.audioPoolIndex = 0;

        // Buffers precargados
        this.audioBuffers = {};
        this.audioLoaded = false;
        this.audioLoadError = false;
        this.soundsLoadedCount = 0;
        this.soundsTotalCount = Object.keys(this.soundFiles).length;

        // AudioContext global para síntesis (tick) - Se crea una sola vez
        this.audioCtx = null;
        this.audioCtxReady = false;

        // Paletas de colores
        this.colors = {
            coin:     ['#FFD700', '#FFA500', '#FFC107', '#FFB300', '#F59E0B', '#FFF8DC'],
            confetti: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF', '#FF8A5C', '#3B82F6', '#F472B6', '#84CC16', '#F97316'],
            firework: ['#FF4500', '#FFD700', '#FF6347', '#FFA500', '#FFFFFF', '#FF1493', '#00FF88'],
            magic:    ['#A78BFA', '#818CF8', '#C4B5FD', '#6366F1', '#DDD6FE'],
        };

        // Exponer al scope global
        window.effectsManager = this;

        // Arrancar loop de animación
        this.startLoop();

        // Precargar sonidos
        this._preloadSounds();

        console.log('🎨 ContiEffectsManager v5.3.0 listo | Partículas máx:', this.maxParticles, '| Volumen:', this.masterVolume, '| Audio: MP3 + Síntesis tick 5-capas + AudioContext global');
    }

    // ================================================================
    //  CANVAS — Gestión del lienzo
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
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.rotation += p.rotationSpeed;
            p.life -= p.decay;

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

        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }

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
            if (i === 0) {
                ctx.moveTo(sx, sy);
            } else {
                ctx.lineTo(sx, sy);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    // ================================================================
    //  SISTEMA DE AUDIO CON PISTAS MP3
    // ================================================================

    _preloadSounds(onProgress) {
        const loaderFill = document.getElementById('loader-fill');
        if (loaderFill) {
            loaderFill.style.width = '0%';
            loaderFill.style.animation = 'none';
        }
        
        for (let i = 0; i < this.maxAudioPool; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = this.masterVolume;
            this.audioPool.push(audio);
        }

        for (const [key, path] of Object.entries(this.soundFiles)) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = path;
            audio.volume = this.masterVolume;

            audio.addEventListener('canplaythrough', () => {
                this.soundsLoadedCount++;
                this.audioBuffers[key] = audio;
                
                if (loaderFill) {
                    const progress = (this.soundsLoadedCount / this.soundsTotalCount) * 100;
                    loaderFill.style.width = progress + '%';
                }
                
                if (onProgress) {
                    onProgress(this.soundsLoadedCount, this.soundsTotalCount);
                }

                if (this.soundsLoadedCount === this.soundsTotalCount) {
                    this.audioLoaded = true;
                    console.log('🔊 Todos los sonidos MP3 precargados correctamente (' + this.soundsTotalCount + ' archivos).');
                    this._showSplashButton();
                }
            }, { once: true });

            audio.addEventListener('error', (err) => {
                this.soundsLoadedCount++;
                console.warn('⚠️ No se pudo cargar el sonido: ' + path + '. El juego continuará sin este sonido.');
                
                if (loaderFill) {
                    const progress = (this.soundsLoadedCount / this.soundsTotalCount) * 100;
                    loaderFill.style.width = progress + '%';
                }
                
                if (onProgress) {
                    onProgress(this.soundsLoadedCount, this.soundsTotalCount);
                }

                if (this.soundsLoadedCount === this.soundsTotalCount && !this.audioLoaded) {
                    this.audioLoadError = true;
                    console.warn('🔇 Algunos sonidos no se cargaron. La app funcionará sin audio.');
                    this._showSplashButton();
                }
            });

            audio.load();
        }
    }

    /**
     * Muestra el botón "Iniciar Experiencia" en el splash screen.
     * Al hacer clic: inicializa AudioContext global + reproduce splash.mp3
     * + oculta el splash. Esto desbloquea todo el audio en iOS/Safari.
     */
    _showSplashButton() {
        const loaderFill = document.getElementById('loader-fill');
        const skipBtn = document.getElementById('skip-splash-btn');
        const splashScreen = document.getElementById('splash-screen');
        
        if (loaderFill) {
            loaderFill.style.width = '100%';
        }
        
        if (skipBtn) {
            skipBtn.style.display = 'block';
            skipBtn.addEventListener('click', () => {
                // Inicializar AudioContext global (necesario para tick en iOS)
                this.initGlobalAudio();
                // Reproducir splash (gesto del usuario desbloquea audio en iOS)
                this.playSound('splash');
                // Ocultar splash screen
                if (splashScreen) {
                    splashScreen.classList.add('hidden');
                }
            }, { once: true });
        }
    }

    /**
     * Inicializa un AudioContext global para síntesis de audio (tick).
     * Se llama una sola vez durante el primer gesto del usuario.
     * En iOS, esto es obligatorio para que Web Audio API funcione.
     */
    initGlobalAudio() {
        if (this.audioCtxReady) return;
        
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('Web Audio API no disponible en este navegador.');
            return;
        }
        
        try {
            this.audioCtx = new AudioCtx();
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().then(() => {
                    this.audioCtxReady = true;
                    console.log('🔊 AudioContext global inicializado correctamente.');
                }).catch(err => {
                    console.warn('No se pudo reanudar AudioContext:', err);
                });
            } else {
                this.audioCtxReady = true;
                console.log('🔊 AudioContext global inicializado correctamente.');
            }
        } catch (e) {
            console.warn('Error al crear AudioContext:', e);
        }
    }

    playSound(type) {
        if (!this.audioLoaded && !this.audioLoadError) return;
        if (!this.soundFiles[type]) {
            console.warn('Tipo de sonido no reconocido:', type);
            return;
        }

        const sourceAudio = this.audioBuffers[type];
        if (!sourceAudio) return;

        const poolAudio = this.audioPool[this.audioPoolIndex];
        this.audioPoolIndex = (this.audioPoolIndex + 1) % this.maxAudioPool;

        poolAudio.src = this.soundFiles[type];
        poolAudio.volume = this.masterVolume;

        const playPromise = poolAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.debug('🔇 Reproducción de audio bloqueada:', type, '-', err.message);
            });
        }
    }

    /**
     * MEJORADO v5.3: Genera un sonido de tick de reloj mecánico sintetizado.
     * Usa el AudioContext global (creado en el primer gesto del usuario)
     * para evitar bloqueos en iOS/Safari.
     */
    playTick() {
        if (!this.audioCtxReady || !this.audioCtx) {
            return;
        }
        
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
            return;
        }
        
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const vol = this.masterVolume;
        const masterGain = ctx.createGain();
        masterGain.gain.value = 1.0;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, now);
        compressor.knee.setValueAtTime(6, now);
        compressor.ratio.setValueAtTime(12, now);
        compressor.attack.setValueAtTime(0.003, now);
        compressor.release.setValueAtTime(0.080, now);
        compressor.connect(masterGain);
        masterGain.connect(ctx.destination);

        const oscClick = ctx.createOscillator();
        const gainClick = ctx.createGain();
        oscClick.type = 'sine';
        oscClick.frequency.setValueAtTime(4500, now);
        oscClick.frequency.exponentialRampToValueAtTime(2200, now + 0.060);
        gainClick.gain.setValueAtTime(0.00001, now);
        gainClick.gain.exponentialRampToValueAtTime(0.45 * vol, now + 0.0005);
        gainClick.gain.exponentialRampToValueAtTime(0.00001, now + 0.080);
        oscClick.connect(gainClick);
        gainClick.connect(compressor);

        const oscRing = ctx.createOscillator();
        const gainRing = ctx.createGain();
        const ringMod = ctx.createOscillator();
        const gainRingMod = ctx.createGain();
        oscRing.type = 'triangle';
        oscRing.frequency.setValueAtTime(820, now);
        oscRing.frequency.exponentialRampToValueAtTime(650, now + 0.150);
        ringMod.type = 'sine';
        ringMod.frequency.setValueAtTime(45, now);
        gainRingMod.gain.setValueAtTime(0.3, now);
        gainRing.gain.setValueAtTime(0.00001, now);
        gainRing.gain.exponentialRampToValueAtTime(0.18 * vol, now + 0.002);
        gainRing.gain.exponentialRampToValueAtTime(0.00001, now + 0.200);
        ringMod.connect(gainRingMod);
        gainRingMod.connect(gainRing.gain);
        oscRing.connect(gainRing);
        gainRing.connect(compressor);

        const oscBody = ctx.createOscillator();
        const gainBody = ctx.createGain();
        oscBody.type = 'sine';
        oscBody.frequency.setValueAtTime(110, now);
        oscBody.frequency.exponentialRampToValueAtTime(95, now + 0.300);
        gainBody.gain.setValueAtTime(0.00001, now);
        gainBody.gain.exponentialRampToValueAtTime(0.22 * vol, now + 0.005);
        gainBody.gain.exponentialRampToValueAtTime(0.00001, now + 0.320);
        oscBody.connect(gainBody);
        gainBody.connect(compressor);

        const bufferSize = Math.floor(ctx.sampleRate * 0.050);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = ((Math.random() * 2 - 1) + (Math.random() * 2 - 1)) * 0.25;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(6200, now);
        noiseFilter.Q.value = 2.5;
        const gainNoise = ctx.createGain();
        gainNoise.gain.setValueAtTime(0.00001, now);
        gainNoise.gain.exponentialRampToValueAtTime(0.12 * vol, now + 0.0005);
        gainNoise.gain.exponentialRampToValueAtTime(0.00001, now + 0.040);
        noise.connect(noiseFilter);
        noiseFilter.connect(gainNoise);
        gainNoise.connect(compressor);

        const oscHarm = ctx.createOscillator();
        const gainHarm = ctx.createGain();
        oscHarm.type = 'sine';
        oscHarm.frequency.setValueAtTime(9000, now);
        oscHarm.frequency.exponentialRampToValueAtTime(7000, now + 0.030);
        gainHarm.gain.setValueAtTime(0.00001, now);
        gainHarm.gain.exponentialRampToValueAtTime(0.08 * vol, now + 0.001);
        gainHarm.gain.exponentialRampToValueAtTime(0.00001, now + 0.050);
        oscHarm.connect(gainHarm);
        gainHarm.connect(compressor);

        oscClick.start(now);
        oscClick.stop(now + 0.100);
        oscRing.start(now);
        oscRing.stop(now + 0.220);
        ringMod.start(now);
        ringMod.stop(now + 0.220);
        oscBody.start(now);
        oscBody.stop(now + 0.350);
        noise.start(now);
        noise.stop(now + 0.050);
        oscHarm.start(now);
        oscHarm.stop(now + 0.060);

        masterGain.gain.setValueAtTime(1.0, now);
        masterGain.gain.setValueAtTime(1.0, now + 0.350);
        masterGain.gain.linearRampToValueAtTime(0.00001, now + 0.400);
    }

    ensureAudio() {
        return;
    }

    isSoundLoaded(type) {
        return !!this.audioBuffers[type];
    }

    getSoundLoadProgress() {
        if (this.soundsTotalCount === 0) return 1;
        return this.soundsLoadedCount / this.soundsTotalCount;
    }

    // ================================================================
    //  API PÚBLICA — EFECTOS VISUALES
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

    triggerScoreBadgeFlash() {
        if (!this.scoreBadge) return;
        
        this.scoreBadge.classList.add('ultra-pop');
        setTimeout(() => this.scoreBadge.classList.remove('ultra-pop'), 600);
        
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
    //  API PÚBLICA — SISTEMA DE TOASTS
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
        toast.innerHTML = '<span style="font-size:1.6rem; line-height:1">' + icon + '</span> ' + message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.4s ease-in forwards';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // ================================================================
    //  CONVENIENCIA — Integración con app.js
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
//  INICIALIZACIÓN AUTOMÁTICA
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

