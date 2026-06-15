// Mapeia valores display (com acentos) para chaves Prisma (sem acentos)
// Necessário porque os formulários enviam o valor @map do Prisma,
// mas a API precisa passar a chave do enum.

export const sourceMap: Record<string, string> = {
  'indicação': 'indicacao',
  'cold-call': 'cold_call',
  'site': 'site',
  'linkedin': 'linkedin',
  'evento': 'evento',
  'outro': 'outro',
}

export const activityTypeMap: Record<string, string> = {
  'ligação': 'ligacao',
  'reunião': 'reuniao',
  'email': 'email',
  'whatsapp': 'whatsapp',
  'tarefa': 'tarefa',
}

export const taskTypeMap: Record<string, string> = {
  'ligação': 'ligacao',
  'reunião': 'reuniao',
  'email': 'email',
  'whatsapp': 'whatsapp',
  'outro': 'outro',
}

export const productTypeMap: Record<string, string> = {
  'serviço': 'servico',
  'produto': 'produto',
}

export function mapEnum(map: Record<string, string>, value: string, fallback: string): string {
  return map[value.toLowerCase()] ?? map[fallback.toLowerCase()] ?? fallback
}
