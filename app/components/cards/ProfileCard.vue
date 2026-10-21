<script setup lang="ts">
import { type SlashCommand, slashCommands } from '~/utils/commands'

const props = defineProps<{
  profile: {
    name: string
    avatar: string
    tagline: string
    location: string
    bio: string
  }
}>()


// 头像加载失败（如定时任务尚未生成 avatar.png）时回退为首字母占位
const avatarFailed = ref(false)
const avatarSrc = computed(() =>
  avatarFailed.value ? '' : props.profile.avatar,
)

// 鼠标在头像上方或附近时，头像朝鼠标方向的 3D 视角跟随
const MAX_TILT = 32 // 最大倾斜角度（deg）
const RANGE_FACTOR = 3.4 // 生效半径 = 头像尺寸 × 该系数，超出即回正
const tiltX = ref(0)
const tiltY = ref(0)
const zoneEl = ref<HTMLElement | null>(null)
const prefersReducedMotion = ref(false)

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

function onTiltMove(e: PointerEvent) {
  if (prefersReducedMotion.value) return
  const zone = zoneEl.value
  if (!zone) return
  const rect = zone.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const dist = Math.hypot(dx, dy)
  const range = rect.width * RANGE_FACTOR
  if (dist > range) {
    resetTilt()
    return
  }
  // 强度包络：头像中心为 0，头像边缘达到峰值，向外线性衰减到生效半径处归零
  const peak = rect.width / 2
  const env = dist <= peak ? dist / peak : 1 - (dist - peak) / (range - peak)
  tiltY.value = (dx / dist) * env * MAX_TILT
  tiltX.value = (-dy / dist) * env * MAX_TILT
}

function resetTilt() {
  tiltX.value = 0
  tiltY.value = 0
}

const tiltStyle = computed(() => ({
  '--tilt-x': `${tiltX.value}deg`,
  '--tilt-y': `${tiltY.value}deg`,
}))

/* ---- 交互终端：输出区可滚动，↑/↓ 翻历史，只认 / 斜杠指令 ---- */
type TermLine = { text: string, cls?: string }

const history = ref<TermLine[]>([])
const draft = ref('')
const bodyEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

// 已执行命令记录，↑/↓ 依次翻找
const cmdLog = ref<string[]>([])
const cmdCursor = ref(-1) // -1 表示不在历史中

// rm -rf 彩蛋共享状态：nuking=淡出动画中，nuked=真删（index.vue 据此卸载页面元素）
const { nuking, nuked } = useNuke()
let nukeTimers: ReturnType<typeof setTimeout>[] = []

function push(text: string, cls?: string) {
  history.value.push({ text, cls })
}

// 初始画面：保留原有的 whoami/whereami 自报家门
const INIT_LINES: TermLine[] = [
  { text: '✻ takamiya shell 9.318.054 (x86_64-the-eye)', cls: 't-dim' },
  { text: '输入 help 查看可用指令。', cls: 't-dim' },
  { text: '$ whoami', cls: 't-cmd' },
  { text: props.profile.name, cls: 't-name' },
  { text: '$ whereami', cls: 't-cmd' },
  { text: props.profile.location, cls: 't-accent' },
]

// 重置终端：所有状态归零，重放与首次加载相同的初始画面
function reset() {
  nukeTimers.forEach(clearTimeout)
  nukeTimers = []
  nuking.value = false
  nuked.value = false
  document.documentElement.classList.remove('page-nuked')
  history.value = [...INIT_LINES]
  draft.value = ''
  cmdLog.value = []
  cmdCursor.value = -1
}

// 输出变化后滚到底部，模拟终端始终盯着最新一行
watch(history, async () => {
  await nextTick()
  bodyEl.value?.scrollTo({ top: bodyEl.value.scrollHeight })
}, { deep: true })

function focusInput() {
  inputEl.value?.focus()
}

function navHistory(dir: 1 | -1) {
  const log = cmdLog.value
  if (dir === 1) {
    if (log.length === 0) return
    cmdCursor.value = cmdCursor.value === -1 ? log.length - 1 : Math.max(0, cmdCursor.value - 1)
    draft.value = log[cmdCursor.value] ?? ''
  }
  else {
    if (cmdCursor.value === -1) return
    cmdCursor.value += 1
    if (cmdCursor.value >= log.length) {
      cmdCursor.value = -1
      draft.value = ''
    }
    else {
      draft.value = log[cmdCursor.value] ?? ''
    }
  }
}

// 右键直贴：拦截浏览器菜单，模拟真终端的右键粘贴；未授权读取剪贴板时给出终端风提示
async function pasteFromClipboard() {
  focusInput()
  try {
    const text = await navigator.clipboard.readText()
    if (!text) return
    const el = inputEl.value
    const start = el?.selectionStart ?? draft.value.length
    const end = el?.selectionEnd ?? start
    draft.value = draft.value.slice(0, start) + text + draft.value.slice(end)
    if (el) {
      const pos = start + text.length
      nextTick(() => el.setSelectionRange(pos, pos))
    }
  }
  catch {
    push('paste: 浏览器未授权读取剪贴板', 't-err')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    run(draft.value)
    draft.value = ''
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    navHistory(1)
  }
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    navHistory(-1)
  }
}

// 帮助输出：只列 commands.json 的非隐藏指令表（彩蛋靠猜）
function printHelp() {
  push('可用指令：', 't-out')
  slashCommands.filter(c => !c.hidden).forEach(c => push(`  ${c.name.padEnd(11)} ${c.desc}`, 't-out'))
}

// 执行指令：action 执行内置动作，target 滚动跳转章节，url 新窗口打开外链
function execCommand(sc: SlashCommand) {
  if (sc.action === 'help') {
    printHelp()
    return
  }
  if (sc.action === 'clear') {
    history.value = []
    return
  }
  if (sc.action === 'refresh') {
    reset()
    focusInput()
    return
  }
  if (sc.action === 'rmrf') {
    refuseRoot()
    return
  }
  if (sc.action === 'rmrf-force') {
    nuke()
    return
  }
  push(`→ ${sc.desc}`, 't-accent')
  if (sc.target) {
    // 平滑滚动交给全局 scroll-behavior，scroll-margin 由各 section 自带
    document.getElementById(sc.target)?.scrollIntoView()
  }
  else if (sc.url) {
    window.open(sc.url, '_blank', 'noopener')
  }
}

// 命令入口：只认 commands.json 登记的指令（带 / 为斜杠指令，不带 / 为系统命令），其余一律 not found
function run(raw: string) {
  const input = raw.trim()
  if (!input) return
  push(`$ ${input}`, 't-cmd')
  cmdLog.value.push(input)
  cmdCursor.value = -1

  const sc = slashCommands.find(c => c.name === input.toLowerCase())
  if (sc) {
    execCommand(sc)
  }
  else {
    push(`zsh: command not found: ${input.split(/\s+/)[0]}`, 't-err')
  }
}

// rm -rf /：真实复刻 GNU rm 的保 root 保险丝，拒绝执行
function refuseRoot() {
  push("rm: it is dangerous to operate recursively on '/'", 't-err')
  push('rm: use --no-preserve-root to override the failsafe', 't-err')
}

// rm -rf / --no-preserve-root：仿 rm -v 逐行 removed（"文件"取自指令表里无 action 的条目），播完整页只剩终端漂浮
function nuke() {
  const victims = slashCommands.filter(c => !c.action).map(c => c.name)
  const lines: TermLine[] = [
    ...victims.map(name => ({ text: `removed '${name}'`, cls: 't-out' })),
    { text: "removed '/assets'", cls: 't-out' },
    { text: "removed '/sections'", cls: 't-out' },
    { text: '（输入 refresh 刷新终端恢复）', cls: 't-dim' },
  ]
  lines.forEach((line, i) => {
    nukeTimers.push(setTimeout(() => {
      push(line.text, line.cls)
      if (i === lines.length - 1) {
        nuking.value = true
        document.documentElement.classList.add('page-nuked')
        // 淡出播完后真正卸载页面元素（index.vue 的 v-if），终端靠 Teleport 留在屏上
        nukeTimers.push(setTimeout(() => (nuked.value = true), 700))
      }
    }, 130 * (i + 1)))
  })
}

onMounted(reset)

onUnmounted(() => {
  nukeTimers.forEach(clearTimeout)
  document.documentElement.classList.remove('page-nuked')
})
</script>

<template>
  <section class="hero" @pointermove="onTiltMove" @pointerleave="resetTilt">
    <div v-reveal class="hero-main">
      <!-- 大标题已撤下视觉位置，保留 h1 供屏幕阅读器/搜索引擎识别 -->
      <h1 class="sr-only">{{ profile.name }}</h1>

      <!-- 交互终端：输出可滚动，底部是真输入行，输入 refresh 可刷新；rm -rf 后传送到 body 悬浮 -->
      <Teleport to="body" :disabled="!nuking">
        <div class="term" :class="{ 'term--floating': nuking }" @click="focusInput"
          @contextmenu.prevent="pasteFromClipboard">
          <div class="term-bar">
            <span class="term-dots" aria-hidden="true"><i /><i /><i /></span>
            <span class="term-title">✻ takamiya — zsh</span>
          </div>
          <div ref="bodyEl" class="term-body" aria-live="polite">
            <p v-for="(line, i) in history" :key="i" class="term-line" :class="line.cls">{{ line.text }}</p>
            <div class="term-input">
              <span class="prompt">$</span>
              <input ref="inputEl" v-model="draft" placeholder="输入 help 查看可用命令" spellcheck="false" autocomplete="off"
                aria-label="终端命令输入" @keydown="onKeydown">
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <div v-if="!nuked" v-reveal="{ delay: 150 }" class="hero-art">
      <div ref="zoneEl" class="avatar-zone" :style="tiltStyle">
        <span class="avatar-glow" aria-hidden="true" />
        <div class="avatar-ring">
          <span class="ring-spin" aria-hidden="true" />
          <img v-if="avatarSrc" :src="avatarSrc" :alt="profile.name" class="avatar" @error="avatarFailed = true" />
          <span v-else class="avatar avatar--initial">
            {{ profile.name.charAt(0).toUpperCase() }}
          </span>
        </div>
        <!-- 漂浮的游戏徽章 -->
        <span class="orbit orbit-1" aria-hidden="true">
          <Icon name="lucide:gamepad-2" size="18" />
        </span>
        <span class="orbit orbit-2" aria-hidden="true">
          <Icon name="lucide:ghost" size="18" />
        </span>
        <span class="orbit orbit-3" aria-hidden="true">
          <Icon name="lucide:swords" size="18" />
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 4rem);
  padding-block: clamp(4rem, 10vh, 6.5rem) clamp(2.5rem, 7vh, 4.5rem);
}

/* 视觉隐藏（仅辅助技术可读）：承载被撤下的大标题 h1 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ---- 终端窗口：像素风方点 + 扫描线，真输入行可敲命令 ---- */
.term {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 39rem;
  height: clamp(15.5rem, 24.7vw, 19.5rem);
  margin-top: 0.9rem;
  font-family: var(--font-mono);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

/* rm -rf 后：脱离文档流居中悬浮，像末日后的孤岛（Teleport 到 body 时挂上） */
.term--floating {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(39rem, 92vw);
  height: min(19.5rem, 60vh);
  z-index: 50;
}

.term-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--border);
  cursor: default;
}

.term-dots {
  display: flex;
  gap: 0.35rem;
}

/* 像素风：方形窗口点，不圆角 */
.term-dots i {
  width: 0.55rem;
  height: 0.55rem;
  background: var(--border-strong);
}

.term-dots i:nth-child(1) {
  background: #f87171;
}

.term-dots i:nth-child(2) {
  background: #fbbf24;
}

.term-dots i:nth-child(3) {
  background: #34d399;
}

.term-title {
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.term-body {
  position: relative;
  flex: 1;
  padding: 0.7rem 0.9rem 0.8rem;
  /* 真终端观感：小字号 + 紧行距，一屏塞下更多行 */
  font-size: clamp(0.74rem, 1.15vw, 0.85rem);
  line-height: 1.55;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
  /* 只有正文区是待输入状态，标题栏保持默认箭头 */
  cursor: text;
}

.term-body::-webkit-scrollbar {
  width: 6px;
}

.term-body::-webkit-scrollbar-thumb {
  background: var(--border-strong);
}

/* 扫描线：隔行铺一层极淡的横纹，CRT 质感 */
.term-body::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg,
      transparent 0 2px,
      rgba(255, 255, 255, 0.02) 2px 4px);
}

.term-line {
  color: var(--muted);
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt {
  margin-right: 0.5rem;
  color: var(--accent);
}

/* 命令回显行：$ 开头的输入原样保留在输出流里 */
.t-cmd {
  color: var(--muted);
}

/* whoami 的输出：当年大标题的流动渐变在此小字号复刻 */
.t-name {
  font-weight: 600;
  background: linear-gradient(100deg,
      var(--gradient-soft) 20%,
      var(--accent) 45%,
      var(--accent-2) 60%,
      var(--gradient-soft) 85%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-pan 7s ease-in-out infinite;
}

.t-out {
  color: var(--text);
}

.t-dim {
  color: var(--muted);
}

.t-accent {
  color: var(--accent-2);
}

.t-err {
  color: #f87171;
}

/* 底部真输入行：placeholder 轮播打字机身份标签 */
.term-input {
  display: flex;
  align-items: center;
  min-height: 1.7em;
}

.term-input input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  caret-color: var(--accent-2);
}

.term-input input::placeholder {
  color: var(--muted);
  opacity: 0.7;
}

/* ---- 右侧头像区 ---- */
.hero-art {
  display: grid;
  place-items: center;
}

.avatar-zone {
  position: relative;
  width: fit-content;
  transform: perspective(700px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
  transition: transform 0.25s ease-out;
  will-change: transform;
}

.avatar-glow {
  position: absolute;
  inset: -3rem;
  background: radial-gradient(closest-side, rgba(129, 140, 248, 0.28), transparent);
  filter: blur(30px);
  pointer-events: none;
}

/* 旋转渐变光环头像 */
.avatar-ring {
  position: relative;
  width: clamp(8rem, 14vw, 11rem);
  aspect-ratio: 1;
}

.ring-spin {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
      var(--accent),
      var(--accent-2),
      var(--accent-3),
      var(--accent));
  animation: spin-slow 7s linear infinite;
}

.avatar {
  position: absolute;
  inset: 0.28rem;
  width: calc(100% - 0.56rem);
  height: calc(100% - 0.56rem);
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg);
}

.avatar--initial {
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 3.2rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}

/* 环绕头像漂浮的游戏徽章 */
.orbit {
  position: absolute;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  color: var(--accent-2);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  backdrop-filter: blur(8px);
  animation: bob 5s ease-in-out infinite alternate;
}

.orbit-1 {
  top: -0.6rem;
  right: -1.6rem;
  color: #fbbf24;
  animation-delay: -1s;
}

.orbit-2 {
  bottom: 1.4rem;
  right: -2.4rem;
  color: #c084fc;
  animation-delay: -2.6s;
  animation-duration: 6.2s;
}

.orbit-3 {
  bottom: -0.9rem;
  left: -1.2rem;
  color: #34d399;
  animation-delay: -4s;
}

@media (max-width: 56rem) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-art {
    order: -1;
    justify-items: start;
  }

  .avatar-zone {
    margin-left: 0.5rem;
  }
}
</style>
