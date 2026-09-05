import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterControls } from '../components/ParameterControls';
import { ModelConfig } from '../types/model';

const mockModel: ModelConfig = {
  id: 'test-model',
  name: 'Test Desk Tray',
  description: 'A test parametric model',
  documentId: 'doc123',
  workspaceId: 'ws123',
  elementId: 'elem123',
  elementType: 'partstudio',
  tags: ['Testing'],
  defaultConfiguration: 'Length=120+millimeter;Dividers=2',
  parameters: [
    {
      id: 'Length',
      name: 'Length',
      type: 'quantity',
      unit: 'millimeter',
      default: 120,
      min: 50,
      max: 200,
      step: 5,
      group: 'Dimensions'
    },
    {
      id: 'Dividers',
      name: 'Dividers',
      type: 'enum',
      default: '2',
      group: 'Compartments',
      options: [
        { value: '1', label: '1 Divider' },
        { value: '2', label: '2 Dividers' }
      ]
    },
    {
      id: 'Chamfer',
      name: 'Chamfer Base',
      type: 'boolean',
      default: true,
      group: 'Finishing'
    }
  ]
};

describe('ParameterControls Component (Schema-Driven)', () => {
  it('renders all grouped parameter input fields from model schema', () => {
    const currentValues = { Length: 120, Dividers: '2', Chamfer: true };
    const onChangeValues = vi.fn();
    const onApply = vi.fn();
    const onOpenExport = vi.fn();

    render(
      <ParameterControls
        model={mockModel}
        currentValues={currentValues}
        onChangeValues={onChangeValues}
        onApply={onApply}
        onOpenExport={onOpenExport}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Compartments')).toBeInTheDocument();
    expect(screen.getByText('Finishing')).toBeInTheDocument();
    expect(screen.getByLabelText('Length')).toBeInTheDocument();
    expect(screen.getByLabelText('Dividers')).toBeInTheDocument();
  });

  it('calls onChangeValues when a quantity slider or input changes', () => {
    const currentValues = { Length: 120, Dividers: '2', Chamfer: true };
    const onChangeValues = vi.fn();

    render(
      <ParameterControls
        model={mockModel}
        currentValues={currentValues}
        onChangeValues={onChangeValues}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    const lengthInput = screen.getByLabelText('Length');
    fireEvent.change(lengthInput, { target: { value: '140' } });

    expect(onChangeValues).toHaveBeenCalledWith(
      expect.objectContaining({
        Length: 140
      })
    );
  });

  it('renders segmented button controls and triggers change when clicked', () => {
    const modelWithSegmented: ModelConfig = {
      ...mockModel,
      parameters: [
        {
          id: 'rotation_angle',
          name: 'Rotation Angle',
          type: 'enum',
          default: '0',
          widget: 'segmented',
          group: 'Section Patterns',
          options: [
            { value: '0', label: '0°' },
            { value: '120', label: '120°' },
            { value: '240', label: '240°' }
          ]
        }
      ]
    };

    const onChangeValues = vi.fn();

    render(
      <ParameterControls
        model={modelWithSegmented}
        currentValues={{ rotation_angle: '0' }}
        onChangeValues={onChangeValues}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.getByText('Section Patterns')).toBeInTheDocument();
    expect(screen.getByText('Rotation Angle')).toBeInTheDocument();

    const deg120Btn = screen.getByText('120°');
    expect(deg120Btn).toBeInTheDocument();
    fireEvent.click(deg120Btn);

    expect(onChangeValues).toHaveBeenCalledWith(
      expect.objectContaining({
        rotation_angle: '120'
      })
    );
  });

  it('renders repeated parameter clusters with master batch controls and expands individual items', () => {
    const kumikoModel: ModelConfig = {
      ...mockModel,
      id: 'kumiko-keychain',
      name: 'Kumiko Keychain',
      parameters: [
        {
          id: 'section_1',
          name: 'Section 1 (0°–60°)',
          type: 'enum',
          default: '1',
          group: 'Section Patterns',
          options: [
            { value: '0', label: 'Empty' },
            { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
            { value: '2', label: 'Ryuso Asa-no-ha' }
          ]
        },
        {
          id: 'section_2',
          name: 'Section 2 (60°–120°)',
          type: 'enum',
          default: '1',
          group: 'Section Patterns',
          options: [
            { value: '0', label: 'Empty' },
            { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
            { value: '2', label: 'Ryuso Asa-no-ha' }
          ]
        },
        {
          id: 'section_3',
          name: 'Section 3 (120°–180°)',
          type: 'enum',
          default: '1',
          group: 'Section Patterns',
          options: [
            { value: '0', label: 'Empty' },
            { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
            { value: '2', label: 'Ryuso Asa-no-ha' }
          ]
        },
        {
          id: 'section_1_rotation',
          name: 'Section 1 Rotation',
          type: 'enum',
          default: '0',
          widget: 'segmented',
          group: 'Section Patterns',
          options: [
            { value: '0', label: '0°' },
            { value: '120', label: '120°' },
            { value: '240', label: '240°' }
          ]
        },
        {
          id: 'section_2_rotation',
          name: 'Section 2 Rotation',
          type: 'enum',
          default: '0',
          widget: 'segmented',
          group: 'Section Patterns',
          options: [
            { value: '0', label: '0°' },
            { value: '120', label: '120°' },
            { value: '240', label: '240°' }
          ]
        },
        {
          id: 'section_3_rotation',
          name: 'Section 3 Rotation',
          type: 'enum',
          default: '0',
          widget: 'segmented',
          group: 'Section Patterns',
          options: [
            { value: '0', label: '0°' },
            { value: '120', label: '120°' },
            { value: '240', label: '240°' }
          ]
        }
      ]
    };

    const currentValues = {
      section_1: '1',
      section_2: '1',
      section_3: '1',
      section_1_rotation: '0',
      section_2_rotation: '0',
      section_3_rotation: '0'
    };
    const onChangeValues = vi.fn();

    render(
      <ParameterControls
        model={kumikoModel}
        currentValues={currentValues}
        onChangeValues={onChangeValues}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    // Master controls rendered
    expect(screen.getByText('Lattice Pattern (All Sections)')).toBeInTheDocument();
    expect(screen.getByText('Pattern Rotation (All Sections)')).toBeInTheDocument();
    expect(screen.getByText('Cycle +120°')).toBeInTheDocument();

    // Cycling rotation advances all 3 rotations simultaneously
    const cycleBtn = screen.getByTitle('Cycle through rotation options for all sections');
    fireEvent.click(cycleBtn);

    expect(onChangeValues).toHaveBeenCalledWith(
      expect.objectContaining({
        section_1_rotation: '120',
        section_2_rotation: '120',
        section_3_rotation: '120'
      })
    );

    // Customize each section individually checkbox
    const customizeCheckbox = screen.getByLabelText('Customize each section individually');
    expect(customizeCheckbox).toBeInTheDocument();
    expect(customizeCheckbox).not.toBeChecked();

    // Check individual customization checkbox
    fireEvent.click(customizeCheckbox);
    expect(screen.getByText('Individual Sectors (1–6)')).toBeInTheDocument();
  });

  it('renders primary toggle in group header and manages dependent sub-parameters', () => {
    const modelWithGroupToggle: ModelConfig = {
      ...mockModel,
      parameters: [
        {
          id: 'include_keychain_ring',
          name: 'Keychain Ring Attachment',
          type: 'boolean',
          default: true,
          group: 'Keychain Ring',
          description: 'Include top mounting loop'
        },
        {
          id: 'ring_thickness',
          name: 'Ring Thickness',
          type: 'quantity',
          unit: 'millimeter',
          default: 2,
          min: 1,
          max: 10,
          group: 'Keychain Ring',
          dependsOn: 'include_keychain_ring'
        }
      ]
    };

    const onChangeValues = vi.fn();

    const { rerender } = render(
      <ParameterControls
        model={modelWithGroupToggle}
        currentValues={{ include_keychain_ring: true, ring_thickness: 2 }}
        onChangeValues={onChangeValues}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.getByText('Keychain Ring')).toBeInTheDocument();
    expect(screen.getByText('Include top mounting loop')).toBeInTheDocument();
    expect(screen.getByLabelText('Ring Thickness')).toBeInTheDocument();

    // Toggle switch off
    const switchBtn = screen.getByRole('switch', { checked: true });
    fireEvent.click(switchBtn);

    expect(onChangeValues).toHaveBeenCalledWith(
      expect.objectContaining({
        include_keychain_ring: false
      })
    );

    // When toggled off, dependent parameter is hidden
    rerender(
      <ParameterControls
        model={modelWithGroupToggle}
        currentValues={{ include_keychain_ring: false, ring_thickness: 2 }}
        onChangeValues={onChangeValues}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.queryByLabelText('Ring Thickness')).not.toBeInTheDocument();
  });

  it('renders external model repository links when provided in model schema', () => {
    const modelWithLinks: ModelConfig = {
      ...mockModel,
      links: [
        {
          label: 'Printables',
          url: 'https://www.printables.com/model/1826573-simple-kumiko-inspired-keychain-customisable',
          site: 'printables'
        },
        {
          label: 'QIDI Maker',
          url: 'https://www.qidimaker.com/en/models/detail/2093595266801807362',
          site: 'qidimaker'
        }
      ]
    };

    render(
      <ParameterControls
        model={modelWithLinks}
        currentValues={{ Length: 120, Dividers: '2', Chamfer: true }}
        onChangeValues={vi.fn()}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    const printablesLink = screen.getByTitle('Open model page on Printables');
    expect(printablesLink).toBeInTheDocument();
    expect(printablesLink).toHaveAttribute(
      'href',
      'https://www.printables.com/model/1826573-simple-kumiko-inspired-keychain-customisable'
    );

    const qidiLink = screen.getByTitle('Open model page on QIDI Maker');
    expect(qidiLink).toBeInTheDocument();
    expect(qidiLink).toHaveAttribute(
      'href',
      'https://www.qidimaker.com/en/models/detail/2093595266801807362'
    );
  });

  it('renders pattern option descriptions in both standalone controls and cluster cards', () => {
    const modelWithOptions: ModelConfig = {
      ...mockModel,
      parameters: [
        {
          id: 'pattern_choice',
          name: 'Pattern Choice',
          type: 'enum',
          default: '1',
          options: [
            { value: '0', label: 'Empty', description: 'No infill lattice' },
            { value: '1', label: 'Asa-no-ha', description: 'Classic hemp leaf tripod lattice' }
          ]
        }
      ]
    };

    const { rerender } = render(
      <ParameterControls
        model={modelWithOptions}
        currentValues={{ pattern_choice: '1' }}
        onChangeValues={vi.fn()}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.getByText('Classic hemp leaf tripod lattice')).toBeInTheDocument();

    rerender(
      <ParameterControls
        model={modelWithOptions}
        currentValues={{ pattern_choice: '0' }}
        onChangeValues={vi.fn()}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.getByText('No infill lattice')).toBeInTheDocument();
  });

  it('renders project name and interactive part switcher for multi-model projects', () => {
    const projectModel1: ModelConfig = {
      ...mockModel,
      id: 'opengrid-display-case-shell',
      name: 'OpenGrid Display Case Shell',
      project: 'OpenGrid Display Case',
      partName: 'Shell Case'
    };

    const projectModel2: ModelConfig = {
      ...mockModel,
      id: 'opengrid-display-case-cover',
      name: 'OpenGrid Display Case Cover',
      project: 'OpenGrid Display Case',
      partName: 'Front Cover'
    };

    const allModels = [projectModel1, projectModel2];
    const onSelectModel = vi.fn();

    render(
      <ParameterControls
        model={projectModel1}
        models={allModels}
        currentValues={{ Length: 120 }}
        onChangeValues={vi.fn()}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        onSelectModel={onSelectModel}
        isDirty={false}
        loading={false}
      />
    );

    // Displays project name
    expect(screen.getByText('OpenGrid Display Case')).toBeInTheDocument();
    expect(screen.getByText('OpenGrid Display Case Shell')).toBeInTheDocument();

    // Displays part switcher
    expect(screen.getByText('Switch Part:')).toBeInTheDocument();
    expect(screen.getByText('Shell Case')).toBeInTheDocument();
    const coverBtn = screen.getByText('Front Cover');
    expect(coverBtn).toBeInTheDocument();

    // Click Front Cover
    fireEvent.click(coverBtn);
    expect(onSelectModel).toHaveBeenCalledWith('opengrid-display-case-cover');
  });
});
