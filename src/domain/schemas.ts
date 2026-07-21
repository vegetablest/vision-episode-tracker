import { z } from "zod";
import { activities, associatedSymptoms, eyeScopes, relatedFactors, timePeriods, visualFields, visualSymptoms } from "./episode";

const nullableText = (max: number) => z.string().trim().max(max).nullable();
const accuracy = z.enum(["exact", "approximate", "period_only", "date_only", "unknown"]);

export const episodeSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().uuid(), revision: z.number().int().positive(),
  status: z.enum(["ongoing", "completed", "voided"]), recordMethod: z.enum(["live", "manual"]),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), timezone: z.string().min(1),
  startAt: z.string().datetime().nullable(), endAt: z.string().datetime().nullable(), timePeriod: z.enum(timePeriods).nullable(),
  dateAccuracy: accuracy, startTimeAccuracy: accuracy, endTimeAccuracy: z.enum(["exact", "approximate", "unknown"]),
  duration: z.object({ minutes: z.number().positive().nullable(), source: z.enum(["computed", "manual", "unknown"]), accuracy: z.enum(["exact", "approximate", "unknown"]) }),
  eyeScope: z.enum(eyeScopes).nullable(), visualFields: z.array(z.enum(visualFields)), visualSymptoms: z.array(z.enum(visualSymptoms)), severity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable(),
  onsetPattern: z.enum(["sudden", "gradual", "unknown"]).nullable(), similarToPrevious: z.boolean().nullable(), recoveredCompletely: z.boolean().nullable(), residualSymptoms: z.boolean().nullable(),
  associatedSymptoms: z.array(z.enum(associatedSymptoms)), activity: z.enum(activities).nullable(), possibleRelatedFactors: z.array(z.enum(relatedFactors)),
  otherVisualSymptom: nullableText(100), otherAssociatedSymptom: nullableText(100), otherRelatedFactor: nullableText(100), note: nullableText(500),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(), voidedAt: z.string().datetime().nullable(),
}).strict().superRefine((episode, context) => {
  if (episode.endAt && episode.startAt && episode.endAt < episode.startAt) context.addIssue({ code: "custom", path: ["endAt"], message: "结束时间不能早于开始时间" });
  if (episode.status === "ongoing" && (!episode.startAt || episode.endAt)) context.addIssue({ code: "custom", path: ["status"], message: "进行中记录必须只有开始时间" });
  if (episode.status === "voided" && !episode.voidedAt) context.addIssue({ code: "custom", path: ["voidedAt"], message: "作废记录缺少作废时间" });
  if (episode.startTimeAccuracy === "period_only" && !episode.timePeriod) context.addIssue({ code: "custom", path: ["timePeriod"], message: "仅时段记录必须选择时段" });
  if (episode.associatedSymptoms.includes("none") && episode.associatedSymptoms.length > 1) context.addIssue({ code: "custom", path: ["associatedSymptoms"], message: "无伴随表现不能与其他项同时选择" });
});

export const settingsSchema = z.object({ id: z.literal("settings"), schemaVersion: z.literal(1), reportingTimezone: z.string().min(1), backupReminderDays: z.union([z.literal(0), z.literal(7), z.literal(14), z.literal(30)]), backupReminderChangeCount: z.number().int().nonnegative(), privacyScreenOnBackground: z.boolean(), weekStartsOn: z.union([z.literal(1), z.literal(7)]), theme: z.enum(["system", "light", "dark"]) }).strict();
