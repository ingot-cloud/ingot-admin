export interface InWizardStep {
  title: string;
  description?: string;
}

export type InWizardStepStatus = "valid" | "invalid" | "pending";
