import fastify from 'fastify'

const app = fastify({ logger: true })

const PORT = process.env.PORT || 3000

// Health check
app.get('/health', async () => {
  return { status: 'ok', message: 'Resumate Backend is running!' }
})

// Start server
const start = async () => {
  try {
    await app.listen({ port: Number(PORT), host: '0.0.0.0' })
    console.log(`🚀 Backend server is running on http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
