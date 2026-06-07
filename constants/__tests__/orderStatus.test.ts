import {
  ALL_ORDER_STATUSES,
  getStatusBgColor,
  getStatusColor,
  getStatusLabel,
} from '@/constants/orderStatus';

describe('orderStatus helpers', () => {
  it('returns Indonesian labels for known statuses', () => {
    expect(getStatusLabel('COMPLETED')).toBe('Selesai');
  });

  it('returns original status for unknown labels', () => {
    expect(getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('returns configured colors and fallbacks', () => {
    expect(getStatusColor('COMPLETED')).toBe('#10B981');
    expect(getStatusColor('UNKNOWN')).toBe('#64748B');
    expect(getStatusBgColor('UNKNOWN')).toBe('#F1F5F9');
  });

  it('keeps the timeline order stable', () => {
    expect(ALL_ORDER_STATUSES).toHaveLength(9);
    expect(ALL_ORDER_STATUSES[0]).toBe('WAITING_OWNER_CONFIRMATION');
    expect(ALL_ORDER_STATUSES[ALL_ORDER_STATUSES.length - 1]).toBe('COMPLETED');
  });
});
