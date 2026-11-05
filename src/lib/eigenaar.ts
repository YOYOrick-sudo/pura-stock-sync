/**
 * Wie de takenlijst mag instellen.
 * Nu het auth-e-mailadres. Later kan dit een rol worden, bijvoorbeeld manager.
 */
export function isEigenaarAccount(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase().startsWith('yorick@');
}
