#!/usr/bin/env node
/**
 * 给 Quartz 的 explorer 插件打一个小补丁（npm 安装后自动执行）。
 *
 * 问题：打开任意笔记页时，左侧文件树会把「当前文件」滚进视野，但用的是
 *       scrollIntoView({ behavior: "smooth" })
 * 默认 block:"start" 会把**整个页面**也滚下去约 277px，
 * 用户一进页面标题和面包屑就被顶出屏幕。
 *
 * 修复：补上 block:"nearest"，只做最小滚动，页面不再跳动。
 *
 * 该补丁是幂等的；如果上游插件改动了这段代码导致匹配不到，只警告不报错，
 * 构建不会因此失败。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const targets = [
  "node_modules/@quartz-community/explorer/dist/index.js",
  "node_modules/@quartz-community/explorer/dist/components/index.js",
]

const FROM = 'o&&o.scrollIntoView({behavior:"smooth"})'
const TO = 'o&&o.scrollIntoView({behavior:"smooth",block:"nearest"})'

let patched = 0
let already = 0
let missing = 0

for (const rel of targets) {
  const file = path.join(repoRoot, rel)
  if (!fs.existsSync(file)) {
    missing++
    continue
  }
  const src = fs.readFileSync(file, "utf-8")
  if (src.includes(TO) || src.includes('block:"nearest"')) {
    already++
    continue
  }
  if (!src.includes(FROM)) {
    console.warn(`⚠ ${rel} 里没找到预期代码，补丁跳过（上游可能已改）`)
    missing++
    continue
  }
  fs.writeFileSync(file, src.replace(FROM, TO), "utf-8")
  patched++
}

if (patched > 0) console.log(`✓ explorer 补丁已应用（${patched} 个文件）`)
if (already > 0) console.log(`✓ explorer 补丁已存在（${already} 个文件）`)
if (missing > 0 && patched === 0 && already === 0) console.warn("⚠ explorer 补丁未应用")
