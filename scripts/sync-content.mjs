#!/usr/bin/env node
/**
 * 把 Obsidian 笔记库里的「测井课程知识库」同步到站点的 content/ 目录。
 *
 * 只同步这一个子目录，库根目录下的个人笔记永远不会进入站点或仓库。
 *
 * 用法：
 *   node scripts/sync-content.mjs            # 按 sync.config.json 里的路径同步
 *   node scripts/sync-content.mjs <源目录>   # 临时指定源目录
 *
 * 规则：
 *   - 先清空 content/ 里除「受保护文件」之外的所有内容，再整体复制；
 *   - 受保护文件默认是 content/index.md（手写的站点首页，不在笔记库里）。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const configPath = path.join(repoRoot, "sync.config.json")
const contentDir = path.join(repoRoot, "content")

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`找不到 ${configPath}，请先创建它并填入笔记库路径。`)
  }
  return JSON.parse(fs.readFileSync(configPath, "utf-8"))
}

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".obsidian" || entry.name === ".trash") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full)
  }
  return out
}

const cfg = loadConfig()
const sourceDir = path.resolve(process.argv[2] ?? cfg.vaultCourseDir)
const protectedFiles = new Set(cfg.protectedFiles ?? ["index.md"])

if (!fs.existsSync(sourceDir)) {
  console.error(`✗ 源目录不存在：${sourceDir}`)
  process.exit(1)
}

// 1. 清空 content/（保留受保护文件）
fs.mkdirSync(contentDir, { recursive: true })
for (const entry of fs.readdirSync(contentDir, { withFileTypes: true })) {
  if (protectedFiles.has(entry.name)) continue
  fs.rmSync(path.join(contentDir, entry.name), { recursive: true, force: true })
}

// 2. 复制笔记（保持子目录结构，只复制 .md）
const files = walk(sourceDir)
const protectedRel = new Set(
  (cfg.protectedFiles ?? ["index.md"]).map((p) => path.normalize(p)),
)
let copied = 0
let skipped = 0
for (const file of files) {
  const rel = path.normalize(path.relative(sourceDir, file))
  // 站点专用的文件（首页、面向网站改写过的使用说明）不从笔记库覆盖
  if (protectedRel.has(rel)) {
    skipped++
    continue
  }
  const dest = path.join(contentDir, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(file, dest)
  copied++
}

console.log(`✓ 已同步 ${copied} 篇笔记${skipped > 0 ? `（跳过 ${skipped} 个站点专用文件）` : ""}`)
console.log(`  从：${sourceDir}`)
console.log(`  到：${contentDir}`)
