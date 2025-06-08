export type TripItem = {
  id: string;
  tripId: string;
  name: string;
  category?: string;
  quantity: number;
  packed: boolean;
  notes?: string;
  personId?: string;
  dayIndex?: number; // Which day this item is for (0-based index)

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};
