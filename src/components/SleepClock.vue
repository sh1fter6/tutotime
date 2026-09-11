<template>
  <div class="sleep-clock-container">
    <div class="clock-stage">
      <svg
        class="clock-svg"
        viewBox="0 0 520 520"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 12 Marcas horarias del reloj -->
        <g class="clock-ticks">
          <line
            v-for="tick in ticks"
            :key="tick.index"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linecap="round"
          />
        </g>

        <!-- Círculo base blanco (only border) -->
        <circle
          :cx="cx"
          :cy="cy"
          :r="r"
          fill="none"
          stroke="#ffffff"
          stroke-width="2"
        />

        <!-- Punto indicador de la hora base seleccionada -->
        <circle
          v-if="hasCalculated"
          :cx="startTimeCoord.x"
          :cy="startTimeCoord.y"
          r="4.5"
          fill="#ffffff"
          stroke="#000000"
          stroke-width="1.5"
          class="start-time-dot"
        />

        <!-- Arcos de los 6 ciclos de sueño (en orden 6 a 1 para que 1 quede encima de 2, etc.) -->
        <g v-if="hasCalculated" class="cycle-arcs">
          <path
            v-for="arc in reversedCycleArcs"
            :key="'arc-' + arc.number"
            :d="arc.pathD"
            fill="none"
            :stroke="arc.color"
            stroke-width="7"
            stroke-linecap="round"
            class="cycle-arc-path"
            :class="{ 'intro-anim': isIntroAnimActive }"
            :style="{
              '--arc-length': arc.length,
              '--anim-delay': `${(arc.number - 1) * 0.075}s`
            }"
          />

          <!-- Puntos en los extremos de cada ciclo -->
          <circle
            v-for="dot in cycleDots"
            :key="'dot-' + dot.number"
            :cx="dot.x"
            :cy="dot.y"
            r="3.5"
            :fill="dot.color"
            stroke="#000000"
            stroke-width="1"
            class="cycle-dot"
            :class="{ 'intro-anim': isIntroAnimActive }"
            :style="{
              '--anim-delay': `${(dot.number - 1) * 0.075 + 0.05}s`
            }"
          />
        </g>

        <!-- Horas exactas fuera del círculo con alineación dinámica y transición de opacidad al cambiar toggle -->
        <g v-if="hasCalculated" class="cycle-labels" :style="{ opacity: labelsOpacity }">
          <text
            v-for="label in cycleLabels"
            :key="'label-' + label.number"
            :x="label.x"
            :y="label.y"
            :text-anchor="label.alignment.textAnchor"
            :dominant-baseline="label.alignment.dominantBaseline"
            fill="#ffffff"
            class="cycle-label-text"
            :class="{ 'intro-anim': isIntroAnimActive }"
            :style="{
              '--anim-delay': `${(label.number - 1) * 0.075 + 0.1}s`
            }"
          >
            {{ label.time }}
          </text>
        </g>
      </svg>

      <!-- Centro del reloj: Hora centrada en Zen Dots sin bordes, soporte táctil/rueda y botón Calcular bajado y achicado -->
      <div class="clock-center">
        <div class="time-selector">
          <!-- Control de Horas (00 a 23) con soporte táctil / rueda / inercia -->
          <div
            class="time-box"
            @touchstart="onTouchStart($event, 'hours')"
            @touchmove="onTouchMove($event, 'hours')"
            @touchend="onTouchEnd($event, 'hours')"
            @touchcancel="onTouchEnd($event, 'hours')"
            @wheel.prevent="onWheel($event, 'hours')"
          >
            <button
              type="button"
              class="arrow-btn"
              @click="stepHour(1)"
              tabindex="-1"
              aria-label="Aumentar hora"
            >▲</button>

            <div class="digit-viewport">
              <input
                ref="hoursInputRef"
                type="text"
                inputmode="numeric"
                maxlength="2"
                class="time-digit-input"
                :class="hourAnimClass"
                :value="rawHours"
                @input="onHoursInput"
                @blur="onHoursBlur"
                @keydown.up.prevent="stepHour(1)"
                @keydown.down.prevent="stepHour(-1)"
                @keydown.right="focusMinutes"
                aria-label="Horas (00 a 23)"
              />
            </div>

            <button
              type="button"
              class="arrow-btn"
              @click="stepHour(-1)"
              tabindex="-1"
              aria-label="Disminuir hora"
            >▼</button>
          </div>

          <span class="time-colon">:</span>

          <!-- Control de Minutos (SIEMPRE 2 dígitos 00 a 59) con soporte táctil / rueda / inercia -->
          <div
            class="time-box"
            @touchstart="onTouchStart($event, 'minutes')"
            @touchmove="onTouchMove($event, 'minutes')"
            @touchend="onTouchEnd($event, 'minutes')"
            @touchcancel="onTouchEnd($event, 'minutes')"
            @wheel.prevent="onWheel($event, 'minutes')"
          >
            <button
              type="button"
              class="arrow-btn"
              @click="stepMinute(1)"
              tabindex="-1"
              aria-label="Aumentar minutos"
            >▲</button>

            <div class="digit-viewport">
              <input
                ref="minutesInputRef"
                type="text"
                inputmode="numeric"
                maxlength="2"
                class="time-digit-input"
                :class="minuteAnimClass"
                :value="rawMinutes"
                @input="onMinutesInput"
                @blur="onMinutesBlur"
                @keydown.up.prevent="stepMinute(1)"
                @keydown.down.prevent="stepMinute(-1)"
                @keydown.left="focusHours"
                aria-label="Minutos (00 a 59)"
              />
            </div>

            <button
              type="button"
              class="arrow-btn"
              @click="stepMinute(-1)"
              tabindex="-1"
              aria-label="Disminuir minutos"
            >▼</button>
          </div>
        </div>

        <button
          type="button"
          class="btn-calculate"
          @click="handleCalculate"
        >
          Calcular
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SleepClock',
  setup() {
    const store = useStore()
    const hoursInputRef = ref(null)
    const minutesInputRef = ref(null)

    const cx = 260
    const cy = 260
    const r = 160
    const tickLength = 12

    const hoursNum = ref(23)
    const minutesNum = ref(0)
    const rawHours = ref('23')
    const rawMinutes = ref('00')

    const hourAnimClass = ref('')
    const minuteAnimClass = ref('')
    const isIntroAnimActive = ref(false)

    // Animación de cambio de sentido al alternar el toggle post-cálculo
    const displayedMode = ref('bed')
    const arcProgress = ref(1)
    const labelsOpacity = ref(1)
    let toggleAnimId = null

    // Feedback háptico (vibración en móviles compatibles)
    const triggerHaptic = (ms = 10) => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(ms)
        } catch (e) {
          // Silencioso si no está disponible
        }
      }
    }

    // Sincronizar hora inicial
    onMounted(() => {
      const parsed = store.getters.parsedTargetTime
      hoursNum.value = parsed.hours
      minutesNum.value = parsed.minutes
      rawHours.value = String(parsed.hours).padStart(2, '0')
      rawMinutes.value = String(parsed.minutes).padStart(2, '0')
      displayedMode.value = store.getters.mode
      currentAngle.value = calcTargetBaseAngle()
      currentDotAngle.value = calcBaseBedtimeAngle()
    })

    const mode = computed(() => store.getters.mode)
    const cycles = computed(() => store.getters.cycles)
    const hasCalculated = computed(() => store.getters.hasCalculated)
    const includeLatency = computed(() => store.getters.includeFallAsleepLatency)

    // Cálculo del ángulo base de la hora
    const calcBaseBedtimeAngle = () => {
      const h = hoursNum.value || 0
      const m = minutesNum.value || 0
      const clockMinutes = (h % 12) * 60 + m
      return (clockMinutes / 720) * 360 - 90
    }

    const calcTargetBaseAngle = () => {
      let baseDeg = calcBaseBedtimeAngle()
      if (includeLatency.value) {
        const latencyDeg = (14 / 720) * 360
        if (mode.value === 'bed') {
          baseDeg += latencyDeg
        } else {
          baseDeg -= latencyDeg
        }
      }
      return baseDeg
    }

    // Ángulos dinámicos con animación suave (lerp/RAF)
    const currentAngle = ref(calcTargetBaseAngle())
    const currentDotAngle = ref(calcBaseBedtimeAngle())
    let animId = null

    const animateToAngle = (targetDeg, targetDotDeg) => {
      if (animId) cancelAnimationFrame(animId)

      const startA = currentAngle.value
      let diffA = (targetDeg - startA) % 360
      if (diffA > 180) diffA -= 360
      if (diffA < -180) diffA += 360
      const endA = startA + diffA

      const startDotA = currentDotAngle.value
      let diffDot = (targetDotDeg - startDotA) % 360
      if (diffDot > 180) diffDot -= 360
      if (diffDot < -180) diffDot += 360
      const endDotA = startDotA + diffDot

      const startTime = performance.now()
      const duration = 360 // ms

      const step = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)

        currentAngle.value = startA + (endA - startA) * ease
        currentDotAngle.value = startDotA + (endDotA - startDotA) * ease

        if (progress < 1) {
          animId = requestAnimationFrame(step)
        } else {
          currentAngle.value = endA % 360
          currentDotAngle.value = endDotA % 360
          animId = null
        }
      }

      animId = requestAnimationFrame(step)
    }

    // Animación de repliegue y despliegue al cambiar toggle post cálculo
    const runToggleAnimation = (newMode) => {
      if (toggleAnimId) cancelAnimationFrame(toggleAnimId)

      // Fase 1: Retroceder todas las líneas (220ms)
      const retractStart = performance.now()
      const retractDuration = 220

      const stepRetract = (now) => {
        const elapsed = now - retractStart
        const progress = Math.min(elapsed / retractDuration, 1)
        // easeInQuad para recoger las líneas
        arcProgress.value = 1 - Math.pow(progress, 2)
        labelsOpacity.value = 1 - progress

        if (progress < 1) {
          toggleAnimId = requestAnimationFrame(stepRetract)
        } else {
          arcProgress.value = 0
          labelsOpacity.value = 0
          displayedMode.value = newMode

          // Actualizar el ángulo objetivo para el nuevo modo
          animateToAngle(calcTargetBaseAngle(), calcBaseBedtimeAngle())

          // Fase 2: Expandir en el nuevo sentido inverso (320ms)
          triggerHaptic(15)
          const expandStart = performance.now()
          const expandDuration = 320

          const stepExpand = (nowExpand) => {
            const elapsedExpand = nowExpand - expandStart
            const pExpand = Math.min(elapsedExpand / expandDuration, 1)
            // easeOutCubic para despliegue suave
            arcProgress.value = 1 - Math.pow(1 - pExpand, 3)
            labelsOpacity.value = pExpand

            if (pExpand < 1) {
              toggleAnimId = requestAnimationFrame(stepExpand)
            } else {
              arcProgress.value = 1
              labelsOpacity.value = 1
              toggleAnimId = null
            }
          }

          toggleAnimId = requestAnimationFrame(stepExpand)
        }
      }

      toggleAnimId = requestAnimationFrame(stepRetract)
    }

    // Vigilar cambios de modo: si ya calculó, retrocede y expande; si no, actualiza inmediato
    watch(mode, (newMode, oldMode) => {
      if (newMode !== oldMode) {
        if (hasCalculated.value) {
          runToggleAnimation(newMode)
        } else {
          displayedMode.value = newMode
        }
      }
    })

    // Control táctil e inercia estilo alarma iOS
    const touchState = {
      hours: {
        lastY: 0,
        startTime: 0,
        accumulatedDelta: 0,
        velocity: 0,
        inertiaId: null
      },
      minutes: {
        lastY: 0,
        startTime: 0,
        accumulatedDelta: 0,
        velocity: 0,
        inertiaId: null
      }
    }

    const STEP_THRESHOLD = 24

    const stopInertia = (type) => {
      if (touchState[type].inertiaId) {
        cancelAnimationFrame(touchState[type].inertiaId)
        touchState[type].inertiaId = null
      }
    }

    const onTouchStart = (e, type) => {
      stopInertia(type)
      const state = touchState[type]
      state.lastY = e.touches[0].clientY
      state.startTime = performance.now()
      state.accumulatedDelta = 0
      state.velocity = 0
    }

    const onTouchMove = (e, type) => {
      const state = touchState[type]
      const currentY = e.touches[0].clientY
      const deltaY = currentY - state.lastY
      const now = performance.now()
      const dt = now - state.startTime || 16

      state.velocity = 0.6 * (deltaY / dt) + 0.4 * state.velocity
      state.lastY = currentY
      state.startTime = now
      state.accumulatedDelta += deltaY

      // Deslizar hacia arriba aumenta, deslizar hacia abajo disminuye
      if (state.accumulatedDelta <= -STEP_THRESHOLD) {
        const steps = Math.floor(-state.accumulatedDelta / STEP_THRESHOLD)
        if (type === 'hours') stepHour(steps)
        else stepMinute(steps)
        state.accumulatedDelta += steps * STEP_THRESHOLD
      } else if (state.accumulatedDelta >= STEP_THRESHOLD) {
        const steps = Math.floor(state.accumulatedDelta / STEP_THRESHOLD)
        if (type === 'hours') stepHour(-steps)
        else stepMinute(-steps)
        state.accumulatedDelta -= steps * STEP_THRESHOLD
      }
    }

    const onTouchEnd = (e, type) => {
      const state = touchState[type]
      let vel = state.velocity

      // Inercia con frenado suave
      if (Math.abs(vel) > 0.22) {
        let lastTime = performance.now()
        let accum = 0

        const runInertia = (now) => {
          const dt = now - lastTime
          lastTime = now

          accum += vel * dt

          if (accum <= -STEP_THRESHOLD) {
            if (type === 'hours') stepHour(1)
            else stepMinute(1)
            accum += STEP_THRESHOLD
          } else if (accum >= STEP_THRESHOLD) {
            if (type === 'hours') stepHour(-1)
            else stepMinute(-1)
            accum -= STEP_THRESHOLD
          }

          vel *= Math.pow(0.92, dt / 16)

          if (Math.abs(vel) > 0.035) {
            state.inertiaId = requestAnimationFrame(runInertia)
          } else {
            state.inertiaId = null
          }
        }

        state.inertiaId = requestAnimationFrame(runInertia)
      }
    }

    const onWheel = (e, type) => {
      const delta = Math.sign(e.deltaY)
      if (delta > 0) {
        if (type === 'hours') stepHour(-1)
        else stepMinute(-1)
      } else if (delta < 0) {
        if (type === 'hours') stepHour(1)
        else stepMinute(1)
      }
    }

    onUnmounted(() => {
      if (animId) cancelAnimationFrame(animId)
      if (toggleAnimId) cancelAnimationFrame(toggleAnimId)
      stopInertia('hours')
      stopInertia('minutes')
    })

    // Sincronización en tiempo real post-cálculo
    const syncTimeAndRecalculate = () => {
      const h = hoursNum.value
      const m = minutesNum.value
      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      store.commit('SET_TARGET_TIME', formatted)

      if (hasCalculated.value) {
        store.dispatch('calculateSleepCycles')
        animateToAngle(calcTargetBaseAngle(), calcBaseBedtimeAngle())
      }
    }

    // Vigilar checkbox de 14 min para desplazar suavemente la línea en tiempo real
    watch(includeLatency, () => {
      if (hasCalculated.value) {
        animateToAngle(calcTargetBaseAngle(), calcBaseBedtimeAngle())
      }
    })

    // Input handlers: mantiene el foco SIEMPRE sin destruir elementos al borrar
    const onHoursInput = (e) => {
      let val = e.target.value.replace(/\D/g, '')
      if (val.length > 2) val = val.slice(-2)

      rawHours.value = val
      if (val !== '') {
        let num = parseInt(val, 10)
        if (num > 23) {
          num = 23
          val = '23'
          rawHours.value = val
        }
        hoursNum.value = num
        syncTimeAndRecalculate()
        if (val.length === 2 && minutesInputRef.value) {
          minutesInputRef.value.focus()
          minutesInputRef.value.select()
        }
      }
    }

    const onHoursBlur = () => {
      let num = parseInt(rawHours.value, 10)
      if (isNaN(num) || num < 0) num = 0
      if (num > 23) num = 23
      hoursNum.value = num
      rawHours.value = String(num).padStart(2, '0')
      syncTimeAndRecalculate()
    }

    const onMinutesInput = (e) => {
      let val = e.target.value.replace(/\D/g, '')
      if (val.length > 2) val = val.slice(-2)

      rawMinutes.value = val
      if (val !== '') {
        let num = parseInt(val, 10)
        if (num > 59) {
          num = 59
          val = '59'
          rawMinutes.value = val
        }
        minutesNum.value = num
        syncTimeAndRecalculate()
      }
    }

    const onMinutesBlur = () => {
      let num = parseInt(rawMinutes.value, 10)
      if (isNaN(num) || num < 0) num = 0
      if (num > 59) num = 59
      minutesNum.value = num
      rawMinutes.value = String(num).padStart(2, '0')
      syncTimeAndRecalculate()
    }

    const stepHour = (delta) => {
      hourAnimClass.value = delta > 0 ? 'anim-slide-up' : 'anim-slide-down'
      setTimeout(() => {
        hourAnimClass.value = ''
      }, 160)

      let next = (hoursNum.value + delta + 24) % 24
      hoursNum.value = next
      rawHours.value = String(next).padStart(2, '0')
      triggerHaptic(12)
      syncTimeAndRecalculate()
    }

    const stepMinute = (delta) => {
      minuteAnimClass.value = delta > 0 ? 'anim-slide-up' : 'anim-slide-down'
      setTimeout(() => {
        minuteAnimClass.value = ''
      }, 160)

      let next = (minutesNum.value + delta + 60) % 60
      minutesNum.value = next
      rawMinutes.value = String(next).padStart(2, '0')
      triggerHaptic(12)
      syncTimeAndRecalculate()
    }

    const focusMinutes = () => {
      if (minutesInputRef.value) {
        minutesInputRef.value.focus()
        minutesInputRef.value.select()
      }
    }

    const focusHours = () => {
      if (hoursInputRef.value) {
        hoursInputRef.value.focus()
        hoursInputRef.value.select()
      }
    }

    // 12 Marcas radiales del reloj
    const ticks = computed(() => {
      const result = []
      for (let i = 0; i < 12; i++) {
        const rad = (i * 30 - 90) * (Math.PI / 180)
        result.push({
          index: i,
          x1: cx + (r - tickLength) * Math.cos(rad),
          y1: cy + (r - tickLength) * Math.sin(rad),
          x2: cx + r * Math.cos(rad),
          y2: cy + r * Math.sin(rad)
        })
      }
      return result
    })

    // Coordenadas del punto de inicio base (desplaza suavemente)
    const startTimeCoord = computed(() => {
      const rad = currentDotAngle.value * (Math.PI / 180)
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      }
    })

    // Función matemática para construir arcos en SVG
    const createArcD = (startDeg, endDeg, isClockwise) => {
      const startRad = startDeg * (Math.PI / 180)
      const endRad = endDeg * (Math.PI / 180)

      const x1 = cx + r * Math.cos(startRad)
      const y1 = cy + r * Math.sin(startRad)
      const x2 = cx + r * Math.cos(endRad)
      const y2 = cy + r * Math.sin(endRad)

      let deltaDeg = isClockwise
        ? (endDeg - startDeg) % 360
        : (startDeg - endDeg) % 360

      if (deltaDeg <= 0) deltaDeg += 360

      const largeArcFlag = deltaDeg > 180 ? 1 : 0
      const sweepFlag = isClockwise ? 1 : 0

      return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)}`
    }

    // Arcos calculados a partir de currentAngle reactivo, arcProgress y displayedMode
    const cycleArcs = computed(() => {
      if (!cycles.value || cycles.value.length === 0 || arcProgress.value <= 0.01) return []
      const isClockwise = displayedMode.value === 'bed'
      const startDeg = currentAngle.value

      return cycles.value.map(c => {
        const sweepAngle = (c.number * 45) * arcProgress.value
        if (sweepAngle < 0.5) return null

        const endDeg = isClockwise
          ? startDeg + sweepAngle
          : startDeg - sweepAngle

        const pathD = createArcD(startDeg, endDeg, isClockwise)
        const length = (sweepAngle * Math.PI * r) / 180

        return {
          number: c.number,
          color: c.color,
          pathD,
          length: length.toFixed(1)
        }
      }).filter(Boolean)
    })

    const reversedCycleArcs = computed(() => {
      return [...cycleArcs.value].reverse()
    })

    const cycleDots = computed(() => {
      if (!cycles.value || arcProgress.value <= 0.01) return []
      const isClockwise = displayedMode.value === 'bed'
      const startDeg = currentAngle.value

      return cycles.value.map(c => {
        const sweepAngle = (c.number * 45) * arcProgress.value
        const endDeg = isClockwise
          ? startDeg + sweepAngle
          : startDeg - sweepAngle
        const rad = endDeg * (Math.PI / 180)

        return {
          number: c.number,
          color: c.color,
          x: cx + r * Math.cos(rad),
          y: cy + r * Math.sin(rad)
        }
      })
    })

    const getAlignment = (cos, sin) => {
      let textAnchor = 'middle'
      let dominantBaseline = 'central'

      if (cos > 0.38) {
        textAnchor = 'start'
      } else if (cos < -0.38) {
        textAnchor = 'end'
      } else {
        textAnchor = 'middle'
      }

      if (sin > 0.38) {
        dominantBaseline = 'hanging'
      } else if (sin < -0.38) {
        dominantBaseline = 'auto'
      } else {
        dominantBaseline = 'central'
      }

      return { textAnchor, dominantBaseline }
    }

    const cycleLabels = computed(() => {
      if (!cycles.value || arcProgress.value <= 0.1) return []
      const isClockwise = displayedMode.value === 'bed'
      const startDeg = currentAngle.value
      const labelRadius = r + 24

      return cycles.value.map(c => {
        const sweepAngle = (c.number * 45) * arcProgress.value
        const endDeg = isClockwise
          ? startDeg + sweepAngle
          : startDeg - sweepAngle
        const rad = endDeg * (Math.PI / 180)
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        return {
          number: c.number,
          time: c.time,
          color: c.color,
          x: cx + labelRadius * cos,
          y: cy + labelRadius * sin,
          alignment: getAlignment(cos, sin)
        }
      })
    })

    const handleCalculate = () => {
      onHoursBlur()
      onMinutesBlur()
      const wasCalculated = hasCalculated.value
      displayedMode.value = mode.value
      arcProgress.value = 1
      labelsOpacity.value = 1

      store.dispatch('calculateSleepCycles')
      triggerHaptic(20)

      if (!wasCalculated) {
        isIntroAnimActive.value = true
        currentAngle.value = calcTargetBaseAngle()
        currentDotAngle.value = calcBaseBedtimeAngle()
        setTimeout(() => {
          isIntroAnimActive.value = false
        }, 800)
      } else {
        animateToAngle(calcTargetBaseAngle(), calcBaseBedtimeAngle())
      }
    }

    return {
      cx,
      cy,
      r,
      ticks,
      hoursInputRef,
      minutesInputRef,
      rawHours,
      rawMinutes,
      hourAnimClass,
      minuteAnimClass,
      labelsOpacity,
      onHoursInput,
      onHoursBlur,
      onMinutesInput,
      onMinutesBlur,
      stepHour,
      stepMinute,
      focusHours,
      focusMinutes,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onWheel,
      hasCalculated,
      isIntroAnimActive,
      startTimeCoord,
      reversedCycleArcs,
      cycleDots,
      cycleLabels,
      handleCalculate
    }
  }
}
</script>

<style scoped>
.sleep-clock-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0 25px;
  position: relative;
  user-select: none;
}

.clock-stage {
  position: relative;
  width: 520px;
  height: 520px;
  max-width: 90vw;
  max-height: 90vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

.clock-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Centro del reloj con hora geométricamente centrada y botón bajado */
.clock-center {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.time-selector {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.time-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  touch-action: none; /* Permite deslizar los números sin desplazar la pantalla */
  cursor: grab;
}

.time-box:active {
  cursor: grabbing;
}

.arrow-btn {
  background: transparent;
  color: #777777;
  border: none;
  font-size: 11px;
  padding: 3px 14px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s ease, transform 0.1s ease;
  user-select: none;
}

.arrow-btn:hover {
  color: #ffffff;
}

.arrow-btn:active {
  color: #ffffff;
  transform: scale(0.85);
}

/* Viewport con holgura suficiente para los dígitos anchos de Zen Dots */
.digit-viewport {
  position: relative;
  overflow-x: visible;
  overflow-y: hidden;
  height: 58px;
  width: 98px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Input sin bordes, centrado y con fuente Zen Dots con ancho completo sin recortes */
.time-digit-input {
  background: transparent;
  color: #ffffff;
  border: none;
  outline: none;
  font-family: 'Zen Dots', monospace, sans-serif;
  font-size: 40px;
  font-weight: 400;
  text-align: center;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  cursor: text;
  border-radius: 0;
  letter-spacing: 0;
  line-height: 58px;
  transition: transform 0.05s ease-out;
  box-sizing: border-box;
}

.time-colon {
  font-family: 'Zen Dots', monospace, sans-serif;
  font-size: 36px;
  font-weight: 400;
  color: #ffffff;
  line-height: 1;
  margin: 0 6px;
  margin-top: -6px;
  user-select: none;
}

/* Animaciones slide al cambiar hora/minuto mediante flechas o inercia */
@keyframes slideUp {
  0% { transform: translateY(40%); opacity: 0.3; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes slideDown {
  0% { transform: translateY(-40%); opacity: 0.3; }
  100% { transform: translateY(0); opacity: 1; }
}

.anim-slide-up {
  animation: slideUp 0.16s cubic-bezier(0.2, 0, 0, 1);
}

.anim-slide-down {
  animation: slideDown 0.16s cubic-bezier(0.2, 0, 0, 1);
}

/* Botón bajado, achicado, con border-radius 10 y push inner shadow */
.btn-calculate {
  position: absolute;
  top: 67%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  background-color: #000000;
  color: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 10px;
  width: 88px;
  height: 30px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  cursor: pointer;
  outline: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.08s ease, box-shadow 0.08s ease, background-color 0.15s ease;
}

.btn-calculate:hover {
  background-color: #111111;
}

.btn-calculate:active {
  box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.45), inset 0 -1px 3px rgba(0, 0, 0, 0.9);
  transform: translate(-50%, -50%) scale(0.95);
}

/* Animación inicial de los arcos */
.cycle-arc-path.intro-anim {
  stroke-dasharray: var(--arc-length);
  stroke-dashoffset: var(--arc-length);
  animation: drawArc 0.35s ease-out forwards;
  animation-delay: var(--anim-delay);
}

@keyframes drawArc {
  to {
    stroke-dashoffset: 0;
  }
}

.cycle-dot.intro-anim {
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;
  animation-delay: var(--anim-delay);
}

.cycle-label-text {
  font-family: 'Zen Dots', monospace, sans-serif;
  font-size: 13px;
  user-select: none;
}

.cycle-label-text.intro-anim {
  opacity: 0;
  animation: fadeIn 0.25s ease forwards;
  animation-delay: var(--anim-delay);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Transición suave de opacidad para las etiquetas al retroceder y desplegar */
.cycle-labels {
  transition: opacity 0.18s ease;
}

/* =========================================
   MEDIA QUERIES PARA DISPOSITIVOS MÓVILES
   ========================================= */
@media (max-width: 600px) {
  .clock-stage {
    width: 360px;
    height: 360px;
    max-width: 92vw;
    max-height: 92vw;
  }

  .digit-viewport {
    width: 82px;
    height: 50px;
    overflow-x: visible;
  }

  .time-digit-input {
    font-size: 32px;
    line-height: 50px;
    letter-spacing: 0;
  }

  .time-colon {
    font-size: 28px;
    margin: 0 4px;
    margin-top: -4px;
  }

  .arrow-btn {
    padding: 2px 10px;
    font-size: 9px;
  }

  .btn-calculate {
    width: 80px;
    height: 28px;
    font-size: 10px;
    top: 68%;
  }

  .cycle-label-text {
    font-size: 11.5px;
  }
}

@media (max-width: 380px) {
  .digit-viewport {
    width: 72px;
    height: 44px;
    overflow-x: visible;
  }

  .time-digit-input {
    font-size: 27px;
    line-height: 44px;
    letter-spacing: 0;
  }

  .time-colon {
    font-size: 24px;
    margin: 0 2px;
  }

  .btn-calculate {
    width: 74px;
    height: 26px;
    font-size: 9.5px;
    top: 69%;
  }
}
</style>
