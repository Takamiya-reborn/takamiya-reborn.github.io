<script setup lang="ts">
// 彩蛋层：科乐美 → confetti + toast + party；进站成就弹窗。nuked 后仍在（终端留场）
import { easterEgg } from "~/config/site";
import { accentPalette } from "~/utils/theme";

// 彩纸颜色：六色主题池，浅色主题自动跟随
interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  dur: number;
  size: number;
  color: string;
  round: boolean;
}

const confetti = ref<ConfettiPiece[]>([]);
const party = useState("egg-party", () => false);
const toast = ref("");
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let partyTimer: ReturnType<typeof setTimeout> | undefined;

function celebrate() {
  confetti.value = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 2.4 + Math.random() * 1.6,
    size: 6 + Math.random() * 7,
    color: accentPalette[i % accentPalette.length]!,
    round: Math.random() > 0.5,
  }));
  party.value = true;
  toast.value = easterEgg.toast;

  clearTimeout(toastTimer);
  clearTimeout(partyTimer);
  toastTimer = setTimeout(() => (toast.value = ""), 2600);
  partyTimer = setTimeout(() => {
    confetti.value = [];
    party.value = false;
  }, 4200);
}

useKonami(celebrate, easterEgg.keys);

// 进站成就：1.6s 后弹、6.6s 后收
const achievement = ref(false);
let achievementTimers: ReturnType<typeof setTimeout>[] = [];

onMounted(() => {
  achievementTimers = [
    setTimeout(() => (achievement.value = true), 1600),
    setTimeout(() => (achievement.value = false), 6600),
  ];
});

onUnmounted(() => achievementTimers.forEach(clearTimeout));
</script>

<template>
  <div class="confetti-layer" aria-hidden="true">
    <span v-for="p in confetti" :key="p.id" class="confetti" :style="{
      left: `${p.left}%`,
      width: `${p.size}px`,
      height: `${p.round ? p.size : p.size * 0.45}px`,
      background: p.color,
      borderRadius: p.round ? '50%' : '1px',
      animationDelay: `${p.delay}s`,
      animationDuration: `${p.dur}s`,
    }" />
  </div>

  <Transition name="toast">
    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </Transition>

  <!-- Xbox 风格成就弹窗 -->
  <Transition name="achv">
    <div v-if="achievement" class="achv" role="status">
      <span class="achv-icon">
        <Icon name="lucide:trophy" size="22" />
      </span>
      <div class="achv-body">
        <p class="achv-title">{{ easterEgg.achievement.title }}</p>
        <p class="achv-desc">{{ easterEgg.achievement.desc }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confetti-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow: hidden;
  pointer-events: none;
}

.confetti {
  position: absolute;
  top: 0;
  animation: drop linear forwards;
}

.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 70;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  color: var(--text);
  background: var(--bg-soft);
  border: 1px solid var(--accent-border);
  border-radius: 999px;
  box-shadow: var(--glow);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s var(--ease-bouncy);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}

.achv {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 70;
  /* 超窄屏收敛宽度，防横向溢出 */
  max-width: min(24rem, calc(100vw - 2.5rem));
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.1rem;
  background: var(--bg-soft);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  box-shadow: 0 1rem 2.5rem var(--shadow-deep);
}

.achv-icon {
  display: grid;
  place-items: center;
  width: 2.8rem;
  height: 2.8rem;
  color: #3fd16f;
  background: rgba(16, 124, 16, 0.18);
  border: 1px solid rgba(63, 209, 111, 0.4);
  border-radius: var(--radius-sm);
}

.achv-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.achv-desc {
  font-size: 0.76rem;
  color: var(--muted);
}

.achv-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.45s var(--ease-bouncy);
}

.achv-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.achv-enter-from,
.achv-leave-to {
  opacity: 0;
  transform: translateX(120%);
}

@keyframes drop {
  from {
    transform: translateY(-6vh) rotate(0deg);
  }

  to {
    transform: translateY(112vh) rotate(720deg);
  }
}
</style>
