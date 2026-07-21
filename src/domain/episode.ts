export const eyeScopes = ["left", "right", "both", "unknown"] as const;
export const visualFields = ["left_field", "right_field", "central", "peripheral", "full", "unknown", "other"] as const;
export const visualSymptoms = ["blurred", "blind_spot", "flashing", "zigzag", "dark_shadow", "distorted", "tunnel_vision", "temporary_blindness", "other"] as const;
export const associatedSymptoms = ["headache", "nausea", "dizziness", "numbness", "weakness", "speech_difficulty", "balance_problem", "none", "other"] as const;
export const activities = ["screen", "reading", "driving", "walking", "exercise", "resting", "just_woke_up", "eating", "other", "unknown"] as const;
export const relatedFactors = ["poor_sleep", "fasting", "stress", "long_screen_time", "bright_light", "exercise", "dehydration", "unknown", "other"] as const;
export const timePeriods = ["dawn", "morning", "afternoon", "evening"] as const;

export type EyeScope = typeof eyeScopes[number];
export type VisualField = typeof visualFields[number];
export type VisualSymptom = typeof visualSymptoms[number];
export type AssociatedSymptom = typeof associatedSymptoms[number];
export type Activity = typeof activities[number];
export type PossibleRelatedFactor = typeof relatedFactors[number];
export type TimePeriod = typeof timePeriods[number];
export type TimeAccuracy = "exact" | "approximate" | "period_only" | "date_only" | "unknown";

export interface VisionEpisode {
  schemaVersion: 1;
  id: string;
  revision: number;
  status: "ongoing" | "completed" | "voided";
  recordMethod: "live" | "manual";
  occurredOn: string;
  timezone: string;
  startAt: string | null;
  endAt: string | null;
  timePeriod: TimePeriod | null;
  dateAccuracy: TimeAccuracy;
  startTimeAccuracy: TimeAccuracy;
  endTimeAccuracy: Exclude<TimeAccuracy, "period_only" | "date_only">;
  duration: { minutes: number | null; source: "computed" | "manual" | "unknown"; accuracy: "exact" | "approximate" | "unknown" };
  eyeScope: EyeScope | null;
  visualFields: VisualField[];
  visualSymptoms: VisualSymptom[];
  severity: 1 | 2 | 3 | 4 | 5 | null;
  onsetPattern: "sudden" | "gradual" | "unknown" | null;
  similarToPrevious: boolean | null;
  recoveredCompletely: boolean | null;
  residualSymptoms: boolean | null;
  associatedSymptoms: AssociatedSymptom[];
  activity: Activity | null;
  possibleRelatedFactors: PossibleRelatedFactor[];
  otherVisualSymptom: string | null;
  otherAssociatedSymptom: string | null;
  otherRelatedFactor: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  voidedAt: string | null;
}

export interface AppSettings {
  id: "settings";
  schemaVersion: 1;
  reportingTimezone: string;
  backupReminderDays: 0 | 7 | 14 | 30;
  backupReminderChangeCount: number;
  privacyScreenOnBackground: boolean;
  weekStartsOn: 1 | 7;
  theme: "system" | "light" | "dark";
}

export interface AppMetadata {
  id: "metadata";
  databaseSchemaVersion: 1;
  createdAt: string;
  lastMigrationAt: string | null;
  lastBackupAt: string | null;
  changesSinceBackup: number;
}

export type EpisodeDraft = Pick<VisionEpisode, "eyeScope" | "visualFields" | "visualSymptoms" | "severity" | "onsetPattern" | "similarToPrevious" | "recoveredCompletely" | "residualSymptoms" | "associatedSymptoms" | "activity" | "possibleRelatedFactors" | "otherVisualSymptom" | "otherAssociatedSymptom" | "otherRelatedFactor" | "note">;

export const emptyDetails: EpisodeDraft = { eyeScope: null, visualFields: [], visualSymptoms: [], severity: null, onsetPattern: null, similarToPrevious: null, recoveredCompletely: null, residualSymptoms: null, associatedSymptoms: [], activity: null, possibleRelatedFactors: [], otherVisualSymptom: null, otherAssociatedSymptom: null, otherRelatedFactor: null, note: null };
