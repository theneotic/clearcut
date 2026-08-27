# Clearcut Background Remover

Clearcut is a public, responsive image background-removal web app. Visitors can drop a JPG, JPEG, PNG, or WebP image, review the original beside the cutout on a checkerboard transparency preview, and download the result as a transparent PNG.

## How it works

The browser validates file type and size before sending an image to `POST /api/remove-background`. The Express server validates the payload again, writes it to an isolated temporary directory, then invokes `scripts/remove_background.py`. That script uses Pillow to normalize orientation and `rembg` to produce an RGBA PNG. The temporary source and intermediate output are deleted after processing; the finished PNG is placed in project storage only to provide the download URL.

| Requirement | Current behavior |
|---|---|
| Accepted input | JPG/JPEG, PNG, and WebP, up to 8 MB |
| Processing | Server-side Python with `rembg` and Pillow |
| Download format | PNG with transparency preserved |
| UI behavior | Drag/drop, file picker, processing, error, and success states |

## Local development

Install a current Node 22 runtime, Python 3.11 or newer, and a package manager that supports the `packageManager` entry in `package.json`. Create and activate a virtual environment, install Python dependencies, then start the web app.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
corepack enable
pnpm install
pnpm dev
```

If the virtual environment is not active when starting the app, point the server to it explicitly:

```bash
PYTHON_BIN=.venv/bin/python pnpm dev
```

The compact `u2netp` model used by `rembg` may be downloaded the first time Python runs locally. Keep the terminal online until that initial download completes.

## Tests and checks

Run the validation-focused test suite and TypeScript check before opening a pull request:

```bash
pnpm test
pnpm check
```

## Docker runtime

The root `Dockerfile` installs Python, creates a dedicated virtual environment, installs `rembg[cpu]` and Pillow, prefetches the compact `u2netp` model, installs the Node dependencies, and builds both the React frontend and Express server. It starts the production server with `node dist/index.js`, which respects the platform-provided `PORT` environment variable.

Build and run locally with Docker:

```bash
docker build -t clearcut .
docker run --rm -p 3000:3000 -e PORT=3000 clearcut
```

The supplied runtime configuration assumes a request-bound workload. For sustained concurrent heavy processing, add a queue and move model inference to appropriately sized dedicated compute.

## Vercel deployment

Vercel can deploy this application through its container runtime. Import the **`theneotic/clearcut-background-remover`** repository and leave the root directory at `/`. The repository includes `Dockerfile.vercel`, which tells Vercel to build the Node and Python/rembg application as one HTTP container.

Do **not** import `theneotic/background-removex`; that is a separate media-routing application and is not Clearcut. During import, Vercel should detect the container build rather than create a generic static or Node-only deployment. Set the same required secrets through the Vercel project settings before promoting a deployment to production.

When the Manus Forge storage variables are not present, Clearcut automatically returns the processed result as a short-lived inline image URL. This makes the primary upload, edit, download, local history, and batch-export flows work in a standalone Vercel container without Manus storage. Inline delivery is capped at 7 MB per processed file; configure object storage for larger results or durable server-side history.

## GitHub workflow

Create a private repository, add the project as its remote, and push the initial commit. Do not commit `.env` files or any deployment secrets.

```bash
git init
git add .
git commit -m "Build Clearcut background remover"
gh repo create clearcut-background-remover --private --source=. --push
```

Before deploying, set the required platform configuration through the hosting provider’s secret-management interface. The built-in project runtime injects those values automatically; the Dockerfile intentionally contains no secret literals.
