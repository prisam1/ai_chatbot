import { z } from "zod";
import { SECTION_IDS, STYLE_IDS } from "./presets";

export const PROMPT_MIN = 3;
export const PROMPT_MAX = 2000;
export const PASSWORD_MIN = 8;
// bcrypt ignores everything after 72 bytes
export const PASSWORD_MAX_BYTES = 72;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

export const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .refine((p) => byteLength(p) <= PASSWORD_MAX_BYTES, "Password is too long")
  .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p), "Use both uppercase and lowercase letters")
  .refine((p) => /\d/.test(p), "Include at least one number");

export const registerSchema = z.object({ email: emailSchema, password: passwordSchema });

// Login skips strength rules so older accounts can still sign in
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .refine((p) => byteLength(p) <= PASSWORD_MAX_BYTES, "Password is too long"),
});

export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string().min(1, "Please confirm your password") })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const promptText = z
  .string({ required_error: "Prompt is required" })
  .trim()
  .min(PROMPT_MIN, `Describe your page in at least ${PROMPT_MIN} characters`)
  .max(PROMPT_MAX, `Keep your description under ${PROMPT_MAX} characters`);

// Strict enums and a hex check, so nothing free-form reaches the AI through options
export const generationOptionsSchema = z
  .object({
    style: z.enum(STYLE_IDS).optional(),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i, "Invalid colour").optional(),
    sections: z.array(z.enum(SECTION_IDS)).max(SECTION_IDS.length).optional(),
  })
  .strict();

export const promptSchema = z.object({
  prompt: promptText,
  options: generationOptionsSchema.optional(),
});

export const enhanceSchema = z.object({ prompt: promptText });

export const idSchema = z.string().min(1).max(64).regex(/^[a-z0-9]+$/i, "Invalid id");
export const shareIdSchema = z.string().regex(/^[A-Za-z0-9_-]{24}$/, "Invalid link");

export type GenerationOptions = z.infer<typeof generationOptionsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
