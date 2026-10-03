<template>
  <div class="score-panel">
    <!-- Main HUD stats -->
    <div class="hud-box">
      <div class="stat-card score-card">
        <span class="stat-label">SCORE</span>
        <span class="stat-value">{{ score }}</span>
      </div>

      <div class="stat-card highscore-card">
        <span class="stat-label">HIGH SCORE</span>
        <span class="stat-value high-val">{{ highScore }}</span>
      </div>

      <div class="stat-card coin-card">
        <span class="coin-icon">🪙</span>
        <span class="stat-value gold-val">{{ coin }}</span>
      </div>

      <div class="stat-card mistake-card">
        <span class="stat-label">LIVES</span>
        <div class="hearts">
          <span :class="['heart', { lost: mistake >= 1 }]">❤️</span>
          <span :class="['heart', { lost: mistake >= 2 }]">❤️</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, watch } from 'vue';

const props = defineProps({
  score: { type: Number, default: 0 },
  coin: { type: Number, default: 0 },
  mistake: { type: Number, default: 0 },
});

const highScore = ref(Number(localStorage.getItem('subway_high_score') || 0));

watch(() => props.score, (newScore) => {
  if (newScore > highScore.value) {
    highScore.value = newScore;
    localStorage.setItem('subway_high_score', newScore.toString());
  }
});
</script>

<style scoped>
.score-panel {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 998;
  pointer-events: none;
}

.hud-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 900px;
  margin: 0 auto;
}

.stat-card {
  background: rgba(15, 20, 31, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 0.6rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.stat-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 900;
  font-family: monospace;
}

.high-val {
  color: #00f2fe;
}

.gold-val {
  color: #ffe600;
  font-size: 1.3rem;
}

.coin-card {
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
}

.coin-icon {
  font-size: 1.3rem;
}

.mistake-card {
  align-items: center;
}

.hearts {
  display: flex;
  gap: 4px;
}

.heart {
  font-size: 1.1rem;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.heart.lost {
  opacity: 0.2;
  filter: grayscale(100%);
}

@media (max-width: 600px) {
  .score-panel {
    top: 10px;
    left: 10px;
    right: 10px;
  }
  .stat-card {
    padding: 0.4rem 0.7rem;
  }
  .stat-value {
    font-size: 1rem;
  }
}
</style>