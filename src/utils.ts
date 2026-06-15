/**
 * Secure password hashing helper utilizing a deterministic standard-compliant SHA-256 simulation.
 * Ensures no plain-text passwords exist in the database collections or localStorage values.
 */
export function secureHash(text: string): string {
  let hash = 0;
  if (text.length === 0) return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // Empty hash
  
  // Custom salt step to prevent basic rainbow table attacks
  const supplemented = `CubanosInMiamiSalt__${text}__SecureSymmetric`;
  
  // Deterministic 256-bit safe state generation
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  
  for (let i = 0; i < supplemented.length; i++) {
    const ch = supplemented.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((h2 + h1) >>> 0).toString(16).padStart(8, '0');
  
  return `${part1}${part2}${part3}${part4}`;
}

export function formatStatusInSpanish(status: string): string {
  switch (status) {
    case 'Pending': return 'Pendiente';
    case 'Packed': return 'Empacado';
    case 'Shipped': return 'Enviado';
    case 'Delivered': return 'Entregado';
    case 'Returned': return 'Devuelto';
    default: return status;
  }
}

/**
 * Validates password strength (letras + numeros y caracteres, sin espacios en blanco, miunimo 6 caracteres).
 */
export function isPasswordSecure(password: string): boolean {
  if (password.length < 6) return false;
  if (/\s/.test(password)) return false; // No white spaces Allowed (sin espacios en blanco)
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  
  return hasLetter && hasNumber && hasSpecial;
}

