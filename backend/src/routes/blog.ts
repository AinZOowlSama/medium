import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@giriii/medium-common";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();
blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    c.status(401);
    return c.json({ error: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  const payload = await verify(token, c.env.JWT_SECRET);
  if (!payload) {
    c.status(401);
    return c.json({ error: "unauthorized" });
  }
  console.log(payload);
  c.set("userId", String(payload.id));
  await next();
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = await prisma.post.findMany({});

  return c.json({ posts });
});
blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const id = c.req.param("id");

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      c.status(404);
      return c.json({ error: "Post not found" });
    }

    return c.json({ post });
  } catch (e) {
    c.status(500);
    return c.json({ error: "Failed to fetch post" });
  }
});

blogRouter.post("/", async (c) => {
  const body = await c.req.json();
  const { title, content } = body;
  const { success } = createBlogInput.safeParse(await c.req.json());
  if (!success) {
    c.status(400);
    return c.json({ error: "invalid input" });
  }
  const userId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  if (!title || !content) {
    c.status(400);
    return c.json({ error: "Title and content are required" });
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: userId,
      },
    });
    return c.json({ id: post.id });
  } catch (e) {
    c.status(500);
    return c.json({ error: "Failed to create post" });
  }
});

blogRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { title, content } = body;
  const { success } = updateBlogInput.safeParse(await c.req.json());
  if (!success) {
    c.status(400);
    return c.json({ error: "invalid input" });
  }
  const userId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  if (!title && !content) {
    c.status(400);
    return c.json({ error: "At least one of title or content is required" });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      c.status(404);
      return c.json({ error: "Post not found" });
    }
    if (post.authorId !== userId) {
      c.status(403);
      return c.json({ error: "You are not authorized to update this post" });
    }

    const updatedPost = await prisma.post.update({
      where: { id, authorId: userId },
      data: {
        title: title || post.title,
        content: content || post.content,
      },
    });

    return c.json({ post: updatedPost });
  } catch (e) {
    c.status(500);
    return c.json({ error: "Failed to update post" });
  }
});
