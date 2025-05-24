import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'

const app = new Hono<{
  Bindings: {
      DATABASE_URL: string,
      JWT_SECRET: string  
  }
  Variables : {
		userId: string
	}
}>();

app.route('/api/v1/user',userRouter)
app.route('/api/v1/blog',blogRouter)

// app.use('*', cors({
//   origin: '*',
//   allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
// }))





export default app
