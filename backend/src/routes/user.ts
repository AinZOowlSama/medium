import { Hono } from "hono"
import { PrismaClient } from '../generated/prisma/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signupInput, signinInput } from "@giriii/medium-common" 

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string  
  },
  Variables: {
    userId: string
  }
}>();


userRouter.post('/signup', async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL, 
  }).$extends(withAccelerate());

  try {
   
    const body = await c.req.json();
    
    
    const { success } = signupInput.safeParse(body);
    if (!success) {
      c.status(400);
      return c.json({ error: "invalid input" });
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email, 
        password: body.password
      }
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt: token });

  } catch (e) {
    console.error(e);
    c.status(403);
    return c.json({ error: "error while signing up" });
  }
});


userRouter.post('/signin', async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    
    const body = await c.req.json();

   
    const { success } = signinInput.safeParse(body);
    if (!success) {
      c.status(400);
      return c.json({ error: "invalid input" });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: body.email 
      }
    });

    if (!user || user.password !== body.password) {
      c.status(403);
      return c.json({ error: "invalid credentials" });
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt: token });

  } catch (e) {
    console.error(e);
    c.status(403);
    return c.json({ error: "error while signing in" });
  }
});