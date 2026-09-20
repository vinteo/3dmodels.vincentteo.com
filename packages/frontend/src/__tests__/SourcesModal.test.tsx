import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { SourcesModal } from '../components/SourcesModal';
import { ParameterControls } from '../components/ParameterControls';
import { ModelConfig } from '../types/model';

describe('Sources & References Feature', () => {
  describe('Header Sources Pill', () => {
    it('renders the Sources pill in Header when hasSources is true and responds to click', () => {
      const handleOpenSources = vi.fn();
      render(
        <Header
          onOpenModelDrawer={vi.fn()}
          activeModelName="Chinese Lattice Bookmark"
          hasSources={true}
          onOpenSources={handleOpenSources}
        />
      );

      const pillButton = screen.getByRole('button', { name: /Sources/i });
      expect(pillButton).toBeInTheDocument();

      fireEvent.click(pillButton);
      expect(handleOpenSources).toHaveBeenCalledTimes(1);
    });

    it('does not render Sources pill in Header when hasSources is false or omitted', () => {
      render(
        <Header onOpenModelDrawer={vi.fn()} activeModelName="Kumiko Bookmark" hasSources={false} />
      );

      expect(screen.queryByRole('button', { name: /^Sources$/i })).not.toBeInTheDocument();
    });
  });

  describe('SourcesModal Component', () => {
    const mockSources = [
      {
        title: 'An Algorithmic Approach to Chinese Lattice Design',
        authors: 'Miroslaw Majewski, Chuan-Kuan Wang',
        publication: 'The Electronic Journal of Mathematics and Technology (eJMT), Vol. 3, No. 1',
        year: 2009,
        url: 'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf',
        description:
          'Original mathematical algorithms and generative geometric rules for classical Chinese window lattice designs.'
      }
    ];

    it('renders nothing when isOpen is false', () => {
      render(
        <SourcesModal
          isOpen={false}
          onClose={vi.fn()}
          modelName="Chinese Lattice Bookmark"
          sources={mockSources}
        />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders source information when isOpen is true', () => {
      render(
        <SourcesModal
          isOpen={true}
          onClose={vi.fn()}
          modelName="Chinese Lattice Bookmark"
          sources={mockSources}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Sources & References/i })).toBeInTheDocument();
      expect(
        screen.getByText(/An Algorithmic Approach to Chinese Lattice Design/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Miroslaw Majewski, Chuan-Kuan Wang/i)).toBeInTheDocument();
      expect(
        screen.getByText(/The Electronic Journal of Mathematics and Technology/i)
      ).toBeInTheDocument();

      // Check external PDF link
      const pdfLink = screen.getByRole('link', { name: /View Reference PDF/i });
      expect(pdfLink).toHaveAttribute(
        'href',
        'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf'
      );
      expect(pdfLink).toHaveAttribute('target', '_blank');
      expect(pdfLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('distinguishes between PDF and non-PDF sources with appropriate badges and button labels', () => {
      const mixedSources = [
        {
          title: 'PDF Research Paper',
          url: 'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf',
          description: 'A mathematical paper in PDF format.'
        },
        {
          title: 'Kumiko Designer App',
          url: 'https://www.kumikodesigner.com/',
          description: 'An interactive web design tool.'
        }
      ];

      render(
        <SourcesModal
          isOpen={true}
          onClose={vi.fn()}
          modelName="Mixed Sources Model"
          sources={mixedSources}
        />
      );

      // PDF source badge and action
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /View Reference PDF/i })).toHaveAttribute(
        'href',
        'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf'
      );

      // Non-PDF source badge and action
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Visit Website/i })).toHaveAttribute(
        'href',
        'https://www.kumikodesigner.com/'
      );
    });

    it('renders fallback message when sources list is empty', () => {
      render(<SourcesModal isOpen={true} onClose={vi.fn()} modelName="Empty Model" sources={[]} />);

      expect(
        screen.getByText(/No external sources documented for this model/i)
      ).toBeInTheDocument();
    });

    it('triggers onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <SourcesModal
          isOpen={true}
          onClose={handleClose}
          modelName="Test Model"
          sources={mockSources}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <SourcesModal
          isOpen={true}
          onClose={handleClose}
          modelName="Test Model"
          sources={mockSources}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when clicking the backdrop overlay', () => {
      const handleClose = vi.fn();
      render(
        <SourcesModal
          isOpen={true}
          onClose={handleClose}
          modelName="Test Model"
          sources={mockSources}
        />
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('ParameterControls Links Bar', () => {
    it('does not render Sources button in ParameterControls (reserved for top right header pill), but renders model links', () => {
      const mockModel: ModelConfig = {
        id: 'test-lattice-model',
        name: 'Test Lattice Model',
        description: 'Test description',
        tags: ['Test'],
        defaultConfiguration: '',
        parameters: [],
        links: [
          {
            label: 'Research Paper (PDF)',
            url: 'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf',
            site: 'paper'
          }
        ],
        sources: [
          {
            title: 'Paper title',
            url: 'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf'
          }
        ]
      };

      render(
        <ParameterControls
          model={mockModel}
          currentValues={{}}
          onChangeValues={vi.fn()}
          onApply={vi.fn()}
          onOpenExport={vi.fn()}
          onOpenModelDrawer={vi.fn()}
          isDirty={false}
          loading={false}
        />
      );

      // Sources button should not exist in ParameterControls
      expect(screen.queryByRole('button', { name: /Sources/i })).toBeNull();

      // External links should still be rendered
      const paperLink = screen.getByRole('link', { name: /Research Paper \(PDF\)/i });
      expect(paperLink).toBeInTheDocument();
      expect(paperLink).toHaveAttribute(
        'href',
        'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf'
      );
    });
  });

  describe('Model Integration and AI Disclosure Matching', () => {
    it('chinese-lattice-bookmark has the same AI disclosure as flags-keychain', async () => {
      const { getModels } = await import('../services/api');
      const { models } = await getModels(true);

      const flagsModel = models.find((m) => m.id === 'flags-keychain');
      const chineseModel = models.find((m) => m.id === 'chinese-lattice-bookmark');

      expect(flagsModel).toBeDefined();
      expect(chineseModel).toBeDefined();

      expect(chineseModel?.aiDisclosure?.modelingAiAssisted).toBe(
        flagsModel?.aiDisclosure?.modelingAiAssisted
      );
      expect(chineseModel?.aiDisclosure?.modelNotice).toBe(flagsModel?.aiDisclosure?.modelNotice);
      expect(chineseModel?.aiDisclosure?.modelNotice).toBe(
        'The 3D model generation code, parametric geometry definitions, and CAD algorithms for this model were created with AI assistance.'
      );
    });

    it('chinese-lattice-bookmark provides sources referencing eJMT PDF', async () => {
      const { getModels } = await import('../services/api');
      const { models } = await getModels(true);

      const chineseModel = models.find((m) => m.id === 'chinese-lattice-bookmark');
      expect(chineseModel).toBeDefined();
      expect(chineseModel?.sources).toBeDefined();
      expect(chineseModel?.sources?.length).toBeGreaterThan(0);

      const ejmtSource = chineseModel?.sources?.find((s) => s.url.includes('eJMT_v3n1n4.pdf'));
      expect(ejmtSource).toBeDefined();
      expect(ejmtSource?.title).toContain('Chinese Lattice Design');
      expect(ejmtSource?.url).toBe('https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf');
    });

    it('all kumiko models provide kumikodesigner.com as a source', async () => {
      const { getModels } = await import('../services/api');
      const { models } = await getModels(true);

      const kumikoModelIds = ['kumiko-keychain', 'kumiko-bookmark', 'kumiko-pattern-keychain'];

      for (const id of kumikoModelIds) {
        const model = models.find((m) => m.id === id);
        expect(model, `Expected model ${id} to exist`).toBeDefined();
        expect(model?.sources, `Expected model ${id} to have sources`).toBeDefined();
        expect(
          model?.sources?.length,
          `Expected model ${id} to have at least one source`
        ).toBeGreaterThan(0);

        const kumikoDesignerSource = model?.sources?.find(
          (s) => s.url === 'https://www.kumikodesigner.com/'
        );
        expect(
          kumikoDesignerSource,
          `Expected model ${id} to have https://www.kumikodesigner.com/ in sources`
        ).toBeDefined();
        expect(kumikoDesignerSource?.title).toBe('Kumiko Designer');
      }
    });
  });
});
