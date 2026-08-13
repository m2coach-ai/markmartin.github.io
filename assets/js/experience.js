import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.querySelector('#orb-canvas');
const stage = document.querySelector('.webgl-stage');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && stage && !reducedMotion) {
  try {
    const constrainedDevice = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    let qualityScale = constrainedDevice ? 0.82 : 1;
    let qualityReduced = constrainedDevice;
    let performanceSampled = false;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !constrainedDevice,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, constrainedDevice ? 1 : 1.25) * qualityScale);
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03030a);
    scene.fog = new THREE.FogExp2(0x05050d, 0.038);

    const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.03, 100);
    camera.position.set(-0.7, 0.3, 8.5);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.05).texture;
    room.dispose();
    pmrem.dispose();

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb8c7ff,
      transmission: 1,
      opacity: 1,
      transparent: true,
      roughness: 0.035,
      metalness: 0,
      ior: 1.48,
      thickness: 1.1,
      attenuationColor: new THREE.Color(0x6040ff),
      attenuationDistance: 8.2,
      dispersion: 0.68,
      iridescence: 0.28,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [110, 460],
      envMapIntensity: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      side: THREE.FrontSide
    });

    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.62, 96, 64), glassMaterial);
    orbGroup.add(orb);

    const innerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x6a35ff,
      emissive: 0x1a063d,
      emissiveIntensity: 1.25,
      transmission: 0.5,
      transparent: true,
      opacity: 0.36,
      roughness: 0.18,
      thickness: 0.8,
      ior: 1.2,
      dispersion: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 6), innerMaterial);
    inner.scale.set(1, 0.9, 1.05);
    orbGroup.add(inner);

    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [0x56d9ff, 0xa16bff, 0xff70bd, 0xffffff].map(value => new THREE.Color(value));
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.25 + Math.pow(Math.random(), 0.7) * 5.4;
      const angle = Math.random() * Math.PI * 2;
      const band = (Math.random() - 0.5) * 1.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = band * radius * 0.34;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.58;
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
      size: 0.027,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
    scene.add(particles);

    const cyan = new THREE.PointLight(0x4cdcff, 48, 18, 2);
    cyan.position.set(-4, 2.6, 4.5);
    scene.add(cyan);
    const pink = new THREE.PointLight(0xff4fa8, 44, 18, 2);
    pink.position.set(4, -2.4, 3);
    scene.add(pink);
    const violet = new THREE.PointLight(0x784cff, 32, 16, 2);
    violet.position.set(0, 3.8, -2);
    scene.add(violet);
    scene.add(new THREE.AmbientLight(0x252055, 1.8));

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight),
      constrainedDevice ? 0.48 : 0.68,
      0.62,
      0.88
    );
    let bloomEnabled = true;
    composer.addPass(bloom);

    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 0.3, 8.5),
      new THREE.Vector3(0.9, 0.15, 6.2),
      new THREE.Vector3(-1.2, 0.42, 4.25),
      new THREE.Vector3(0.55, 0.08, 2.55),
      new THREE.Vector3(0.12, 0.02, 0.9),
      new THREE.Vector3(-0.08, 0, -0.35),
      new THREE.Vector3(0.35, -0.1, -3.6)
    ], false, 'catmullrom', 0.48);
    const lookPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1, 0, 0),
      new THREE.Vector3(0, 0, -0.3),
      new THREE.Vector3(0, 0, -1.5),
      new THREE.Vector3(0, 0, -4.5)
    ]);

    let targetProgress = 0;
    let easedProgress = 0;
    let pointerX = 0;
    let pointerY = 0;
    let running = true;
    let firstFrame = true;
    let sampledFrames = 0;
    let sampledTime = 0;

    function updateProgress() {
      targetProgress = THREE.MathUtils.clamp(
        scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight),
        0,
        1
      );
    }
    updateProgress();
    addEventListener('scroll', updateProgress, { passive: true });
    addEventListener('pointermove', event => {
      pointerX = (event.clientX / innerWidth - 0.5) * 0.18;
      pointerY = (event.clientY / innerHeight - 0.5) * 0.1;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });

    const clock = new THREE.Clock();
    function render() {
      requestAnimationFrame(render);
      if (!running) return;

      const rawDelta = clock.getDelta();
      const delta = Math.min(rawDelta, 0.05);
      const elapsed = clock.elapsedTime;
      easedProgress = THREE.MathUtils.damp(easedProgress, targetProgress, 3.2, delta);
      const pathT = THREE.MathUtils.smoothstep(easedProgress, 0, 1);

      // Keep the orb clear of the hero copy, then bring it to centre as the journey begins.
      const heroOffset = 1.35 * (1 - THREE.MathUtils.smoothstep(pathT, 0.02, 0.28));
      orbGroup.position.x = heroOffset;

      const position = cameraPath.getPoint(pathT);
      camera.position.set(position.x + pointerX, position.y - pointerY, position.z);
      const lookT = THREE.MathUtils.clamp((pathT - 0.52) / 0.48, 0, 1);
      camera.lookAt(lookPath.getPoint(lookT));

      orbGroup.rotation.y = elapsed * 0.12 + pathT * 0.7;
      orbGroup.rotation.x = Math.sin(elapsed * 0.22) * 0.07;
      inner.rotation.x = -elapsed * 0.09;
      inner.rotation.z = elapsed * 0.07;
      particles.rotation.y = -elapsed * 0.018 + pathT * 0.45;
      particles.rotation.z = Math.sin(elapsed * 0.08) * 0.035;
      glassMaterial.dispersion = 0.56 + Math.sin(elapsed * 0.35) * 0.08;
      if (bloomEnabled) {
        bloom.strength = (constrainedDevice ? 0.48 : 0.68) + Math.sin(elapsed * 0.42) * 0.06;
      }

      sampledFrames += 1;
      sampledTime += rawDelta;
      if (!performanceSampled && sampledFrames >= 120) {
        const sampledFps = sampledFrames / Math.max(sampledTime, 0.001);
        performanceSampled = true;
        if (sampledFps < 45) {
          qualityReduced = true;
          qualityScale = 0.72;
          renderer.setPixelRatio(Math.min(devicePixelRatio, 1) * qualityScale);
          composer.setPixelRatio(Math.min(devicePixelRatio, 1) * qualityScale);
          if (sampledFps < 32 && bloomEnabled) {
            composer.removePass(bloom);
            bloomEnabled = false;
          }
        }
        sampledFrames = 0;
        sampledTime = 0;
      }

      composer.render();
      if (firstFrame) {
        firstFrame = false;
        document.documentElement.classList.add('webgl-ready');
      }
    }
    render();

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      composer.setSize(innerWidth, innerHeight);
      const dprCap = constrainedDevice || qualityReduced ? 1 : 1.25;
      renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap) * qualityScale);
      composer.setPixelRatio(Math.min(devicePixelRatio, dprCap) * qualityScale);
    });
  } catch (error) {
    console.error('WebGL experience unavailable:', error);
    document.documentElement.classList.add('webgl-failed');
  }
}
