/** @type {import('next').NextConfig} */
const nextConfig = {
  // The dev overlay badge sits on top of the sheet's lower-left corner, which
  // is where the legend ends. It is dev-only, and it has no business in a
  // review capture.
  devIndicators: false,

  // PGlite ships a WASM Postgres build. It must stay external to the server
  // bundle so the .wasm and .data files are resolved from node_modules at
  // runtime rather than inlined by the bundler.
  serverExternalPackages: ['@electric-sql/pglite', '@electric-sql/pglite-postgis'],

  // The extract is read off disk by the API routes at cold start, so it has to
  // travel with the serverless bundle.
  outputFileTracingIncludes: {
    '/api/**': ['./data/**'],
  },
};

export default nextConfig;
