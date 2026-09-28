/** @type {import('next').NextConfig} */
const config = process.env.REALITY_DESKTOP === '1'
  ? { output: 'export', assetPrefix: './', images: { unoptimized: true } }
  : {};
export default config;
