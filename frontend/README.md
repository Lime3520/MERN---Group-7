# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Authentication requests use the `/api` path. During local development, Vite proxies these requests to `https://mern.mathewjugo.com` by default. To use a local backend instead, set `VITE_API_PROXY_TARGET=http://127.0.0.1:5000` in a frontend `.env.local` file.

## Body scanner

Open `/scanner` and enter a height between 120 and 230 cm to try the camera-based pose estimate. Camera access requires HTTPS (or localhost). MediaPipe's model and WebAssembly runtime load from public CDNs, but camera frames are processed in the browser and are not uploaded or saved. The displayed shoulder and hip spans are rough pose-landmark estimates, not body circumferences or tailoring measurements.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
