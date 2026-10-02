<template>
  <div v-if="showMask" class="game-mask">
    <div class="menu-container">
      <div class="character-select">
        <h3>Choose Character</h3>
        <div class="character-options">
          <button
            v-for="char in characters"
            :key="char.id"
            :class="['char-btn', { active: selectedCharacter === char.id }]"
            :style="{ borderColor: '#' + char.color.toString(16).padStart(6, '0') }"
            @click="selectCharacter(char.id)"
          >
            <span
              class="color-dot"
              :style="{ backgroundColor: '#' + char.color.toString(16).padStart(6, '0') }"
            ></span>
            {{ char.name }}
          </button>
        </div>
      </div>
      <div class="action-container">
        <button class="start-btn" @click="triggerAction">
          {{ gameStatus === 'end' ? 'RESTART GAME' : 'START GAME' }}
        </button>
        <div class="controls-hint">
          <p>Controls: <b>WASD</b> or <b>Arrow Keys</b> to Move/Jump/Slide</p>
          <p>Press <b>Enter</b>, <b>Space</b>, or <b>{{ textCompute.key }}</b> to {{ textCompute.text }}</p>
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

const keyMap: Record<string, any> = {
  ready: {
    key: 'P',
    text: 'to start game',
  },
  end: {
    key: 'R',
    text: 'to restart game',
  },
};

const textCompute = computed(() => {
  return keyMap[props.gameStatus] || keyMap.ready;
});
</script>

<style scoped>
.game-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.menu-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
  background: rgba(20, 20, 30, 0.85);
  padding: 30px 40px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.character-select h3 {
  color: #fff;
  font-size: 20px;
  margin-bottom: 15px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.character-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 450px;
}

.char-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid transparent;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.char-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.char-btn.active {
  background: rgba(255, 255, 255, 0.25);
  font-weight: bold;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.action-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.start-btn {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  font-size: 20px;
  font-weight: bold;
  padding: 14px 40px;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  letter-spacing: 1.5px;
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
  transition: all 0.25s ease;
}

.start-btn:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 10px 25px rgba(46, 204, 113, 0.6);
  background: linear-gradient(135deg, #27ae60, #2ecc71);
}

.controls-hint {
  color: #bdc3c7;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
}

.controls-hint b {
  color: #f39c12;
}
</style>
