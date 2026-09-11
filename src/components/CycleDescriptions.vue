<template>
  <div v-if="hasCalculated" class="descriptions-container">
    <div class="descriptions-header">
      <h2 class="descriptions-title">
        {{ mode === 'bed' ? 'Horas recomendadas para despertar:' : 'Horas recomendadas para acostarte:' }}
      </h2>
      <p class="descriptions-subtitle">
        Un ciclo de sueño promedio dura 90 minutos. Despertar al final de un ciclo evita la inercia del sueño y el cansancio matutino.
      </p>
    </div>

    <div class="cycles-grid">
      <div
        v-for="cycle in cycles"
        :key="cycle.number"
        class="cycle-card"
        :style="{ '--cycle-color': cycle.color }"
      >
        <div class="cycle-card-top">
          <div class="cycle-indicator" :style="{ backgroundColor: cycle.color }"></div>
          <span class="cycle-number">Ciclo {{ cycle.number }}</span>
          <span class="cycle-duration">({{ cycle.duration }})</span>
          <span class="cycle-time">{{ cycle.time }}</span>
        </div>

        <div class="cycle-stage">{{ cycle.stage }}</div>

        <div class="cycle-section">
          <span class="section-label">En el cuerpo:</span>
          <p class="section-text">{{ cycle.bodyEffect }}</p>
        </div>

        <div class="cycle-section">
          <span class="section-label">Tip:</span>
          <p class="section-text">{{ cycle.tip }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'CycleDescriptions',
  setup() {
    const store = useStore()
    const mode = computed(() => store.getters.mode)
    const cycles = computed(() => store.getters.cycles)
    const hasCalculated = computed(() => store.getters.hasCalculated)

    return {
      mode,
      cycles,
      hasCalculated
    }
  }
}
</script>

<style scoped>
.descriptions-container {
  width: 100%;
  max-width: 800px;
  margin-top: 10px;
  background-color: #000000;
  color: #ffffff;
}

.descriptions-header {
  text-align: center;
  margin-bottom: 24px;
}

.descriptions-title {
  font-family: 'Prosto One', cursive, sans-serif;
  font-size: 18px;
  font-weight: 400;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.descriptions-subtitle {
  font-size: 13px;
  color: #aaaaaa;
}

.cycles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.cycle-card {
  border: 1px solid #333333;
  border-radius: 10px;
  padding: 16px;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  transition: border-color 0.2s ease;
}

.cycle-card:hover {
  border-color: #ffffff;
}

.cycle-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #222222;
  padding-bottom: 8px;
}

.cycle-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cycle-number {
  font-family: 'Prosto One', cursive, sans-serif;
  font-weight: 400;
  font-size: 14px;
}

.cycle-duration {
  font-size: 12px;
  color: #888888;
}

.cycle-time {
  margin-left: auto;
  font-family: 'Zen Dots', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #ffffff;
}

.cycle-stage {
  font-size: 13px;
  font-weight: 600;
  color: #dddddd;
}

.cycle-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #777777;
  font-weight: 600;
}

.section-text {
  font-size: 12px;
  line-height: 1.4;
  color: #bbbbbb;
}

@media (max-width: 600px) {
  .descriptions-title {
    font-size: 16px;
  }

  .descriptions-subtitle {
    font-size: 12px;
  }

  .cycles-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .cycle-card {
    padding: 14px;
  }

  .cycle-time {
    font-size: 14px;
  }
}
</style>
