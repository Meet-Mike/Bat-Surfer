<template>
  <div class="app-root">
    <!-- Polished Loading / Splash Screen -->
    <transition name="fade">
      <div v-if="!isReady" class="splash-screen">
        <div class="splash-content">
          <div class="logo-container">
            <span class="logo-subway">SUBWAY</span>
            <span class="logo-surfers">SURFERS</span>
            <div class="logo-tagline">3D METRO RUNNER</div>
          </div>

          <div class="progress-section">
            <div class="progress-bar-container">
              <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="progress-text">
              <span>{{ progressText }}</span>
              <span class="percent-label">{{ Math.round(progressPercent) }}%</span>
            </div>
          </div>

          <div class="tips-box">
            <span class="tip-badge">TIP</span>
            <span class="tip-text">{{ currentTip }}</span>
          </div>
        </div>
      </div>
    </transition>

    <GameGuide
      :show-mask="isReady && showGuide"
      :game-status="gameStatus"
      v-model="selectedCharacter"
      @select-character="handleSelectCharacter"
      @start-game="handleStartGame"
      @restart-game="handleRestartGame"
    />
    <ScorePanel :score="score" :coin="coin" :mistake="mistake" />
    <div class="experience">
      <canvas ref="exp_canvas" class="experience__canvas"></canvas>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, onUnmounted } from 'vue';
import ScorePanel from './components/ScorePanel.vue';
import GameGuide from './components/GameGuide.vue';
import Game from './Game';

const isReady = ref(false);
const score = ref(0);
const coin = ref(0);
const mistake = ref(0);
const gameStatus = ref('ready');
const selectedCharacter = ref('classic');

const loadingData = ref<{ itemsLoaded?: number; itemsTotal?: number; type?: string; url?: string }>({});
let gameInstance: Game | null = null;

const tips = [
  'Use UP / Space / W to jump over hurdles & kerb stones!',
  'Swipe or press Left/Right to change lanes on the run.',
  'Press DOWN / S to slide under barriers.',
  'Collect shiny gold coins to boost your score multiplier!',
  'Pick your favorite runner character before jumping onto the tracks.'
];
const currentTip = ref(tips[0]);

const progressPercent = computed(() => {
  if (loadingData.value.type === 'successLoad' || isReady.value) return 100;
  const loaded = loadingData.value.itemsLoaded || 0;
  const total = loadingData.value.itemsTotal || 1;
  return Math.min(Math.round((loaded / total) * 100), 99);
});

const progressText = computed(() => {
  if (loadingData.value.type === 'successLoad') return 'Loading complete! Preparing track...';
  if (!loadingData.value.url) return 'Initializing Metro Engine...';
  const fileName = loadingData.value.url.split('/').pop() || loadingData.value.url;
  return `Loading asset: ${fileName}`;
});

const handleSelectCharacter = (charId: string) => {
  if (gameInstance?.player) {
    gameInstance.player.setCharacter(charId);
  }
};

const handleStartGame = () => {
  if (gameInstance?.player?.controlPlayer) {
    gameInstance.player.controlPlayer.start();
  }
};

const handleRestartGame = () => {
  if (gameInstance?.player?.controlPlayer) {
    gameInstance.player.controlPlayer.restart();
  }
};

const exp_canvas = ref<HTMLElement>();
const showGuide = computed(() => {
  return gameStatus.value !== 'start';
});

let tipInterval: any = null;

onMounted(() => {
  tipInterval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * tips.length);
    currentTip.value = tips[randomIndex];
  }, 2500);

  const game = new Game(exp_canvas.value);
  gameInstance = game;

  game.on('progress', (data: any) => {
    const { type } = data;
    if (type === 'successLoad') {
      loadingData.value.type = 'successLoad';
      setTimeout(() => {
        isReady.value = true;
      }, 300);
    } else {
      loadingData.value = data;
    }
  });

  game.on('gameStatus', (data: any) => {
    gameStatus.value = data;
  });

  game.on('gameData', (data: any) => {
    score.value = data.score;
    coin.value = data.coin;
    mistake.value = data.mistake;
  });
});

onUnmounted(() => {
  if (tipInterval) clearInterval(tipInterval);
  gameInstance?.disposeGame();
});
</script>

<style scoped>
.app-root {
  font-family: 'Montserrat', 'Segoe UI', system-ui, -apple-system, sans-serif;
  user-select: none;
}

/* Splash / Loading Screen */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: radial-gradient(circle at center, #1b2838 0%, #0d121d 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  overflow: hidden;
}

.splash-content {
  width: 90%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 0.9;
}

.logo-subway {
  font-size: 3.2rem;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 2px;
  background: linear-gradient(180deg, #ffe600 0%, #ff8800 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 10px rgba(255, 136, 0, 0.4));
  transform: skewX(-6deg);
}

.logo-surfers {
  font-size: 2.5rem;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 3px;
  background: linear-gradient(180deg, #00f2fe 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 10px rgba(79, 172, 254, 0.4));
  transform: skewX(-6deg);
  margin-top: 4px;
}

.logo-tagline {
  margin-top: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 4px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
}

.progress-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.progress-bar-container {
  width: 100%;
  height: 14px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00f2fe 0%, #00c6ff 50%, #ff007f 100%);
  border-radius: 8px;
  transition: width 0.25s ease-out;
  box-shadow: 0 0 12px rgba(0, 242, 254, 0.6);
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.percent-label {
  font-weight: 800;
  color: #00f2fe;
}

.tips-box {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.75rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 100%;
  text-align: left;
}

.tip-badge {
  background: #ff007f;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  letter-spacing: 1px;
}

.tip-text {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.3;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.experience {
  position: fixed;
  height: 100vh;
  width: 100vw;
  top: 0;
  left: 0;
}

.experience__canvas {
  height: 100%;
  width: 100%;
}
</style>