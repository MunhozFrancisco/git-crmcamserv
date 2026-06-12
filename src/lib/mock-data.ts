import type { User, Lead, Stage, Opportunity, Activity, Task, Alert, SellerStats, Product, Client } from '@/types'

export const CURRENT_USER: User = {
  id: 'u0',
  name: 'Rafael Costa',
  email: 'rafael@camserv.com.br',
  role: 'gestor',
  meta: 150000,
}

export const USERS: User[] = [
  CURRENT_USER,
  { id: 'u1', name: 'Carlos Mendes', email: 'carlos@camserv.com.br', role: 'vendedor', meta: 30000 },
  { id: 'u2', name: 'Ana Beatriz', email: 'ana@camserv.com.br', role: 'vendedor', meta: 30000 },
  { id: 'u3', name: 'Lucas Ferreira', email: 'lucas@camserv.com.br', role: 'vendedor', meta: 25000 },
  { id: 'u4', name: 'Juliana Santos', email: 'juliana@camserv.com.br', role: 'vendedor', meta: 25000 },
  { id: 'u5', name: 'Pedro Alves', email: 'pedro@camserv.com.br', role: 'vendedor', meta: 20000 },
]

export const STAGES: Stage[] = [
  { id: 's1', name: 'Novo Lead',    order_index: 0, probability: 10,  color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { id: 's2', name: 'Qualificado', order_index: 1, probability: 25,  color: 'text-blue-600',   bgColor: 'bg-blue-100' },
  { id: 's3', name: 'Processo',    order_index: 2, probability: 45,  color: 'text-violet-600', bgColor: 'bg-violet-100' },
  { id: 's4', name: 'Negociação',  order_index: 3, probability: 70,  color: 'text-amber-600',  bgColor: 'bg-amber-100' },
  { id: 's5', name: 'Ganho',       order_index: 4, probability: 100, color: 'text-green-600',  bgColor: 'bg-green-100' },
  { id: 's6', name: 'Perdido',     order_index: 5, probability: 0,   color: 'text-red-600',    bgColor: 'bg-red-100' },
]

export const LEADS: Lead[] = [
  { id: 'l1', company_name: 'Grupo Horizonte', contact_name: 'Marcos Silva', email: 'marcos@horizonte.com', phone: '(11) 99999-1111', source: 'indicação', temperature: 'quente', assigned_to: 'u1', segment: 'Tecnologia', created_at: '2025-04-10' },
  { id: 'l2', company_name: 'Loja Primus', contact_name: 'Fernanda Lima', email: 'fernanda@primus.com', phone: '(11) 99999-2222', source: 'site', temperature: 'morno', assigned_to: 'u2', segment: 'Varejo', created_at: '2025-04-15' },
  { id: 'l3', company_name: 'Delta Construtora', contact_name: 'Roberto Neves', email: 'roberto@delta.com', phone: '(11) 99999-3333', source: 'linkedin', temperature: 'frio', assigned_to: 'u3', segment: 'Construção', created_at: '2025-04-20' },
  { id: 'l4', company_name: 'Clínica Saúde+', contact_name: 'Dra. Paula Mota', email: 'paula@saudemais.com', phone: '(11) 99999-4444', source: 'indicação', temperature: 'quente', assigned_to: 'u1', segment: 'Saúde', created_at: '2025-05-01' },
  { id: 'l5', company_name: 'Escola Futuro', contact_name: 'Diretor João', email: 'joao@escolafuturo.com', phone: '(11) 99999-5555', source: 'evento', temperature: 'morno', assigned_to: 'u4', segment: 'Educação', created_at: '2025-05-03' },
  { id: 'l6', company_name: 'Transprime Log', contact_name: 'Célia Ramos', email: 'celia@transprime.com', phone: '(11) 99999-6666', source: 'cold-call', temperature: 'frio', assigned_to: 'u5', segment: 'Logística', created_at: '2025-05-05' },
  { id: 'l7', company_name: 'Indústria Forja', contact_name: 'Eng. Renato', email: 'renato@forja.com', phone: '(11) 99999-7777', source: 'linkedin', temperature: 'morno', assigned_to: 'u2', segment: 'Indústria', created_at: '2025-05-08' },
  { id: 'l8', company_name: 'Rede Alimenta', contact_name: 'Sônia Braga', email: 'sonia@alimenta.com', phone: '(11) 99999-8888', source: 'site', temperature: 'quente', assigned_to: 'u3', segment: 'Alimentação', created_at: '2025-05-10' },
]

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'o1', lead_id: 'l1', client_id: '', stage_id: 's4', value: 48000, status: 'aberta',
    assigned_to: 'u1', score: 87, risk_level: 'baixo',
    expected_close_date: '2025-05-30', last_interaction: '2025-05-16',
    created_at: '2025-04-10', lead: LEADS[0], assignee: USERS[1],
  },
  {
    id: 'o2', lead_id: 'l2', client_id: '', stage_id: 's3', value: 15000, status: 'aberta',
    assigned_to: 'u2', score: 54, risk_level: 'medio',
    expected_close_date: '2025-06-15', last_interaction: '2025-05-10',
    created_at: '2025-04-15', lead: LEADS[1], assignee: USERS[2],
  },
  {
    id: 'o3', lead_id: 'l3', client_id: '', stage_id: 's1', value: 8000, status: 'aberta',
    assigned_to: 'u3', score: 22, risk_level: 'alto',
    expected_close_date: '2025-07-01', last_interaction: '2025-05-05',
    created_at: '2025-04-20', lead: LEADS[2], assignee: USERS[3],
  },
  {
    id: 'o4', lead_id: 'l4', client_id: '', stage_id: 's3', value: 32000, status: 'aberta',
    assigned_to: 'u1', score: 75, risk_level: 'baixo',
    expected_close_date: '2025-06-05', last_interaction: '2025-05-17',
    created_at: '2025-05-01', lead: LEADS[3], assignee: USERS[1],
  },
  {
    id: 'o5', lead_id: 'l5', client_id: '', stage_id: 's2', value: 12000, status: 'aberta',
    assigned_to: 'u4', score: 41, risk_level: 'medio',
    expected_close_date: '2025-06-20', last_interaction: '2025-05-12',
    created_at: '2025-05-03', lead: LEADS[4], assignee: USERS[4],
  },
  {
    id: 'o6', lead_id: 'l6', client_id: '', stage_id: 's1', value: 6500, status: 'aberta',
    assigned_to: 'u5', score: 18, risk_level: 'alto',
    expected_close_date: '2025-07-10', last_interaction: '2025-05-06',
    created_at: '2025-05-05', lead: LEADS[5], assignee: USERS[5],
  },
  {
    id: 'o7', lead_id: 'l7', client_id: '', stage_id: 's3', value: 21000, status: 'aberta',
    assigned_to: 'u2', score: 63, risk_level: 'medio',
    expected_close_date: '2025-06-10', last_interaction: '2025-05-14',
    created_at: '2025-05-08', lead: LEADS[6], assignee: USERS[2],
  },
  {
    id: 'o8', lead_id: 'l8', client_id: '', stage_id: 's4', value: 27000, status: 'aberta',
    assigned_to: 'u3', score: 79, risk_level: 'baixo',
    expected_close_date: '2025-05-28', last_interaction: '2025-05-17',
    created_at: '2025-05-10', lead: LEADS[7], assignee: USERS[3],
  },
]

export const ACTIVITIES: Activity[] = [
  { id: 'a1', opportunity_id: 'o1', user_id: 'u1', type: 'reunião', description: 'Reunião de apresentação da proposta comercial. Cliente demonstrou interesse no módulo financeiro.', created_at: '2025-05-16', user: USERS[1] },
  { id: 'a2', opportunity_id: 'o1', user_id: 'u1', type: 'ligação', description: 'Ligação para alinhar próximos passos. Decisor confirma reunião para amanhã.', created_at: '2025-05-14', user: USERS[1] },
  { id: 'a3', opportunity_id: 'o4', user_id: 'u1', type: 'email', description: 'Envio da proposta revisada com desconto de 10%.', created_at: '2025-05-17', user: USERS[1] },
  { id: 'a4', opportunity_id: 'o2', user_id: 'u2', type: 'whatsapp', description: 'Mensagem enviada pelo WhatsApp com catálogo de serviços.', created_at: '2025-05-10', user: USERS[2] },
  { id: 'a5', opportunity_id: 'o8', user_id: 'u3', type: 'reunião', description: 'Call de descoberta. Cliente tem urgência em implantar antes de julho.', created_at: '2025-05-17', user: USERS[3] },
]

export const TASKS: Task[] = [
  { id: 't1', title: 'Ligar para Grupo Horizonte — confirmar assinatura', opportunity_id: 'o1', assigned_to: 'u1', due_date: '2025-05-19', done: false, priority: 'alta', type: 'ligação' },
  { id: 't2', title: 'Enviar proposta para Clínica Saúde+', opportunity_id: 'o4', assigned_to: 'u1', due_date: '2025-05-20', done: false, priority: 'alta', type: 'email' },
  { id: 't3', title: 'Follow-up com Loja Primus', opportunity_id: 'o2', assigned_to: 'u2', due_date: '2025-05-19', done: false, priority: 'media', type: 'whatsapp' },
  { id: 't4', title: 'Reunião online com Indústria Forja', opportunity_id: 'o7', assigned_to: 'u2', due_date: '2025-05-21', done: false, priority: 'media', type: 'reunião' },
  { id: 't5', title: 'Qualificar Delta Construtora', opportunity_id: 'o3', assigned_to: 'u3', due_date: '2025-05-20', done: false, priority: 'baixa', type: 'ligação' },
  { id: 't6', title: 'Enviar material para Escola Futuro', opportunity_id: 'o5', assigned_to: 'u4', due_date: '2025-05-20', done: false, priority: 'media', type: 'email' },
  { id: 't7', title: 'Primeiro contato com Transprime Log', opportunity_id: 'o6', assigned_to: 'u5', due_date: '2025-05-22', done: false, priority: 'baixa', type: 'ligação' },
  { id: 't8', title: 'Apresentar demo para Rede Alimenta', opportunity_id: 'o8', assigned_to: 'u3', due_date: '2025-05-19', done: false, priority: 'alta', type: 'reunião' },
]

export const ALERTS: Alert[] = [
  { id: 'al1', opportunity_id: 'o3', message: 'Delta Construtora está há 13 dias sem interação — risco de perda.', type: 'danger', resolved: false, created_at: '2025-05-18', opportunity: OPPORTUNITIES[2] },
  { id: 'al2', opportunity_id: 'o6', message: 'Transprime Log está há 12 dias sem atualização.', type: 'danger', resolved: false, created_at: '2025-05-18', opportunity: OPPORTUNITIES[5] },
  { id: 'al3', opportunity_id: 'o2', message: 'Loja Primus está há 8 dias sem interação — monitore.', type: 'warning', resolved: false, created_at: '2025-05-18', opportunity: OPPORTUNITIES[1] },
  { id: 'al4', opportunity_id: 'o1', message: 'Grupo Horizonte: proposta enviada — ideal fechar em 48h.', type: 'info', resolved: false, created_at: '2025-05-18', opportunity: OPPORTUNITIES[0] },
]

export const SELLER_STATS: SellerStats[] = [
  { user: USERS[1], total_opportunities: 12, won: 5, lost: 2, open: 5, conversion_rate: 41.7, total_value: 180000, avg_ticket: 28000, avg_close_days: 22 },
  { user: USERS[2], total_opportunities: 10, won: 3, lost: 3, open: 4, conversion_rate: 30.0, total_value: 95000, avg_ticket: 19000, avg_close_days: 31 },
  { user: USERS[3], total_opportunities: 8, won: 2, lost: 3, open: 3, conversion_rate: 25.0, total_value: 64000, avg_ticket: 21000, avg_close_days: 28 },
  { user: USERS[4], total_opportunities: 7, won: 2, lost: 2, open: 3, conversion_rate: 28.6, total_value: 58000, avg_ticket: 19000, avg_close_days: 35 },
  { user: USERS[5], total_opportunities: 6, won: 1, lost: 2, open: 3, conversion_rate: 16.7, total_value: 32000, avg_ticket: 16000, avg_close_days: 42 },
]

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'CRM Pro', description: 'Licença mensal do sistema CRM com todos os módulos', type: 'serviço', category: 'Software', unit: '/mês/usuário', active: true, created_at: '2025-01-10' },
  { id: 'p2', name: 'Implantação e Configuração', description: 'Serviço de implantação, migração de dados e configuração inicial do sistema', type: 'serviço', category: 'Consultoria', unit: 'único', active: true, created_at: '2025-01-10' },
  { id: 'p3', name: 'Treinamento Equipe', description: 'Treinamento presencial ou online para a equipe comercial (até 10 pessoas)', type: 'serviço', category: 'Treinamento', unit: '/turma', active: true, created_at: '2025-01-15' },
  { id: 'p4', name: 'Suporte Prioritário', description: 'Suporte técnico com SLA de 4 horas e atendimento via WhatsApp', type: 'serviço', category: 'Suporte', unit: '/mês', active: true, created_at: '2025-02-01' },
  { id: 'p5', name: 'Integração WhatsApp Business', description: 'Integração do CRM com WhatsApp Business API para automação de mensagens', type: 'serviço', category: 'Software', unit: '/mês', active: true, created_at: '2025-02-15' },
  { id: 'p6', name: 'Módulo IA Gestor Comercial', description: 'Agente de IA que analisa oportunidades, gera score e recomenda ações', type: 'serviço', category: 'Software', unit: '/mês', active: true, created_at: '2025-03-01' },
  { id: 'p7', name: 'Consultoria Comercial Mensal', description: 'Reunião mensal com especialista para análise de pipeline e estratégia de vendas', type: 'serviço', category: 'Consultoria', unit: '/mês', active: false, created_at: '2025-03-10' },
  { id: 'p8', name: 'Backup e Segurança de Dados', description: 'Backup diário automático com criptografia e armazenamento em nuvem', type: 'serviço', category: 'Infraestrutura', unit: '/mês', active: true, created_at: '2025-04-01' },
]

export const CLIENTS: Client[] = [
  /* ── clientes ativos ── */
  {
    id: 'c1', status: 'cliente', name: 'Grupo Horizonte', razao_social: 'Grupo Horizonte Tecnologia Ltda',
    cnpj: '12.345.678/0001-90', site: 'www.grupohorizonte.com.br', segment: 'Tecnologia',
    source: 'indicação', temperature: 'quente', client_type: 'privado', phone: '', whatsapp: '',
    address: 'Av. Paulista, 1000 — Sala 501, Bela Vista, São Paulo/SP, CEP 01310-100',
    responsible_name: 'Marcos Silva', assigned_to: 'u1', created_at: '2025-04-20',
    contacts: [
      { id: 'ct1', client_id: 'c1', name: 'Marcos Silva', cargo: 'Diretor de TI', department: 'Tecnologia', email: 'marcos@horizonte.com', phone: '(11) 99999-1111', whatsapp: '(11) 99999-1111', is_primary: true },
      { id: 'ct2', client_id: 'c1', name: 'Carla Mendes', cargo: 'Gerente de Compras', department: 'Suprimentos', email: 'carla@horizonte.com', phone: '(11) 99999-1122', whatsapp: '(11) 99999-1122', is_primary: false },
    ],
  },
  {
    id: 'c2', status: 'cliente', name: 'Clínica Saúde+', razao_social: 'Clínica Saúde Mais Serviços Médicos S/S Ltda',
    cnpj: '23.456.789/0001-01', site: 'www.clinicasaudemais.com.br', segment: 'Saúde',
    source: 'indicação', temperature: 'quente', client_type: 'privado', phone: '', whatsapp: '',
    address: 'Rua das Flores, 200 — Centro, Campinas/SP, CEP 13010-050',
    responsible_name: 'Dra. Paula Mota', assigned_to: 'u1', created_at: '2025-05-10',
    contacts: [
      { id: 'ct3', client_id: 'c2', name: 'Dra. Paula Mota', cargo: 'Diretora Geral', department: 'Diretoria', email: 'paula@saudemais.com', phone: '(19) 99999-4444', whatsapp: '(19) 99999-4444', is_primary: true },
      { id: 'ct4', client_id: 'c2', name: 'Roberto Lima', cargo: 'Coordenador Administrativo', department: 'Administrativo', email: 'roberto@saudemais.com', phone: '(19) 99999-4455', whatsapp: '', is_primary: false },
      { id: 'ct5', client_id: 'c2', name: 'Ana Fernandes', cargo: 'Analista Financeira', department: 'Financeiro', email: 'ana.f@saudemais.com', phone: '(19) 99999-4466', whatsapp: '(19) 99999-4466', is_primary: false },
    ],
  },
  {
    id: 'c3', status: 'cliente', name: 'Indústria Forja', razao_social: 'Forja Metais Indústria e Comércio SA',
    cnpj: '34.567.890/0001-12', site: 'www.forjametais.com.br', segment: 'Indústria',
    source: 'linkedin', temperature: 'morno', client_type: 'privado', phone: '', whatsapp: '',
    address: 'Rod. Anhanguera, km 88 — Distrito Industrial, Sumaré/SP, CEP 13175-000',
    responsible_name: 'Eng. Renato Barbosa', assigned_to: 'u2', created_at: '2025-04-15',
    contacts: [
      { id: 'ct6', client_id: 'c3', name: 'Eng. Renato Barbosa', cargo: 'Gerente Industrial', department: 'Produção', email: 'renato@forja.com', phone: '(19) 99999-7777', whatsapp: '(19) 99999-7777', is_primary: true },
    ],
  },
  {
    id: 'c4', status: 'cliente', name: 'Escola Futuro', razao_social: 'Centro Educacional Futuro Eireli',
    cnpj: '45.678.901/0001-23', site: 'www.escolafuturo.edu.br', segment: 'Educação',
    source: 'evento', temperature: 'morno', client_type: 'privado', phone: '', whatsapp: '',
    address: 'Rua Esperança, 450 — Jardim América, Ribeirão Preto/SP, CEP 14020-260',
    responsible_name: 'Dir. João Pires', assigned_to: 'u4', created_at: '2025-05-02',
    contacts: [
      { id: 'ct7', client_id: 'c4', name: 'João Pires', cargo: 'Diretor', department: 'Diretoria', email: 'joao@escolafuturo.com', phone: '(16) 99999-5555', whatsapp: '(16) 99999-5555', is_primary: true },
      { id: 'ct8', client_id: 'c4', name: 'Maria Souza', cargo: 'Secretária Executiva', department: 'Administrativo', email: 'maria@escolafuturo.com', phone: '(16) 99999-5566', whatsapp: '(16) 99999-5566', is_primary: false },
    ],
  },
  {
    id: 'c5', status: 'cliente', name: 'Rede Alimenta', razao_social: 'Rede Alimenta Franqueadora Ltda',
    cnpj: '56.789.012/0001-34', site: 'www.realimenta.com.br', segment: 'Alimentação',
    source: 'site', temperature: 'quente', client_type: 'privado', phone: '', whatsapp: '',
    address: 'Av. Brasil, 3000 — Barra da Tijuca, Rio de Janeiro/RJ, CEP 22640-102',
    responsible_name: 'Sônia Braga', assigned_to: 'u3', created_at: '2025-05-12',
    contacts: [
      { id: 'ct9', client_id: 'c5', name: 'Sônia Braga', cargo: 'CEO', department: 'Diretoria', email: 'sonia@alimenta.com', phone: '(21) 99999-8888', whatsapp: '(21) 99999-8888', is_primary: true },
      { id: 'ct10', client_id: 'c5', name: 'Paulo Saraiva', cargo: 'Gerente de Expansão', department: 'Franquias', email: 'paulo@alimenta.com', phone: '(21) 99999-8899', whatsapp: '(21) 99999-8899', is_primary: false },
      { id: 'ct11', client_id: 'c5', name: 'Juliana Neves', cargo: 'Analista de TI', department: 'Tecnologia', email: 'juliana@alimenta.com', phone: '(21) 99999-8800', whatsapp: '', is_primary: false },
    ],
  },
  /* ── leads (prospects ainda não convertidos) ── */
  {
    id: 'cl1', status: 'lead', name: 'Loja Primus', razao_social: 'Loja Primus Comércio Ltda',
    cnpj: '', site: '', segment: 'Varejo',
    source: 'site', temperature: 'morno', client_type: 'privado', phone: '', whatsapp: '', address: '',
    responsible_name: 'Fernanda Lima', assigned_to: 'u2', created_at: '2025-04-15',
    contacts: [
      { id: 'ct12', client_id: 'cl1', name: 'Fernanda Lima', cargo: 'Gerente Comercial', department: 'Comercial', email: 'fernanda@primus.com', phone: '(11) 99999-2222', whatsapp: '(11) 99999-2222', is_primary: true },
    ],
  },
  {
    id: 'cl2', status: 'lead', name: 'Delta Construtora', razao_social: 'Delta Construtora e Incorporadora SA',
    cnpj: '', site: '', segment: 'Construção',
    source: 'linkedin', temperature: 'frio', client_type: 'privado', phone: '', whatsapp: '', address: '',
    responsible_name: 'Roberto Neves', assigned_to: 'u3', created_at: '2025-04-20',
    contacts: [
      { id: 'ct13', client_id: 'cl2', name: 'Roberto Neves', cargo: 'Diretor de Obras', department: 'Engenharia', email: 'roberto@delta.com', phone: '(11) 99999-3333', whatsapp: '', is_primary: true },
    ],
  },
  {
    id: 'cl3', status: 'lead', name: 'Transprime Log', razao_social: 'Transprime Logística e Transporte Ltda',
    cnpj: '', site: '', segment: 'Logística',
    source: 'cold-call', temperature: 'frio', client_type: 'privado', phone: '', whatsapp: '', address: '',
    responsible_name: 'Célia Ramos', assigned_to: 'u5', created_at: '2025-05-05',
    contacts: [
      { id: 'ct14', client_id: 'cl3', name: 'Célia Ramos', cargo: 'Gerente Operacional', department: 'Operações', email: 'celia@transprime.com', phone: '(11) 99999-6666', whatsapp: '', is_primary: true },
    ],
  },
]

export function getPipelineByStage(opportunities: Opportunity[]) {
  return STAGES.map((stage) => ({
    stage,
    opportunities: opportunities.filter((o) => o.stage_id === stage.id && o.status === 'aberta'),
  }))
}

export function getTotalPipelineValue(opportunities: Opportunity[]) {
  return opportunities.filter((o) => o.status === 'aberta').reduce((sum, o) => sum + o.value, 0)
}

export function getAtRiskOpportunities(opportunities: Opportunity[]) {
  return opportunities.filter((o) => o.risk_level === 'alto' && o.status === 'aberta')
}
