import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '@/services/adminService';
import { Wallet, WalletTransaction, Withdrawal, WithdrawPayload } from '@/types/wallet';
import { getErrorMessage } from '@/utils/helpers';
import { crossAlert } from '@/utils/crossAlert';

export function useAdminWallet() {
  const queryClient = useQueryClient();

  // Queries
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['adminWallet'],
    queryFn: async () => {
      const res = await adminService.getAdminWallet();
      if (!res.success) throw new Error(res.message);
      return res.data as Wallet;
    }
  });

  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: async () => {
      const res = await adminService.getAdminTransactions();
      if (!res.success) throw new Error(res.message);
      return Array.isArray(res.data) ? res.data as WalletTransaction[] : [];
    }
  });

  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['adminPendingWithdrawals'],
    queryFn: async () => {
      const res = await adminService.getPendingWithdrawals();
      if (!res.success) throw new Error(res.message);
      return Array.isArray(res.data) ? res.data as Withdrawal[] : [];
    }
  });

  const { data: allWithdrawalsData, isLoading: allLoading, refetch: refetchAll } = useQuery({
    queryKey: ['adminAllWithdrawals'],
    queryFn: async () => {
      const res = await adminService.getAllWithdrawals();
      if (!res.success) throw new Error(res.message);
      return Array.isArray(res.data) ? res.data as Withdrawal[] : [];
    }
  });

  const loading = walletLoading || txLoading || pendingLoading || allLoading;
  const [refreshing, setRefreshing] = useState(false);
  const error = ''; // React query handles errors better, we can map them if needed, keeping simple here

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTx(), refetchPending(), refetchAll()]);
    setRefreshing(false);
  };

  // Process withdrawal modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processAction, setProcessAction] = useState<'success' | 'failed'>('success');
  const [processNotes, setProcessNotes] = useState('');

  const processMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: 'success'|'failed', note?: string }) => {
      const res = await adminService.processWithdrawal(id, { status, note });
      if (!res.success) throw new Error(res.message || 'Gagal memproses penarikan');
      return res;
    },
    onSuccess: (_, variables) => {
      crossAlert('Berhasil', variables.status === 'success' ? 'Penarikan disetujui' : 'Penarikan ditolak');
      closeProcessModal();
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['adminWallet'] });
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['adminPendingWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllWithdrawals'] });
    },
    onError: (err) => {
      crossAlert('Error', getErrorMessage(err, 'Gagal memproses penarikan'));
    }
  });

  const openProcessModal = (item: Withdrawal, action: 'success' | 'failed') => {
    setSelectedWithdrawal(item);
    setProcessAction(action);
    setProcessNotes('');
    setProcessModalOpen(true);
  };

  const closeProcessModal = () => {
    setProcessModalOpen(false);
    setSelectedWithdrawal(null);
    setProcessNotes('');
  };

  const submitProcess = () => {
    if (!selectedWithdrawal) return;
    processMutation.mutate({
      id: selectedWithdrawal.withdraw_id,
      status: processAction,
      note: processNotes.trim() || undefined
    });
  };

  // Admin withdraw modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'ewallet'>('bank');
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bank_account_number: '',
    bank_name: '',
    e_wallet_number: '',
    e_wallet_provider: '',
  });

  const withdrawMutation = useMutation({
    mutationFn: async (payload: WithdrawPayload) => {
      const res = await adminService.requestAdminWithdraw(payload);
      if (!res.success) throw new Error(res.message || 'Gagal mengajukan penarikan');
      return res;
    },
    onSuccess: () => {
      crossAlert('Berhasil', 'Permintaan penarikan berhasil diajukan');
      closeWithdrawModal();
      queryClient.invalidateQueries({ queryKey: ['adminWallet'] });
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['adminPendingWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllWithdrawals'] });
    },
    onError: (err) => {
      crossAlert('Error', getErrorMessage(err, 'Gagal mengajukan penarikan'));
    }
  });

  const closeWithdrawModal = () => {
    setWithdrawModalOpen(false);
    setWithdrawForm({
      amount: '',
      bank_account_number: '',
      bank_name: '',
      e_wallet_number: '',
      e_wallet_provider: '',
    });
    setWithdrawMethod('bank');
  };

  const submitAdminWithdraw = () => {
    const amountNum = Number(withdrawForm.amount.replace(/\./g, ''));
    const bankName = withdrawForm.bank_name.trim();
    const bankAccountNumber = withdrawForm.bank_account_number.trim();
    const eWalletProvider = withdrawForm.e_wallet_provider.trim();
    const eWalletNumber = withdrawForm.e_wallet_number.trim();

    if (!amountNum || amountNum < 50000) {
      return crossAlert('Gagal', 'Minimal penarikan adalah Rp 50.000');
    }
    if (withdrawMethod === 'bank') {
      if (!bankName || !bankAccountNumber) return crossAlert('Gagal', 'Lengkapi data bank');
    } else {
      if (!eWalletProvider || !eWalletNumber) return crossAlert('Gagal', 'Lengkapi data e-wallet');
    }

    const payload: WithdrawPayload = withdrawMethod === 'bank'
      ? { amount: amountNum, bank_name: bankName, bank_account_number: bankAccountNumber }
      : { amount: amountNum, e_wallet_provider: eWalletProvider, e_wallet_number: eWalletNumber };

    withdrawMutation.mutate(payload);
  };

  return {
    wallet: walletData || null,
    transactions: txData || [],
    pendingWithdrawals: pendingData || [],
    allWithdrawals: allWithdrawalsData || [],
    loading,
    refreshing,
    error,
    onRefresh,
    
    selectedWithdrawal,
    processModalOpen,
    processAction,
    processNotes,
    processing: processMutation.isPending,
    setProcessNotes,
    openProcessModal,
    closeProcessModal,
    submitProcess,
    
    withdrawModalOpen,
    setWithdrawModalOpen,
    submittingWithdraw: withdrawMutation.isPending,
    withdrawMethod,
    setWithdrawMethod,
    withdrawForm,
    setWithdrawForm,
    closeWithdrawModal,
    submitAdminWithdraw,
  };
}
