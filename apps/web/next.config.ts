import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@nextreport/schema',
    '@nextreport/engine-core',
    '@nextreport/renderer-html',
    '@nextreport/renderer-pdf',
    '@nextreport/canvas',
    '@nextreport/ui-designer',
    '@nextreport/ui-viewer',
  ],
}

export default nextConfig
