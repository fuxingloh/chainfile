import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
});

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3000`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BASE_URL: getBaseUrl(),
  },
};

export default withNextra(nextConfig);
