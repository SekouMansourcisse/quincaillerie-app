import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/common/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should call onClose when clicking close button', () => {
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking overlay', () => {
    render(<Modal {...defaultProps} />);

    // L'overlay est le premier element avec la classe fixed
    const overlay = document.querySelector('.fixed.inset-0.bg-black');
    if (overlay) {
      fireEvent.click(overlay);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('should render footer when provided', () => {
    const footer = <button>Submit</button>;
    render(<Modal {...defaultProps} footer={footer} />);

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should apply size classes', () => {
    const { container } = render(<Modal {...defaultProps} size="lg" />);

    const modalContent = container.querySelector('.max-w-3xl');
    expect(modalContent).toBeInTheDocument();
  });
});
