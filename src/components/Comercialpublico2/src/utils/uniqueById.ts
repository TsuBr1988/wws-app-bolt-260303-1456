/**
 * Garante itens únicos por id e preserva o mais recente
 * Versão otimizada para evitar duplicação
 */
export function uniqueById<T extends { id: string | number }>(rows: T[]): T[] {
  if (!Array.isArray(rows)) return [];
  
  const map = new Map<string | number, T>();
  for (const r of rows) {
    if (r && r.id) {
      map.set(r.id, r);
    }
  }
  return Array.from(map.values());
}

/**
 * Atualiza/substitui um item no Map por ID
 * SEMPRE substitui, nunca adiciona duplicado
 */
export function upsertInMap<T extends { id: string | number }>(
  map: Map<string | number, T>, 
  item: T
): Map<string | number, T> {
  const newMap = new Map(map);
  if (item && item.id) {
    newMap.set(item.id, item);
  }
  return newMap;
}