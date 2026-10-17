#!/usr/bin/env node
/**
 * 本地预览服务器 —— 模拟 GitHub Pages 的 URL 规则。
 *
 * 为什么需要它：Quartz 生成的是 `foo.html` 而不是 `foo/index.html`，
 * 线上 GitHub Pages 会把 /foo 映射到 foo.html，但 python -m http.server
 * 之类的简单服务器不支持，直接打开会 404、双链全部点不开。
 *
 * 用法：
 *   node scripts/preview.mjs           # 默认 http://127.0.0.1:8080
 *   node scripts/preview.mjs 9000      # 指定端口
 */
import http from "node:http"
import fs from "node:fs"
import path from "node:path"

const root = path.resolve(process.argv[3] ?? "public")
const port = Number(process.argv[2] ?? process.env.PORT ?? 8080)

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile()
  } catch {
    return false
  }
}

const server = http.createServer((req, res) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
  } catch {
    pathname = "/"
  }

  // 防止 ../ 穿越到 public 之外
  const relative = path.normalize(pathname).replace(/^([/\\])+/, "")
  const base = path.join(root, relative)
  if (!base.startsWith(root)) {
    res.writeHead(403).end("403")
    return
  }

  // 依次尝试：原路径 → 加 .html → 目录下的 index.html
  const target = [base, `${base}.html`, path.join(base, "index.html")].find(isFile)

  if (!target) {
    const notFound = path.join(root, "404.html")
    res.writeHead(404, { "content-type": MIME[".html"] })
    res.end(isFile(notFound) ? fs.readFileSync(notFound) : "404 Not Found")
    return
  }

  res.writeHead(200, { "content-type": MIME[path.extname(target).toLowerCase()] ?? "application/octet-stream" })
  fs.createReadStream(target).pipe(res)
})

server.listen(port, "127.0.0.1", () => {
  console.log(`\n  本地预览已启动：http://127.0.0.1:${port}/\n  按 Ctrl+C 停止\n`)
})
