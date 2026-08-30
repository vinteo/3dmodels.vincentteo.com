import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelDimensionsHUD } from '../components/ModelDimensionsHUD';
import { ModelDimensionItem } from '../engines/replicad/types';

describe('ModelDimensionsHUD Component', () => {
  const mockDimensions: ModelDimensionItem[] = [
    {
      id: 'vertex_to_vertex',
      label: 'Vertex to Vertex',
      value: 40,
      unit: 'mm',
      formatted: '40.0 mm',
      description: 'Point-to-point major diameter'
    },
    {
      id: 'side_to_side',
      label: 'Side to Side',
      value: 34.6,
      unit: 'mm',
      formatted: '34.6 mm',
      description: 'Flat-to-flat minor diameter'
    },
    {
      id: 'height',
      label: 'Height / Depth',
      value: 3,
      unit: 'mm',
      formatted: '3.0 mm',
      description: 'Extruded thickness'
    },
    {
      id: 'full_length',
      label: 'Full Length (inc. Ring)',
      value: 48.5,
      unit: 'mm',
      formatted: '48.5 mm',
      description: 'Total length'
    }
  ];

  it('renders all model dimensions with labels and formatted units', () => {
    render(<ModelDimensionsHUD dimensions={mockDimensions} />);

    expect(screen.getByText('Model Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Vertex to Vertex')).toBeInTheDocument();
    expect(screen.getByText('40.0 mm')).toBeInTheDocument();
    expect(screen.getByText('Side to Side')).toBeInTheDocument();
    expect(screen.getByText('34.6 mm')).toBeInTheDocument();
    expect(screen.getByText('Height / Depth')).toBeInTheDocument();
    expect(screen.getByText('3.0 mm')).toBeInTheDocument();
    expect(screen.getByText('Full Length (inc. Ring)')).toBeInTheDocument();
    expect(screen.getByText('48.5 mm')).toBeInTheDocument();
  });

  it('collapses into summary pill and expands when clicked', () => {
    render(<ModelDimensionsHUD dimensions={mockDimensions} defaultCollapsed={true} />);

    // Initially collapsed
    expect(screen.queryByText('Model Dimensions')).not.toBeInTheDocument();
    expect(screen.getByText('40.0 mm × 34.6 mm × 3.0 mm')).toBeInTheDocument();

    // Click to expand
    const expandBtn = screen.getByTitle('Expand Model Dimensions');
    fireEvent.click(expandBtn);

    expect(screen.getByText('Model Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Vertex to Vertex')).toBeInTheDocument();

    // Click minimize button
    const minimizeBtn = screen.getByTitle('Minimize dimensions panel');
    fireEvent.click(minimizeBtn);

    expect(screen.queryByText('Model Dimensions')).not.toBeInTheDocument();
    expect(screen.getByText('40.0 mm × 34.6 mm × 3.0 mm')).toBeInTheDocument();
  });

  it('returns null when dimensions array is empty', () => {
    const { container } = render(<ModelDimensionsHUD dimensions={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
