import { API_BASE_URL } from "./api";

export interface Remedy {
  remedy_type: "chemical_fertilizer" | "organic_cow_dung";
  title: string;
  instructions: string;
  source_ids: string[];
  safety_notes?: string | null;
}

export interface DiagnosisResult {
  id: string;
  farm_id?: string | null;
  crop?: string | null;
  likely_cause: string;
  cause_category: "deficiency" | "excess" | "pest" | "disease" | "unknown";
  confidence: number;
  remedies: Remedy[];
  sources: string[];
  disclaimer: string;
  image_uri?: string | null;
  created_at: string;
}

export async function requestDiagnosis(formData: FormData): Promise<DiagnosisResult> {
  const response = await fetch(`${API_BASE_URL}/api/diagnose`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "Diagnosis request failed.";
    try {
      const err = await response.json();
      if (typeof err.detail === "string") {
        detail = err.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(detail);
  }

  return (await response.json()) as DiagnosisResult;
}
