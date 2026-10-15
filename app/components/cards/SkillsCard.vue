<script setup lang="ts">
import { hierarchy } from 'd3-hierarchy'
import type { HierarchyPointNode } from 'd3-hierarchy'
import type { SkillGroup, SkillItem } from '~/config/types'

const props = defineProps<{ groups: SkillGroup[] }>()

/* 分组配色：与站点暗色主题呼应的荧光色 */
const PALETTE = ['#818cf8', '#22d3ee', '#c084fc', '#fbbf24', '#34d399', '#fb7185'] as const

/* 悬停高亮：按 path 前缀点亮整条祖先/后代链，其余淡出 */
const hoveredPath = ref<string | null>(null)

function isOn(path: string): boolean {
  if (hoveredPath.value === null) return false
  return hoveredPath.value.startsWith(path) || path.startsWith(hoveredPath.value)
}

interface MindNode {
  name: string
  icon?: string
  path: string
  gid: number
  color: string
  children?: MindNode[]
}

/** 配置项 → 思维导图节点；path 编码层级位置，供悬停链路匹配 */
function toNode(item: SkillItem, gid: number, path: string): MindNode {
  const base = { path, gid, color: PALETTE[gid % PALETTE.length] }
  if (typeof item === 'string') return { name: item, ...base }
  return {
    name: item.name,
    ...base,
    children: item.children?.map((c, ci) => toNode(c, gid, `${path}.${ci}`)),
  }
}

const raw: MindNode = {
  name: '技能树',
  path: '',
  gid: 0,
  color: PALETTE[0],
  children: props.groups.map((g, gi) => ({
    name: g.title,
    icon: g.icon,
    path: `${gi}`,
    gid: gi,
    color: PALETTE[gi % PALETTE.length],
    children: g.skills.map((s, si) => toNode(s, gi, `${gi}.${si}`)),
  })),
}

/* 电路板布局：根居中，前三组向右、后三组向左，叶子独占一行，
   走线为 45° 切角的 PCB 折线（同层垂直段共线成"总线"，天然互不遮挡） */
const GX = 210 // 分组列
const HX = 330 // 进阶 hub 列（JavaScript/Vue/Node.js）
const LX = 445 // 叶子列
const ROW = 36 // 叶子行高
const CH = 8 // 45° 切角最小尺寸

/** 切角尺寸随转角距离变化（有长有短），且不超过距离的一半，避免相邻切角重叠 */
const cham = (ad: number) => Math.min(26, Math.max(CH, ad * 0.45), ad * 0.9)
const VB_W = 1040
const VB_H = 600
const rootNode = hierarchy(raw) as HierarchyPointNode<MindNode>

/* 叶子按 DFS 先序收集到所属侧（descendants() 是 BFS，会把 depth-3
   进阶子技能排到末尾，导致行序错乱），每侧以 y=0 居中 */
const groupList = rootNode.children ?? []
const sideLeaves: HierarchyPointNode<MindNode>[][] = [[], []]
groupList.forEach((g, gi) => {
  const side = gi < 3 ? 0 : 1
  g.eachBefore((n) => {
    if (n.depth >= 2 && !n.children?.length) sideLeaves[side].push(n)
  })
})
const leafY = new Map<HierarchyPointNode<MindNode>, number>()
for (const leaves of sideLeaves) {
  leaves.forEach((n, i) => leafY.set(n, (i - (leaves.length - 1) / 2) * ROW))
}

/* 自底向上定坐标：叶子取行位，hub/分组取子节点均值，根固定在原点 */
const pos = new Map<HierarchyPointNode<MindNode>, [number, number]>()
function layout(n: HierarchyPointNode<MindNode>, dir: 1 | -1): number {
  const y = n.children?.length
    ? n.children.reduce((s, c) => s + layout(c, dir), 0) / n.children.length
    : (leafY.get(n) ?? 0)
  const x = n.depth === 1 ? dir * GX : n.children?.length ? dir * HX : dir * LX
  pos.set(n, [x, y])
  return y
}
groupList.forEach((g, gi) => layout(g, gi < 3 ? 1 : -1))
pos.set(rootNode, [0, 0])

/** PCB 走线：水平进 → 45° 切角 → 垂直汇流于 bx → 45° 切角出 → 水平到达 */
function trace(x1: number, y1: number, x2: number, y2: number, bx: number): string {
  const dy = y2 - y1
  if (Math.abs(dy) < 0.5) return `M ${x1} ${y1} H ${x2}`
  const s = Math.sign(dy)
  const c = Math.min(CH, Math.abs(dy) / 2)
  return `M ${x1} ${y1} H ${bx - c} L ${bx} ${y1 + s * c} V ${y2 - s * c} L ${bx + c} ${y2} H ${x2}`
}

/* 坐标 → 覆盖层百分比定位 */
const pct = (v: number, total: number) => ((v + total / 2) / total) * 100

/* 分组胶囊：HTML 覆盖层渲染 */
const groupNodes = groupList.map((n) => {
  const [x, y] = pos.get(n)!
  return {
    path: n.data.path,
    gid: n.data.gid,
    name: n.data.name,
    icon: n.data.icon ?? 'lucide:circle',
    color: n.data.color,
    left: pct(x, VB_W),
    top: pct(y, VB_H),
    delay: 0.12 + n.data.gid * 0.09,
  }
})

/* 技能胶囊（含进阶中间节点）：按最终 y 自上而下排序，入场依次点亮 */
const skillNodeList = rootNode
  .descendants()
  .filter((n) => n.depth >= 2)
  .sort((a, b) => {
    const [ax, ay] = pos.get(a)!
    const [bx, by] = pos.get(b)!
    return ay - by || ax - bx
  })
const delayMap = new Map(skillNodeList.map((n, i) => [n, 0.45 + i * 0.02] as const))
const skillNodes = skillNodeList.map((n) => {
  const [x, y] = pos.get(n)!
  return {
    path: n.data.path,
    name: n.data.name,
    color: n.data.color,
    hub: Boolean(n.children?.length),
    left: pct(x, VB_W),
    top: pct(y, VB_H),
    delay: delayMap.get(n) ?? 0.5,
  }
})

/* 连线：按"电路网"生成——干路与总线只画一次，避免同色走线重合段叠加发亮；
   转弯处 45° 切角，干路交接处为直角 T 型（PCB 焊盘风格） */
interface LinkItem {
  d: string
  path: string
  ppath: string
  color: string
  delay: number
}

const links: LinkItem[] = []
function pushLink(d: string, path: string, ppath: string, color: string, delay: number) {
  links.push({ d, path, ppath, color, delay })
}

/* 根主干 + 侧总线：横主干从根胶囊引出，垂直总线贯穿该侧各分组的行位；
   两端以 45° 切角进上/下极端分组，中间分组走直角 T 型（垂直段由总线承担） */
for (const [start, dir] of [
  [0, 1],
  [3, -1],
] as const) {
  const side = groupList.slice(start, start + 3)
  if (!side.length) continue
  const bx = (dir * GX) / 2
  const entries = side
    .map((g) => {
      const [gx, gy] = pos.get(g)!
      return { g, gx, gy, c: cham(Math.abs(gy)) }
    })
    .sort((a, b) => a.gy - b.gy)
  const top = entries[0]
  const bottom = entries[entries.length - 1]
  const hasSpine = bottom.gy - top.gy > 1
  /* 总线端点向根行 y=0 收拢，保证与横主干相接 */
  const spineTop = Math.min(top.gy + top.c, 0)
  const spineBottom = Math.max(bottom.gy - bottom.c, 0)
  pushLink(`M 0 0 H ${bx}`, '', '', 'var(--accent)', 0.02)
  if (hasSpine && spineBottom - spineTop > 1) {
    pushLink(`M ${bx} ${spineTop} V ${spineBottom}`, '', '', 'var(--accent)', 0.06)
  }
  for (const e of entries) {
    const { g, gx, gy, c } = e
    const delay = 0.08 + g.data.gid * 0.09
    if (Math.abs(gy) < 0.5) {
      pushLink(`M ${bx} ${gy} H ${gx}`, g.data.path, '', g.data.color, delay)
      continue
    }
    const s = Math.sign(gy)
    if (hasSpine && e !== top && e !== bottom) {
      pushLink(`M ${bx} ${gy} H ${gx}`, g.data.path, '', g.data.color, delay)
    } else {
      const from = hasSpine
        ? Math.min(Math.max(gy - s * c, spineTop), spineBottom)
        : 0
      pushLink(
        `M ${bx} ${from} V ${gy - s * c} L ${bx + dir * c} ${gy} H ${gx}`,
        g.data.path,
        '',
        g.data.color,
        delay,
      )
    }
  }
}

/* 分组出线：干路到总线位后，上/下两条 45° 射线扇出，各子项在射线上
   按行距"剥离"出水平线——斜线方向一致、长短随行距变化，且互不交叉 */
for (const g of groupList) {
  const [gx, gy] = pos.get(g)!
  const dir: 1 | -1 = gx >= 0 ? 1 : -1
  const bx = (dir * (GX + HX)) / 2
  const kids = g.children ?? []
  const stemDelay = 0.12 + g.data.gid * 0.09
  pushLink(`M ${gx} ${gy} H ${bx}`, g.data.path, '', g.data.color, stemDelay)
  for (const up of [true, false] as const) {
    const arr = kids
      .map((k) => ({ k, kx: pos.get(k)![0], ky: pos.get(k)![1] }))
      .filter((e) => (up ? e.ky < gy - 0.5 : e.ky > gy + 0.5))
    if (!arr.length) continue
    const far = up ? Math.min(...arr.map((e) => e.ky)) : Math.max(...arr.map((e) => e.ky))
    pushLink(
      `M ${bx} ${gy} L ${bx + dir * Math.abs(far - gy)} ${far}`,
      g.data.path,
      '',
      g.data.color,
      stemDelay,
    )
    for (const { k, kx, ky } of arr) {
      pushLink(
        `M ${bx + dir * Math.abs(ky - gy)} ${ky} H ${kx}`,
        k.data.path,
        g.data.path,
        k.data.color,
        (delayMap.get(k) ?? 0.5) - 0.03,
      )
    }
  }
  /* 与分组同行的子项：干路直接延伸 */
  for (const k of kids) {
    const [kx, ky] = pos.get(k)!
    if (Math.abs(ky - gy) < 0.5) {
      pushLink(
        `M ${bx} ${ky} H ${kx}`,
        k.data.path,
        g.data.path,
        k.data.color,
        (delayMap.get(k) ?? 0.5) - 0.03,
      )
    }
  }
}

/* 进阶链：hub → 子技能（同行，一段水平直线） */
for (const hub of rootNode.descendants().filter((n) => n.depth === 2 && n.children?.length)) {
  const [hx, hy] = pos.get(hub)!
  for (const k of hub.children) {
    const [kx, ky] = pos.get(k)!
    pushLink(
      trace(hx, hy, kx, ky, (hx + kx) / 2),
      k.data.path,
      hub.data.path,
      k.data.color,
      (delayMap.get(k) ?? 0.5) - 0.03,
    )
  }
}

function skillLabel(skill: SkillItem): string {
  return typeof skill === 'string' ? skill : skill.name
}

function skillChildren(skill: SkillItem): string[] | undefined {
  return typeof skill === 'string' ? undefined : skill.children?.map((c) => skillLabel(c))
}
</script>

<template>
  <div class="skills">
    <!-- 桌面端：电路板思维导图 -->
    <div v-reveal class="tree" role="img" aria-label="技能树思维导图">
      <svg class="tree-svg" viewBox="-520 -300 1040 600">
        <path
          v-for="(l, i) in links" :key="i"
          class="link"
          :class="{ dim: hoveredPath !== null && !isOn(l.path) && !isOn(l.ppath), on: isOn(l.path) }"
          :d="l.d" pathLength="1" :style="{ '--c': l.color, '--d': `${l.delay}s` }"
        />
      </svg>

      <!-- 根/分组/技能胶囊（HTML 覆盖层） -->
      <div class="root-pill">
        <Icon name="lucide:network" size="17" />
        技能树
      </div>
      <div
        v-for="g in groupNodes" :key="g.gid"
        class="group-pill"
        :class="{ dim: hoveredPath !== null && !isOn(g.path) }"
        :style="{ left: `${g.left}%`, top: `${g.top}%`, '--d': `${g.delay}s`, '--c': g.color }"
        @mouseenter="hoveredPath = g.path" @mouseleave="hoveredPath = null"
      >
        <Icon :name="g.icon" size="15" />
        {{ g.name }}
      </div>
      <div
        v-for="n in skillNodes" :key="n.path"
        class="skill-pill" :class="{ hub: n.hub, dim: hoveredPath !== null && !isOn(n.path), on: isOn(n.path) }"
        :style="{ left: `${n.left}%`, top: `${n.top}%`, '--d': `${n.delay}s`, '--c': n.color }"
        @mouseenter="hoveredPath = n.path" @mouseleave="hoveredPath = null"
      >
        {{ n.name }}
      </div>
    </div>

    <!-- 移动端：分组标签流 -->
    <div class="groups">
      <div v-for="(group, gi) in groups" :key="group.title" v-reveal="{ delay: gi * 90 }" class="group">
        <h3 class="group-title">
          <Icon :name="group.icon" size="15" />
          {{ group.title }}
        </h3>
        <ul class="skills-list">
          <li v-for="(skill, si) in group.skills" :key="skillLabel(skill)" v-reveal="{ delay: gi * 90 + si * 50 }">
            <TagPill :label="skillLabel(skill)" />
            <template v-if="skillChildren(skill)">
              <Icon name="lucide:corner-down-right" size="12" class="sub-arrow" />
              <TagPill v-for="c in skillChildren(skill)" :key="c" :label="c" class="sub-pill" />
            </template>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills {
  padding-top: 0.5rem;
}

/* ---- 径向思维导图 ---- */
.tree {
  position: relative;
  max-width: 58rem;
  margin: 0 auto;
  user-select: none;
}

.tree-svg {
  display: block;
  width: 100%;
  height: auto;
}

.link {
  fill: none;
  /* 颜色百分比代替 opacity 调制：同组走线的重合段不会叠加发亮 */
  stroke: color-mix(in srgb, var(--c) 55%, transparent);
  stroke-width: 1.7;
  stroke-dasharray: 1;
  transition:
    stroke 0.25s ease,
    stroke-width 0.25s ease;
  pointer-events: none;
}

.link.dim {
  stroke: color-mix(in srgb, var(--c) 7%, transparent);
}

.link.on {
  stroke: color-mix(in srgb, var(--c) 95%, transparent);
  stroke-width: 2.6;
}

/* ---- 根节点与分组胶囊 ---- */
.root-pill,
.group-pill,
.skill-pill {
  position: absolute;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.root-pill {
  left: 50%;
  top: 50%;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 1.15rem;
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: #10131f;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-radius: 999px;
  box-shadow: 0 0 28px rgba(129, 140, 248, 0.4);
}

.group-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  background: rgba(17, 20, 32, 0.85);
  border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
  border-radius: 999px;
  transition:
    opacity 0.25s ease,
    transform 0.3s var(--ease-bouncy);
}

.group-pill svg {
  color: var(--c);
}

.group-pill:hover {
  transform: translate(-50%, -50%) scale(1.08);
}

.group-pill.dim {
  opacity: 0.3;
}

/* ---- 技能胶囊：带边框框住文字，进阶中间节点边框更亮 ---- */
.skill-pill {
  padding: 0.16rem 0.55rem;
  font-family: var(--font-mono);
  font-size: 0.84rem;
  color: var(--text);
  background: rgba(15, 18, 30, 0.92);
  border: 1px solid color-mix(in srgb, var(--c) 38%, transparent);
  border-radius: 8px;
  transition:
    opacity 0.25s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.3s var(--ease-bouncy);
}

.skill-pill.hub {
  border-color: color-mix(in srgb, var(--c) 65%, transparent);
  font-weight: 600;
}

.skill-pill.on {
  border-color: var(--c);
  box-shadow: 0 0 10px color-mix(in srgb, var(--c) 30%, transparent);
}

.skill-pill.dim {
  opacity: 0.25;
}

/* ---- 入场：连线生长 + 节点依次点亮 ---- */
.reveal--visible .link {
  animation: link-draw 0.8s ease var(--d) backwards;
}

@keyframes link-draw {
  from {
    stroke-dashoffset: 1;
  }
}

.reveal--visible .skill-pill,
.reveal--visible .group-pill,
.reveal--visible .root-pill {
  animation: fade-in 0.5s ease var(--d, 0s) backwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

/* ---- 分组标签流（移动端） ---- */
.groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1.6rem;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.group-title svg {
  color: var(--accent);
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.skills-list li {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.sub-arrow {
  color: var(--muted);
}

.sub-pill {
  opacity: 0.85;
}

/* 响应式切换须放在 display 声明之后，否则会被同优先级规则覆盖 */
@media (min-width: 900px) {
  .groups {
    display: none;
  }
}

@media (max-width: 899px) {
  .tree {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal--visible .link,
  .reveal--visible .skill-pill,
  .reveal--visible .group-pill,
  .reveal--visible .root-pill {
    animation: none;
  }
}
</style>
