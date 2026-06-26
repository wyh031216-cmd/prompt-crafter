import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages 子路径部署：仓库名 prompt-crafter → /prompt-crafter/ */
const repoName = 'prompt-crafter'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: isGitHubPages ? `/${repoName}/` : '/',
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5188, strictPort: true },
})
