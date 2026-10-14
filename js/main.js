// Mobile navigation retains ordinary links when JavaScript is unavailable.
(() => {
    const toggle = document.querySelector('.menu-toggle');
    const navigation = document.getElementById('site-navigation');
    toggle.hidden = false;
    document.documentElement.classList.add('navigation-ready');
    function closeMenu(returnFocus = false) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'MENU';
        if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'CLOSE' : 'MENU';
    });
    navigation.addEventListener('click', event => {
        if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.site-header')) closeMenu();
    });
    document.querySelector('.site-header').addEventListener('focusout', event => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
    });
    matchMedia('(max-width: 650px)').addEventListener('change', () => closeMenu());
})();

/* =========================================================
   THE IMPLEMENTATION QUEST — GAME v0.1
   ========================================================= */

(() => {

    const game = document.getElementById("questGame");

    if (!game) {
        return;
    }


    /* -----------------------------------------------------
       ELEMENTS
       ----------------------------------------------------- */

    const player = document.getElementById("questPlayer");

    const startPanel =
        document.getElementById("questStart");

    const completePanel =
        document.getElementById("questComplete");

    const startButton =
        document.getElementById("questStartButton");

    const restartButton =
        document.getElementById("questRestartButton");

    const scoreDisplay =
        document.getElementById("questScore");

    const items =
        Array.from(
            game.querySelectorAll(".quest-item")
        );

    const obstacles =
        Array.from(
            game.querySelectorAll(".quest-obstacle")
        );

    const platforms =
        Array.from(
            game.querySelectorAll(".quest-platform")
        );


    /* -----------------------------------------------------
       TOUCH CONTROLS
       ----------------------------------------------------- */

    const shell =
        game.closest(".quest-shell");

    const touchControls =
        document.createElement("div");

    touchControls.className =
        "quest-touch-controls";

    touchControls.innerHTML = `
        <button
            type="button"
            data-control="left"
            aria-label="Move left"
        >
            ← LEFT
        </button>

        <button
            type="button"
            data-control="jump"
            aria-label="Jump"
        >
            ↑ JUMP
        </button>

        <button
            type="button"
            data-control="right"
            aria-label="Move right"
        >
            RIGHT →
        </button>
    `;

    game.insertAdjacentElement("afterend", touchControls);


    /* -----------------------------------------------------
       TOAST
       ----------------------------------------------------- */

    const toast =
        document.createElement("div");

    toast.className =
        "quest-toast";

    toast.setAttribute(
        "aria-live",
        "polite"
    );

    game.appendChild(toast);

    /* -----------------------------------------------------
   PROJECT MILESTONE
   ----------------------------------------------------- */

const milestone =
    document.createElement("div");

milestone.className =
    "quest-milestone";

milestone.innerHTML = `
    <span>PROJECT STATUS</span>
    <strong>AWAITING REQUIREMENTS</strong>
`;

game.appendChild(milestone);


function setMilestone(message) {

    const status =
        milestone.querySelector("strong");

    status.textContent =
        message;

}

    let toastTimer = null;

    function showToast(message) {

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {

            toast.classList.remove("show");

        }, 1100);

    }

    /* -----------------------------------------------------
   PICKUP EFFECT
   ----------------------------------------------------- */

function spawnPickupEffect(
    item,
    label
) {

    const rect =
        elementRectInGame(item);

    const burst =
        document.createElement("div");

    burst.className =
        "quest-burst";

    burst.textContent =
        `+ ${label}`;

    burst.style.left =
        `${
            rect.left +
            rect.width / 2
        }px`;

    burst.style.top =
        `${
            rect.top +
            rect.height / 2
        }px`;

    game.appendChild(burst);


    burst.addEventListener(
        "animationend",
        () => {

            burst.remove();

        },
        {
            once: true
        }
    );

}

/* -----------------------------------------------------
   OBJECTIVE PROGRESSION
   ----------------------------------------------------- */

const scopeCreep =
    game.querySelector(".obstacle-one");

const blocker =
    game.querySelector(".obstacle-two");


function applyObjectiveProgress(id) {

    if (id === "requirements") {

        game.classList.add(
            "stage-requirements"
        );

        scopeCreep.classList.add(
            "resolved"
        );

        scopeCreep.innerHTML = `
            <span>SCOPE</span>
            <strong>LOCKED</strong>
        `;

        setMilestone(
            "SCOPE DEFINED"
        );

    }


    if (id === "integration") {

        game.classList.add(
            "stage-integration"
        );

        blocker.classList.add(
            "resolved"
        );

        blocker.innerHTML = `
            <span>BLOCKER</span>
            <strong>CLEARED</strong>
        `;

        setMilestone(
            "SYSTEMS CONNECTED"
        );

    }


    if (id === "golive") {

        setMilestone(
            "RELEASE READY"
        );

    }

}


    /* -----------------------------------------------------
       STATE
       ----------------------------------------------------- */

    const state = {

        running: false,

        completed: false,

        x: 28,

        y: 0,

        velocityX: 0,

        velocityY: 0,

        grounded: false,

        collected: new Set(),

        keys: {
            left: false,
            right: false
        },

        lastTime: 0,

        frame: null

    };


    /* -----------------------------------------------------
       PHYSICS
       ----------------------------------------------------- */

    const physics = {

    moveSpeed: 260,

    jumpStrength: 520,

    gravity: 1080,

    maxFallSpeed: 720

};


    /* -----------------------------------------------------
       HELPERS
       ----------------------------------------------------- */

    function gameDimensions() {

        return {
            width:
                game.clientWidth,

            height:
                game.clientHeight
        };

    }


    function playerDimensions() {

        return {
            width:
                player.offsetWidth,

            height:
                player.offsetHeight
        };

    }


    function groundTop() {

        const ground =
            game.querySelector(".quest-ground");

        return (
            game.clientHeight -
            ground.offsetHeight
        );

    }


    function elementRectInGame(element) {

        const gameRect =
            game.getBoundingClientRect();

        const rect =
            element.getBoundingClientRect();

        return {

            left:
                rect.left -
                gameRect.left,

            right:
                rect.right -
                gameRect.left,

            top:
                rect.top -
                gameRect.top,

            bottom:
                rect.bottom -
                gameRect.top,

            width:
                rect.width,

            height:
                rect.height

        };

    }


    function playerRectAt(
        x = state.x,
        y = state.y
    ) {

        const size =
            playerDimensions();

        return {

            left: x,

            right:
                x +
                size.width,

            top: y,

            bottom:
                y +
                size.height,

            width:
                size.width,

            height:
                size.height

        };

    }


    function intersects(a, b) {

        return !(
            a.right < b.left ||
            a.left > b.right ||
            a.bottom < b.top ||
            a.top > b.bottom
        );

    }


    /* -----------------------------------------------------
       RESET
       ----------------------------------------------------- */

function clearCelebrationArtifacts() {

    game.querySelectorAll(
        ".quest-live-label, .quest-launch-wave, .quest-confetti, .quest-burst"
    ).forEach(node => {

        node.remove();

    });

}

    function resetPlayer() {

        const playerSize =
            playerDimensions();

        state.x = 28;

        state.y =
            groundTop() -
            playerSize.height;

        state.velocityX = 0;
        state.velocityY = 0;

        state.grounded = true;

        renderPlayer();

    }


    function resetGame() {

        state.completed = false;
        state.keys.left = false;
        state.keys.right = false;
        clearTimeout(toastTimer);
        toast.classList.remove("show");

        state.collected.clear();

        clearCelebrationArtifacts();

        game.classList.remove(
    "stage-requirements",
    "stage-integration",
    "quest-live"
);

setMilestone(
    "AWAITING REQUIREMENTS"
);


scopeCreep.classList.remove(
    "resolved"
);

scopeCreep.innerHTML = `
    <span>SCOPE</span>
    <strong>CREEP</strong>
`;


blocker.classList.remove(
    "resolved"
);

blocker.innerHTML = `
    <span>BLOCKER</span>
`;


const groundLabel =
    game.querySelector(
        ".quest-ground span"
    );

groundLabel.textContent =
    "DELIVERY ENVIRONMENT";

        scoreDisplay.textContent =
            "0 / 3";

        items.forEach(item => {

            item.classList.remove(
                "collected"
            );

        });

        completePanel.hidden = true;

        resetPlayer();

    }


    /* -----------------------------------------------------
       PLAYER RENDER
       ----------------------------------------------------- */

    function renderPlayer() {

        player.style.left =
            `${state.x}px`;

        player.style.top =
            `${state.y}px`;

    }


    /* -----------------------------------------------------
       JUMP
       ----------------------------------------------------- */

    function jump() {

        if (
            !state.running ||
            state.completed ||
            !state.grounded
        ) {
            return;
        }

        state.velocityY =
            -physics.jumpStrength;

        state.grounded = false;

    }


/* -----------------------------------------------------
   COLLECTION
   ----------------------------------------------------- */

function checkCollectibles() {

    const playerRect =
        playerRectAt();

    items.forEach(item => {

        const id =
            item.dataset.item;

        if (
            state.collected.has(id)
        ) {
            return;
        }


        const itemRect =
            elementRectInGame(item);


        if (
            intersects(
                playerRect,
                itemRect
            )
        ) {

            const label =
                item
                    .querySelector("strong")
                    ?.textContent
                    ?.trim()
                || "OBJECTIVE";


            state.collected.add(id);


            applyObjectiveProgress(id);


            spawnPickupEffect(
                item,
                label
            );


            item.classList.add(
                "collected"
            );


            scoreDisplay.textContent =
                `${state.collected.size} / ${items.length}`;


            /* replay score animation */

            scoreDisplay.classList.remove(
                "score-pop"
            );

            void scoreDisplay.offsetWidth;

            scoreDisplay.classList.add(
                "score-pop"
            );


            showToast(
                `${label} ACQUIRED`
            );


            if (
                state.collected.size ===
                items.length
            ) {

                completeQuest();

            }

        }

    });

}


/* -----------------------------------------------------
   GO-LIVE CELEBRATION
   ----------------------------------------------------- */

function launchCelebration() {
    clearCelebrationArtifacts();
    game.classList.add('quest-live');
    setMilestone('PRODUCTION LIVE');
    game.querySelector('.quest-ground span').textContent = 'PRODUCTION ENVIRONMENT / LIVE';
}

    /* -----------------------------------------------------
       HAZARDS
       ----------------------------------------------------- */

    function checkHazards() {

        const playerRect =
            playerRectAt();

        for (
            const obstacle
            of obstacles
        ) {

            if (
    obstacle.classList.contains(
        "resolved"
    )
) {
    continue;
}

            const obstacleRect =
                elementRectInGame(
                    obstacle
                );

            if (
                intersects(
                    playerRect,
                    obstacleRect
                )
            ) {

                player.classList.remove(
                    "hit"
                );

                void player.offsetWidth;

                player.classList.add(
                    "hit"
                );

                showToast(
                    "BLOCKER DETECTED — REPLAN!"
                );

                resetPlayer();

                return;

            }

        }

    }


    /* -----------------------------------------------------
       PLATFORM COLLISION
       ----------------------------------------------------- */

    function findLandingSurface(
        previousBottom,
        nextBottom,
        playerRect
    ) {

        let landingY = null;

        platforms.forEach(platform => {

            const rect =
                elementRectInGame(
                    platform
                );

            const horizontalOverlap =
                playerRect.right >
                    rect.left + 4 &&
                playerRect.left <
                    rect.right - 4;

            const crossedTop =
                previousBottom <=
                    rect.top + 3 &&
                nextBottom >=
                    rect.top;

            if (
                horizontalOverlap &&
                crossedTop
            ) {

                if (
                    landingY === null ||
                    rect.top <
                    landingY
                ) {

                    landingY =
                        rect.top;

                }

            }

        });

        return landingY;

    }


    /* -----------------------------------------------------
       PHYSICS UPDATE
       ----------------------------------------------------- */

    function update(delta) {

        if (
            !state.running ||
            state.completed
        ) {
            return;
        }


        /* horizontal movement */

        let direction = 0;

        if (state.keys.left) {
            direction -= 1;
        }

        if (state.keys.right) {
            direction += 1;
        }

        if (direction < 0) {
    player.classList.add("facing-left");
}

if (direction > 0) {
    player.classList.remove("facing-left");
}

        state.velocityX =
            direction *
            physics.moveSpeed;

        player.classList.toggle(
            "running",
            direction !== 0
        );


        const dimensions =
            gameDimensions();

        const playerSize =
            playerDimensions();


        state.x +=
            state.velocityX *
            delta;

        state.x =
            Math.max(
                0,
                Math.min(
                    state.x,
                    dimensions.width -
                    playerSize.width
                )
            );


        /* gravity */

        state.velocityY +=
            physics.gravity *
            delta;

        state.velocityY =
            Math.min(
                state.velocityY,
                physics.maxFallSpeed
            );


        const previousY =
            state.y;

        const previousBottom =
            previousY +
            playerSize.height;

        let nextY =
            state.y +
            state.velocityY *
            delta;

        const nextBottom =
            nextY +
            playerSize.height;


        /* platform landing */

        state.grounded = false;

        if (
            state.velocityY >= 0
        ) {

            const testRect =
                playerRectAt(
                    state.x,
                    nextY
                );

            const landing =
                findLandingSurface(
                    previousBottom,
                    nextBottom,
                    testRect
                );

            if (
                landing !== null
            ) {

                nextY =
                    landing -
                    playerSize.height;

                state.velocityY = 0;

                state.grounded = true;

            }

        }


        /* ground landing */

        const floor =
            groundTop();

        if (
            nextY +
            playerSize.height >=
            floor
        ) {

            nextY =
                floor -
                playerSize.height;

            state.velocityY = 0;

            state.grounded = true;

        }


        state.y = nextY;


        /* world limits */

        if (state.y < 0) {

            state.y = 0;

            state.velocityY = 0;

        }

        player.classList.toggle(
    "jumping",
    !state.grounded
);

        renderPlayer();

        checkCollectibles();

        if (!state.completed) checkHazards();

    }


    /* -----------------------------------------------------
       GAME LOOP
       ----------------------------------------------------- */

    function loop(timestamp) {

        if (!state.running) {
            return;
        }

        if (!state.lastTime) {

            state.lastTime =
                timestamp;

        }

        const elapsed =
            Math.min(
                (
                    timestamp -
                    state.lastTime
                ) / 1000,
                0.035
            );

        state.lastTime =
            timestamp;

        update(elapsed);

        if (state.running) {
            state.frame = requestAnimationFrame(loop);
        }

    }


    /* -----------------------------------------------------
       START
       ----------------------------------------------------- */

    function startGame() {

        startPanel.hidden = true;

        completePanel.hidden = true;

        state.running = true;

        state.completed = false;

        state.lastTime = 0;

        resetGame();

        game.focus({ preventScroll: true });

        cancelAnimationFrame(
            state.frame
        );

        state.frame =
            requestAnimationFrame(
                loop
            );

        showToast(
            "QUEST STARTED"
        );

    }


    /* -----------------------------------------------------
       COMPLETE
       ----------------------------------------------------- */

function completeQuest() {

    if (state.completed) {
        return;
    }

    state.completed = true;
    state.running = false;

    state.velocityX = 0;
    state.keys.left = false;
    state.keys.right = false;

    player.classList.remove(
        "running",
        "jumping"
    );

    launchCelebration();

    showToast("ALL SYSTEMS GO");

    setTimeout(() => {
        completePanel.hidden = false;
        restartButton.focus({ preventScroll: true });
    }, 1250);
}

    /* -----------------------------------------------------
       KEYBOARD
       ----------------------------------------------------- */

    function isEditableTarget(target) {

        return (
            target instanceof
                HTMLInputElement ||
            target instanceof
                HTMLTextAreaElement ||
            target instanceof
                HTMLSelectElement ||
            target.isContentEditable
        );

    }


    game.addEventListener(
        "keydown",
        event => {

            if (event.target.closest("button")) return;

            if (
                isEditableTarget(
                    event.target
                )
            ) {
                return;
            }

            const key =
                event.key.toLowerCase();


            if (
                key === "arrowleft" ||
                key === "a"
            ) {

                event.preventDefault();

                state.keys.left = true;

            }


            if (
                key === "arrowright" ||
                key === "d"
            ) {

                event.preventDefault();

                state.keys.right = true;

            }


            if (
                key === " " ||
                key === "arrowup" ||
                key === "w"
            ) {

                event.preventDefault();

                jump();

            }

        }
    );


    game.addEventListener(
        "keyup",
        event => {

            const key =
                event.key.toLowerCase();


            if (
                key === "arrowleft" ||
                key === "a"
            ) {

                state.keys.left =
                    false;

            }


            if (
                key === "arrowright" ||
                key === "d"
            ) {

                state.keys.right =
                    false;

            }

        }
    );


    /* -----------------------------------------------------
       TOUCH / POINTER CONTROLS
       ----------------------------------------------------- */

    const controlButtons =
        touchControls.querySelectorAll(
            "button"
        );


    controlButtons.forEach(button => {

        const control =
            button.dataset.control;


        if (
            control === "jump"
        ) {

            button.addEventListener(
                "pointerdown",
                event => {

                    event.preventDefault();

                    game.focus({ preventScroll: true });

                    jump();

                }
            );

            button.addEventListener('click', event => {
                // Keyboard and assistive-technology clicks have no pointer detail.
                if (event.detail === 0) jump();
            });
            return;

        }


        const setControlState =
            value => {

                if (
                    control === "left"
                ) {

                    state.keys.left =
                        value;

                }

                if (
                    control === "right"
                ) {

                    state.keys.right =
                        value;

                }

            };


        button.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                game.focus({ preventScroll: true });

                setControlState(
                    true
                );

            }
        );


        button.addEventListener('keydown', event => {
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                setControlState(true);
            }
        });
        button.addEventListener('keyup', event => {
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                setControlState(false);
            }
        });
        button.addEventListener('blur', () => setControlState(false));

        [
            "pointerup",
            "pointercancel",
            "pointerleave"
        ].forEach(type => {

            button.addEventListener(
                type,
                () => {

                    setControlState(
                        false
                    );

                }
            );

        });

    });


    /* -----------------------------------------------------
       BUTTONS
       ----------------------------------------------------- */

    startButton.addEventListener(
        "click",
        startGame
    );


    restartButton.addEventListener(
        "click",
        startGame
    );


    /* -----------------------------------------------------
       RESIZE
       ----------------------------------------------------- */

    window.addEventListener(
        "resize",
        () => {

            if (!state.running) {

                resetPlayer();

                return;

            }

            const dimensions =
                gameDimensions();

            const playerSize =
                playerDimensions();

            state.x =
                Math.min(
                    state.x,
                    dimensions.width -
                    playerSize.width
                );

            const floor =
                groundTop();

            if (
                state.y +
                playerSize.height >
                floor
            ) {

                state.y =
                    floor -
                    playerSize.height;

            }

            renderPlayer();

        }
    );


    /* -----------------------------------------------------
       INITIAL POSITION
       ----------------------------------------------------- */

    function releaseMovement() {
        state.keys.left = false;
        state.keys.right = false;
    }
    window.addEventListener('blur', releaseMovement);
    game.addEventListener('blur', releaseMovement);
    document.addEventListener('visibilitychange', releaseMovement);
    resetPlayer();

})();
// Visitors can stop the orbit; hovering or keyboard focus also holds links still.
(() => {
    const system = document.querySelector('.expertise-system');
    const button = system.querySelector('.orbit-toggle');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    button.hidden = reducedMotion.matches;
    reducedMotion.addEventListener('change', event => { button.hidden = event.matches; });
    button.addEventListener('click', () => {
        const paused = system.classList.toggle('orbit-paused');
        button.setAttribute('aria-pressed', String(paused));
        button.setAttribute('aria-label', paused ? 'Resume orbital motion' : 'Pause orbital motion');
        button.innerHTML = paused ? '<span aria-hidden="true">▷</span> RESUME' : '<span aria-hidden="true">Ⅱ</span> PAUSE';
    });
})();

// Count the two headline metrics once when they enter the viewport.
// Static text remains available without JavaScript and for screen readers.
(() => {
    const counters = [...document.querySelectorAll('[data-count-to]')];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) return;
    const frames = new Map();
    const finish = element => { element.textContent = element.dataset.countTo + '+'; };
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const element = entry.target;
            observer.unobserve(element);
            if (motion.matches) { finish(element); continue; }
            const target = Number(element.dataset.countTo);
            const started = performance.now();
            element.textContent = '0+';
            const tick = now => {
                const progress = Math.min((now - started) / 900, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = Math.floor(target * eased) + '+';
                if (progress < 1) frames.set(element, requestAnimationFrame(tick));
                else { finish(element); frames.delete(element); }
            };
            frames.set(element, requestAnimationFrame(tick));
        }
    }, { threshold: 0.5 });
    counters.forEach(element => observer.observe(element));
    motion.addEventListener('change', event => {
        if (!event.matches) return;
        observer.disconnect();
        frames.forEach(frame => cancelAnimationFrame(frame));
        frames.clear();
        counters.forEach(finish);
    });
})();
