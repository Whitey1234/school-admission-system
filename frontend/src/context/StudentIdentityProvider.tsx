import { useState, type ReactNode } from "react";
import {
  getBirthRegistrationNumber,
  isValidBirthRegistrationNumber,
  saveBirthRegistrationNumber,
} from "../services/student";
import { StudentIdentityContext } from "./StudentIdentityContext";

export function StudentIdentityProvider({ children }: { children: ReactNode }) {
  const [birthRegistrationNumber, setBirthRegistrationNumberState] = useState(getBirthRegistrationNumber);

  const setBirthRegistrationNumber = (value: string) => {
    setBirthRegistrationNumberState(value);
    saveBirthRegistrationNumber(value);
  };

  return (
    <StudentIdentityContext.Provider
      value={{
        birthRegistrationNumber,
        isValid: isValidBirthRegistrationNumber(birthRegistrationNumber),
        setBirthRegistrationNumber,
      }}
    >
      {children}
    </StudentIdentityContext.Provider>
  );
}
