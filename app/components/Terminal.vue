<script setup lang="ts">
import { type SlashCommand, slashCommands, commandHandlers } from '~/utils/commands'

/* ---- 交互终端：输出区可滚动，↑/↓ 翻历史，只认 / 斜杠指令 ---- */
type TermLine = { text: string, cls?: string, icon?: string }

const props = defineProps<{
  /** whoami 输出（取 site.profile.name） */
  name: string
  /** whereami 输出（取 site.profile.location） */
  location: string
}>()

const history = ref<TermLine[]>([])
const draft = ref('')
const bodyEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

// 已执行命令记录，↑/↓ 依次翻找
const cmdLog = ref<string[]>([])
const cmdCursor = ref(-1) // -1 表示不在历史中

// 异步演出（chat 思考/流式）进行中：Enter 暂不受理，避免新输出插进打字机
const busy = ref(false)

// rm -rf 彩蛋共享状态：nuking=淡出动画中，nuked=真删（index.vue 据此卸载页面元素）
const { nuking, nuked } = useNuke()
// 演出计时器（nuke 逐行 removed、chat 思考/流式），reset/卸载时统一清掉
let timers: (ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>)[] = []

function push(text: string, cls?: string): TermLine {
  const line: TermLine = { text, cls }
  history.value.push(line)
  // 返回数组里的响应式代理而非原始对象：stream/think 后续改 line.text 必须走代理才能触发重渲染
  return history.value[history.value.length - 1]!
}

function delay(ms: number) {
  return new Promise<void>(resolve => timers.push(setTimeout(resolve, ms)))
}

// 打字机：把一行文字逐字点亮（流式回显），resolve 于整行输出完；
// 直接改 line 对象（history 持同一引用），中途 clear 也不怕写到别的行上
function stream(text: string, cls?: string) {
  const line = push('', cls)
  let i = 0
  return new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      i += 1
      line.text = text.slice(0, i)
      if (i >= text.length) {
        clearInterval(timer)
        resolve()
      }
    }, 26)
    timers.push(timer)
  })
}

// 伪思考：spinner 帧取自 Claude Code cli.js 的 macOS 分支（6 帧 + 正放倒放乒乓循环，120ms/帧），
// 两处按浏览器渲染微调：ASCII 星号 * 墨迹偏上、middle dot · 位置随字体漂（fallback 里贴底），换成居中设计的 ✳ 和 •
// 文字为 “Thinking… (Xs · N tokens)”（CC 里只有符号在动，token 数仿其状态栏实时累加）；
// 结束后定格为 “Thought for Xs · N tokens”，回显阶段不再累加（“说”不消耗思考 token）
const CC_FRAMES = ['•', '✢', '✳', '✶', '✻', '✽']
const THINK_FRAMES = [...CC_FRAMES, ...CC_FRAMES.slice().reverse()]

// 伪 token 计量：只在思考期累加、随思考结束冻结——出字阶段是“说”，不再“想”
function fmtTokens(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}

function think(ms: number) {
  const line = push('Thinking…', 't-think')
  line.icon = THINK_FRAMES[0]
  let tokens = 0
  const start = Date.now()
  return new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= ms) {
        clearInterval(timer)
        line.icon = undefined
        line.cls = 't-dim'
        line.text = `Thought for ${Math.max(1, Math.round(elapsed / 1000))}s · ${fmtTokens(tokens)} tokens`
        resolve()
        return
      }
      // 思考期 token 以 ~70-270/s 随机累加，秒数同步跳动
      tokens += 8 + Math.floor(Math.random() * 25)
      line.text = `Thinking… (${Math.max(1, Math.round(elapsed / 1000))}s · ${fmtTokens(tokens)} tokens)`
      line.icon = THINK_FRAMES[Math.floor(elapsed / 120) % THINK_FRAMES.length]
    }, 120)
    timers.push(timer)
  })
}

// 初始画面：保留原有的 whoami/whereami 自报家门
const INIT_LINES: TermLine[] = [
  { text: '✻ takamiya shell 9.318.054 (x86_64-the-eye)', cls: 't-dim' },
  { text: '输入 help 查看可用指令。', cls: 't-dim' },
  { text: '$ whoami', cls: 't-cmd' },
  { text: props.name, cls: 't-name' },
  { text: '$ whereami', cls: 't-cmd' },
  { text: props.location, cls: 't-accent' },
]

// 重置终端：所有状态归零，重放与首次加载相同的初始画面
function reset() {
  timers.forEach(clearTimeout)
  timers = []
  busy.value = false
  nuking.value = false
  nuked.value = false
  document.documentElement.classList.remove('page-nuked')
  history.value = [...INIT_LINES]
  draft.value = ''
  cmdLog.value = []
  cmdCursor.value = -1
}

// 输出变化（含演出中逐字增长）或演出结束输入行重新出现后，都滚到底部盯着最新一行
watch([history, busy], async () => {
  await nextTick()
  bodyEl.value?.scrollTo({ top: bodyEl.value.scrollHeight })
}, { deep: true })

function focusInput() {
  // preventScroll：聚焦底部输入行时浏览器默认会把光标滚进视野，向上翻输出后点击终端会被强制拉回底部
  inputEl.value?.focus({ preventScroll: true })
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
    if (busy.value) return
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

// 执行指令：先查内置动作注册表（commands.ts 的 commandHandlers），未命中按声明式兜底——
// target 滚动跳转章节，url 新窗口打开外链
async function execCommand(sc: SlashCommand) {
  const handler = sc.action ? commandHandlers[sc.action] : undefined
  if (handler) {
    // handler 可返回 Promise（chat 的思考/流式演出），期间输入行 disabled，演出完交还光标
    busy.value = true
    try {
      await handler(sc, { push, stream, think, delay, clear: () => (history.value = []), reset, focusInput, nuke })
    }
    finally {
      busy.value = false
      // v-if 重建输入行要等下一个 tick，直接 focus 会扑空
      nextTick(focusInput)
    }
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

// 命令入口：只认 commands.json 登记的指令（带 / 为斜杠指令，不带 / 为系统命令），其余一律 not found。
// 先全串精确匹配（兼容 "rm -rf /" 这类自带空格的名字），未命中再对带参指令做首段匹配，其余部分作为参数传入
function run(raw: string) {
  const input = raw.trim()
  if (!input) return
  push(`$ ${input}`, 't-cmd')
  cmdLog.value.push(input)
  cmdCursor.value = -1

  const lower = input.toLowerCase()
  const sc = slashCommands.find(c => c.name === lower)
    ?? slashCommands.find(c => c.args && lower.startsWith(`${c.name} `))
  if (sc) {
    const argv = lower === sc.name ? [] : input.slice(sc.name.length + 1).trim().split(/\s+/)
    execCommand({ ...sc, argv })
  }
  else {
    const argv = input.split(/\s+/)
    if (argv[0] === 'rm' && argv.length > 1) {
      // rm 系变体按真 rm 语义兜底（完整形式已在上面精确命中）：
      // 不带 -r 只认文件，而本站一切皆目录，一律拒删；带 -r 碰根目录复刻 GNU 的保 root 保险丝
      const targets = argv.slice(1).filter(a => !a.startsWith('-'))
      if (argv.slice(1).some(a => a.includes('r')) && targets.includes('/')) {
        push("rm: it is dangerous to operate recursively on '/'", 't-err')
        push("rm: use --no-preserve-root to override the failsafe", 't-err')
      }
      else {
        push(`rm: cannot remove '${targets[0] ?? argv[1]}': Is a directory`, 't-err')
      }
    }
    else {
      // 前缀命中唯一已登记指令时视作参数缺失，直接贴出完整用法（如 rm → 用法：rm -rf /）；
      // hidden 不参与，避免剧透彩蛋；命中多个或全不命中按普通 not found 处理
      const near = slashCommands.filter(c => !c.hidden && c.name.startsWith(input) && c.name !== input)
      if (near.length === 1) {
        push(`用法：${near[0].name}`, 't-dim')
      }
      else {
        push(`zsh: command not found: ${argv[0]}`, 't-err')
      }
    }
  }
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
    timers.push(setTimeout(() => {
      push(line.text, line.cls)
      if (i === lines.length - 1) {
        nuking.value = true
        document.documentElement.classList.add('page-nuked')
        // 淡出播完后真正卸载页面元素（index.vue 的 v-if），终端靠 Teleport 留在屏上
        timers.push(setTimeout(() => (nuked.value = true), 700))
      }
    }, 130 * (i + 1)))
  })
}

onMounted(reset)

onUnmounted(() => {
  timers.forEach(clearTimeout)
  document.documentElement.classList.remove('page-nuked')
})
</script>

<template>
  <!-- 交互终端：输出可滚动，底部是真输入行，输入 refresh 可刷新；rm -rf 后传送到 body 悬浮 -->
  <Teleport to="body" :disabled="!nuking">
    <div class="term" :class="{ 'term--floating': nuking }" @click="focusInput"
      @contextmenu.prevent="pasteFromClipboard">
      <div class="term-bar">
        <span class="term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span class="term-title">✻ takamiya — zsh</span>
      </div>
      <div ref="bodyEl" class="term-body" aria-live="polite">
        <p v-for="(line, i) in history" :key="i" class="term-line" :class="line.cls">
          <span v-if="line.icon" class="term-spin" aria-hidden="true">{{ line.icon }}</span>{{ line.text }}
        </p>
        <!-- 演出中整行隐藏：连 $ 提示符带 placeholder 一起消失，像终端被模型占住了 -->
        <div v-if="!busy" class="term-input">
          <span class="prompt">$</span>
          <input ref="inputEl" v-model="draft" placeholder="输入 help 查看可用命令" spellcheck="false" autocomplete="off"
            :disabled="busy" aria-label="终端命令输入" @keydown="onKeydown">
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ---- 终端窗口：像素风方点 + 扫描线，真输入行可敲命令 ---- */
.term {
  display: flex;
  flex-direction: column;
  /* 填满 hero 的 7fr 列，与 quote 卡（同为 7fr 列）严格等宽 */
  width: 100%;
  height: clamp(18.5rem, 31vw, 26rem);
  margin-top: 0.9rem;
  font-family: var(--font-mono);
  background: var(--surface-faint);
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
  height: min(26rem, 70vh);
  z-index: 50;
}

.term-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.8rem;
  background: var(--surface-faint);
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

/* mac 红绿灯装饰色，与主题无关，保持硬编码 */
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
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.term-body {
  position: relative;
  flex: 1;
  padding: 0.7rem 0.9rem 0.8rem;
  /* 真终端观感：小字号 + 紧行距，一屏塞下更多行 */
  font-size: clamp(0.82rem, 1.3vw, 0.95rem);
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
      var(--surface-faint) 2px 4px);
}

.term-line {
  color: var(--muted);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 思考动画符号：定宽槽位内居中，避免逐帧字形宽度不一导致整行左右抖动；
   强制正体——ASCII 帧（*）会被合成斜体而 fallback 字体的花哨符号不会，混着闪很扎眼 */
.term-spin {
  display: inline-block;
  width: 1.2em;
  text-align: center;
  font-style: normal;
}

.prompt {
  margin-right: 0.5rem;
  color: var(--accent);
}

/* 命令回显行：命令本身用正文白，和暗灰的提示文字拉开主次 */
.t-cmd {
  color: var(--text);
}

/* whoami 的输出：当年大标题的流动渐变在此小字号复刻 */
.t-name {
  font-weight: 600;
  background: linear-gradient(100deg,
      var(--gradient-soft) 10%,
      var(--accent) 45%,
      var(--accent-2) 60%,
      var(--gradient-soft) 92.5%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-pan 7s ease-in-out infinite;
}

@keyframes gradient-pan {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.t-out {
  color: var(--text);
}

.t-dim {
  color: var(--muted);
}

/* 思考行：仿 Claude Code 的斜体次级文本 */
.t-think {
  color: var(--muted);
  font-style: italic;
}

.t-accent {
  color: var(--accent-2);
}

.t-err {
  color: var(--c-error);
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
</style>
