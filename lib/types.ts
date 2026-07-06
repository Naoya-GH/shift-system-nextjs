export interface User {
  id: number;
  name: string;
  displayName: string;
  role: "owner" | "staff";
  password: string;
  sortOrder: number;
  createdAt: string;
}

export interface ShiftRequestRow {
  id: number;
  userId: number;
  month: string;
  workDate: string;
  slot: string;
  status: "ok" | "maybe";
  startTime: string;
  endTime: string;
  memo: string;
  createdAt: string;
}

export interface ShiftRow {
  id: number;
  userId: number;
  workDate: string;
  confirmed: boolean;
  createdAt: string;
}

export interface DayLabelEntry {
  type: "lunch" | "obanzai" | "custom";
  label: string;
}
