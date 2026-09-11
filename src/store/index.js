import { createStore } from 'vuex'

const CYCLE_COLORS = [
  '#ef4444', // Ciclo 1 - Rojo
  '#f97316', // Ciclo 2 - Naranja
  '#eab308', // Ciclo 3 - Amarillo
  '#84cc16', // Ciclo 4 - Lima
  '#22c55e', // Ciclo 5 - Verde (Óptimo)
  '#10b981'  // Ciclo 6 - Verde esmeralda (Completo)
]

const CYCLE_INFO = [
  {
    number: 1,
    duration: '1h 30m',
    stage: 'Transición y Sueño Profundo Inicial',
    bodyEffect: 'Disminución de frecuencia cardíaca y temperatura corporal. Primera entrada a ondas delta.',
    tip: 'Despertar en este punto produce fuerte inercia del sueño (aturdimiento). Evitar salvo siesta de emergencia.',
    tag: 'No recomendado'
  },
  {
    number: 2,
    duration: '3h 00m',
    stage: 'Primer Ciclo REM y Reparación Básica',
    bodyEffect: 'Primer periodo REM corto. Se sintetizan hormonas de crecimiento celular.',
    tip: 'Apenas suficiente ante emergencias o viajes. Te sentirás fatigado durante el día.',
    tag: 'Mínimo de emergencia'
  },
  {
    number: 3,
    duration: '4h 30m',
    stage: 'Consolidación de Memoria y Descanso Moderado',
    bodyEffect: 'El cerebro limpia toxinas metabólicas (sistema glinfático) y consolida aprendizajes del día.',
    tip: 'Si tienes poco tiempo para dormir, 4.5 horas te permitirán despertar al final de un ciclo sin alarma traumática.',
    tag: 'Aceptable'
  },
  {
    number: 4,
    duration: '6h 00m',
    stage: 'Recuperación Física y Aumento de Fase REM',
    bodyEffect: 'Refuerzo del sistema inmune, aumento de sueño REM para salud emocional y creatividad.',
    tip: 'Un estándar funcional para días laborales intensos con un rendimiento mental adecuado.',
    tag: 'Bueno'
  },
  {
    number: 5,
    duration: '7h 30m',
    stage: 'Ciclo Óptimo y Restauración Completa',
    bodyEffect: 'Equilibrio perfecto entre sueño profundo no-REM (físico) y REM (cognitivo). Máxima claridad mental.',
    tip: 'El punto dulce recomendado por especialistas del sueño para la gran mayoría de adultos.',
    tag: 'Recomendado'
  },
  {
    number: 6,
    duration: '9h 00m',
    stage: 'Regeneración Total y Reparación Muscular Profunda',
    bodyEffect: 'Pico de producción de hormona del crecimiento, restauración tisular y descanso neurológico total.',
    tip: 'Excelente para atletas, personas en recuperación física o tras periodos de agotamiento severo.',
    tag: 'Óptimo'
  }
]

function safeParseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hours: 23, minutes: 0, formatted: '23:00' }
  }
  const parts = timeStr.split(':')
  let h = parseInt(parts[0], 10)
  let m = parseInt(parts[1], 10)

  if (isNaN(h) || h < 0) h = 0
  if (h > 23) h = 23

  if (isNaN(m) || m < 0) m = 0
  if (m > 59) m = 59

  const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return { hours: h, minutes: m, formatted }
}

export default createStore({
  state: {
    mode: 'bed', // 'bed' = "me quiero acostar a las", 'wake' = "me quiero levantar a las"
    targetTime: '23:00',
    includeFallAsleepLatency: false,
    cycles: [],
    hasCalculated: false
  },
  getters: {
    mode: state => state.mode,
    targetTime: state => state.targetTime,
    parsedTargetTime: state => safeParseTime(state.targetTime),
    includeFallAsleepLatency: state => state.includeFallAsleepLatency,
    cycles: state => state.cycles,
    hasCalculated: state => state.hasCalculated,
    targetTimeMinutes: state => {
      const { hours, minutes } = safeParseTime(state.targetTime)
      return hours * 60 + minutes
    }
  },
  mutations: {
    SET_MODE(state, mode) {
      state.mode = mode
    },
    SET_TARGET_TIME(state, time) {
      const { formatted } = safeParseTime(time)
      state.targetTime = formatted
    },
    SET_INCLUDE_LATENCY(state, value) {
      state.includeFallAsleepLatency = value
    },
    SET_CYCLES(state, cycles) {
      state.cycles = cycles
      state.hasCalculated = true
    }
  },
  actions: {
    calculateSleepCycles({ commit, state }) {
      const { hours, minutes } = safeParseTime(state.targetTime)
      const baseMinutes = hours * 60 + minutes
      const latency = state.includeFallAsleepLatency ? 14 : 0
      const isBedMode = state.mode === 'bed'

      const calculated = []

      for (let i = 1; i <= 6; i++) {
        const cycleDurationMinutes = i * 90
        let totalMinutes

        if (isBedMode) {
          totalMinutes = (baseMinutes + latency + cycleDurationMinutes) % (24 * 60)
        } else {
          totalMinutes = ((baseMinutes - latency - cycleDurationMinutes) % (24 * 60) + (24 * 60)) % (24 * 60)
        }

        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        const formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

        // Ángulo en reloj de 12 horas (720 min = 360°, 12:00 = -90°)
        const clockMinutes = (h % 12) * 60 + m
        const angleDeg = (clockMinutes / 720) * 360 - 90

        const info = CYCLE_INFO[i - 1]

        calculated.push({
          number: i,
          time: formattedTime,
          hours: h,
          minutes: m,
          angleDeg,
          color: CYCLE_COLORS[i - 1],
          ...info
        })
      }

      commit('SET_CYCLES', calculated)
    }
  }
})
