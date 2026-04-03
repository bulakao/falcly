export interface Installment {
  id: string;
  cardId: string;
  name: string;
  merchant: string;
  totalAmount: number;
  monthlyAmount: number;
  totalMonths: number;
  startDate: number; // timestamp
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
