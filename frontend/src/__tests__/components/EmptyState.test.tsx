import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../components/common/EmptyState';
import { Package } from 'lucide-react';

describe('EmptyState Component', () => {
  it('should render with title and message', () => {
    render(
      <EmptyState
        icon={Package}
        title="No items"
        message="There are no items to display"
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={Package}
        title="No items"
        message="There are no items to display"
        action={{ label: 'Add Item', onClick: onAction }}
      />
    );

    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onAction).toHaveBeenCalled();
  });

  it('should render icon', () => {
    const { container } = render(
      <EmptyState
        icon={Package}
        title="No items"
        message="There are no items to display"
      />
    );

    // Lucide icons render as SVGs
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
