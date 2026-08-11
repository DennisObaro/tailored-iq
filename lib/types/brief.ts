export interface Brief {
  id: string;
  projectId: string;
  situation: string;
  objective: string;
  constraints: string;
  authority: string;
  existingActions: string;
  desiredOutcome: string;
  category?: string;
  secondaryCategories: string[];
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}
