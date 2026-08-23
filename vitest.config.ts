import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    // tests/unit: la suite de las prácticas y el proyecto.
    // ejemplos: cada snippet de las sesiones de clase con su test ejecutable.
    include: ['tests/unit/**/*.test.ts', 'ejemplos/**/*.test.{ts,tsx}'],
    environment: 'node', // los tests de UI declaran jsdom con el pragma @vitest-environment
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
