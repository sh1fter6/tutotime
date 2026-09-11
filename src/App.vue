<template>
  <main class="app-container">
    <header class="app-header">
      <h1 class="app-title">Tutotime</h1>
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
  width: 100%;
  max-width: 800px;
  margin-bottom: 20px;
  text-align: center;
  display: flex;
  justify-content: center;
}

.app-title {
  font-family: 'Prosto One', cursive, sans-serif;
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-align: center;
  color: #ffffff;
}

@media (max-width: 600px) {
  .app-header {
    margin-bottom: 14px;
  }

  .app-title {
    font-size: 30px;
  }
}
</style>
