import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

import earthVertexShader from './shaders/earth/vertex.glsl';
import earthFragmentShader from './shaders/earth/fragment.glsl';
import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl';
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl';
import starsVertexShader from './shaders/stars/vertex.glsl';
import starsFragmentShader from './shaders/stars/fragment.glsl';

// Elementos e controle do carregamento inicial
const loaderElement = document.getElementById('loader');
const loaderBarElement = document.getElementById('loaderBar');
const loaderPercentElement = document.getElementById('loaderPercent');

let rawProgress = 0;
let fakeProgress = 0;
let isLoaded = false;

// Simulacao de progresso ate que os arquivos pesados carreguem
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

// Gerenciador de carregamento do Three.js
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

// Cena base e loader de texturas
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader(loadingManager);

// Fundo com 5.000 estrelas distribuidas em coordenadas esfericas
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

// Cores de iluminacao da atmosfera diurna e crepuscular
const earthParameters = {
  atmosphereDayColor: '#009dff',
  atmosphereTwilightColor: '#0008ff'
};

// Texturas da superficie: dia, noite e mapa de nuvens/oceanos
const dayTexture = textureLoader.load('./earth/day.jpg');
dayTexture.colorSpace = THREE.SRGBColorSpace;

const nightTexture = textureLoader.load('./earth/night.jpg');
nightTexture.colorSpace = THREE.SRGBColorSpace;

const specularCloudsTexture = textureLoader.load('./earth/specularClouds.jpg');

// Malha principal da Terra com shaders customizados
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

// Marcadores 3D das cidades pelo mundo
const cities = [
  { name: 'Rio de Janeiro', country: 'Brasil', lat: -22.9068, lon: -43.1729, timeZone: 'America/Sao_Paulo', pop: '13.6M', desc: 'Cidade Maravilhosa, Pão de Açúcar e praias icônicas' },
  { name: 'Tóquio', country: 'Japão', lat: 35.6762, lon: 139.6503, timeZone: 'Asia/Tokyo', pop: '37.4M', desc: 'Maior metrópole do planeta e polo global de alta tecnologia' },
  { name: 'Paris', country: 'França', lat: 48.8566, lon: 2.3522, timeZone: 'Europe/Paris', pop: '11.1M', desc: 'Cidade Luz, arte, gastronomia e a Torre Eiffel' },
  { name: 'Nova York', country: 'EUA', lat: 40.7128, lon: -74.0060, timeZone: 'America/New_York', pop: '18.8M', desc: 'Capital financeira global e centro cultural cosmopolita' },
  { name: 'Cairo', country: 'Egito', lat: 30.0444, lon: 31.2357, timeZone: 'Africa/Cairo', pop: '21.8M', desc: 'Metrópole milenar às margens do Rio Nilo e Pirâmides' },
  { name: 'Cidade do Cabo', country: 'África do Sul', lat: -33.9249, lon: 18.4241, timeZone: 'Africa/Johannesburg', pop: '4.6M', desc: 'Table Mountain e o encontro espetacular dos oceanos' },
  { name: 'Londres', country: 'Reino Unido', lat: 51.5074, lon: -0.1278, timeZone: 'Europe/London', pop: '9.0M', desc: 'Marco do meridiano principal (Greenwich) e Big Ben' },
  { name: 'Sydney', country: 'Austrália', lat: -33.8688, lon: 151.2093, timeZone: 'Australia/Sydney', pop: '5.3M', desc: 'Porto icônico da Baía de Sydney e a Opera House' },
  { name: 'Dubai', country: 'Emirados Árabes', lat: 25.2048, lon: 55.2708, timeZone: 'Asia/Dubai', pop: '3.6M', desc: 'Oásis futurista e lar do edifício mais alto do planeta' }
];

// Converte coordenadas GPS (latitude e longitude) para um vetor 3D
const latLonToVector3 = (lat, lon, r = 2.025) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lon * (Math.PI / 180);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    -r * Math.sin(phi) * Math.sin(theta)
  );
};

const cityPins = [];
const cityColliders = [];

// Geometrias e materiais dos marcadores
const pinCoreGeo = new THREE.SphereGeometry(0.022, 16, 16);
const pinCoreMat = new THREE.MeshBasicMaterial({ color: 0x66c2ff });

const ringGeo = new THREE.RingGeometry(0.035, 0.048, 32);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0x4da6ff,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.75
});

const colliderGeo = new THREE.SphereGeometry(0.09, 8, 8);
const colliderMat = new THREE.MeshBasicMaterial({ visible: false });

// Grupo de marcadores que fica visivel apenas no modo 360
const cityPinsGroup = new THREE.Group();
cityPinsGroup.visible = false;
cityPinsGroup.scale.set(0, 0, 0);
earth.add(cityPinsGroup);

// Posiciona cada marcador na superficie do planeta
cities.forEach(city => {
  const pos = latLonToVector3(city.lat, city.lon, 2.025);
  const pinGroup = new THREE.Group();
  pinGroup.position.copy(pos);

  // Orienta o marcador para apontar para fora do centro da Terra
  pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());

  const core = new THREE.Mesh(pinCoreGeo, pinCoreMat);
  pinGroup.add(core);

  const ring = new THREE.Mesh(ringGeo, ringMat.clone());
  pinGroup.add(ring);

  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.userData = { city, pinGroup, ring };
  pinGroup.add(collider);

  cityPinsGroup.add(pinGroup);
  cityPins.push({ group: pinGroup, ring, city });
  cityColliders.push(collider);
});

// Camada exterior da atmosfera com efeito Fresnel
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

// Direcao e atualizacao do vetor solar nos shaders
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
const sunDirection = new THREE.Vector3();

const updateSun = () => {
  sunDirection.setFromSpherical(sunSpherical);
  earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
  atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);
};
updateSun();

// Dimensoes da tela e calculo de escala responsiva
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

// Camera de perspectiva e renderizador WebGL
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

// Anisotropia para manter as texturas nitidas em angulos rasos
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
dayTexture.anisotropy = maxAnisotropy;
nightTexture.anisotropy = maxAnisotropy;
specularCloudsTexture.anisotropy = maxAnisotropy;

// Controles de orbita livre para o modo 360
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

// Pontos de parada da camera sincronizados com o scroll da pagina
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

// Animacao cinematografica de entrada da camera no espaco
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

// Sincronizacao da posicao da camera com a rolagem vertical
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

  // Interpolacao suave de Hermite: 3t^2 - 2t^3
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

// Revela os cards de conteudo quando entram no campo de visao
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

// Navegacao com rolagem suave ao clicar nos links do menu
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

// Controle de abertura e transicao para o modo 360 livre
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

  // Revela os marcadores das cidades com efeito de escala
  cityPinsGroup.visible = true;
  gsap.fromTo(cityPinsGroup.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 0.8, delay: 0.4, ease: 'back.out(1.5)' });

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

// Fechamento do modo 360 e retorno para a posicao de scroll
const closeExploreMode = () => {
  if (!isExploreMode || isTransitioning) return;
  isTransitioning = true;
  controls.enabled = false;
  exploreOverlay.classList.remove('active');

  // Oculta o card de cidade e recolhe os marcadores
  if (cityTooltip) {
    cityTooltip.classList.remove('visible');
  }
  hoveredCity = null;
  document.body.style.cursor = 'default';

  gsap.to(cityPinsGroup.scale, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      cityPinsGroup.visible = false;
    }
  });

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

// Slider para controlar o angulo da luz solar no modo 360
const sunSlider = document.getElementById('sunSlider');
if (sunSlider) {
  sunSlider.addEventListener('input', (e) => {
    sunSpherical.theta = parseFloat(e.target.value);
    updateSun();
  });
}

// Redimensionamento dinamico da janela
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

// Player da trilha sonora e controle de mute/play
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

// Deteccao do cursor para parallax e raycasting dos marcadores
const cityTooltip = document.getElementById('cityTooltip');
const cityTooltipName = document.getElementById('cityTooltipName');
const cityTooltipCountry = document.getElementById('cityTooltipCountry');
const cityTooltipDesc = document.getElementById('cityTooltipDesc');
const cityTooltipTime = document.getElementById('cityTooltipTime');
const cityTooltipPop = document.getElementById('cityTooltipPop');

const raycaster = new THREE.Raycaster();
const mouseRay = new THREE.Vector2(-999, -999);
let hoveredCity = null;

const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

window.addEventListener('mousemove', (e) => {
  mouse.targetX = (e.clientX / sizes.width - 0.5) * 2;
  mouse.targetY = -(e.clientY / sizes.height - 0.5) * 2;

  // Coordenadas normalizadas de tela para o raycaster
  mouseRay.x = (e.clientX / sizes.width) * 2 - 1;
  mouseRay.y = -(e.clientY / sizes.height) * 2 + 1;

  if (cityTooltip) {
    cityTooltip.style.left = `${e.clientX}px`;
    cityTooltip.style.top = `${e.clientY - 12}px`;
  }
});

// Animacao elastica ao clicar no marcador da cidade
window.addEventListener('click', () => {
  if (isExploreMode && hoveredCity) {
    const hitPin = cityPins.find(p => p.city === hoveredCity);
    if (hitPin) {
      gsap.fromTo(
        hitPin.group.scale,
        { x: 2, y: 2, z: 2 },
        { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(2)' }
      );
    }
  }
});

// Loop principal de animacao e renderizacao
const clock = new THREE.Clock();
const cameraLerpSpeed = 0.012;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Rotacao continua suave da Terra no proprio eixo
  earth.rotation.y = elapsedTime * 0.01;

  // Animacao de pulsacao dos aneis das cidades
  const pulse = Math.sin(elapsedTime * 4) * 0.25 + 1;
  cityPins.forEach(p => {
    p.ring.scale.setScalar(pulse);
    p.ring.material.opacity = (2 - pulse) * 0.55;
  });

  // Deteccao de hover nos marcadores (apenas no modo 360)
  if (isExploreMode && !isTransitioning) {
    raycaster.setFromCamera(mouseRay, camera);
    const intersects = raycaster.intersectObjects(cityColliders);

    if (intersects.length > 0) {
      const hitData = intersects[0].object.userData;
      if (hoveredCity !== hitData.city) {
        hoveredCity = hitData.city;
        document.body.style.cursor = 'pointer';

        if (cityTooltip) {
          cityTooltipName.textContent = hoveredCity.name;
          cityTooltipCountry.textContent = hoveredCity.country;
          cityTooltipDesc.textContent = hoveredCity.desc;
          cityTooltipPop.textContent = hoveredCity.pop;

          const timeStr = new Date().toLocaleTimeString('pt-BR', {
            timeZone: hoveredCity.timeZone,
            hour: '2-digit',
            minute: '2-digit'
          });
          cityTooltipTime.textContent = timeStr;

          cityTooltip.classList.add('visible');
        }
      }
    } else {
      if (hoveredCity !== null) {
        hoveredCity = null;
        document.body.style.cursor = 'default';
        if (cityTooltip) {
          cityTooltip.classList.remove('visible');
        }
      }
    }
  } else {
    // Fora do modo 360, garante que o card de cidade fique oculto
    if (hoveredCity !== null) {
      hoveredCity = null;
      document.body.style.cursor = 'default';
    }
    if (cityTooltip && cityTooltip.classList.contains('visible')) {
      cityTooltip.classList.remove('visible');
    }
  }

  if (isExploreMode && controls.enabled) {
    controls.update();
  } else if (!isExploreMode && !isTransitioning) {
    // Suavizacao do efeito parallax com o mouse
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    const parallaxX = mouse.x * 0.45;
    const parallaxY = mouse.y * 0.35;

    // Interpolacao amortecida da posicao da camera
    camera.position.x += (targetCamPos.x + parallaxX - camera.position.x) * cameraLerpSpeed;
    camera.position.y += (targetCamPos.y + parallaxY - camera.position.y) * cameraLerpSpeed;
    camera.position.z += (targetCamPos.z - camera.position.z) * cameraLerpSpeed;

    // Interpolacao amortecida do ponto focal da camera
    currentLookAt.x += (targetLookAt.x - currentLookAt.x) * cameraLerpSpeed;
    currentLookAt.y += (targetLookAt.y - currentLookAt.y) * cameraLerpSpeed;
    currentLookAt.z += (targetLookAt.z - currentLookAt.z) * cameraLerpSpeed;

    camera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z);
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
