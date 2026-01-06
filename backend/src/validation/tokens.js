import { z } from "zod";
export const tokenCreateSchema = z.object({
  address: z.string().min(1),
  ownerId: z.string().min(1),
  balance: z.number().nonnegative().optional(),
  chain: z.string().optional(),
  note: z.string().optional()
});
export const tokenUpdateSchema = z.object({
  address: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  balance: z.number().nonnegative().optional(),
  chain: z.string().optional(),
  note: z.string().optional(),
  isDeleted: z.boolean().optional()
});
