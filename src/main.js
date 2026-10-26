import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

import earthVertexShader from './shaders/earth/vertex.glsl';
import earthFragmentShader from './shaders/earth/fragment.glsl';
import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl';
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl';
import starsVertexShader from './shaders/stars/vertex.glsl';
import starsFragmentShader from './shaders/stars/fragment.glsl';

/**
 * Loader
 */
const loaderElement = document.getElementById('loader');
const loaderBarElement = document.getElementById('loaderBar');
const loaderPercentElement = document.getElementById('loaderPercent');

let rawProgress = 0;
let fakeProgress = 0;
let isLoaded = false;

const fakeInterval = setInterval(() => {
  if (isLoaded) return;
  const target = 85;
  if (fakeProgress < target) {
    fakeProgress += (target - fakeProgress) * 0.03;
    const current = Math.max(Math.round(fakeProgress), rawProgress);
    loaderBarElement.style.width = `${current}%`;
    loaderPercentElement.textContent = `${current}%`;
  }
}, 50);

const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, loaded, total) => {
  rawProgress = Math.round((loaded / total) * 99);
  const current = Math.max(rawProgress, Math.round(fakeProgress));
  loaderBarElement.style.width = `${current}%`;
  loaderPercentElement.textContent = `${current}%`;
};

loadingManager.onLoad = () => {
  isLoaded = true;
  clearInterval(fakeInterval);
  loaderBarElement.style.width = '99%';
  loaderPercentElement.textContent = '99%';
  setTimeout(() => {
    loaderBarElement.style.width = '100%';
    loaderPercentElement.textContent = '100%';
    setTimeout(() => {
      loaderElement.classList.add('done');
    }, 400);
  }, 1300);
};

/**
 * Base Scene & Canvas
 */
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader(loadingManager);

/**
 * Stars Background
 */
const starsCount = 5000;
const starsGeometry = new THREE.BufferGeometry();
const starsPositions = new Float32Array(starsCount * 3);
const starsSizes = new Float32Array(starsCount);

for (let i = 0; i < starsCount; i++) {
  const i3 = i * 3;
  const radius = 30 + Math.random() * 70;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  starsPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  starsPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starsPositions[i3 + 2] = radius * Math.cos(phi);

  starsSizes[i] = Math.random() * 1.8 + 0.4;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
starsGeometry.setAttribute('aSize', new THREE.BufferAttribute(starsSizes, 1));

const starsMaterial = new THREE.ShaderMaterial({
  vertexShader: starsVertexShader,
  fragmentShader: starsFragmentShader,
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

/**
 * Earth & Atmosphere Parameters
 */
const earthParameters = {
  atmosphereDayColor: '#009dff',
  atmosphereTwilightColor: '#0008ff'
};

// Textures
const dayTexture = textureLoader.load('./earth/day.jpg');
dayTexture.colorSpace = THREE.SRGBColorSpace;

const nightTexture = textureLoader.load('./earth/night.jpg');
nightTexture.colorSpace = THREE.SRGBColorSpace;

const specularCloudsTexture = textureLoader.load('./earth/specularClouds.jpg');

// Earth Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
const earthMaterial = new THREE.ShaderMaterial({
  vertexShader: earthVertexShader,
  fragmentShader: earthFragmentShader,
  uniforms: {
    uDayTexture: new THREE.Uniform(dayTexture),
    uNightTexture: new THREE.Uniform(nightTexture),
    uSpecularCloudsTexture: new THREE.Uniform(specularCloudsTexture),
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uCloudsMix: { value: 0.09334 },
    uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
    uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
  }
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Atmosphere Mesh
const atmosphereGeometry = new THREE.SphereGeometry(2, 32, 32);
const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  uniforms: {
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
    uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
  },
  side: THREE.BackSide,
  transparent: true
});

const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
atmosphere.scale.set(1.04, 1.04, 1.04);
scene.add(atmosphere);

// Sun Direction
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
const sunDirection = new THREE.Vector3();

const updateSun = () => {
  sunDirection.setFromSpherical(sunSpherical);
  earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
  atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);
};
updateSun();

/**
 * Sizes & Responsive Scaling
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2)
};

const getResponsiveScale = () => {
  if (sizes.width < 480) return 0.65;
  if (sizes.width < 768) return 0.8;
  if (sizes.width < 1024) return 0.9;
  return 1;
};

const updateEarthScale = () => {
  const s = getResponsiveScale();
  earth.scale.set(s, s, s);
  atmosphere.scale.set(1.04 * s, 1.04 * s, 1.04 * s);
};
updateEarthScale();

/**
 * Camera & Renderer
 */
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 200);
camera.position.set(8, 2, 6);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.setClearColor('#000011');

// Anisotropy for sharper textures at glancing angles
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
dayTexture.anisotropy = maxAnisotropy;
nightTexture.anisotropy = maxAnisotropy;
specularCloudsTexture.anisotropy = maxAnisotropy;

/**
 * OrbitControls (for Explore Mode)
 */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 4;
controls.maxDistance = 20;
controls.enablePan = false;
controls.enabled = false;
controls.autoRotate = false;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;

/**
 * Camera Waypoints (Scroll-driven path)
 */
const cameraPositions = [
  { x: 8, y: 2, z: 6 },
  { x: -7, y: 1, z: 7 },
  { x: -7, y: 0.5, z: 0.7 },
  { x: -8.3, y: 1.5, z: -1.8 },
  { x: 0, y: -2, z: 11 },
  { x: 0, y: -2, z: 11 }
];

const cameraLookAts = [
  { x: -2, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0.3, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 }
];

const targetCamPos = { x: 0.1, y: 0, z: 12 };
const targetLookAt = { x: 0, y: 0, z: 0 };
const currentLookAt = { x: 0, y: 0, z: 0 };

let currentSectionIndex = 0;
let scrollProgress = 0;
let isIntroFinished = false;
let isExploreMode = false;

// Initial camera entry animation
gsap.to(targetCamPos, {
  x: cameraPositions[0].x,
  y: cameraPositions[0].y,
  z: cameraPositions[0].z,
  duration: 3,
  ease: 'power3.inOut',
  onComplete: () => {
    isIntroFinished = true;
  }
});

gsap.to(targetLookAt, {
  x: cameraLookAts[0].x,
  y: cameraLookAts[0].y,
  z: cameraLookAts[0].z,
  duration: 3,
  ease: 'power3.inOut'
});

/**
 * Scroll Tracking
 */
const scrollContainer = document.getElementById('scrollContainer');
const navLinks = document.querySelectorAll('.nav-link');

const onScroll = () => {
  if (!isIntroFinished || isExploreMode) return;

  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;

  scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

  const numPoints = cameraPositions.length;
  const scaledProgress = scrollProgress * (numPoints - 1);
  const index = Math.floor(scaledProgress);
  const factor = scaledProgress - index;

  const curr = Math.min(index, numPoints - 1);
  const next = Math.min(index + 1, numPoints - 1);

  // Smooth Hermite interpolation: 3t^2 - 2t^3
  const smoothFactor = factor * factor * (3 - 2 * factor);

  targetCamPos.x = cameraPositions[curr].x + (cameraPositions[next].x - cameraPositions[curr].x) * smoothFactor;
  targetCamPos.y = cameraPositions[curr].y + (cameraPositions[next].y - cameraPositions[curr].y) * smoothFactor;
  targetCamPos.z = cameraPositions[curr].z + (cameraPositions[next].z - cameraPositions[curr].z) * smoothFactor;

  targetLookAt.x = cameraLookAts[curr].x + (cameraLookAts[next].x - cameraLookAts[curr].x) * smoothFactor;
  targetLookAt.y = cameraLookAts[curr].y + (cameraLookAts[next].y - cameraLookAts[curr].y) * smoothFactor;
  targetLookAt.z = cameraLookAts[curr].z + (cameraLookAts[next].z - cameraLookAts[curr].z) * smoothFactor;

  const roundedIndex = Math.round(scaledProgress);
  if (roundedIndex !== currentSectionIndex) {
    currentSectionIndex = roundedIndex;
    navLinks.forEach((link, idx) => {
      link.classList.toggle('active', idx === currentSectionIndex);
    });
  }
};

window.addEventListener('scroll', onScroll, { passive: true });

// Fade in content cards when in view
const contentCards = document.querySelectorAll('.content-card');
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
);
contentCards.forEach(card => observer.observe(card));

// Smooth scroll on nav link click
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const id = link.getAttribute('href').substring(1);
    const targetSection = document.getElementById(id);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/**
 * Explore Mode (360 interactive rotation & zoom)
 */
const exploreOverlay = document.getElementById('exploreOverlay');
const exploreBtn = document.getElementById('exploreBtn');
const exploreClose = document.getElementById('exploreClose');
const ctaExplore = document.getElementById('ctaExplore');
const nav = document.getElementById('nav');

let savedCamPos = { x: 0, y: 0, z: 0 };
let savedLookAt = { x: 0, y: 0, z: 0 };
let savedScrollY = 0;
let isTransitioning = false;

const openExploreMode = () => {
  if (isExploreMode || isTransitioning) return;
  isTransitioning = true;
  isExploreMode = true;

  savedCamPos.x = targetCamPos.x;
  savedCamPos.y = targetCamPos.y;
  savedCamPos.z = targetCamPos.z;

  savedLookAt.x = targetLookAt.x;
  savedLookAt.y = targetLookAt.y;
  savedLookAt.z = targetLookAt.z;

  savedScrollY = window.scrollY;

  scrollContainer.classList.add('hidden');
  nav.classList.add('nav-hidden');
  exploreOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  const animCam = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  const animLook = { x: currentLookAt.x, y: currentLookAt.y, z: currentLookAt.z };

  gsap.to(animCam, {
    x: 0,
    y: 0,
    z: 11,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.position.set(animCam.x, animCam.y, animCam.z);
      camera.lookAt(animLook.x, animLook.y, animLook.z);
    },
    onComplete: () => {
      controls.target.set(0, 0, 0);
      controls.enabled = true;
      controls.update();
      targetCamPos.x = 0;
      targetCamPos.y = 0;
      targetCamPos.z = 14;
      targetLookAt.x = 0;
      targetLookAt.y = 0;
      targetLookAt.z = 0;
      isTransitioning = false;
    }
  });

  gsap.to(animLook, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.4,
    ease: 'power2.inOut'
  });
};

const closeExploreMode = () => {
  if (!isExploreMode || isTransitioning) return;
  isTransitioning = true;
  controls.enabled = false;
  exploreOverlay.classList.remove('active');

  const animCam = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  const animLook = { x: 0, y: 0, z: 0 };

  gsap.to(animCam, {
    x: savedCamPos.x,
    y: savedCamPos.y,
    z: savedCamPos.z,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.position.set(animCam.x, animCam.y, animCam.z);
      camera.lookAt(animLook.x, animLook.y, animLook.z);
    },
    onComplete: () => {
      isExploreMode = false;
      isTransitioning = false;

      targetCamPos.x = savedCamPos.x;
      targetCamPos.y = savedCamPos.y;
      targetCamPos.z = savedCamPos.z;

      targetLookAt.x = savedLookAt.x;
      targetLookAt.y = savedLookAt.y;
      targetLookAt.z = savedLookAt.z;

      currentLookAt.x = savedLookAt.x;
      currentLookAt.y = savedLookAt.y;
      currentLookAt.z = savedLookAt.z;

      document.body.style.overflow = '';
      scrollContainer.classList.remove('hidden');
      nav.classList.remove('nav-hidden');
      window.scrollTo(0, savedScrollY);
      onScroll();
    }
  });

  gsap.to(animLook, {
    x: savedLookAt.x,
    y: savedLookAt.y,
    z: savedLookAt.z,
    duration: 1.4,
    ease: 'power2.inOut'
  });
};

exploreBtn.addEventListener('click', openExploreMode);
if (ctaExplore) ctaExplore.addEventListener('click', openExploreMode);
exploreClose.addEventListener('click', closeExploreMode);
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isExploreMode) {
    closeExploreMode();
  }
});

/**
 * Window Resize
 */
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);

  starsMaterial.uniforms.uPixelRatio.value = sizes.pixelRatio;
  updateEarthScale();
});

/**
 * Background Audio
 */
const backgroundMusic = document.getElementById('backgroundMusic');
const musicButton = document.getElementById('musicButton');
let isAudioPlaying = false;

const startAudioOnFirstInteraction = () => {
  if (!isAudioPlaying) {
    backgroundMusic.play().then(() => {
      musicButton.classList.add('playing');
      isAudioPlaying = true;
    }).catch(() => {});
  }
  window.removeEventListener('click', startAudioOnFirstInteraction);
};
window.addEventListener('click', startAudioOnFirstInteraction);

musicButton.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isAudioPlaying) {
    backgroundMusic.pause();
    musicButton.classList.remove('playing');
    isAudioPlaying = false;
  } else {
    backgroundMusic.play().then(() => {
      musicButton.classList.add('playing');
      isAudioPlaying = true;
    }).catch(() => {});
  }
});

/**
 * Animation Loop
 */
const clock = new THREE.Clock();
const cameraLerpSpeed = 0.012;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Subtle continuous rotation of Earth
  earth.rotation.y = elapsedTime * 0.01;

  if (isExploreMode && controls.enabled) {
    controls.update();
  } else if (!isExploreMode && !isTransitioning) {
    // Smooth camera position interpolation
    camera.position.x += (targetCamPos.x - camera.position.x) * cameraLerpSpeed;
    camera.position.y += (targetCamPos.y - camera.position.y) * cameraLerpSpeed;
    camera.position.z += (targetCamPos.z - camera.position.z) * cameraLerpSpeed;

    // Smooth look-at target interpolation
    currentLookAt.x += (targetLookAt.x - currentLookAt.x) * cameraLerpSpeed;
    currentLookAt.y += (targetLookAt.y - currentLookAt.y) * cameraLerpSpeed;
    currentLookAt.z += (targetLookAt.z - currentLookAt.z) * cameraLerpSpeed;

    camera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z);
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();

