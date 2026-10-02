<template>
  <div class="score_container">
      <div class="score_panel">
          <div class="stat-item high-score">
              <span class="label">HIGH SCORE:</span>
              <span class="val">{{ highScore }}</span>
          </div>
          <div class="stat-item">
              <span class="label">Score:</span>
              <span class="val">{{ score }}</span>
          </div>
          <div class="stat-item">
              <span class="label">Coins:</span>
              <span class="val coin-val">🪙 {{ coin }}</span>
          </div>
          <div class="stat-item">
              <span class="label">Mistakes:</span>
              <span class="val mistake-val">{{ mistake }}/2</span>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, watch, onMounted } from 'vue';

const props = defineProps({
  score: { type: Number, default: 0 },
  coin: { type: Number, default: 0 },
  mistake: { type: Number, default: 0 },
});

const highScore = ref(0);

onMounted(() => {
  const saved = localStorage.getItem('subway_surfers_highscore');
  if (saved) {
    highScore.value = parseInt(saved, 10) || 0;
  }
});

watch(() => props.score, (newScore) => {
  if (newScore > highScore.value) {
    highScore.value = newScore;
    localStorage.setItem('subway_surfers_highscore', newScore.toString());
  }
});
</script>

<style scoped>
.score_container {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 998;
  pointer-events: none;
}

.score_panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 18px;
  background: rgba(15, 15, 25, 0.85);
  color: #fff;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  min-width: 170px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
}

.label {
  color: #a0a0b0;
  font-weight: 500;
}

.val {
  font-weight: 700;
  color: #ffffff;
}

.high-score {
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding-bottom: 4px;
  margin-bottom: 2px;
}

.high-score .label {
  color: #f1c40f;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.high-score .val {
  color: #f1c40f;
}

.coin-val {
  color: #f39c12;
}

.mistake-val {
  color: #e74c3c;
}
</style>
