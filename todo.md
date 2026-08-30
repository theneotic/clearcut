# Project TODO

- [x] Create and refine the Clearcut responsive public image background-removal application.
- [x] Add JPG, JPEG, PNG, and WebP upload validation, drag-and-drop input, server-side rembg/Pillow processing, transparent previews, advanced crop/shadow/background controls, export formats, local history, and batch ZIP downloads.
- [x] Add public About, Contact, Privacy, and Terms routes with shared navigation and footer.
- [x] Add standalone result delivery and optional managed-service routes so Clearcut can run without Manus storage or OAuth environment variables.
- [x] Validate the application with 25 automated tests, TypeScript checks, production builds, and responsive review.
- [x] Create or reuse the private Clearcut GitHub repository and publish the reviewed source with the user’s GitHub identity.
- [x] Confirm the canonical repository is https://github.com/theneotic/clearcut on the main branch.
- [x] Diagnose the Vercel failure in which a Vite static deployment exposed the compiled server bundle instead of serving Clearcut.
- [x] Add root vercel.json clearing stale Vite framework, build-command, install-command, and output-directory overrides so Vercel can select Dockerfile.vercel.
- [x] Update deployment documentation to use theneotic/clearcut and container mode rather than the unrelated Background Removex repository.
- [x] Commit and push the Vercel correction as theneotic <157010181+theneotic@users.noreply.github.com>; commit 32c29d8c59113a9f64c94e4d51b78d1a80d6f12c.
- [ ] Deploy the updated canonical Clearcut repository through the user’s personal Vercel project.
- [ ] Verify the live Vercel URL serves the Clearcut frontend and complete an upload/export smoke test.
- [x] Fix production `Unexpected token '<'` JSON parsing by adding safe HTML/malformed-response handling for Clearcut API requests; 28 tests, TypeScript checks, and the production build pass.
- [x] Improve the production background-removal runtime by caching the u2netp rembg session; the supplied JPG produced a non-empty PNG locally and 28 tests passed.
- [x] Replace the broken hero before/after storage URLs with deployment-safe inline SVG artwork and verify the mobile homepage visually.
