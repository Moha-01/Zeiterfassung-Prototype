export type TimeEntry = {
  id: string;
  employeeId: string;
  locationId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  paid: boolean;
};

export type Employee = {
    id: string;
    name: string;
};

export type Location = {
    id: string;
    name: string;
};
