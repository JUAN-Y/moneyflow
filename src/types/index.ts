export type Account = {
  id: string
  user_id: string
  name: string
  bank: string
  balance: number
  type: 'checking' | 'savings' | 'cash'
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  merchant: string
  description: string
  date: string
  payment_method: 'card' | 'cash' | 'transfer'
  source: 'manual' | 'ocr_pdf' | 'ocr_image'
  created_at: string
}

export type Debt = {
  id: string
  user_id: string
  name: string
  total_amount: number
  remaining_amount: number
  monthly_payment: number
  due_date: string
  type: 'loan' | 'credit_card' | 'other'
  created_at: string
}

export type Receivable = {
  id: string
  user_id: string
  debtor_name: string
  amount: number
  due_date: string
  notes: string
  status: 'pending' | 'paid'
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category: string
  limit_amount: number
  month: string
  created_at: string
}

export type Goal = {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string
  created_at: string
}

export type CategoryRule = {
  id: string
  user_id: string
  keyword: string
  category: string
  created_at: string
}
