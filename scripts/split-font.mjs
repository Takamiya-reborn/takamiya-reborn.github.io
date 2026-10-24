#!/usr/bin/env node
// 字体分片：把 font-src 下的整包中文字体用 cn-font-split 拆成
// unicode-range 分片（同 Google Fonts 思路），输出到 app/assets/fonts/<slug>/，
// 由 Vite 随构建打包哈希。浏览器只按需下载页面实际用到的分片。
// 用法：node scripts/split-font.mjs（字体换包时改 CONFIG 再跑，
// 源字体不进 public——整包 1.5MB 不该原样部署）

import { readFile, readdir, rm, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fontSplit } from 'cn-font-split'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const CONFIG = {
  input: resolve(ROOT, 'font-src/HYWenHei-85W.woff2'),
  outDir: resolve(ROOT, 'app/assets/fonts/hyw'),
  // 与 main.css 字体栈里的名字保持一致，全站引用不用改
  fontFamily: 'HYWenHei-85W',
  // 单字重文件注册成全权重，让粗体走合成加粗（与原整包 @font-face 口径一致）
  fontWeight: '400 900',
}

// 输出目录整体重建，避免上一版分片残留
await rm(CONFIG.outDir, { recursive: true, force: true })
await mkdir(CONFIG.outDir, { recursive: true })

console.time('font-split')
await fontSplit({
  input: await readFile(CONFIG.input),
  outDir: CONFIG.outDir,
  targetType: 'woff2',
  css: {
    fontFamily: CONFIG.fontFamily,
    fontWeight: CONFIG.fontWeight,
    fontDisplay: 'swap',
  },
})
console.timeEnd('font-split')

const files = await readdir(CONFIG.outDir)
const css = files.filter(f => f.endsWith('.css'))
const fonts = files.filter(f => f.endsWith('.woff2'))
console.log(`分片完成：${fonts.length} 个 woff2 + ${css.length} 个 css → ${CONFIG.outDir}`)
