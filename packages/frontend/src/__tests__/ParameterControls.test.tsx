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
      step: 5
    },
    {
      id: 'Dividers',
      name: 'Dividers',
      type: 'enum',
      default: '2',
      options: [
        { value: '1', label: '1 Divider' },
        { value: '2', label: '2 Dividers' }
      ]
    },
    {
      id: 'Chamfer',
      name: 'Chamfer Base',
      type: 'boolean',
      default: true
    }
  ]
};

describe('ParameterControls Component', () => {
  it('renders all parameter input fields from model schema', () => {
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
    expect(screen.getByLabelText('Length')).toBeInTheDocument();
    expect(screen.getByLabelText('Dividers')).toBeInTheDocument();
    expect(screen.getByText('Chamfer Base')).toBeInTheDocument();
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

  it('calls onOpenExport when Export button is clicked', () => {
    const onOpenExport = vi.fn();

    render(
      <ParameterControls
        model={mockModel}
        currentValues={{ Length: 120, Dividers: '2', Chamfer: true }}
        onChangeValues={vi.fn()}
        onApply={vi.fn()}
        onOpenExport={onOpenExport}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    const exportBtn = screen.getByText('Export STL / STEP Files');
    fireEvent.click(exportBtn);
    expect(onOpenExport).toHaveBeenCalled();
  });

  it('renders section pattern controls and cycles rotation by 120 degrees', () => {
    const kumikoMockModel: ModelConfig = {
      ...mockModel,
      id: 'kumiko-keychain-replicad',
      name: 'Kumiko Keychain',
      parameters: [
        {
          id: 'section_1',
          name: 'Section 1 (0°–60°)',
          type: 'enum',
          default: '1',
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
          options: [
            { value: '0', label: 'Empty' },
            { value: '1', label: 'Asa-no-ha' }
          ]
        },
        {
          id: 'section_1_rotation',
          name: 'Section 1 Rotation',
          type: 'enum',
          default: '0',
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
      section_1_rotation: '0',
      section_2_rotation: '0'
    };
    const onChangeValues = vi.fn();

    render(
      <ParameterControls
        model={kumikoMockModel}
        currentValues={currentValues}
        onChangeValues={onChangeValues}
        onApply={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenModelDrawer={vi.fn()}
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.getByText('Section Patterns (6 Wedges)')).toBeInTheDocument();
    expect(screen.getByText('Pattern Rotation (All Sections)')).toBeInTheDocument();

    const cycleAllBtn = screen.getByTitle('Cycle rotation by 120° around inner triangle center');
    expect(cycleAllBtn).toBeInTheDocument();

    // Clicking Cycle +120° advances from 0° to 120° for all sections
    fireEvent.click(cycleAllBtn);
    expect(onChangeValues).toHaveBeenCalledWith(
      expect.objectContaining({
        section_1_rotation: '120',
        section_2_rotation: '120'
      })
    );
  });
});
