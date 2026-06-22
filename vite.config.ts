import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Plain client-side SPA — deploys as static files on Vercel.
export default defineConfig({
  plugins: [react()],
});
