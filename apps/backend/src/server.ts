import { buildApp } from './app'
import { env } from './config/env'

async function start(): Promise<void> {
  const app = await buildApp()

  try {
    await app.listen({ port: Number(env.PORT), host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  const shutdown = async (): Promise<void> => {
    app.log.info('서버 종료 중...')
    await app.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

start()
