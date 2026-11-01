import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AirspaceFlightPlannerDialog } from './AirspaceFlightPlannerDialog';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('AirspaceFlightPlannerDialog', () => {
  it('renders flight survey map dialog with asset name, coordinates and cambay portal link', () => {
    const onClose = vi.fn();
    render(
      <AirspaceFlightPlannerDialog
        open={true}
        onClose={onClose}
        assetName="Cầu Ba Son (Cầu Thủ Thiêm 2)"
        latitude={10.7805}
        longitude={106.7108}
        inspectionItems={['Mố cầu M1', 'Trụ cầu P1']}
      />,
    );

    expect(
      screen.getByText(/Bản đồ Khảo sát Không phận & Kế hoạch Bay Drone/i),
    ).toBeTruthy();
    expect(screen.getAllByText(/Cầu Ba Son/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tọa độ mục tiêu công trình/i)).toBeTruthy();
    expect(screen.getByText('Mố cầu M1')).toBeTruthy();
    expect(screen.getByText('Trụ cầu P1')).toBeTruthy();

    const portalLink = screen.getByRole('link', {
      name: /Tra cứu cổng cambay\.mod\.gov\.vn/i,
    });
    expect(portalLink.getAttribute('href')).toBe('https://cambay.mod.gov.vn');
  });

  it('supports applying edited coordinates in create/edit asset mode', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <AirspaceFlightPlannerDialog
        open={true}
        onClose={onClose}
        assetName="Công trình mới"
        latitude={10.7805}
        longitude={106.7108}
        canEditCoordinates={true}
        onApplyCoordinates={onApply}
      />,
    );

    const applyBtn = screen.getByRole('button', {
      name: /Áp dụng tọa độ vào công trình/i,
    });
    fireEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalledWith(
      10.7805,
      106.7108,
      expect.any(String),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
