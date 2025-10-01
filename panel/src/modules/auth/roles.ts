export type Role = 'Owner' | 'Admin' | 'Operator' | 'BillingAdmin' | 'Support' | 'ReadOnly';

export const Roles = {
  Owner: 'Owner',
  Admin: 'Admin',
  Operator: 'Operator',
  BillingAdmin: 'BillingAdmin',
  Support: 'Support',
  ReadOnly: 'ReadOnly',
} as const;
