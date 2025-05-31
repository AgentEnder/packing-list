import { render, screen, within } from '@testing-library/react';
import { PrintableView } from './PrintableView';

describe('PrintableView', () => {
  describe('by-person view', () => {
    const mockItems = {
      'Person 1': [
        {
          name: 'Toothbrush',
          context: 'Person 1',
          isExtra: false,
          quantity: 1,
          day: 'Day 1',
        },
        {
          name: 'Socks',
          context: 'Person 1',
          isExtra: true,
          quantity: 2,
          day: 'Day 2',
        },
        {
          name: 'Passport',
          context: 'Person 1',
          isExtra: false,
          quantity: 1,
          day: 'All Days',
        },
      ],
      'General Items': [
        {
          name: 'First Aid Kit',
          context: 'General Items',
          isExtra: false,
          quantity: 1,
          day: 'All Days',
        },
        {
          name: 'Snacks',
          context: 'General Items',
          isExtra: true,
          quantity: 3,
          day: 'All Days',
        },
      ],
    };

    beforeEach(() => {
      render(<PrintableView items={mockItems} mode="by-person" />);
    });

    it('renders person sections with correct titles', () => {
      expect(screen.getByText('Person 1 - Packing List')).toBeInTheDocument();
      expect(
        screen.getByText('General Items - Packing List')
      ).toBeInTheDocument();
    });

    it('shows day information for items with specific days', () => {
      expect(screen.getByText('Toothbrush')).toBeInTheDocument();
      expect(screen.getByText('for Day 1')).toBeInTheDocument();
      expect(screen.getByText('Socks')).toBeInTheDocument();
      expect(screen.getByText('for Day 2')).toBeInTheDocument();
    });

    it('does not show day information for "All Days" items', () => {
      expect(screen.getByText('Passport')).toBeInTheDocument();
      expect(screen.queryByText('for All Days')).not.toBeInTheDocument();
      expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
      expect(screen.queryByText('for All Days')).not.toBeInTheDocument();
    });

    it('shows extra badge for extra items', () => {
      const extraBadges = screen.getAllByText('extra');
      expect(extraBadges).toHaveLength(2); // Socks and Snacks are extra items
    });

    it('shows quantity badge for items with quantity > 1', () => {
      expect(screen.getByText('×2')).toBeInTheDocument(); // Socks
      expect(screen.getByText('×3')).toBeInTheDocument(); // Snacks
    });

    it('renders checkboxes for all items', () => {
      const checkboxes = document.querySelectorAll('.checkbox');
      // Total number of items: 3 person items + 2 general items = 5
      expect(checkboxes).toHaveLength(5);
    });

    it('maintains proper section order with General Items at the end', () => {
      const sections = document.querySelectorAll('.section-title');
      expect(sections[0].textContent).toBe('Person 1 - Packing List');
      expect(sections[1].textContent).toBe('General Items - Packing List');
    });

    it('shows person information for items', () => {
      // Check Toothbrush item has Day 1 info
      const toothbrushItem = screen
        .getByText('Toothbrush')
        .closest('.item-details');
      expect(toothbrushItem).not.toBeNull();
      expect(toothbrushItem as HTMLElement).toContainElement(
        screen.getByText('for Day 1')
      );

      // Check Socks item has Day 2 info
      const socksItem = screen.getByText('Socks').closest('.item-details');
      expect(socksItem).not.toBeNull();
      expect(socksItem as HTMLElement).toContainElement(
        screen.getByText('for Day 2')
      );
    });
  });

  describe('by-day view', () => {
    const mockItems = {
      'Day 1 - Jan 1 - Beach': [
        {
          name: 'Sunscreen',
          context: 'Day 1 - Jan 1 - Beach',
          isExtra: false,
          quantity: 1,
          person: 'John',
        },
        {
          name: 'Hat',
          context: 'Day 1 - Jan 1 - Beach',
          isExtra: true,
          quantity: 2,
          person: 'Jane',
        },
      ],
      'Day 2 - Jan 2 - Mountain': [
        {
          name: 'Hiking Boots',
          context: 'Day 2 - Jan 2 - Mountain',
          isExtra: false,
          quantity: 1,
          person: 'John',
        },
      ],
      'Any Day': [
        {
          name: 'Passport',
          context: 'Any Day',
          isExtra: false,
          quantity: 1,
          person: 'John',
        },
        {
          name: 'First Aid Kit',
          context: 'Any Day',
          isExtra: false,
          quantity: 1,
          person: undefined,
        },
      ],
    };

    beforeEach(() => {
      render(<PrintableView items={mockItems} mode="by-day" />);
    });

    it('renders day sections with correct titles', () => {
      expect(
        screen.getByText('Day 1 - Jan 1 - Beach - Packing List')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Day 2 - Jan 2 - Mountain - Packing List')
      ).toBeInTheDocument();
      expect(screen.getByText('Any Day - Packing List')).toBeInTheDocument();
    });

    it('shows person information for items', () => {
      // Check Sunscreen item has John's name
      const sunscreenItem = screen
        .getByText('Sunscreen')
        .closest('.item-details');
      expect(sunscreenItem).not.toBeNull();
      const sunscreenContext = within(sunscreenItem as HTMLElement).getByText(
        'for John'
      );
      expect(sunscreenContext).toBeInTheDocument();

      // Check Hat item has Jane's name
      const hatItem = screen.getByText('Hat').closest('.item-details');
      expect(hatItem).not.toBeNull();
      const hatContext = within(hatItem as HTMLElement).getByText('for Jane');
      expect(hatContext).toBeInTheDocument();
    });

    it('shows extra badge for extra items', () => {
      const extraBadges = screen.getAllByText('extra');
      expect(extraBadges).toHaveLength(1); // Only Hat is extra
    });

    it('shows quantity badge for items with quantity > 1', () => {
      expect(screen.getByText('×2')).toBeInTheDocument(); // Hat
    });

    it('renders checkboxes for all items', () => {
      const checkboxes = document.querySelectorAll('.checkbox');
      // Total number of items: 2 day 1 items + 1 day 2 item + 2 any day items = 5
      expect(checkboxes).toHaveLength(5);
    });

    it('maintains proper section order with Any Day at the end', () => {
      const sections = document.querySelectorAll('.section-title');
      expect(sections[0].textContent).toBe(
        'Day 1 - Jan 1 - Beach - Packing List'
      );
      expect(sections[1].textContent).toBe(
        'Day 2 - Jan 2 - Mountain - Packing List'
      );
      expect(sections[2].textContent).toBe('Any Day - Packing List');
    });

    it('handles items without person information', () => {
      expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
      // Should not show "for" text for items without a person
      const firstAidText = screen.getByText('First Aid Kit').parentElement;
      expect(firstAidText?.textContent).not.toContain('for');
    });

    it('groups items correctly by day', () => {
      // Day 1 items
      const day1Section = screen
        .getByText('Day 1 - Jan 1 - Beach - Packing List')
        .closest('.report-container');
      expect(day1Section).toContainElement(screen.getByText('Sunscreen'));
      expect(day1Section).toContainElement(screen.getByText('Hat'));

      // Day 2 items
      const day2Section = screen
        .getByText('Day 2 - Jan 2 - Mountain - Packing List')
        .closest('.report-container');
      expect(day2Section).toContainElement(screen.getByText('Hiking Boots'));

      // Any Day items
      const anyDaySection = screen
        .getByText('Any Day - Packing List')
        .closest('.report-container');
      expect(anyDaySection).toContainElement(screen.getByText('Passport'));
      expect(anyDaySection).toContainElement(screen.getByText('First Aid Kit'));
    });
  });
});
