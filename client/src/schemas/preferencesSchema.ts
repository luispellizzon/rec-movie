import z from "zod";

export const preferencesSchema = z
    .object({
        selectedMood: z.string().min(1, "Select one mood."),
        customMood: z.string().optional(),
        freeTime: z.string(),
        language: z.string(),
        country: z.string(),
        era: z.string(),
        popularity: z.string(),
        genres: z
            .array(z.string())
            .min(1, "Select at least one genre."),
        movieCount: z.coerce
            .number()
            .int()
            .min(1, "At least 1 movie.")
            .max(20, "Maximum 20 movies."),
    })

export type PreferencesFormData = z.infer<typeof preferencesSchema>;

export type PreferencesErrors = Partial<
    Record<keyof PreferencesFormData, string>
>;