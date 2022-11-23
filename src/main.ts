require("dotenv").config()
import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const PORT = process.env.SERVER_PORT || 9999
  const SERVICE_CODE = process.env.SERVICE_CODE || 'linode_autoscale'
  await app.listen(PORT, () => {
    console.log(`[Application] ${SERVICE_CODE.toUpperCase()} backend ready serve on port ${PORT}`)
  })
}

bootstrap();
