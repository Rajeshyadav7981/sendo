import { apiClient } from '@shared/api/client';

export interface PayoutSummary {
  totalDays: number;
  basicPayment: string;
  dailyWage: string;
  totalWorkingDays: number;
  totalHolidays: number | string;
  earnedPayment: string;
  totalAdvanceDeduction: string;
  referralBonus: string;
  payableAmount: string;
}

export const payoutApi = {
  forDriver: (driverId: string, month: string) =>
    apiClient.get<PayoutSummary>(`/advance/payout/${driverId}/${month}`),
};
