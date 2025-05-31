import { format } from 'date-fns';
import { PackingListItem } from '@packing-list/model';

export type ItemInstance = PackingListItem;

interface Day {
  date: string | number;
  location?: string;
}

export const formatDayInfo = (
  instance: { dayIndex?: number; dayStart?: number; dayEnd?: number },
  days: Day[]
): string | undefined => {
  if (instance.dayIndex === undefined) return undefined;

  const day = days[instance.dayIndex];
  if (!day) return undefined;

  const date = new Date(day.date);
  if (
    instance.dayStart !== undefined &&
    instance.dayEnd !== undefined &&
    instance.dayStart !== instance.dayEnd
  ) {
    return `Days ${instance.dayStart + 1}-${instance.dayEnd + 1}`;
  }

  return `Day ${instance.dayIndex + 1} - ${format(date, 'MMM d')}${
    day.location ? ` (${day.location})` : ''
  }`;
};

export const splitInstancesByExtraStatus = (instances: ItemInstance[]) => {
  const baseItems = instances.filter((i) => !i.isExtra);
  const extraItems = instances.filter((i) => i.isExtra);
  return { baseItems, extraItems };
};

export const getItemLabel = (
  item: ItemInstance,
  viewMode: 'by-day' | 'by-person'
): string => {
  let itemLabel = item.itemName || '';

  if (viewMode === 'by-day') {
    // In day view, show person name for each instance
    itemLabel = item.personName || 'General';
  } else {
    // In person view, show day information
    if (item.dayIndex !== undefined) {
      itemLabel += ` (Day ${item.dayIndex + 1})`;
    }
  }

  return itemLabel;
};

export const getQuantityLabel = (quantity: number): string => {
  return quantity > 1 ? ` - ${quantity} needed` : '';
};
