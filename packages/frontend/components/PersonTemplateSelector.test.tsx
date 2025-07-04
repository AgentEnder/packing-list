import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { PersonTemplateSelector } from './PersonTemplateSelector';
import * as model from '@packing-list/model';
import * as state from '@packing-list/state';

vi.mock('@packing-list/model', () => ({
  getTemplateSuggestions: vi.fn(),
}));
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  selectUserPeople: vi.fn(),
}));

describe('PersonTemplateSelector Component', () => {
  const mockPeople = [
    { id: 'p1', name: 'Alice', isUserProfile: false },
    { id: 'p2', name: 'Bob', isUserProfile: false },
  ];
  const mockSelect = vi.fn();
  const mockCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppSelector as Mock).mockImplementation(() => mockPeople);
    (model.getTemplateSuggestions as Mock).mockReturnValue(mockPeople);
  });

  it('shows suggestions and selects template', () => {
    render(
      <PersonTemplateSelector
        onSelectTemplate={mockSelect}
        onCreateNew={mockCreate}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'A' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Alice'));
    expect(mockSelect).toHaveBeenCalledWith(mockPeople[0]);
  });

  it('creates new person when enter pressed with no match', () => {
    (model.getTemplateSuggestions as Mock).mockReturnValue([]);
    render(
      <PersonTemplateSelector
        onSelectTemplate={mockSelect}
        onCreateNew={mockCreate}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Charlie' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockCreate).toHaveBeenCalledWith('Charlie');
  });
});
