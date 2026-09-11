<template>
  <main class="app-container">
    <header class="app-header">
      <h1 class="app-title">Calculadora de sueño</h1>
    </header>

    <ModeToggle />
    <SleepClock />
    <CycleDescriptions />
  </main>
</template>

<script>
import ModeToggle from './components/ModeToggle.vue'
import SleepClock from './components/SleepClock.vue'
import CycleDescriptions from './components/CycleDescriptions.vue'

export default {
  name: 'App',
  components: {
    ModeToggle,
    SleepClock,
    CycleDescriptions
  }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-header {
  margin-bottom: 20px;
  text-align: center;
}

.app-title {
  font-family: 'Prosto One', cursive, sans-serif;
  font-size: 26px;
  font-weight: 400;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ffffff;
}
</style>
