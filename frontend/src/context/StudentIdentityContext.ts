import { createContext, useContext } from "react";

export interface StudentIdentityContextValue {
  birthRegistrationNumber: string;
  isValid: boolean;
  setBirthRegistrationNumber: (value: string) => void;
}

export const StudentIdentityContext =
  createContext<StudentIdentityContextValue | null>(null);

export function useStudentIdentity(): StudentIdentityContextValue {
  const context = useContext(StudentIdentityContext);
  if (!context) {
    throw new Error("useStudentIdentity must be used within StudentIdentityProvider.");
  }

  return context;
}
