<template>
  <div v-if="showMask" class="game-mask">
    <div class="menu-card">
      <div class="header-section">
        <div class="badge-tag">{{ gameStatus === 'end' ? 'GAME OVER' : 'RUNNER GARAGE' }}</div>
        <h2 class="menu-title">SELECT YOUR RUNNER</h2>
      </div>

      <div class="character-grid">
        <div
          v-for="char in characters"
          :key="char.id"
          :class="['char-card', { active: selectedCharacter === char.id }]"
          @click="selectCharacter(char.id)"
        >
          <div
            class="char-avatar-ring"
            :style="{ borderColor: '#' + char.color.toString(16).padStart(6, '0') }"
          >
            <span
              class="char-avatar-inner"
              :style="{ backgroundColor: '#' + char.color.toString(16).padStart(6, '0') }"
            ></span>
          </div>
          <div class="char-info">
            <span class="char-name">{{ char.name }}</span>
            <span class="char-style">{{ char.style }}</span>
          </div>
          <div v-if="selectedCharacter === char.id" class="check-badge">✓</div>
        </div>
      </div>

      <div class="action-section">
        <button class="play-btn" @click="triggerAction">
          <span class="play-btn-glow"></span>
          <span class="play-btn-text">{{ gameStatus === 'end' ? 'TRY AGAIN' : 'TAP TO RUN' }}</span>
        </button>

        <div class="controls-card">
          <div class="control-row">
            <span class="ctrl-key">W / UP / SPACE</span>
            <span class="ctrl-desc">Jump over obstacles</span>
          </div>
          <div class="control-row">
            <span class="ctrl-key">A / D / SWIPE</span>
            <span class="ctrl-desc">Switch track lane</span>
          </div>
          <div class="control-row">
            <span class="ctrl-key">S / DOWN</span>
            <span class="ctrl-desc">Slide under barriers</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, watch } from 'vue';
import { CHARACTERS } from '@/Game/player';

const props = defineProps({
  showMask: { type: Boolean, default: false },
  gameStatus: { type: String, default: 'ready' },
  modelValue: { type: String, default: 'classic' },
});

const emit = defineEmits(['update:modelValue', 'select-character', 'start-game', 'restart-game']);

function triggerAction() {
  if (props.gameStatus === 'end') {
    emit('restart-game');
  } else {
    emit('start-game');
  }
}

const characters = CHARACTERS;
const selectedCharacter = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
  selectedCharacter.value = newVal;
});

function selectCharacter(id: string) {
  selectedCharacter.value = id;
  emit('update:modelValue', id);
  emit('select-character', id);
}
</script>

<style scoped>
.game-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 14, 23, 0.82);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.menu-card {
  width: 92%;
  max-width: 520px;
  background: linear-gradient(165deg, rgba(28, 38, 56, 0.95) 0%, rgba(15, 20, 31, 0.98) 100%);
  border-radius: 28px;
  padding: 2.2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  color: #fff;
}

.header-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.badge-tag {
  background: linear-gradient(90deg, #ff007f, #ff5e00);
  padding: 0.25rem 0.8rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 0, 127, 0.4);
}

.menu-title {
  font-size: 1.6rem;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 1px;
  background: linear-gradient(180deg, #ffffff 0%, #a1a8c1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.character-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.char-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.8rem 1.2rem;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}

.char-card:hover {
  background: rgba(255, 255, 255, 0.09);
  transform: translateY(-2px);
}

.char-card.active {
  background: linear-gradient(90deg, rgba(0, 242, 254, 0.15) 0%, rgba(79, 172, 254, 0.05) 100%);
  border-color: #00f2fe;
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.25);
}

.char-avatar-ring {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3px;
  background: rgba(0, 0, 0, 0.3);
}

.char-avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.char-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.char-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
}

.char-style {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
}

.check-badge {
  background: #00f2fe;
  color: #000;
  font-weight: 900;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.85rem;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.6);
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  align-items: center;
}

.play-btn {
  position: relative;
  width: 100%;
  padding: 1.1rem;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  color: #0d121d;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 242, 254, 0.4);
  transition: all 0.25s ease;
}

.play-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(0, 242, 254, 0.6);
}

.play-btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: skewX(-20deg);
  animation: shine 2.5s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  50%, 100% { left: 200%; }
}

.controls-card {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 0.8rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}

.ctrl-key {
  font-weight: 800;
  color: #ffe600;
  background: rgba(255, 230, 0, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
}

.ctrl-desc {
  color: rgba(255, 255, 255, 0.7);
}
</style>