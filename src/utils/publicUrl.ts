export function getPublicBaseUrl(): string {
  // Usar siempre el origen actual - funciona en preview y producción
  return window.location.origin;
}
