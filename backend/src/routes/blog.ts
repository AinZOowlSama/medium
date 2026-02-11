import { createBlogInput, updateBlogInput } from "@giriii/medium-common";
import { PrismaClient } from "../generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }, 
    Variables: {
        userId: string;
    }
}>();

// AUTHENTICATION MIDDLEWARE
blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    
    // Fix: Extract the token by splitting "Bearer <token>"
    const token = authHeader.split(" ")[1]; 

    if (!token) {
        c.status(403);
        return c.json({ message: "No token provided" });
    }

    try {
        // Verify only the raw token string
        const user = await verify(token, c.env.JWT_SECRET, { alg: "HS256" });
        
        if (user && user.id) {
            c.set("userId", String(user.id));
            await next();
        } else {
            c.status(403);
            return c.json({ message: "You are not logged in" });
        }
    } catch(e) {
        c.status(403);
        return c.json({ message: "Invalid session or token" });
    }
});

// CREATE BLOG
blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({ message: "Inputs not correct" });
    }

    const authorId = c.get("userId");
    const prisma = new PrismaClient({
      accelerateUrl: c.env.DATABASE_URL, // Prisma 7 standard
    }).$extends(withAccelerate());

    const blog = await prisma.blog.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: Number(authorId)
        }
    });

    return c.json({ id: blog.id });
});

// UPDATE BLOG
blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({ message: "Inputs not correct" });
    }

    const prisma = new PrismaClient({
      accelerateUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.blog.update({
        where: {
            id: Number(body.id) // Ensure ID is a Number if defined as Int in schema
        }, 
        data: {
            title: body.title,
            content: body.content
        }
    });

    return c.json({ id: blog.id });
});

// GET ALL BLOGS (BULK)
blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        accelerateUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.blog.findMany({
        select: {
            content: true,
            title: true,
            id: true,
            author: {
                select: {
                    name: true
                }
            }
        }
    });

    return c.json({ blogs });
});

// GET SINGLE BLOG
blogRouter.get('/:id', async (c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
      accelerateUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            },
            select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });
    
        return c.json({ blog });
    } catch(e) {
        c.status(411);
        return c.json({ message: "Error while fetching blog post" });
    }
});