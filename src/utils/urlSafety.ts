export type UrlSafetyLevel = 'clear' | 'caution' | 'high';

export interface UrlSafetyReport {
  level: UrlSafetyLevel;
  hostname: string;
  reasons: string[];
}

const SHORTENER_HOSTS = new Set([
  'bit.ly',
  'buff.ly',
  'cutt.ly',
  'goo.gl',
  'is.gd',
  'lnkd.in',
  'ow.ly',
  'rebrand.ly',
  'rb.gy',
  'shorturl.at',
  't.co',
  'tinyurl.com',
]);

function isIpAddress(hostname: string) {
  return (
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
    /^\[[\da-f:]+\]$/i.test(hostname)
  );
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    octets[0] === 0 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 169 && octets[1] === 254)
  );
}

export function analyzeUrlSafety(value: string): UrlSafetyReport {
  const parsed = new URL(value);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('QR Guardián solo analiza enlaces HTTP y HTTPS.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const reasons: string[] = [];
  let level: UrlSafetyLevel = 'clear';
  const addCaution = (reason: string) => {
    reasons.push(reason);
    if (level === 'clear') level = 'caution';
  };

  if (parsed.username || parsed.password) {
    reasons.push(
      'El enlace incluye credenciales antes del dominio, una técnica que puede ocultar el destino real.',
    );
    level = 'high';
  }

  if (parsed.protocol === 'http:') {
    addCaution('La conexión no usa HTTPS y el contenido podría viajar sin cifrar.');
  }

  if (isIpAddress(hostname)) {
    addCaution(
      isPrivateIpv4(hostname)
        ? 'El enlace apunta a una dirección de red local, no a un dominio público.'
        : 'El enlace usa una dirección IP en vez de un nombre de dominio.',
    );
  }

  if (hostname.split('.').some((label) => label.startsWith('xn--'))) {
    addCaution(
      'El dominio usa caracteres internacionalizados que pueden parecerse a otros nombres.',
    );
  }

  if (SHORTENER_HOSTS.has(hostname)) {
    addCaution(
      'El enlace es acortado y oculta el dominio al que te llevará.',
    );
  }

  if (parsed.port) {
    addCaution(
      `El enlace usa el puerto no habitual ${parsed.port}; verifica que esperabas este servicio.`,
    );
  }

  return { level, hostname, reasons };
}
