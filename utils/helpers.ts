/**
 * getErrorMessage
 * Safely extracts error messages from unknown error objects (e.g., Axios errors, standard Errors).
 */
export function getErrorMessage(err: unknown, fallback: string = 'Terjadi kesalahan'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'success' | 'rejected' | 'failed';

/**
 * statusColor
 * Returns standardized colors for withdrawal statuses.
 */
export function statusColor(status: string): { text: string; bg: string } {
  if (status === 'success' || status === 'approved')
    return { text: '#10B981', bg: '#ECFDF5' };
  if (status === 'pending') 
    return { text: '#F59E0B', bg: '#FEF3C7' };
  if (status === 'failed' || status === 'rejected')
    return { text: '#EF4444', bg: '#FEF2F2' };
  return { text: '#94A3B8', bg: '#F1F5F9' };
}

/**
 * statusLabel
 * Returns standardized Indonesian labels for withdrawal statuses.
 */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    success: 'Berhasil',
    rejected: 'Ditolak',
    failed: 'Gagal',
  };
  return map[status] || status;
}
