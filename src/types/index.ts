export type UserRole = 'gestor' | 'vendedor'

export type ProductType = 'produto' | 'serviço'
export type ProductCategory = 'Software' | 'Hardware' | 'Consultoria' | 'Suporte' | 'Treinamento' | 'Infraestrutura' | 'Outro'

export interface Product {
  id: string
  name: string
  description: string
  type: ProductType
  category: ProductCategory
  unit: string
  active: boolean
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  meta: number
  active?: boolean
}

export interface Lead {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  source: 'indicação' | 'site' | 'linkedin' | 'evento' | 'cold-call' | 'outro'
  temperature: 'frio' | 'morno' | 'quente'
  assigned_to: string
  segment: string
  created_at: string
}

export interface Stage {
  id: string
  name: string
  order_index: number
  probability: number
  color: string
  bgColor: string
}

export type RiskLevel = 'baixo' | 'medio' | 'alto'
export type OpportunityStatus = 'aberta' | 'ganha' | 'perdida'

export interface Opportunity {
  id: string
  client_id: string
  lead_id: string
  stage_id: string
  value: number
  status: OpportunityStatus
  assigned_to: string
  score: number
  risk_level: RiskLevel
  expected_close_date: string
  next_interaction_date?: string
  last_interaction: string
  created_at: string
  client?: Client
  lead: Lead
  assignee: User
}

export interface Activity {
  id: string
  opportunity_id: string
  user_id: string
  type: 'ligação' | 'email' | 'reunião' | 'whatsapp' | 'tarefa'
  description: string
  created_at: string
  user?: User
}

export interface Task {
  id: string
  title: string
  opportunity_id?: string
  client_id?: string
  lead_id?: string
  assigned_to: string
  due_date: string
  done: boolean
  done_at?: string
  priority: 'baixa' | 'media' | 'alta'
  type: 'ligação' | 'email' | 'reunião' | 'whatsapp' | 'outro'
  opportunity?: Opportunity
  client?: Client
  assignee?: User
}

export interface Alert {
  id: string
  opportunity_id: string
  message: string
  type: 'warning' | 'danger' | 'info'
  resolved: boolean
  created_at: string
  opportunity?: Opportunity
}

export interface Contact {
  id: string
  client_id: string
  name: string
  cargo: string
  department: string
  email: string
  phone: string
  whatsapp: string
  is_primary: boolean
}

export type ClientType = 'privado' | 'governo'

export interface Client {
  id: string
  status: 'lead' | 'cliente'
  name: string
  razao_social: string
  cnpj: string
  site: string
  phone: string
  whatsapp: string
  segment: string
  address: string
  source: 'indicação' | 'site' | 'linkedin' | 'evento' | 'cold-call' | 'outro'
  temperature: 'frio' | 'morno' | 'quente'
  client_type: ClientType
  responsible_name: string
  assigned_to: string
  created_at: string
  contacts: Contact[]
}

export interface SellerStats {
  user: User
  total_opportunities: number
  won: number
  lost: number
  open: number
  conversion_rate: number
  total_value: number
  avg_ticket: number
  avg_close_days: number
}
