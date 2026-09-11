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
  margin-bottom: 18px;
  text-align: left;
  display: flex;
  justify-content: flex-start;
  padding: 0 6px;
}

.app-title {
  font-family: 'Prosto One', cursive, sans-serif;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: 1px;
  color: #ffffff;
}

@media (max-width: 600px) {
  .app-header {
    margin-bottom: 14px;
    padding: 0 4px;
  }

  .app-title {
    font-size: 28px;
  }
}
</style>
