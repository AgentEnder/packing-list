export type TripSummary = {
  tripId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  totalItems: number;
  packedItems: number;
  totalPeople: number;
};
