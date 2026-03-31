import { z } from "zod";

export const nsConfigSchema = z.object({
  enabled: z.boolean(),
  servers: z.array(z.string()).max(4).min(0),
});

export const phonebookEntrySchema = z.object({
  number: z
    .string()
    .regex(/^\d+$/, "Number must be digits only")
    .min(5)
    .max(15),
  name: z.string().min(1).max(50),
});

export type NSConfig = z.infer<typeof nsConfigSchema>;
export type PhonebookEntry = z.infer<typeof phonebookEntrySchema>;
