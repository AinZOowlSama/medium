import { z } from 'zod'

// this zod schema is for backend
export const signupInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

export type SignupInput = z.infer<typeof signupInput>; // to be used by front end

export const signinInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
export type SigninInput = z.infer<typeof signinInput>; // to be used by front end

export const createBlogInput = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})
export type CreateBlogInput = z.infer<typeof createBlogInput>; // to be used by front end

export const updateBlogInput = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  id : z.string().min(1),
})
export type UpdateBlogInput = z.infer<typeof updateBlogInput>; // to be used by front end