/* ==========================================================
   SIMPLE WEB ANIMATION - FULLSCREEN CONTINUOUS ENGINE
   With Auto-Hiding Controls Hint & Info Toggle
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const character = document.getElementById('character');
  const packageContainer = document.getElementById('packageContainer');
  const controlsHint = document.getElementById('controlsHint');
  const infoBtn = document.getElementById('infoBtn');

  // Mobile On-Screen Controls Elements
  const mobileControls = document.getElementById('mobileControls');
  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnSpace = document.getElementById('btnSpace');

  // Movement State
  let posX = 0;
  let posY = 0;
  let targetAngle = 0;
  let currentAngle = 0;

  // Movement Parameters
  const SPEED = 7;
  let maxX = (window.innerWidth / 2) - 65;
  let maxY = (window.innerHeight / 2) - 65;

  // Active Key Tracker
  const keysPressed = {};

  // Package Physics Storage
  const packages = [];
  const GRAVITY = 0.45;
  let lastDropTime = 0;

  // ==========================================
  // Controls Hint Timer & Info Button Toggle
  // ==========================================
  let hideTimer;

  function scheduleHideHint() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      controlsHint.classList.add('hidden');
    }, 5000);
  }

  // Start initial 5 second auto-hide timer
  scheduleHideHint();

  // Toggle Info Button
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (controlsHint.classList.contains('hidden')) {
      controlsHint.classList.remove('hidden');
      scheduleHideHint(); // Hide again after 5s
    } else {
      controlsHint.classList.add('hidden');
      clearTimeout(hideTimer);
    }
  });

  // Resize Bounds
  function updateBounds() {
    maxX = (window.innerWidth / 2) - 65;
    maxY = (window.innerHeight / 2) - 65;

    posX = Math.max(-maxX, Math.min(maxX, posX));
    posY = Math.max(-maxY, Math.min(maxY, posY));
  }

  window.addEventListener('resize', updateBounds);

  // Key Down Listener
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
      keysPressed[key] = true;
    } else if (key === ' ' || key === 'r') {
      e.preventDefault();
      dropPackage();
    }
  });

  // Click / Touch to drop package as well (excluding UI buttons)
  window.addEventListener('pointerdown', (e) => {
    const isUIElement = (infoBtn && infoBtn.contains(e.target)) ||
                        (controlsHint && controlsHint.contains(e.target)) ||
                        (mobileControls && mobileControls.contains(e.target));
    if (!isUIElement) {
      dropPackage();
    }
  });

  // Key Up Listener
  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keysPressed[key]) {
      delete keysPressed[key];
    }
  });

  // ==========================================
  // Mobile On-Screen D-Pad & Space Button Logic
  // ==========================================
  const dpadBindings = [
    { btn: btnUp, key: 'arrowup' },
    { btn: btnDown, key: 'arrowdown' },
    { btn: btnLeft, key: 'arrowleft' },
    { btn: btnRight, key: 'arrowright' }
  ];

  dpadBindings.forEach(({ btn, key }) => {
    if (!btn) return;
    const startPress = (e) => {
      e.preventDefault();
      e.stopPropagation();
      keysPressed[key] = true;
      btn.classList.add('active');
    };
    const endPress = (e) => {
      e.preventDefault();
      e.stopPropagation();
      delete keysPressed[key];
      btn.classList.remove('active');
    };

    btn.addEventListener('pointerdown', startPress);
    btn.addEventListener('pointerup', endPress);
    btn.addEventListener('pointerleave', endPress);
    btn.addEventListener('pointercancel', endPress);
  });

  if (btnSpace) {
    btnSpace.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropPackage();
      btnSpace.classList.add('active');
      setTimeout(() => btnSpace.classList.remove('active'), 150);
    });
  }

  // Action: Drop Package Box
  function dropPackage() {
    const now = Date.now();
    if (now - lastDropTime < 200) return;
    lastDropTime = now;

    const centerX = (window.innerWidth / 2) + posX;
    const centerY = (window.innerHeight / 2) + posY + 20;

    let initialVx = 0;
    if (keysPressed['arrowleft'] || keysPressed['a']) initialVx = -3;
    if (keysPressed['arrowright'] || keysPressed['d']) initialVx = 3;

    const el = document.createElement('div');
    el.className = 'package';
    packageContainer.appendChild(el);

    packages.push({
      el,
      x: centerX - 12,
      y: centerY,
      vx: initialVx,
      vy: 1,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 8,
      landed: false,
      opacity: 1
    });
  }

  // Create dust landing puff effect
  function createLandingPuff(x, y) {
    const puff = document.createElement('div');
    puff.className = 'landing-puff';
    puff.style.left = `${x}px`;
    puff.style.top = `${y}px`;
    packageContainer.appendChild(puff);

    setTimeout(() => {
      if (puff.parentNode) {
        puff.parentNode.removeChild(puff);
      }
    }, 500);
  }

  // Main Game Loop (60fps)
  function gameLoop() {
    let movingHorizontal = false;

    if (keysPressed['arrowleft'] || keysPressed['a']) {
      posX -= SPEED;
      targetAngle = -18;
      movingHorizontal = true;
    }
    if (keysPressed['arrowright'] || keysPressed['d']) {
      posX += SPEED;
      targetAngle = 18;
      movingHorizontal = true;
    }

    if (keysPressed['arrowup'] || keysPressed['w']) {
      posY -= SPEED;
    }
    if (keysPressed['arrowdown'] || keysPressed['s']) {
      posY += SPEED;
    }

    if (!movingHorizontal) {
      targetAngle = 0;
    }

    currentAngle += (targetAngle - currentAngle) * 0.2;

    posX = Math.max(-maxX, Math.min(maxX, posX));
    posY = Math.max(-maxY, Math.min(maxY, posY));

    character.style.transform = `translate(${posX}px, ${posY}px) rotate(${currentAngle}deg)`;

    // Package Physics Update
    const groundLevel = window.innerHeight - 30;

    for (let i = packages.length - 1; i >= 0; i--) {
      const pkg = packages[i];

      if (!pkg.landed) {
        pkg.vy += GRAVITY;
        pkg.x += pkg.vx;
        pkg.y += pkg.vy;
        pkg.rotation += pkg.rotSpeed;

        if (pkg.y >= groundLevel) {
          pkg.y = groundLevel;
          pkg.landed = true;
          createLandingPuff(pkg.x + 12, groundLevel + 10);
        }
      } else {
        pkg.opacity -= 0.025;
      }

      pkg.el.style.transform = `translate(${pkg.x}px, ${pkg.y}px) rotate(${pkg.rotation}deg)`;
      pkg.el.style.opacity = pkg.opacity;

      if (pkg.opacity <= 0) {
        if (pkg.el.parentNode) {
          pkg.el.parentNode.removeChild(pkg.el);
        }
        packages.splice(i, 1);
      }
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
