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

// ---- 站在窗口顶边的 Chrome 断网小恐龙 ----
// 像素直接取自 Chrome 官方离线 sprite（wayou/t-rex-runner 镜像的 100-offline-sprite.png，
// LDPI TREX 基址 x=848 + 跑步帧偏移 [88,132]），构建期离线转成 SVG path 常量：
// 深色主体一条 path，sprite 自带的浅色描边一条（低透明度渲染），白色眼睛与背景留孔
const DINO_FRAMES = [
  {
    dark: 'M24 2h16v2h-16zM22 4h20v1h-20zM22 5h4v2h-4zM28 5h14v2h-14zM22 7h20v6h-20zM22 13h10v2h-10zM22 15h16v2h-16zM2 17h2v2h-2zM20 17h10v2h-10zM2 19h2v2h-2zM17 19h13v2h-13zM2 21h4v2h-4zM14 21h20v2h-20zM2 23h6v2h-6zM12 23h18v2h-18zM32 23h2v2h-2zM2 25h28v2h-28zM2 27h28v2h-28zM4 29h26v1h-26zM4 30h24v1h-24zM6 31h22v2h-22zM8 33h18v2h-18zM10 35h14v2h-14zM12 37h6v2h-6zM22 37h5v2h-5zM12 39h4v2h-4zM12 41h2v2h-2zM12 43h4v2h-4z',
    light: 'M22 0h20v2h-20zM20 2h4v2h-4zM40 2h2v2h-2zM20 4h2v1h-2zM42 4h2v1h-2zM20 5h2v2h-2zM42 5h2v2h-2zM20 7h2v6h-2zM42 7h2v6h-2zM20 13h2v2h-2zM32 13h12v2h-12zM2 15h4v2h-4zM18 15h4v2h-4zM38 15h2v2h-2zM0 17h2v2h-2zM4 17h2v2h-2zM15 17h5v2h-5zM30 17h10v2h-10zM0 19h2v2h-2zM4 19h2v2h-2zM12 19h5v2h-5zM30 19h6v2h-6zM0 21h2v2h-2zM6 21h8v2h-8zM34 21h2v2h-2zM0 23h2v2h-2zM8 23h4v2h-4zM30 23h2v2h-2zM34 23h2v2h-2zM0 25h2v2h-2zM30 25h6v2h-6zM0 27h2v2h-2zM30 27h2v2h-2zM2 29h2v1h-2zM30 29h2v1h-2zM2 30h2v1h-2zM28 30h2v1h-2zM4 31h2v2h-2zM28 31h2v2h-2zM6 33h2v2h-2zM26 33h4v2h-4zM8 35h2v2h-2zM24 35h4v2h-4zM8 37h4v2h-4zM18 37h4v2h-4zM27 37h4v2h-4zM10 39h2v2h-2zM16 39h2v2h-2zM20 39h9v2h-9zM10 41h2v2h-2zM14 41h2v2h-2zM10 43h2v2h-2zM16 43h2v2h-2zM10 45h8v2h-8z',
  },
  {
    dark: 'M24 2h16v2h-16zM22 4h20v1h-20zM22 5h4v2h-4zM28 5h14v2h-14zM22 7h20v6h-20zM22 13h10v2h-10zM22 15h16v2h-16zM2 17h2v2h-2zM20 17h10v2h-10zM2 19h2v2h-2zM17 19h13v2h-13zM2 21h4v2h-4zM14 21h20v2h-20zM2 23h6v2h-6zM12 23h18v2h-18zM32 23h2v2h-2zM2 25h28v2h-28zM2 27h28v2h-28zM4 29h26v1h-26zM4 30h24v1h-24zM6 31h22v2h-22zM8 33h18v2h-18zM10 35h14v2h-14zM12 37h4v2h-4zM20 37h4v2h-4zM14 39h4v2h-4zM22 39h2v2h-2zM22 41h2v2h-2zM22 43h4v2h-4z',
    light: 'M22 0h20v2h-20zM20 2h4v2h-4zM40 2h2v2h-2zM20 4h2v1h-2zM42 4h2v1h-2zM20 5h2v2h-2zM42 5h2v2h-2zM20 7h2v6h-2zM42 7h2v6h-2zM20 13h2v2h-2zM32 13h12v2h-12zM2 15h4v2h-4zM18 15h4v2h-4zM38 15h2v2h-2zM0 17h2v2h-2zM4 17h2v2h-2zM15 17h5v2h-5zM30 17h10v2h-10zM0 19h2v2h-2zM4 19h2v2h-2zM12 19h5v2h-5zM30 19h6v2h-6zM0 21h2v2h-2zM6 21h8v2h-8zM34 21h2v2h-2zM0 23h2v2h-2zM8 23h4v2h-4zM30 23h2v2h-2zM34 23h2v2h-2zM0 25h2v2h-2zM30 25h6v2h-6zM0 27h2v2h-2zM30 27h2v2h-2zM2 29h2v1h-2zM30 29h2v1h-2zM2 30h2v1h-2zM28 30h2v1h-2zM4 31h2v2h-2zM28 31h2v2h-2zM6 33h2v2h-2zM26 33h4v2h-4zM8 35h2v2h-2zM24 35h4v2h-4zM8 37h4v2h-4zM16 37h4v2h-4zM24 37h4v2h-4zM10 39h4v2h-4zM18 39h4v2h-4zM24 39h2v2h-2zM12 41h6v2h-6zM20 41h2v2h-2zM24 41h2v2h-2zM20 43h2v2h-2zM26 43h2v2h-2zM20 45h8v2h-8z',
  },
]

// 同一张 sprite 里的云（86,2）与一大一小仙人掌（228,2 / 332,2）：云整个是浅色描边，
// 仙人掌同恐龙分深浅两色；都作纯装饰，不拦截点击
const CLOUD_LIGHT = 'M25 0h4v1h-4zM20 1h6v1h-6zM28 1h3v1h-3zM19 2h2v1h-2zM30 2h2v1h-2zM17 3h3v1h-3zM31 3h1v1h-1zM17 4h1v1h-1zM31 4h4v1h-4zM17 5h1v1h-1zM31 5h1v1h-1zM34 5h6v1h-6zM14 6h4v1h-4zM30 6h1v1h-1zM39 6h1v1h-1zM13 7h2v1h-2zM39 7h4v1h-4zM6 8h8v1h-8zM42 8h1v1h-1zM5 9h2v1h-2zM42 9h3v1h-3zM5 10h1v1h-1zM44 10h1v1h-1zM1 11h2v1h-2zM4 11h2v1h-2zM9 11h1v1h-1zM45 11h1v1h-1zM0 12h2v1h-2zM10 12h36v1h-36z'
const CACTUS_S = {
  dark: 'M7 1h3v1h-3zM6 2h5v2h-5zM6 4h5v1h-5zM6 5h5v1h-5zM14 5h1v1h-1zM6 6h5v2h-5zM13 6h3v2h-3zM6 8h5v1h-5zM13 8h3v1h-3zM2 9h1v1h-1zM6 9h5v1h-5zM13 9h3v1h-3zM1 10h3v6h-3zM6 10h5v6h-5zM13 10h3v6h-3zM1 16h3v1h-3zM6 16h10v1h-10zM1 17h3v1h-3zM6 17h9v1h-9zM1 18h3v1h-3zM6 18h8v1h-8zM1 19h3v1h-3zM6 19h5v1h-5zM1 20h10v1h-10zM2 21h9v1h-9zM3 22h8v1h-8zM6 23h5v1h-5zM6 24h5v10h-5z',
  light: 'M7 0h3v1h-3zM6 1h1v1h-1zM10 1h1v1h-1zM5 2h1v2h-1zM11 2h1v2h-1zM5 4h1v1h-1zM11 4h1v1h-1zM14 4h1v1h-1zM5 5h1v1h-1zM11 5h1v1h-1zM13 5h1v1h-1zM15 5h1v1h-1zM5 6h1v2h-1zM11 6h2v2h-2zM16 6h1v2h-1zM2 8h1v1h-1zM5 8h1v1h-1zM11 8h2v1h-2zM16 8h1v1h-1zM1 9h1v1h-1zM3 9h1v1h-1zM5 9h1v1h-1zM11 9h2v1h-2zM16 9h1v1h-1zM0 10h1v6h-1zM4 10h2v6h-2zM11 10h2v6h-2zM16 10h1v6h-1zM0 16h1v1h-1zM4 16h2v1h-2zM16 16h1v1h-1zM0 17h1v1h-1zM4 17h2v1h-2zM15 17h1v1h-1zM0 18h1v1h-1zM4 18h2v1h-2zM14 18h1v1h-1zM0 19h1v1h-1zM4 19h2v1h-2zM11 19h3v1h-3zM0 20h1v1h-1zM11 20h1v1h-1zM1 21h1v1h-1zM11 21h1v1h-1zM2 22h1v1h-1zM11 22h1v1h-1zM3 23h3v1h-3zM11 23h1v1h-1zM5 24h1v10h-1zM11 24h1v10h-1zM6 34h5v1h-5z',
}
const CACTUS_L = {
  dark: 'M10 1h5v1h-5zM9 2h7v8h-7zM9 10h7v1h-7zM9 11h7v1h-7zM20 11h3v1h-3zM9 12h7v1h-7zM19 12h5v1h-5zM2 13h3v1h-3zM9 13h7v1h-7zM19 13h5v1h-5zM1 14h5v12h-5zM9 14h7v12h-7zM19 14h5v12h-5zM1 26h5v1h-5zM9 26h7v1h-7zM19 26h5v1h-5zM1 27h22v1h-22zM1 28h21v1h-21zM2 29h19v1h-19zM3 30h17v1h-17zM4 31h12v1h-12zM9 32h7v1h-7zM9 33h7v11h-7zM9 44h7v1h-7zM9 45h7v1h-7zM19 45h1v1h-1zM5 46h1v1h-1zM7 46h9v1h-9zM16 48h1v1h-1z',
  light: 'M10 0h5v1h-5zM9 1h1v1h-1zM15 1h1v1h-1zM8 2h1v8h-1zM16 2h1v8h-1zM8 10h1v1h-1zM16 10h1v1h-1zM20 10h3v1h-3zM8 11h1v1h-1zM16 11h1v1h-1zM19 11h1v1h-1zM23 11h1v1h-1zM2 12h3v1h-3zM8 12h1v1h-1zM16 12h1v1h-1zM18 12h1v1h-1zM24 12h1v1h-1zM1 13h1v1h-1zM5 13h1v1h-1zM8 13h1v1h-1zM16 13h1v1h-1zM18 13h1v1h-1zM24 13h1v1h-1zM0 14h1v12h-1zM6 14h1v12h-1zM8 14h1v12h-1zM16 14h1v12h-1zM18 14h1v12h-1zM24 14h1v12h-1zM0 26h1v1h-1zM6 26h3v1h-3zM16 26h3v1h-3zM24 26h1v1h-1zM0 27h1v1h-1zM23 27h1v1h-1zM0 28h1v1h-1zM22 28h1v1h-1zM1 29h1v1h-1zM21 29h1v1h-1zM2 30h1v1h-1zM20 30h1v1h-1zM3 31h1v1h-1zM16 31h4v1h-4zM4 32h5v1h-5zM16 32h1v1h-1zM8 33h1v11h-1zM16 33h1v11h-1zM8 44h1v1h-1zM16 44h1v1h-1zM19 44h1v1h-1zM5 45h1v1h-1zM7 45h2v1h-2zM16 45h1v1h-1zM18 45h1v1h-1zM20 45h1v1h-1zM4 46h1v1h-1zM6 46h1v1h-1zM16 46h1v1h-1zM19 46h1v1h-1zM5 47h1v1h-1zM7 47h10v1h-10zM15 48h1v1h-1zM17 48h1v1h-1zM16 49h1v1h-1z',
}

const dinoFrame = ref(0)
const dinoJumping = ref(false)
const dinoReducedMotion = ref(false)
// 腿部换帧计时器独立于 timers：reset() 会清空 timers（refresh/nuke 后），不能把跑步也停了
let legTimer: ReturnType<typeof setInterval> | undefined

function dinoJump() {
  if (dinoReducedMotion.value || dinoJumping.value) return
  dinoJumping.value = true
}

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
      const command = near[0]
      if (near.length === 1 && command) {
        push(`用法：${command.name}`, 't-dim')
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

// 恐龙跑步换帧（原版 msPerFrame = 1000/12）；prefers-reduced-motion 时保持站姿不跑
onMounted(() => {
  dinoReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!dinoReducedMotion.value) {
    legTimer = setInterval(() => (dinoFrame.value = dinoFrame.value ? 0 : 1), 1000 / 12)
  }
})

onUnmounted(() => {
  timers.forEach(clearTimeout)
  if (legTimer) clearInterval(legTimer)
  document.documentElement.classList.remove('page-nuked')
})
</script>

<template>
  <!-- 交互终端：输出可滚动，底部是真输入行，输入 refresh 可刷新；rm -rf 后传送到 body 悬浮 -->
  <Teleport to="body" :disabled="!nuking">
    <div class="term" :class="{ 'term--floating': nuking }" @click="focusInput"
      @contextmenu.prevent="pasteFromClipboard">
      <!-- 站在窗口顶边上的断网小恐龙：官方 sprite 像素 + 跑步换帧，点击跳跃；rm -rf 后随悬浮窗口一起搬家 -->
      <svg class="term-dino" :class="{ 'term-dino--jump': dinoJumping }" viewBox="0 0 44 47"
        shape-rendering="crispEdges" role="img" aria-label="Chrome 断网小恐龙（点击跳跃）" title="chrome://dino"
        @click.stop="dinoJump" @animationend="dinoJumping = false">
        <path :d="DINO_FRAMES[dinoFrame]!.dark" fill="currentColor" />
        <path :d="DINO_FRAMES[dinoFrame]!.light" fill="currentColor" fill-opacity="0.35" />
      </svg>
      <!-- 顶边右侧的仙人掌（一大一小）与天上的云：同一张官方 sprite 抠出来的，纯装饰 -->
      <!-- 大仙人掌 viewBox 裁到 47：sprite 后 3 行是落地灰尘点缀（35% 透明度几乎不可见），
           留着会把 svg 撑高、主干悬空离边框 3 个像素，裁掉后与左侧恐龙/右侧小仙人掌同一地平线 -->
      <svg class="term-cactus term-cactus--large" viewBox="0 0 25 47" shape-rendering="crispEdges" aria-hidden="true">
        <path :d="CACTUS_L.dark" fill="currentColor" />
        <path :d="CACTUS_L.light" fill="currentColor" fill-opacity="0.35" />
      </svg>
      <svg class="term-cactus term-cactus--small" viewBox="0 0 17 35" shape-rendering="crispEdges" aria-hidden="true">
        <path :d="CACTUS_S.dark" fill="currentColor" />
        <path :d="CACTUS_S.light" fill="currentColor" fill-opacity="0.35" />
      </svg>
      <svg class="term-cloud term-cloud--near" viewBox="0 0 46 14" shape-rendering="crispEdges" aria-hidden="true">
        <path :d="CLOUD_LIGHT" fill="currentColor" />
      </svg>
      <svg class="term-cloud term-cloud--far" viewBox="0 0 46 14" shape-rendering="crispEdges" aria-hidden="true">
        <path :d="CLOUD_LIGHT" fill="currentColor" />
      </svg>
      <div class="term-bar">
        <span class="term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span class="term-title">✻ takamiya — zsh</span>
      </div>
      <div class="term-screen">
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
    </div>
  </Teleport>
</template>

<style scoped>
/* ---- 终端窗口：像素风方点 + 扫描线，真输入行可敲命令 ---- */
.term {
  position: relative;
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
  /* overflow 放开：恐龙站在顶边上不能被裁掉；圆角裁切改由标题栏/屏幕各自负责 */
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
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
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

/* 正文视口层：不滚动，扫描线钉在这里（滚动条以内层 term-body 为准） */
.term-screen {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  cursor: text;
}

/* ---- 窗顶小恐龙：官方 sprite 像素，脚踩上边框，跑步换帧，点击跳一跳 ---- */
.term-dino {
  position: absolute;
  bottom: 100%;
  left: 0.8rem;
  width: clamp(3.25rem, 5.2vw, 4.2rem);
  height: auto;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
}

/* 顶边右侧的仙人掌：和恐龙同一份 sprite 的官方像素，一大一小站在窗口边上 */
.term-cactus {
  position: absolute;
  bottom: 100%;
  color: var(--muted);
  pointer-events: none;
}

.term-cactus--large {
  right: 2.4rem;
  width: clamp(1.6rem, 2.6vw, 2rem);
}

.term-cactus--small {
  right: 0.9rem;
  width: clamp(1.1rem, 1.8vw, 1.4rem);
}

/* 天上的云：官方 sprite 本身就是浅色描边，再压一档存在感做远景，轻轻浮沉 */
.term-cloud {
  position: absolute;
  bottom: calc(100% + 2.2rem);
  color: var(--muted);
  opacity: 0.55;
  pointer-events: none;
  animation: cloud-bob 6s ease-in-out infinite alternate;
}

.term-cloud--near {
  right: 4.5rem;
  width: clamp(2.8rem, 4.6vw, 3.6rem);
}

.term-cloud--far {
  right: 9.5rem;
  bottom: calc(100% + 3.8rem);
  width: clamp(2rem, 3.2vw, 2.5rem);
  animation-duration: 7.5s;
  animation-delay: -3s;
}

.term-dino--jump {
  animation: dino-jump 0.45s ease-out;
}

@keyframes dino-jump {

  0%,
  100% {
    transform: translateY(0);
  }

  40%,
  60% {
    transform: translateY(-2.6rem);
  }
}

@keyframes cloud-bob {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-0.35rem);
  }
}

.term-body {
  position: absolute;
  inset: 0;
  padding: 0.7rem 0.9rem 0.8rem;
  /* 真终端观感：小字号 + 紧行距，一屏塞下更多行 */
  font-size: clamp(0.82rem, 1.3vw, 0.95rem);
  line-height: 1.55;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
}

.term-body::-webkit-scrollbar {
  width: 6px;
}

.term-body::-webkit-scrollbar-thumb {
  background: var(--border-strong);
}

/* 扫描线：隔行铺一层极淡的横纹，CRT 质感。
   钉在不滚动的视口层 .term-screen 上——挂进滚动容器会随内容滚走（内容一多只剩顶部有纹），
   挂整个 .term 又会盖到标题栏；从视口层开始正好把标题栏排除在外 */
.term-screen::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
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
