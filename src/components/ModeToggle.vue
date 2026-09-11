<template>
  <div class="mode-toggle-container">
    <div class="mode-toggle">
      <button
        type="button"
        :class="['toggle-btn', { active: mode === 'bed' }]"
        @click="setMode('bed')"
      >
        Me quiero acostar a las
      </button>
      <button
        type="button"
        :class="['toggle-btn', { active: mode === 'wake' }]"
        @click="setMode('wake')"
      >
        Me quiero levantar a las
      </button>
    </div>

    <!-- Opción sutil para latencia de conciliar el sueño (14 min) -->
    <label class="latency-toggle" title="Añade 14 minutos promedio que tarda una persona en quedarse dormida">
      <input
        type="checkbox"
        :checked="includeLatency"
        @change="toggleLatency"
      />
      <span>Incluir ~14 min para conciliar el sueño</span>
    </label>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ModeToggle',
  setup() {
    const store = useStore()
    const mode = computed(() => store.getters.mode)
    const includeLatency = computed(() => store.getters.includeFallAsleepLatency)
    const hasCalculated = computed(() => store.getters.hasCalculated)

    const setMode = (newMode) => {
      store.commit('SET_MODE', newMode)
      if (hasCalculated.value) {
        store.dispatch('calculateSleepCycles')
      }
    }

    const toggleLatency = (e) => {
      store.commit('SET_INCLUDE_LATENCY', e.target.checked)
      if (hasCalculated.value) {
        store.dispatch('calculateSleepCycles')
      }
    }

    return {
      mode,
      includeLatency,
      setMode,
      toggleLatency
    }
  }
}
</script>

<style scoped>
.mode-toggle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
}

.mode-toggle {
  display: flex;
  width: 450px;
  max-width: 90vw;
  border: 1px solid #ffffff;
  border-radius: 10px;
  overflow: hidden;
  background-color: #000000;
  user-select: none;
}

.toggle-btn {
  flex: 1 1 0;
  background-color: #000000;
  color: #ffffff;
  border: none;
  padding: 10px 14px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.toggle-btn:first-child {
  border-right: 1px solid #ffffff;
}

.toggle-btn.active {
  background-color: #ffffff;
  color: #000000;
}

.latency-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #cccccc;
  cursor: pointer;
  user-select: none;
}

.latency-toggle input[type="checkbox"] {
  accent-color: #ffffff;
  cursor: pointer;
  width: 14px;
  height: 14px;
}

@media (max-width: 600px) {
  .mode-toggle {
    width: 100%;
    max-width: 380px;
  }

  .toggle-btn {
    padding: 9px 8px;
    font-size: 12px;
  }

  .latency-toggle {
    font-size: 11px;
  }
}

@media (max-width: 380px) {
  .toggle-btn {
    padding: 8px 4px;
    font-size: 11px;
  }
}
</style>
