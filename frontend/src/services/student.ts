const STUDENT_KEY = "admission_birth_registration_number";
const LEGACY_STUDENT_KEY = "admission_student_id";

export function isValidBirthRegistrationNumber(value: string): boolean {
  return /^[0-9]{17}$/.test(value);
}

export function getBirthRegistrationNumber(): string {
  localStorage.removeItem(LEGACY_STUDENT_KEY);

  const value = localStorage.getItem(STUDENT_KEY) ?? "";
  if (isValidBirthRegistrationNumber(value)) {
    return value;
  }

  localStorage.removeItem(STUDENT_KEY);
  return "";
}

export function saveBirthRegistrationNumber(value: string): void {
  if (isValidBirthRegistrationNumber(value)) {
    localStorage.setItem(STUDENT_KEY, value);
  } else {
    localStorage.removeItem(STUDENT_KEY);
  }
}
