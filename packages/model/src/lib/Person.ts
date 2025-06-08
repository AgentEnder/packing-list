export type Person = {
  id: string;
  tripId: string;
  name: string;
  age?: number;
  gender?: string;
  settings?: Record<string, unknown>;

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};
