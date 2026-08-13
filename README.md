# Mark Martin E-portfolio

A static postgraduate computing and artificial intelligence e-portfolio built for GitHub Pages.

## Publish

1. Upload all files and folders to the repository root.
2. In GitHub, open **Settings > Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Select **main** and **/(root)**, then save.
5. The project site should appear at `https://m2coach-ai.github.io/markmartin.github.io/`.

## Structure

- `index.html`: immersive landing page
- `about/`: About Me
- `modules/`: module hubs, entries and evidence
- `learning-loop/`: programme synthesis
- `assets/`: shared styles, scripts and visual assets

## Important content gaps

The current build intentionally does not invent academic evidence. Before submission, add official module learning outcomes, final About Me content, peer or tutor feedback, and engaged academic literature.

## Technical notes

The landing page loads Three.js from jsDelivr. If WebGL or the network request fails, a static poster remains visible and all navigation and assessed content still work. Module and entry pages do not load Three.js.
