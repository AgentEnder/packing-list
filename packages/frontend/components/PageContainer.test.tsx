import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageContainer } from './PageContainer';

describe('PageContainer Component', () => {
  it('renders children correctly', () => {
    render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );

    const container =
      screen.getByText('Test content').parentElement?.parentElement;
    expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'py-6');
  });

  it('applies custom className when provided', () => {
    render(
      <PageContainer className="custom-class">
        <div>Test content</div>
      </PageContainer>
    );

    const container =
      screen.getByText('Test content').parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('maintains max width constraint', () => {
    render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );

    const innerContainer = screen.getByText('Test content').parentElement;
    expect(innerContainer).toHaveClass('max-w-7xl', 'mx-auto');
  });

  it('nests content in proper container structure', () => {
    const { container } = render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );

    // Verify the DOM structure
    const outerContainer = container.firstChild;
    const innerContainer = outerContainer?.firstChild;
    const content = innerContainer?.firstChild;

    expect(outerContainer).toHaveClass('container');
    expect(innerContainer).toHaveClass('max-w-7xl');
    expect(content).toHaveTextContent('Test content');
  });
});
