import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { signupInput } from "@giriii/medium-common"

export const userRouter = new Hono<{
  Bindings: {
      DATABASE_URL: string,
      JWT_SECRET: string  
  }
  Variables : {
		userId: string
	}
}>();
userRouter.post('/signup', async(c) => {
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const { name, username, password } = await c.req.json()
    const {success} = signupInput.safeParse(await c.req.json())
      if (!success) {
        c.status(400);
        return c.json({ error: "invalid input" });
      }
  try{
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password
      }
    })
    const token = await sign({ id: user.id }, c.env.JWT_SECRET)
    return c.json({ jwt: token });
  } catch(e) {
    c.status(403);
    return c.json({ error: "error while signing up" });
  }
})
  

    


userRouter.post('/signin',async (c) => {
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const { username, password } = await c.req.json()
    const {success} = signupInput.safeParse(await c.req.json())
       if (!success) {
        c.status(400);
        return c.json({ error: "invalid input" });
      }
 try{
    const user = await prisma.user.findUnique({
      where: {
        username
        
      }
    })
    if (!user) {
      c.status(403);
      return c.json({ error: "error while signing in" });
    }
    const token = await sign({ id: user.id }, c.env.JWT_SECRET)
    return c.json({ jwt: token });
  }
  catch(e) {
    c.status(403);
    return c.json({ error: "error while signing in" });
  }
})