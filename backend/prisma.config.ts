import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',   // path is relative to this config file
  migrations:{
    path: "prisma/migrations",
  },
  datasource: {
    url: env('DATABASE_URL'),
  }
})