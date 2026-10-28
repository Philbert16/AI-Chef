# AI Chef

AI Chef generates a recipe from the ingredients you add to the list. The request is sent only when you click **Get a recipe**.

## Run locally

1. Start the OpenCode server in a terminal:

   ```sh
   opencode serve --hostname 127.0.0.1 --port 4096
   ```

   OpenCode must have a provider and default model configured.

2. Copy `.env.example` to `.env`. Set the OpenCode server address and, if authentication is enabled, configure either `OPENCODE_API_KEY` (Bearer) or `OPENCODE_SERVER_PASSWORD` (Basic authentication). Do not commit `.env`.

3. Start the frontend and recipe API together:

   ```sh
   npm run dev
   ```

The development command starts both Vite and the local recipe API. The Vite server proxies `/api/recipe` to the Node server. The Node server creates an OpenCode session, sends the ingredient prompt, validates the recipe response, and returns a summary and ordered instruction steps to the page. You can also run only the recipe API with `npm run server` when starting Vite separately.
