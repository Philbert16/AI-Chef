import { spawn } from "node:child_process"

const children = []
let shuttingDown = false

function shutdown(exitCode = 0) {
    if (shuttingDown) return
    shuttingDown = true
    process.exitCode = exitCode

    for (const child of children) {
        if (child.exitCode === null && !child.killed) {
            child.kill()
        }
    }
}

function start(label, args) {
    const child = spawn(process.execPath, args, {
        cwd: process.cwd(),
        stdio: "inherit",
    })
    children.push(child)

    child.on("error", (error) => {
        console.error(`Could not start ${label}:`, error.message)
        shutdown(1)
    })

    child.on("exit", (code) => {
        if (!shuttingDown) {
            console.error(`${label} stopped${code === null ? "" : ` with exit code ${code}`}.`)
            shutdown(code || 1)
        }
    })
}

process.on("SIGINT", () => shutdown())
process.on("SIGTERM", () => shutdown())

console.log("Starting the recipe API and Vite development server...")
start("Recipe API", ["--env-file-if-exists=.env", "server/index.js"])
start("Vite", ["node_modules/vite/bin/vite.js"])
