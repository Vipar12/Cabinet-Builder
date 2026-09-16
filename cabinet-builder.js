(function () {
  const THREE_URL = 'https://unpkg.com/three@0.128.0/build/three.min.js';
  const ORBIT_URL = 'https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js';

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unable to load ' + url));
      document.head.appendChild(script);
    });
  }

  async function ensureThree() {
    if (!window.THREE) await loadScript(THREE_URL);
    if (!window.THREE.OrbitControls) await loadScript(ORBIT_URL);
  }

  function mount(selector, options = {}) {
    const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!root) throw new Error('CabinetBuilder mount target was not found.');
    root.innerHTML = '<div class="cb-loading">Loading configurator...</div>';
    ensureThree().then(() => createBuilder(root, options)).catch((error) => {
      root.innerHTML = '<p class="cb-error">The 3D configurator could not load. Please check that this page can access the Three.js CDN.</p>';
      console.error(error);
    });
  }

  function createBuilder(root, options) {
    const THREE = window.THREE;
    const doorStyles = options.doorStyles || ['Shaker', 'Slab', 'Raised panel', 'Flat recessed panel'];
    const woodFinishes = options.woodFinishes || ['White oak', 'Natural maple', 'Walnut', 'Cherry', 'Painted white', 'Charcoal stain'];
    const woodTextures = options.woodTextures || {};
    const state = { width: 36, height: 48, depth: 16, shelves: 3, door: doorStyles[0], finish: woodFinishes[0] };
    root.innerHTML = `
      <section class="cb-shell" aria-label="Custom cabinet builder">
        <div class="cb-stage"><div class="cb-canvas"></div><div class="cb-stage-label">Drag to rotate · Scroll to zoom</div></div>
        <aside class="cb-panel">
          <p class="cb-kicker">Studio configurator</p><h1>Build your cabinet</h1>
          <p class="cb-intro">Shape a piece that fits your room, down to the inch.</p>
          <form class="cb-form">
            <label>Width <span>in</span><input name="width" type="number" min="12" max="96" step="1" value="36"></label>
            <label>Depth <span>in</span><input name="depth" type="number" min="8" max="36" step="1" value="16"></label>
            <label>Height <span>in</span><input name="height" type="number" min="16" max="102" step="1" value="48"></label>
            <label>Door style<select name="door">${doorStyles.map((style) => `<option>${style}</option>`).join('')}</select></label>
            <label>Wood finish<select name="finish">${woodFinishes.map((finish) => `<option>${finish}</option>`).join('')}</select></label>
            <label>Number of shelves<input name="shelves" type="number" min="0" max="8" step="1" value="3"></label>
            <button type="submit">Update design <span>↗</span></button>
          </form>
          <div class="cb-spec"><span>Current footprint</span><strong class="cb-summary">36 × 48 × 16 in</strong></div>
        </aside>
      </section>`;

    const canvas = root.querySelector('.cb-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1eee7);
    const camera = new THREE.PerspectiveCamera(32, 1, 1, 10000);
    camera.position.set(1800, 1250, 2100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.appendChild(renderer.domElement);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 580, 0);
    controls.maxPolarAngle = Math.PI / 2.05;

    scene.add(new THREE.HemisphereLight(0xfffbf2, 0x5c6970, 2.4));
    const keyLight = new THREE.DirectionalLight(0xfff4df, 3.3);
    keyLight.position.set(900, 2200, 1200); keyLight.castShadow = true; scene.add(keyLight);
    let cabinet;
    const material = new THREE.MeshStandardMaterial({ color: options.color || 0x9a6a45, roughness: .62 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x332b25, roughness: .7 });
    const textureLoader = new THREE.TextureLoader();

    function box(group, width, height, depth, x, y, z, mat = material) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
      mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
    }
    function applyFinishTexture() {
      const textureUrl = woodTextures[state.finish];
      if (!textureUrl) {
        material.map = null;
        material.color.set(options.color || 0x9a6a45);
        material.needsUpdate = true;
        return;
      }
      textureLoader.load(textureUrl, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        rebuild();
      }, undefined, (error) => console.error('Unable to load wood texture:', error));
    }
    function rebuild() {
      if (cabinet) scene.remove(cabinet);
      cabinet = new THREE.Group();
      const w = state.width * 25.4, h = state.height * 25.4, d = state.depth * 25.4, t = 45, base = 80;
      box(cabinet, w, t, d, 0, base + t / 2, 0, darkMaterial); box(cabinet, w, t, d, 0, base + h - t / 2, 0);
      box(cabinet, t, h - 2 * t, d, -w / 2 + t / 2, base + h / 2, 0); box(cabinet, t, h - 2 * t, d, w / 2 - t / 2, base + h / 2, 0);
      box(cabinet, w - 2 * t, h - 2 * t, 18, 0, base + h / 2, -d / 2 + 9, darkMaterial);
      const innerW = w - 2 * t, innerD = d - 12;
      if (state.shelves > 0) for (let i = 1; i <= state.shelves; i++) box(cabinet, innerW, 28, innerD, 0, base + (h * i / (state.shelves + 1)), 0, darkMaterial);
      const doorW = innerW + 14;
      const door = new THREE.Group();
      door.position.set(-doorW / 2, base + h / 2, d / 2 + 14);
      box(door, doorW, h - 2 * t, 24, doorW / 2, 0, 0);
      if (state.door === 'Shaker') box(door, doorW - 90, h - 2 * t - 90, 12, doorW / 2, 0, 16, darkMaterial);
      if (state.door === 'Raised panel') box(door, doorW - 130, h - 2 * t - 130, 34, doorW / 2, 0, 24, darkMaterial);
      if (state.door === 'Flat recessed panel') box(door, doorW - 100, h - 2 * t - 100, 12, doorW / 2, 0, 16, darkMaterial);
      box(door, 18, 90, 18, doorW - 42, 0, 30, darkMaterial);
      door.rotation.y = -Math.PI / 2;
      cabinet.add(door);
      scene.add(cabinet); controls.target.set(0, base + h / 2, 0); camera.position.set(w * 1.8, h * 1.1, d * 3.7); camera.lookAt(controls.target);
    }
    function resize() { const rect = canvas.getBoundingClientRect(); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); renderer.setSize(rect.width, rect.height, false); }
    const form = root.querySelector('form');
    form.addEventListener('submit', (event) => { event.preventDefault(); new FormData(form).forEach((value, key) => { state[key] = ['door', 'finish'].includes(key) ? value : Number(value); }); root.querySelector('.cb-summary').textContent = `${state.width} × ${state.height} × ${state.depth} in`; rebuild(); applyFinishTexture(); });
    new ResizeObserver(resize).observe(canvas); resize(); rebuild(); applyFinishTexture();
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
  }

  window.CabinetBuilder = { mount };
})();