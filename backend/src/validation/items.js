import { z } from "zod";
export const itemCreateSchema = z.object({
  title: z.string().min(1),
  price: z.number().nonnegative(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  sellerId: z.string().min(1),
  status: z.enum(["active","sold","hidden"]).optional()
});
export const itemUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["active","sold","hidden"]).optional(),
  isDeleted: z.boolean().optional()
});
