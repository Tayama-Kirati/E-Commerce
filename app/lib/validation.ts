import { z } from "zod";

export const AddressSchema = z.object({
  label: z.string().max(30).default("Home"),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number"),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
});

export const PasswordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");
