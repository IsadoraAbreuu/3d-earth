# 🌍 Earth 3D — Interactive Experience

Uma experiência interativa tridimensional e imersiva do planeta Terra desenvolvida com **Three.js**, **GLSL Shaders**, **GSAP** e **Vite**.

Inspirado pelo projeto [unfor-earth](https://unfor-earth.vercel.app/), esta aplicação combina renderização gráfica em tempo real na GPU com transições de câmera sincronizadas com o scroll e um modo de exploração 360°.

---

## ✨ Funcionalidades

- **🌐 Globo Terrestre Fotorrealista**:
  - Mistura dinâmica de **dia e noite** baseada no vetor de incidência da luz solar (`uSunDirection`).
  - Textura noturna com as luzes das cidades visíveis apenas no lado escuro do planeta.
  - Reflexo especular da água nos oceanos com base no mapa especular e rugosidade.
  - Camada de nuvens com relevo e sombreamento dinâmico.
- **🌌 Atmosfera e Brilho de Fresnel**:
  - Shader dedicado com espalhamento suave (*Rayleigh scattering*) e brilho crepuscular no contorno do horizonte.
- **✨ Campo Estelar Tridimensional**:
  - Partículas geradas dinamicamente com cálculo esférico, atenuação de tamanho por distância da câmera e brilho circular suave.
- **📜 Navegação e Câmera Guiadas pelo Scroll**:
  - Transições suaves com interpolação de Hermite entre posições orbitais estratégicas ao longo das seções (*The Blue Planet, Discover, Life, Data, Gallery, Future*).
  - Sincronização em tempo real com a barra de navegação e efeito *fade-in* nos cartões de conteúdo.
- **🔄 Modo 360° Interativo (Explore)**:
  - Botão de órbita livre com `OrbitControls` (arrastar para rotacionar e scroll para dar zoom).
  - HUD futurista com métricas astronômicas reais (raio equatorial, velocidade de rotação e velocidade orbital).
- **🎵 Trilha Sonora Ambiente**:
  - Versão instrumental/orquestrada com botão de controle de áudio (*play/pause*) e autoplay inteligente após o primeiro clique.
- **📱 Design Futurista & Responsivo**:
  - Interface com cartões translúcidos (*glassmorphism*), tipografia com as fontes *Space Grotesk* e *Inter*, e adaptação de escala para dispositivos móveis e desktops.

---

## 🛠️ Tecnologias Utilizadas

- **[Three.js](https://threejs.org/)** (`^0.166.1`): Criação da cena, geometrias, câmera de perspectiva, iluminação e renderizador WebGL.
- **[GLSL (OpenGL Shading Language)](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)**: Shaders de vértice e fragmento customizados para a Terra, atmosfera e estrelas.
- **[GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/)** (`^3.13.0`): Animações e interpolação de câmera ao longo dos pontos orbitais.
- **[Vite](https://vitejs.dev/)** (`^5.3.3`): Bundler moderno e servidor de desenvolvimento ultra-rápido.
- **[vite-plugin-glsl](https://github.com/UstymUkhman/vite-plugin-glsl)**: Importação direta de arquivos `.glsl` como módulos JavaScript.

---

## 📁 Estrutura do Projeto

```text
3d-earth/
├── public/
│   ├── assets/
│   │   ├── logo.jpg             # Ícone do projeto
│   │   └── m.mp3                # Trilha sonora (Viva La Vida - Instrumental Orquestra)
│   ├── earth/
│   │   ├── day.jpg              # Textura diurna dos continentes e oceanos
│   │   ├── night.jpg            # Textura noturna com luzes urbanas
│   │   └── specularClouds.jpg   # Mapa de reflexo aquático e nuvens
│   └── 1.webp ... 6.png         # Imagens da galeria espacial
├── src/
│   ├── shaders/
│   │   ├── earth/
│   │   │   ├── vertex.glsl      # Posições, vetores normais e UVs da Terra
│   │   │   └── fragment.glsl    # Mistura dia/noite, reflexo solar, nuvens e Fresnel
│   │   ├── atmosphere/
│   │   │   ├── vertex.glsl      # Posições e projeção da camada atmosférica
│   │   │   └── fragment.glsl    # Halo azulado e cálculo do ângulo solar
│   │   └── stars/
│   │       ├── vertex.glsl      # Atenuação do tamanho dos pontos pelo campo de visão
│   │       └── fragment.glsl    # Desenho circular suave do brilho das estrelas
│   ├── main.js                  # Ponto de entrada: cena, render loop, câmera e eventos
│   └── style.css                # Estilização completa da página (glassmorphism e layout)
├── index.html                   # Estrutura das seções e canvas WebGL
├── package.json                 # Dependências e scripts
└── vite.config.js               # Configuração do Vite e plugins GLSL
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- Gerenciador de pacotes `npm` ou `yarn`

### 1. Clonar ou abrir o repositório

```bash
git clone https://github.com/seu-usuario/3d-earth.git
cd 3d-earth
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abra o endereço exibido no terminal (geralmente [http://localhost:5173/](http://localhost:5173/)) no seu navegador.

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento com hot-reload |
| `npm run build` | Gera os arquivos otimizados e minificados para produção na pasta `dist/` |
| `npm run preview` | Testa localmente a versão gerada pelo build de produção |

---

## 📄 Licença

Este projeto é de código aberto para fins de aprendizado e portfólio.

