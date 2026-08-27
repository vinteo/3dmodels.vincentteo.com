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
        isDirty={false}
        loading={false}
      />
    );

    expect(screen.getByText('Customization')).toBeInTheDocument();
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
        isDirty={false}
        loading={false}
      />
    );

    const exportBtn = screen.getByText('Export STL / STEP Files');
    fireEvent.click(exportBtn);
    expect(onOpenExport).toHaveBeenCalled();
  });
});
