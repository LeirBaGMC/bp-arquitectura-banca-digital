export type Customer = { id: string; name: string; email: string; segment: string };
export type Account = { id: string; alias: string; kind: string; number: string; balance: number; currency: string };
export type Movement = { id: number; accountId: string; account: string; title: string; detail: string; amount: number; direction: 'IN' | 'OUT'; status: string; createdAt: string };
export type Transfer = { id: string; destinationType: string; recipient: string; bank: string; amount: number; description: string; status: string; createdAt: string };
export type Notification = { id: number; title: string; message: string; createdAt: string; isRead: boolean };
export type BankingData = { customer: Customer; accounts: Account[]; movements: Movement[]; transfers: Transfer[]; notifications: Notification[] };
export type TransferRequest = {
  sourceAccountId: string;
  destinationType: 'OWN' | 'INTERBANK';
  destinationAccountId: string | null;
  recipientName: string | null;
  recipientBank: string | null;
  destinationAccountNumber: string | null;
  amount: number;
  description: string | null;
  idempotencyKey: string;
};
