/**
 * Utility functions for date handling
 */

/**
 * Função para obter a chave de data considerando horário de São Paulo
 * O dia termina às 2:00 da manhã (horário de São Paulo)
 */
export function getDateKeyForSaoPaulo(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Converter para horário de São Paulo usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === "year")?.value || "";
  const month = parts.find(p => p.type === "month")?.value || "";
  const day = parts.find(p => p.type === "day")?.value || "";
  const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
  
  // Se a hora for antes das 2:00, considerar como parte do dia anterior
  let dateKey = `${year}-${month}-${day}`;
  if (hour < 2) {
    // Subtrair um dia da data
    const dateObj = new Date(`${year}-${month}-${day}T00:00:00`);
    dateObj.setDate(dateObj.getDate() - 1);
    const prevYear = dateObj.getFullYear();
    const prevMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
    const prevDay = String(dateObj.getDate()).padStart(2, "0");
    dateKey = `${prevYear}-${prevMonth}-${prevDay}`;
  }
  
  return dateKey;
}

