import { createServer } from "node:http"

const port = Number(process.env.PORT || 3001)
const baseUrl = process.env.OPENCODE_BASE_URL || "http://127.0.0.1:4096"
const maxRequestSize = 32 * 1024

function getAuthorizationHeader() {
    if (process.env.OPENCODE_API_KEY) {
        return `Bearer ${process.env.OPENCODE_API_KEY}`
    }

    if (process.env.OPENCODE_SERVER_PASSWORD) {
        const username = process.env.OPENCODE_SERVER_USERNAME || "opencode"
        const credentials = Buffer.from(
            `${username}:${process.env.OPENCODE_SERVER_PASSWORD}`,
        ).toString("base64")
        return `Basic ${credentials}`
    }

    return null
}

async function readJsonBody(request) {
    let body = ""

    for await (const chunk of request) {
        body += chunk
        if (Buffer.byteLength(body) > maxRequestSize) {
            throw new Error("Request body is too large.")
        }
    }

    try {
        return JSON.parse(body)
    } catch {
        throw new Error("Request body must be valid JSON.")
    }
}

async function openCodeRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json" }
    const authorization = getAuthorizationHeader()
    if (authorization) headers.Authorization = authorization

    const response = await fetch(new URL(path, baseUrl), {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: AbortSignal.timeout(120_000),
    })
    const responseText = await response.text()
    let data

    try {
        data = responseText ? JSON.parse(responseText) : null
    } catch {
        throw new Error("OpenCode returned an invalid response.")
    }

    if (!response.ok) {
        const message = data?.message || data?.error || `OpenCode request failed (${response.status}).`
        throw new Error(message)
    }

    return data
}

function parseRecipeResponse(message) {
    const text = message.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n")
        .trim()

    if (!text) {
        throw new Error("OpenCode returned an empty recipe.")
    }

    const jsonText = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")

    let recipe
    try {
        recipe = JSON.parse(jsonText)
    } catch {
        throw new Error("OpenCode did not return the requested recipe format. Please try again.")
    }

    if (
        typeof recipe.summary !== "string" ||
        !recipe.summary.trim() ||
        !Array.isArray(recipe.instructions) ||
        recipe.instructions.length === 0 ||
        recipe.instructions.some((step) => typeof step !== "string" || !step.trim())
    ) {
        throw new Error("OpenCode returned an incomplete recipe. Please try again.")
    }

    return {
        summary: recipe.summary.trim(),
        instructions: recipe.instructions.map((step) => step.trim()),
    }
}

async function generateRecipe(ingredients) {
    const session = await openCodeRequest("/session", {
        method: "POST",
        body: JSON.stringify({ title: "Chef AI recipe" }),
    })

    if (!session?.id) {
        throw new Error("OpenCode did not create a recipe session.")
    }

    const response = await openCodeRequest(
        `/session/${encodeURIComponent(session.id)}/message`,
        {
            method: "POST",
            body: JSON.stringify({
                system: [
                    "You are a helpful cooking assistant.",
                    "Create one practical recipe using the ingredients supplied by the user.",
                    "Return only valid JSON with exactly two properties: summary (a short string) and instructions (an array of strings in cooking order).",
                    "Do not include Markdown, HTML, or code fences.",
                ].join(" "),
                parts: [{
                    type: "text",
                    text: `Make a recipe using these ingredients: ${ingredients.join(", ")}.`,
                }],
            }),
        },
    )

    return parseRecipeResponse(response)
}

const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/api/recipe") {
        response.writeHead(404, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ error: "Not found." }))
        return
    }

    try {
        const body = await readJsonBody(request)
        if (!Array.isArray(body?.ingredients)) {
            response.writeHead(400, { "Content-Type": "application/json" })
            response.end(JSON.stringify({ error: "Ingredients must be provided as a list." }))
            return
        }

        const ingredients = body.ingredients
            .filter((ingredient) => typeof ingredient === "string")
            .map((ingredient) => ingredient.trim())
            .filter(Boolean)

        if (ingredients.length === 0) {
            response.writeHead(400, { "Content-Type": "application/json" })
            response.end(JSON.stringify({ error: "Add at least one ingredient first." }))
            return
        }

        const recipe = await generateRecipe(ingredients)
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(JSON.stringify(recipe))
    } catch (error) {
        const statusCode = error.message === "Request body must be valid JSON." ||
            error.message === "Request body is too large."
            ? 400
            : 502

        console.error("Recipe generation failed:", error)
        response.writeHead(statusCode, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ error: error.message || "Recipe generation failed." }))
    }
})

server.listen(port, "127.0.0.1", () => {
    console.log(`Recipe API listening on http://127.0.0.1:${port}`)
})
