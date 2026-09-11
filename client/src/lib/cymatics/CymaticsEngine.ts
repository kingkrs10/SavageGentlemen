/**
 * CymaticsEngine.ts
 * 
 * High-Definition 3D CymaScope & Chladni Standing Wave Resonance Engine built with Three.js.
 * Features distinct, millisecond-precise visual reactions for each musical beat:
 * - 1. Kick Drum (Sub 20-90Hz): Central starburst rosette flare, outward ring shockwave & 3D punch
 * - 2. Snare / Clap (200-1200Hz): Glowing amber cell body flash & spoke snap
 * - 3. Hi-Hat / Shaker (5k-16kHz): 16th-note outer rim teeth serration & spark shimmer
 * - 4. Melodic Pitch Tracking: Spoke symmetry (16, 20, 24, 32, 48, 64) locked to active notes
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioBands } from './AudioProcessor';

export type PlateMode = 'flower' | 'radial' | 'hexagonal' | 'cartesian';

export interface VisualizerConfig {
  particleCount: number;
  plateRadius: number;
  plateMode: PlateMode;
  colorTheme: 'fiery' | 'solar' | 'plasma' | 'magma';
  cameraPreset: 'top' | 'isometric' | 'macro' | 'orbit';
  damping: number;
  kickSensitivity: number;
  harmonicSensitivity: number;
  autoRotate: boolean;
  showMesh: boolean;
  wireframeGlow: boolean;
}

export const DEFAULT_CONFIG: VisualizerConfig = {
  particleCount: 65000,
  plateRadius: 28,
  plateMode: 'flower',
  colorTheme: 'fiery',
  cameraPreset: 'isometric',
  damping: 0.86,
  kickSensitivity: 1.6,
  harmonicSensitivity: 1.4,
  autoRotate: true,
  showMesh: true,
  wireframeGlow: true,
};

export class CymaticsEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  public config: VisualizerConfig;

  // Custom CymaScope Shader Disk
  private shaderMaterial!: THREE.ShaderMaterial;
  private shaderMesh!: THREE.Mesh;

  // 3D Particle Embers
  private particleGeometry: THREE.BufferGeometry;
  private particlePoints: THREE.Points;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private particleColors: Float32Array;
  private particleSizes: Float32Array;

  // Bezel & Shockwaves
  private outerBezelMesh!: THREE.Mesh;
  private shockwaveGroup: THREE.Group;
  private shockwaveRings: Array<{ mesh: THREE.Mesh; scale: number; opacity: number; active: boolean }> = [];

  // Multi-Harmonic State
  private spokes1: number = 24;
  private spokes2: number = 48;
  private rings: number = 5;
  private phaseTheta: number = 0;
  private plateVibPhase: number = 0;
  private shockwavePulsePhase: number = 0;

  // Animation Loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, config?: Partial<VisualizerConfig>) {
    this.container = container;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.005);

    // 2. Camera
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.applyCameraPreset(this.config.cameraPreset);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.12;

    // 5. Initialize CymaScope Standing Wave Shader
    this.initCymaScopeShader();

    // 6. Initialize 3D Particle Embers
    this.particlePositions = new Float32Array(this.config.particleCount * 3);
    this.particleVelocities = new Float32Array(this.config.particleCount * 3);
    this.particleColors = new Float32Array(this.config.particleCount * 3);
    this.particleSizes = new Float32Array(this.config.particleCount);
    this.particleGeometry = new THREE.BufferGeometry();
    this.particlePoints = this.initParticles();

    // 7. Outer Bezel & Shockwaves
    this.initOuterBezel();
    this.shockwaveGroup = new THREE.Group();
    this.scene.add(this.shockwaveGroup);
    this.initShockwaves();

    window.addEventListener('resize', this.onResize);
  }

  private initCymaScopeShader(): void {
    const R = this.config.plateRadius;

    const vertexShader = `
      varying vec2 vUv;
      uniform float u_bassEnergy;
      uniform float u_kickTransient;
      uniform float u_snareTransient;
      uniform float u_spokes;
      uniform float u_rings;
      uniform float u_phase;

      void main() {
        vUv = uv;
        vec3 pos = position;

        vec2 centeredUv = (uv - 0.5) * 2.0;
        float r = length(centeredUv);
        float theta = atan(centeredUv.y, centeredUv.x) + u_phase;

        if (r < 1.0) {
          float standingWave = cos(u_rings * 3.14159 * pow(r, 0.82)) * cos(u_spokes * theta);
          float zOffset = standingWave * (u_bassEnergy * 1.8 + u_kickTransient * 2.5 + u_snareTransient * 1.2) * (1.0 - r * 0.45);
          pos.z += zOffset;
        }

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;

      uniform float u_time;
      uniform float u_bassEnergy;
      uniform float u_kickTransient;   // Kick drum sub-bass pulse (20-90Hz)
      uniform float u_snareTransient;  // Snare/Clap mid-frequency snap (200-1200Hz)
      uniform float u_hihatTransient;  // Hi-Hat 16th note tick (5k-16kHz)
      uniform float u_midsEnergy;
      uniform float u_spokes1;
      uniform float u_spokes2;
      uniform float u_rings;
      uniform float u_phase;
      uniform float u_pulseWave;       // Outward expanding kick shockwave
      uniform float u_mode;

      vec3 getFieryColor(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 c0 = vec3(0.04, 0.005, 0.00); // Deep ember black
        vec3 c1 = vec3(0.72, 0.08, 0.00);  // Deep crimson red
        vec3 c2 = vec3(1.00, 0.38, 0.01);  // Blazing neon orange
        vec3 c3 = vec3(1.00, 0.76, 0.08);  // Molten amber gold
        vec3 c4 = vec3(1.00, 0.95, 0.40);  // Solar bright yellow
        vec3 c5 = vec3(1.00, 1.00, 0.95);  // Incandescent white core

        if (t < 0.20) return mix(c0, c1, t / 0.20);
        if (t < 0.45) return mix(c1, c2, (t - 0.20) / 0.25);
        if (t < 0.70) return mix(c2, c3, (t - 0.45) / 0.25);
        if (t < 0.88) return mix(c3, c4, (t - 0.70) / 0.18);
        return mix(c4, c5, (t - 0.88) / 0.12);
      }

      void main() {
        vec2 uvCentered = (vUv - 0.5) * 2.0;
        float r = length(uvCentered);
        if (r > 1.02) discard;

        float theta = atan(uvCentered.y, uvCentered.x);
        
        // Snare / Clap triggers a snappy angular shear alignment
        float snareSnapAngle = u_snareTransient * 0.025;
        float th1 = theta + u_phase + snareSnapAngle;
        float th2 = theta - u_phase * 0.75 - snareSnapAngle;

        float rWarp = pow(r, 0.82);

        // 1. Concentric Radial Spoke Cells
        float numSpokes = u_spokes1;
        if (u_mode == 2.0) numSpokes = 12.0; // Hexagonal
        if (u_mode == 1.0) numSpokes = u_spokes1 * 0.75;

        float spokeOsc1 = abs(cos(numSpokes * th1));
        float spokeOsc2 = abs(cos(u_spokes2 * th2));
        float spokeMix = mix(spokeOsc1, spokeOsc2, u_midsEnergy * 0.45);

        // Ring oscillation with kick expansion wave
        float ringOsc = abs(sin(u_rings * 3.14159265 * rWarp - u_bassEnergy * 0.35 + u_pulseWave));

        // Discrete segmented cell lobes
        float cellAngular = smoothstep(0.24, 0.88, spokeMix);
        float cellRadial = smoothstep(0.22, 0.90, ringOsc);
        float cells = cellAngular * cellRadial;

        // Snare / Clap flashes cell bodies with crisp filaments
        float filaments = sin(r * 160.0 + th1 * 16.0) * (0.06 + u_snareTransient * 0.12);
        cells = clamp(cells + filaments, 0.0, 1.0);

        // 2. Central Starburst Rosette Core (r < 0.22) - Pulses on Kick
        float coreSpokes = 24.0;
        float coreSpokeOsc = abs(cos(coreSpokes * (th1 * 1.2)));
        float coreExpansion = 0.22 + u_kickTransient * 0.06;
        float coreTeeth = smoothstep(0.25, 0.92, coreSpokeOsc) * smoothstep(coreExpansion, 0.05, r);
        float centerEye = smoothstep(0.06 + u_kickTransient * 0.03, 0.015, r);

        // 3. Hi-Hat Serrated Outer Rim Teeth (r > 0.75) - Pulses on every 16th-note hat
        float hatSpokes = u_spokes2 * 1.5;
        float hatTeethOsc = abs(cos(hatSpokes * th1));
        float hatSerration = smoothstep(0.3, 0.95, hatTeethOsc) * smoothstep(0.70, 0.95, r) * u_hihatTransient;

        // 4. Multi-Harmonic Beat Synthesis
        float cellEnergy = cells * (0.65 + u_bassEnergy * 0.85 + u_snareTransient * 0.65);
        float coreEnergy = (coreTeeth * 1.15 + centerEye * 1.35) * (0.9 + u_bassEnergy * 0.7 + u_kickTransient * 1.4);

        float totalIntensity = cellEnergy + coreEnergy + hatSerration * 0.85;

        // Kick Drum full-plate shockwave surge
        totalIntensity += u_kickTransient * (smoothstep(0.98, 0.0, r) * 0.75 + centerEye * 0.9);

        // Snare / Clap sharp cell flash
        totalIntensity += u_snareTransient * cells * 0.55;

        // Outer Vignette
        float rimEdge = smoothstep(1.0, 0.94, r);
        totalIntensity *= rimEdge;

        // Fiery Color Mapping
        vec3 color = getFieryColor(totalIntensity);

        // White-hot core highlights on kick & snare transients
        if (totalIntensity > 0.85) {
          color = mix(color, vec3(1.0, 1.0, 1.0), (totalIntensity - 0.85) / 0.15 * 0.75);
        }

        // Circular Bezel Glow
        float bezelGlow = smoothstep(0.94, 0.99, r) * (1.0 - smoothstep(0.99, 1.01, r));
        color += vec3(1.0, 0.45, 0.05) * bezelGlow * (0.6 + u_kickTransient * 0.8 + u_hihatTransient * 0.5);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_bassEnergy: { value: 0 },
        u_kickTransient: { value: 0 },
        u_snareTransient: { value: 0 },
        u_hihatTransient: { value: 0 },
        u_midsEnergy: { value: 0 },
        u_spokes1: { value: 24.0 },
        u_spokes2: { value: 48.0 },
        u_rings: { value: 5.0 },
        u_phase: { value: 0 },
        u_pulseWave: { value: 0 },
        u_mode: { value: 0.0 }
      },
      side: THREE.DoubleSide
    });

    const geom = new THREE.PlaneGeometry(R * 2, R * 2, 128, 128);
    geom.rotateX(-Math.PI / 2);

    this.shaderMesh = new THREE.Mesh(geom, this.shaderMaterial);
    this.shaderMesh.position.y = -0.05;
    this.scene.add(this.shaderMesh);
  }

  private createParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.20, 'rgba(255, 215, 60, 0.95)');
    grad.addColorStop(0.50, 'rgba(255, 90, 0, 0.55)');
    grad.addColorStop(0.85, 'rgba(180, 20, 0, 0.12)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  }

  private initParticles(): THREE.Points {
    const R = this.config.plateRadius;
    const count = this.config.particleCount;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.sqrt(Math.random()) * (R * 0.96);
      const angle = Math.random() * Math.PI * 2;

      this.particlePositions[i3 + 0] = Math.cos(angle) * r;
      this.particlePositions[i3 + 1] = (Math.random() - 0.5) * 0.15;
      this.particlePositions[i3 + 2] = Math.sin(angle) * r;

      this.particleVelocities[i3 + 0] = (Math.random() - 0.5) * 0.01;
      this.particleVelocities[i3 + 1] = 0;
      this.particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.01;

      this.particleColors[i3 + 0] = 1.0;
      this.particleColors[i3 + 1] = 0.55;
      this.particleColors[i3 + 2] = 0.08;

      this.particleSizes[i] = 1.3 + Math.random() * 1.5;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.particleSizes, 1));

    const sprite = this.createParticleTexture();

    const material = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      map: sprite,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true
    });

    const points = new THREE.Points(this.particleGeometry, material);
    this.scene.add(points);
    return points;
  }

  private initOuterBezel(): void {
    const R = this.config.plateRadius;

    const bezelGeom = new THREE.RingGeometry(R - 0.1, R + 3.5, 128);
    bezelGeom.rotateX(-Math.PI / 2);
    const bezelMat = new THREE.MeshBasicMaterial({
      color: 0x080402,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.outerBezelMesh = new THREE.Mesh(bezelGeom, bezelMat);
    this.outerBezelMesh.position.y = -0.04;
    this.scene.add(this.outerBezelMesh);

    const lipGeom = new THREE.RingGeometry(R - 0.2, R + 0.2, 128);
    lipGeom.rotateX(-Math.PI / 2);
    const lipMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const lipMesh = new THREE.Mesh(lipGeom, lipMat);
    lipMesh.position.y = -0.03;
    this.scene.add(lipMesh);
  }

  private initShockwaves(): void {
    const ringGeom = new THREE.RingGeometry(0.1, 0.6, 64);
    ringGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeom, mat);
      ring.visible = false;
      this.shockwaveGroup.add(ring);
      this.shockwaveRings.push({ mesh: ring, scale: 0, opacity: 0, active: false });
    }
  }

  private triggerShockwave(intensity: number): void {
    const ring = this.shockwaveRings.find(r => !r.active);
    if (!ring) return;

    ring.active = true;
    ring.scale = 0.5;
    ring.opacity = Math.min(1.0, intensity * 0.85);
    ring.mesh.scale.set(0.5, 0.5, 0.5);
    (ring.mesh.material as THREE.MeshBasicMaterial).opacity = ring.opacity;
    (ring.mesh.material as THREE.MeshBasicMaterial).color.setHex(intensity > 0.8 ? 0xffffff : 0xffaa00);
    ring.mesh.visible = true;
  }

  public evaluatePotential(x: number, z: number): number {
    const R = this.config.plateRadius;
    const rNorm = Math.sqrt(x * x + z * z) / R;
    if (rNorm > 1.0) return 1.5;

    const theta = Math.atan2(z, x) + this.phaseTheta;
    const rWarp = Math.pow(rNorm, 0.82);

    const spokeTerm = Math.cos(this.spokes1 * theta);
    const ringTerm = Math.sin(this.rings * Math.PI * rWarp);
    return spokeTerm * ringTerm;
  }

  public updatePhysics(bands: AudioBands, delta: number): void {
    if (this.isDestroyed) return;

    // 1. Precise Multi-Beat Mappings
    const kickBoost = bands.kickPunch * this.config.kickSensitivity;
    const snareBoost = bands.snareSnap * 1.3;
    const hihatBoost = bands.hihatTick * 1.2;
    const bassLevel = (bands.subBass * 1.3 + bands.bass * 0.7) / 2;
    const midEnergy = (bands.midLow * 0.8 + bands.midHigh * 1.4) / 2;

    // Target spoke symmetry dynamically locked to musical pitch / chords
    const targetSpokes = bands.spokeCount || 24;
    this.spokes1 += (targetSpokes - this.spokes1) * 0.12;
    this.spokes2 = this.spokes1 * 2.0;
    this.rings += (Math.round(4 + midEnergy * 3) - this.rings) * 0.08;

    this.phaseTheta += (0.002 + midEnergy * 0.015 + kickBoost * 0.025);
    this.plateVibPhase += delta * (28 + bassLevel * 45);

    // Outward shockwave ripple phase on kick hits
    if (bands.isKick && kickBoost > 0.3) {
      this.shockwavePulsePhase = 1.0;
      this.triggerShockwave(kickBoost);
    } else {
      this.shockwavePulsePhase *= 0.85;
    }

    // 2. Update Shader Uniforms with Beat Precision
    if (this.shaderMaterial) {
      const u = this.shaderMaterial.uniforms;
      u.u_time.value += delta;
      u.u_bassEnergy.value = bassLevel;
      u.u_kickTransient.value = kickBoost;
      u.u_snareTransient.value = snareBoost;
      u.u_hihatTransient.value = hihatBoost;
      u.u_midsEnergy.value = midEnergy;
      u.u_spokes1.value = this.spokes1;
      u.u_spokes2.value = this.spokes2;
      u.u_rings.value = this.rings;
      u.u_phase.value = this.phaseTheta;
      u.u_pulseWave.value = this.shockwavePulsePhase * 2.5;

      let modeNum = 0.0;
      if (this.config.plateMode === 'radial') modeNum = 1.0;
      if (this.config.plateMode === 'hexagonal') modeNum = 2.0;
      if (this.config.plateMode === 'cartesian') modeNum = 3.0;
      u.u_mode.value = modeNum;
    }

    // 3. Update 3D Particle Embers with Multi-Beat Physics
    const pos = this.particlePositions;
    const vel = this.particleVelocities;
    const col = this.particleColors;
    const sizes = this.particleSizes;
    const R = this.config.plateRadius;
    const count = this.config.particleCount;
    const damping = this.config.damping;
    const eps = 0.15;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = pos[i3 + 0];
      let y = pos[i3 + 1];
      let z = pos[i3 + 2];

      let vx = vel[i3 + 0];
      let vy = vel[i3 + 1];
      let vz = vel[i3 + 2];

      const r = Math.sqrt(x * x + z * z);
      const psi = this.evaluatePotential(x, z);

      // Gradient descent force
      const psiXp = this.evaluatePotential(x + eps, z);
      const psiXm = this.evaluatePotential(x - eps, z);
      const psiZp = this.evaluatePotential(x, z + eps);
      const psiZm = this.evaluatePotential(x, z - eps);

      const gx = (psiXp * psiXp - psiXm * psiXm) / (2 * eps);
      const gz = (psiZp * psiZp - psiZm * psiZm) / (2 * eps);

      vx -= gx * (0.26 + bassLevel * 0.8) * 0.08;
      vz -= gz * (0.26 + bassLevel * 0.8) * 0.08;

      // Kick Beat: Vertical Lofting Eruption
      if (kickBoost > 0.04 && Math.abs(psi) > 0.14) {
        vy += kickBoost * Math.abs(psi) * (0.38 + Math.random() * 0.25);
        if (r > 0.01) {
          const scatter = kickBoost * 0.14;
          vx += (x / r) * (Math.random() - 0.45) * scatter;
          vz += (z / r) * (Math.random() - 0.45) * scatter;
        }
      }

      // Snare / Clap: Radial Spoke Shake
      if (snareBoost > 0.08 && Math.abs(psi) < 0.25) {
        vx += (Math.random() - 0.5) * snareBoost * 0.08;
        vz += (Math.random() - 0.5) * snareBoost * 0.08;
        vy += snareBoost * 0.08;
      }

      // Hi-Hat Tick: Outer Rim Micro Spark Jitter
      if (hihatBoost > 0.08 && r > R * 0.6) {
        vx += (Math.random() - 0.5) * hihatBoost * 0.04;
        vz += (Math.random() - 0.5) * hihatBoost * 0.04;
      }

      // Gravity & Plate collision
      vy -= 0.022;
      const plateZ = Math.sin(this.plateVibPhase) * psi * (bassLevel * 1.5 + kickBoost * 1.2);
      if (y < plateZ) {
        y = plateZ;
        vy = Math.abs(vy) * 0.3 + Math.abs(psi) * (bassLevel * 2.0 + kickBoost * 2.5) * 0.12;
      }

      vx *= damping;
      vy *= 0.93;
      vz *= damping;

      x += vx;
      y += vy;
      z += vz;

      if (r > R * 0.98) {
        x = (x / r) * (R * 0.96);
        z = (z / r) * (R * 0.96);
      }

      pos[i3 + 0] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      vel[i3 + 0] = vx;
      vel[i3 + 1] = vy;
      vel[i3 + 2] = vz;

      const heat = Math.min(1.0, (1.0 - Math.abs(psi) * 1.4) * 0.65 + kickBoost * 0.75 + snareBoost * 0.5 + Math.abs(vy) * 1.2);
      col[i3 + 0] = 1.0;
      col[i3 + 1] = 0.45 + heat * 0.5;
      col[i3 + 2] = heat > 0.75 ? 0.4 + (heat - 0.75) * 2.4 : 0.05;

      sizes[i] = 1.2 + kickBoost * 1.8 + hihatBoost * 0.8;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;

    // 4. Shockwaves
    for (const s of this.shockwaveRings) {
      if (s.active) {
        s.scale += 1.6 * (1 + bassLevel);
        s.opacity *= 0.89;
        s.mesh.scale.set(s.scale, s.scale, s.scale);
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = s.opacity;

        if (s.opacity < 0.02 || s.scale > R * 1.4) {
          s.active = false;
          s.mesh.visible = false;
        }
      }
    }

    // 5. Auto-rotation & Kick Shake
    if (this.config.autoRotate) {
      this.scene.rotation.y += 0.0014 + bassLevel * 0.003;
    }

    if (kickBoost > 0.5) {
      const shake = (Math.random() - 0.5) * kickBoost * 0.15;
      this.camera.position.x += shake;
      this.camera.position.y += shake * 0.5;
    }
  }

  public applyCameraPreset(preset: 'top' | 'isometric' | 'macro' | 'orbit'): void {
    this.config.cameraPreset = preset;
    const R = this.config.plateRadius;

    switch (preset) {
      case 'top':
        this.camera.position.set(0, R * 2.35, 0.001);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) this.controls.target.set(0, 0, 0);
        break;

      case 'isometric':
        this.camera.position.set(R * 1.2, R * 1.1, R * 1.2);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) this.controls.target.set(0, 0, 0);
        break;

      case 'macro':
        this.camera.position.set(R * 0.45, R * 0.35, R * 0.45);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) this.controls.target.set(0, 0, 0);
        break;

      case 'orbit':
        this.camera.position.set(R * 1.5, R * 0.8, R * 1.5);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) this.controls.target.set(0, 0, 0);
        break;
    }
  }

  public updateConfig(newConfig: Partial<VisualizerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.cameraPreset) {
      this.applyCameraPreset(newConfig.cameraPreset);
    }
  }

  private onResize = (): void => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public start(getAudioBands: () => AudioBands): void {
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (this.isDestroyed) return;
      const delta = Math.min((currentTime - this.lastTime) / 1000, 0.05);
      this.lastTime = currentTime;

      const bands = getAudioBands();
      this.updatePhysics(bands, delta);

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    window.removeEventListener('resize', this.onResize);

    if (this.controls) this.controls.dispose();

    if (this.particlePoints) {
      this.scene.remove(this.particlePoints);
      this.particleGeometry.dispose();
      (this.particlePoints.material as THREE.Material).dispose();
    }

    if (this.shaderMesh) {
      this.scene.remove(this.shaderMesh);
      this.shaderMesh.geometry.dispose();
      this.shaderMaterial.dispose();
    }

    if (this.outerBezelMesh) {
      this.scene.remove(this.outerBezelMesh);
      this.outerBezelMesh.geometry.dispose();
      (this.outerBezelMesh.material as THREE.Material).dispose();
    }

    this.shockwaveRings.forEach(r => {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });

    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
