export default {
  distDir: process.env.DAMGABIR_BUILD_DIR || '.next',
  devIndicators: false,
  agentRules: false,
  experimental: { cpus: 1 },
  async headers() {
    return [{source:'/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'}]}]
  }
}


