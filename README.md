This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# klinikOS-app
# klinikOS-app

## Design tokens y utilidades Tailwind

Se han añadido tokens semánticos en `src/app/globals.css` y se exponen en `tailwind.config.ts`.

Ejemplos de uso:

```tsx
// Colores semánticos
<div className="bg-surface text-fg border border-border shadow-elevation-card" />

// Jerarquías de texto
<h2 className="text-title-md font-inter text-fg">Título</h2>
<p className="text-body-sm text-fg-secondary">Contenido</p>

// Estados
<span className="text-state-success">+12%</span>

// Data viz
<svg>
  <path className="stroke-chart-1" />
  <path className="stroke-chart-2" />
  <g className="stroke-chart-grid" />
  <g className="stroke-chart-axis" />
  <path className="fill-chart-3" />
  <path className="fill-chart-4" />
  <path className="stroke-chart-accent" />
  <path className="stroke-chart-threshold" />
  <path className="stroke-chart-negative" />
  
// Focus ring
<button className="focus:outline-none focus:ring-2 focus:ring-focus">OK</button>
```

Tokens principales disponibles:

- Fondo y superficies: `bg-surface`, `bg-surface-accent`, `bg-surface-app`
- Texto: `text-fg`, `text-fg-secondary`, `text-fg-muted`, `text-fg-inverse`, `text-fg-link`
- Bordes: `border-border`
- Marca: `text-brandSemantic`, `text-brandSemantic-strong`, `text-brandSemantic-weak`
- Estados: `text-state-success`, `text-state-warning`, `text-state-info`, `text-state-danger`
- Gráficos: `stroke-chart-{1..4}`, `stroke-chart-accent`, `stroke-chart-grid`, `stroke-chart-axis`, `stroke-chart-negative`, `stroke-chart-threshold`
- Sombras: `shadow-elevation-card`, `shadow-elevation-popover`
- Radios: `rounded-lg`, `rounded-pill`, `rounded-full`
