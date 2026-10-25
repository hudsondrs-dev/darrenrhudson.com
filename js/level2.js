/* Implementation Quest / Level 02. Independent of the Level 01 physics. */
(() => {
    'use strict';
    const firstLevel = document.querySelector('#questGame')?.closest('.quest-shell');
    if (!firstLevel) return;
    const shell = document.createElement('section');
    shell.id = 'questLevel2';
    shell.className = 'quest-shell launch-shell';
    shell.setAttribute('aria-label', 'Implementation Quest Level 2: Defend the Launch');
    shell.innerHTML = `
      <div class="quest-header"><div><span>THE IMPLEMENTATION QUEST</span><strong>LEVEL 02 / DEFEND THE LAUNCH</strong></div>
      <div class="quest-status"><span>LAUNCH HEALTH</span><strong data-health>100%</strong></div></div>
      <div class="launch-stage">
        <canvas tabindex="0" aria-label="Defend the Launch playfield" aria-describedby="launchInstructions">Use arrows or A/D to move and Space to shoot.</canvas>
        <div class="launch-panel"><span class="launch-kicker">MISSION 02 • LAUNCH DEFENSE</span><h3>KEEP THE<br>LAUNCH ALIVE.</h3>
          <p>Clear three waves of defects, blockers, and change requests before they reach production.</p><button type="button" data-start>START LEVEL 2</button><button type="button" data-restart-quest hidden>RESTART FROM LEVEL 1</button></div>
      </div>
      <div class="launch-toolbar"><p data-status role="status" aria-live="polite">Ready for launch defense.</p><button type="button" data-pause disabled>PAUSE</button></div>
      <div class="launch-touch" aria-label="Level 2 controls"><button type="button" data-control="left" aria-label="Move left">← LEFT</button><button type="button" data-control="fire">FIRE</button><button type="button" data-control="right" aria-label="Move right">RIGHT →</button></div>
      <p id="launchInstructions" class="quest-hint">Move: ← → or A/D · Hold Space to fire · P or Escape to pause. Touch: hold the buttons above.</p>
      <p class="launch-legend">◆ DEFECT / 1 hit &nbsp; ■ BLOCKER / 3 hits &nbsp; ◇ CHANGE REQUEST / 2 hits, then two small tasks. Each escaped item costs 10% launch health.</p>`;
    firstLevel.after(shell);
    const canvas = shell.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { shell.remove(); return; }
    const panel = shell.querySelector('.launch-panel');
    const title = panel.querySelector('h3');
    const description = panel.querySelector('p');
    const startButton = shell.querySelector('[data-start]');
    const restartQuestButton = shell.querySelector('[data-restart-quest]');
    const pauseButton = shell.querySelector('[data-pause]');
    const status = shell.querySelector('[data-status]');
    const healthLabel = shell.querySelector('[data-health]');
    const inputs = { left: new Set(), right: new Set(), fire: new Set() };
    let width = 720, height = 420, mode = 'ready', frame = 0, last = 0;
    let playerX = 360, health = 100, wave = 0, cleared = 0, cooldown = 0;
    let enemies = [], shots = [], direction = 1, waveDelay = 0;
    const types = {
        defect: { hp: 1, color: '#ff8d9b', label: 'BUG' },
        blocker: { hp: 3, color: '#ffc779', label: 'BLOCK' },
        change: { hp: 2, color: '#b8a1ff', label: 'CR' },
        task: { hp: 1, color: '#d3c5ff', label: 'TASK' }
    };
    function release() { Object.values(inputs).forEach(keys => keys.clear()); }
    function announce(text) { status.textContent = text; }
    function resize() {
        const oldWidth = width;
        width = canvas.clientWidth < 550 ? 400 : 720;
        height = width === 400 ? 500 : 420;
        playerX = Math.max(20, Math.min(width - 20, playerX * width / oldWidth));
        enemies.forEach(e => { e.x *= width / oldWidth; });
        shots.forEach(s => { s.x *= width / oldWidth; });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * ratio; canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        if (mode === 'running') pause();
        draw();
    }
    function nextWave() {
        wave++; direction = 1; waveDelay = 0; shots = [];
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < 4; column++) {
                const type = ['defect', 'change', 'blocker'][(row + wave - 1) % 3];
                enemies.push({ x: width * .2 + column * width * .17, y: 60 + row * 57, type, hp: types[type].hp });
            }
        }
        announce(`Wave ${wave} of 3 · Clear the incoming work.`);
    }
    function showPanel(heading, text, button) {
        title.textContent = heading; description.textContent = text;
        startButton.textContent = button; panel.hidden = false;
        restartQuestButton.hidden = mode !== 'won' && mode !== 'lost';
        startButton.focus({ preventScroll: true });
    }
    function start() {
        const resuming = mode === 'paused';
        if (mode !== 'paused') {
            health = 100; wave = 0; cleared = 0; enemies = []; shots = [];
            playerX = width / 2; cooldown = 0; healthLabel.textContent = '100%'; nextWave();
        }
        release(); mode = 'running'; last = 0; panel.hidden = true;
        pauseButton.disabled = false; pauseButton.textContent = 'PAUSE';
        if (resuming) announce(`Wave ${wave} of 3 · Launch defense resumed.`);
        canvas.focus({ preventScroll: true });
        cancelAnimationFrame(frame); frame = requestAnimationFrame(loop);
    }
    function pause() {
        if (mode !== 'running') return;
        mode = 'paused'; release(); cancelAnimationFrame(frame);
        pauseButton.textContent = 'RESUME';
        announce(`Paused · Wave ${wave} of 3.`);
        showPanel('LAUNCH ON HOLD.', 'Your progress is saved for this round. Ready when you are.', 'RESUME LEVEL 2');
    }
    function finish(won) {
        mode = won ? 'won' : 'lost'; release(); pauseButton.disabled = true;
        announce(won ? `Launch secured! ${cleared} items resolved.` : 'Launch health depleted. Try again.');
        showPanel(won ? 'LAUNCH SECURED.' : 'REGROUP. RELAUNCH.', won
            ? `Three waves cleared. ${cleared} items resolved. Production protected with ${health}% launch health.`
            : 'Too much work reached production. Focus on the lowest items and keep firing.', 'PLAY LEVEL 2 AGAIN');
    }
    function update(dt) {
        playerX = Math.max(20, Math.min(width - 20, playerX + ((inputs.right.size > 0) - (inputs.left.size > 0)) * 290 * dt));
        cooldown -= dt;
        if (inputs.fire.size && cooldown <= 0) { shots.push({ x: playerX, y: height - 53 }); cooldown = .16; }
        shots.forEach(s => { s.y -= 540 * dt; });
        const speed = 20 + wave * 10;
        let bounce = false;
        enemies.forEach(e => { e.x += direction * speed * dt; e.y += (2 + wave) * dt; if (e.x < 23 || e.x > width - 23) bounce = true; });
        if (bounce) {
            direction *= -1;
            enemies.forEach(e => { e.x = Math.max(23, Math.min(width - 23, e.x)); e.y += 15; });
        }
        const tasks = [];
        for (const shot of shots) {
            const hit = enemies.find(e => e.hp > 0 && Math.abs(shot.x - e.x) < 23 && Math.abs(shot.y - e.y) < 24);
            if (!hit) continue;
            shot.y = -100; hit.hp--;
            if (hit.hp === 0) {
                cleared++;
                if (hit.type === 'change') [-12, 12].forEach(offset => tasks.push({ x: hit.x + offset, y: hit.y + 12, type: 'task', hp: 1 }));
            }
        }
        enemies = enemies.filter(e => {
            if (e.hp <= 0) return false;
            if (e.y >= height - 68) { health = Math.max(0, health - 10); healthLabel.textContent = `${health}%`; announce(`Production hit. Launch health ${health}%.`); return false; }
            return true;
        }).concat(tasks);
        shots = shots.filter(s => s.y > -10);
        if (health <= 0) { finish(false); return; }
        if (!enemies.length) {
            if (!waveDelay) announce(wave === 3 ? 'Final checks complete.' : `Wave ${wave} cleared. Next wave incoming.`);
            waveDelay += dt;
            if (waveDelay > 1.3) { if (wave === 3) finish(true); else nextWave(); }
        }
    }
    function draw() {
        ctx.fillStyle = '#090d15'; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#122330'; ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
        ctx.font = '11px monospace'; ctx.fillStyle = '#8da9bc'; ctx.textAlign = 'left';
        ctx.fillText(`WAVE ${wave || 1} / 3`, 18, 24); ctx.textAlign = 'right'; ctx.fillText(`RESOLVED ${cleared}`, width - 18, 24);
        ctx.strokeStyle = '#58d6ff'; ctx.beginPath(); ctx.moveTo(0, height - 64); ctx.lineTo(width, height - 64); ctx.stroke();
        ctx.fillStyle = '#58d6ff'; ctx.textAlign = 'left'; ctx.fillText('PRODUCTION', 12, height - 8);
        ctx.fillStyle = '#58d6ff'; ctx.beginPath(); ctx.moveTo(playerX, height - 55); ctx.lineTo(playerX + 17, height - 25); ctx.lineTo(playerX, height - 32); ctx.lineTo(playerX - 17, height - 25); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#edfbff'; shots.forEach(s => ctx.fillRect(s.x - 2, s.y - 10, 4, 14));
        enemies.forEach(e => {
            const type = types[e.type]; ctx.fillStyle = '#101a29'; ctx.strokeStyle = type.color; ctx.lineWidth = 2;
            ctx.beginPath();
            if (e.type === 'blocker') ctx.rect(e.x - 20, e.y - 18, 40, 36);
            else { ctx.moveTo(e.x, e.y - 22); ctx.lineTo(e.x + 23, e.y); ctx.lineTo(e.x, e.y + 22); ctx.lineTo(e.x - 23, e.y); ctx.closePath(); }
            ctx.fill(); ctx.stroke(); ctx.fillStyle = type.color; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText(type.label, e.x, e.y + 3);
            for (let i = 0; i < e.hp; i++) ctx.fillRect(e.x - e.hp * 4 + i * 8, e.y + 26, 5, 3);
        });
    }
    function loop(timestamp) {
        if (mode !== 'running') return;
        const dt = last ? Math.min((timestamp - last) / 1000, .035) : 0;
        last = timestamp; update(dt); draw();
        if (mode === 'running') frame = requestAnimationFrame(loop);
    }
    function action(key) { return ({ ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ' ': 'fire' })[key]; }
    canvas.addEventListener('keydown', event => {
        const control = action(event.key);
        if (control) { event.preventDefault(); if (mode === 'running') inputs[control].add(event.code); }
        if (['p', 'P', 'Escape'].includes(event.key)) { event.preventDefault(); pause(); }
    });
    window.addEventListener('keyup', event => { const control = action(event.key); if (control) inputs[control].delete(event.code); });
    shell.querySelectorAll('[data-control]').forEach(button => {
        const input = inputs[button.dataset.control];
        button.addEventListener('pointerdown', event => {
            if (mode !== 'running') return;
            event.preventDefault(); canvas.focus({ preventScroll: true });
            button.setPointerCapture(event.pointerId); input.add(event.pointerId);
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, event => input.delete(event.pointerId)));
        button.addEventListener('keydown', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (mode === 'running') input.add('button'); } });
        button.addEventListener('keyup', () => input.delete('button'));
        button.addEventListener('blur', () => input.delete('button'));
    });
    shell.addEventListener('focusout', event => { if (!shell.contains(event.relatedTarget)) pause(); });
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); }).observe(canvas);
    startButton.addEventListener('click', start);
    restartQuestButton.addEventListener('click', () => {
        cancelAnimationFrame(frame);
        release(); mode = 'ready'; last = 0;
        health = 100; wave = 0; cleared = 0; cooldown = 0; waveDelay = 0;
        enemies = []; shots = []; direction = 1; playerX = width / 2;
        healthLabel.textContent = '100%';
        pauseButton.disabled = true; pauseButton.textContent = 'PAUSE';
        title.innerHTML = 'KEEP THE<br>LAUNCH ALIVE.';
        description.textContent = 'Clear three waves of defects, blockers, and change requests before they reach production.';
        startButton.textContent = 'START LEVEL 2';
        restartQuestButton.hidden = true; panel.hidden = false;
        announce('Ready for launch defense.');
        draw();
        firstLevel.scrollIntoView({ block: 'start' });
        // Reuse Level 1's reset/start flow, including collectibles and celebration cleanup.
        document.getElementById('questRestartButton').click();
    });
    pauseButton.addEventListener('click', () => mode === 'paused' ? start() : pause());
    const next = document.createElement('button');
    next.type = 'button'; next.className = 'launch-next'; next.textContent = 'CONTINUE TO LEVEL 2 →';
    next.addEventListener('click', () => { shell.scrollIntoView({ block: 'start' }); startButton.focus({ preventScroll: true }); });
    document.getElementById('questComplete')?.append(next);
    new ResizeObserver(resize).observe(canvas);
    resize();
})();
