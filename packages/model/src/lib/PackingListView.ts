export type PackingListViewState = {
  viewMode: 'by-day' | 'by-person';
  selectedDayIndex?: number;
  selectedPersonId?: string;
  filters: {
    packed: boolean;
    unpacked: boolean;
    excluded: boolean;
  };
};
