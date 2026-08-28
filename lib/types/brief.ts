export interface Brief {
  id: string;
  projectId: string;
  situation: string;
  objective: string;
  constraints: string;
  authority: string;
  existingActions: string;
  desiredOutcome: string;
  /**
   * The brief read back as prose — what the diagnosis heard, and the gap it
   * thinks is behind it. Derived from the structured fields above rather
   * than captured separately, so the two can never disagree: `updateBrief`
   * re-derives both whenever a field is edited.
   */
  summary: string;
  rootCause: string;
  category?: string;
  secondaryCategories: string[];
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}
