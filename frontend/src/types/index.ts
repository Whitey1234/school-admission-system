export interface SchoolClass {
  id: string;
  name: string;
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
}

export type HoldStatus =
  | "HELD"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

export interface StudentHold {
  holdId: string;
  classId: string;
  className: string;
  status: HoldStatus;
  createdAt: string;
  expiresAt: string;
}