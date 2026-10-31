export type Crop = "wheat" | "mustard" | "bajra" | "rice" | "other" | "none";

export type LngLat = [number, number];

export interface FieldGeometry {
  type: "Polygon";
  coordinates: LngLat[][];
}

export interface FieldArea {
  acres: number;
  hectares: number;
}

export interface Field {
  id: string;
  name: string;
  crop: Crop;
  area: FieldArea;
  geometry: FieldGeometry;
  createdAt: string;
}

const KEY_PREFIX = "kisan-saathi:fields:";

function storageKey(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

function isField(value: unknown): value is Field {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const field = value as Partial<Field>;
  return (
    typeof field.id === "string" &&
    typeof field.name === "string" &&
    typeof field.createdAt === "string" &&
    typeof field.geometry === "object" &&
    field.geometry !== null &&
    field.geometry.type === "Polygon" &&
    Array.isArray(field.geometry.coordinates)
  );
}

function writeFields(uid: string, fields: Field[]): void {
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(fields));
  } catch {
    return;
  }
}

export function getFields(uid: string): Field[] {
  if (!uid) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isField);
  } catch {
    return [];
  }
}

export function saveField(uid: string, field: Field): Field[] {
  const current = getFields(uid);
  const next = current.some((item) => item.id === field.id)
    ? current.map((item) => (item.id === field.id ? field : item))
    : [...current, field];
  writeFields(uid, next);
  return next;
}

export function deleteField(uid: string, id: string): Field[] {
  const next = getFields(uid).filter((field) => field.id !== id);
  writeFields(uid, next);
  return next;
}

export function createFieldId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
