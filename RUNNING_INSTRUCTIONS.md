# Running the Game

The game cannot be started directly from the file system (`file://` protocol) because the browser blocks certain operations (e.g., `postMessage`).

## Recommended way
1. **Start a local HTTP server** in the project folder.
   ```bat
   # Windows batch file (run `start_server.bat`)
   npx -y http-server@latest . -p 8000
   ```
   This will serve the files at `http://127.0.0.1:8000`.
2. Open your browser and navigate to `http://127.0.0.1:8000`.
3. Click the **GAME START** button – the game should load and run normally.

## Quick start (one‑liner)
If you have Node.js installed, you can start the server directly from a command prompt:
```bash
cd "C:\\Users\\i712\\Desktop\\진돼지1"
npx -y http-server@latest . -p 8000
```
Then open `http://127.0.0.1:8000` in your browser.

### Why this is needed
- The `file://` protocol prevents scripts from loading resources and communicating across origins, which caused the previous errors.
- Serving over HTTP removes those restrictions and the game runs as intended.

Feel free to create a shortcut to `start_server.bat` for easier access.
