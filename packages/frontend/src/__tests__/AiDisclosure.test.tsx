import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { AiDisclosureModal } from '../components/AiDisclosureModal';

describe('AI Disclosure Feature', () => {
  describe('Header AI Disclosure Pill', () => {
    it('renders the AI Disclosure pill in Header and responds to click', () => {
      const handleOpenAiDisclosure = vi.fn();
      render(
        <Header
          onOpenModelDrawer={vi.fn()}
          activeModelName="Kumiko Keychain"
          onOpenAiDisclosure={handleOpenAiDisclosure}
        />
      );

      const pillButton = screen.getByRole('button', { name: /AI Disclosure/i });
      expect(pillButton).toBeInTheDocument();

      fireEvent.click(pillButton);
      expect(handleOpenAiDisclosure).toHaveBeenCalledTimes(1);
    });
  });

  describe('AiDisclosureModal Component', () => {
    it('renders nothing when isOpen is false', () => {
      render(<AiDisclosureModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders disclosure information when isOpen is true', () => {
      render(<AiDisclosureModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /AI Disclosure/i })).toBeInTheDocument();

      // Customiser and framework AI assistance
      expect(
        screen.getByText(/This interactive customiser web application and its supporting frontend framework were created with AI assistance/i)
      ).toBeInTheDocument();

      // Model generation code manually written
      expect(
        screen.getByText(/All 3D model generation code, parametric geometry definitions, and CAD algorithms are manually written/i)
      ).toBeInTheDocument();
    });

    it('triggers onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(<AiDisclosureModal isOpen={true} onClose={handleClose} />);

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(<AiDisclosureModal isOpen={true} onClose={handleClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when clicking the backdrop overlay', () => {
      const handleClose = vi.fn();
      render(<AiDisclosureModal isOpen={true} onClose={handleClose} />);

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
