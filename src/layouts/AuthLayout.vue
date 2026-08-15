<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden relative animated-auth-bg">
    <!-- Esferas luminosas flotantes (Orb Mesh Animations) -->
    <div class="orb orb-1 pointer-events-none" />
    <div class="orb orb-2 pointer-events-none" />
    <div class="orb orb-3 pointer-events-none" />

    <!-- Partículas destellantes sutiles -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
      <span class="auth-sparkle s-1" />
      <span class="auth-sparkle s-2" />
      <span class="auth-sparkle s-3" />
      <span class="auth-sparkle s-4" />
      <span class="auth-sparkle s-5" />
    </div>

    <!-- Contenedor principal de Autenticación -->
    <div class="relative z-10 w-full max-w-md my-auto">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
/* Fondo con degradado animado suave */
.animated-auth-bg {
  background: linear-gradient(-45deg, #FFF0F4, #FDF2F6, #F9E2E9, #F2D3DF, #FFF5F7);
  background-size: 400% 400%;
  animation: gradientShift 16s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Esferas de luz rosa flotantes más sutiles */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(240,160,175,0.5) 0%, rgba(253,221,230,0) 70%);
  top: -120px;
  left: -100px;
  animation: floatOrb1 18s ease-in-out infinite alternate;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(235,150,170,0.4) 0%, rgba(253,221,230,0) 70%);
  bottom: -150px;
  right: -120px;
  animation: floatOrb2 22s ease-in-out infinite alternate;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(253,221,230,0) 70%);
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: floatOrb3 14s ease-in-out infinite alternate;
}

@keyframes floatOrb1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(60px, 80px) scale(1.15); }
  100% { transform: translate(-30px, 40px) scale(0.9); }
}

@keyframes floatOrb2 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-70px, -60px) scale(1.2); }
  100% { transform: translate(40px, -30px) scale(0.85); }
}

@keyframes floatOrb3 {
  0% { transform: translate(-50%, -50%) scale(0.9); }
  50% { transform: translate(-40%, -60%) scale(1.1); }
  100% { transform: translate(-60%, -40%) scale(1); }
}

/* Partículas destellantes */
.auth-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(224,122,120,0.8) 60%, rgba(255,255,255,0) 100%);
  box-shadow: 0 0 10px rgba(224, 122, 120, 0.7);
  animation: authSparkle 3.5s infinite ease-in-out;
}
.s-1 { top: 12%; left: 10%; animation-delay: 0s; }
.s-2 { top: 25%; right: 12%; animation-delay: 0.8s; }
.s-3 { bottom: 18%; left: 15%; animation-delay: 1.6s; }
.s-4 { bottom: 32%; right: 18%; animation-delay: 2.4s; }
.s-5 { top: 50%; left: 8%; animation-delay: 1.2s; }

@keyframes authSparkle {
  0%, 100% { opacity: 0.15; transform: scale(0.4) rotate(0deg); }
  50% { opacity: 0.95; transform: scale(1.4) rotate(45deg); }
}
</style>
