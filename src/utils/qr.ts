import type {
  BuildResult,
  CreateValues,
  ParsedCode,
  QRCategory,
  ScanCategory,
  ScanSource,
} from '../types';

export const CATEGORY_META: Record<
  QRCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  url: {
    label: 'Enlace / URL',
    shortLabel: 'Enlace',
    description: 'Sitios web, redes y formularios',
    icon: 'link',
    color: '#38BDF8',
  },
  wifi: {
    label: 'Red Wi-Fi',
    shortLabel: 'Wi-Fi',
    description: 'Conecta sin escribir la clave',
    icon: 'wifi',
    color: '#10B981',
  },
  text: {
    label: 'Texto plano',
    shortLabel: 'Texto',
    description: 'Notas, códigos o mensajes',
    icon: 'type',
    color: '#A78BFA',
  },
  contact: {
    label: 'Contacto (vCard)',
    shortLabel: 'Contacto',
    description: 'Nombre, teléfono y correo',
    icon: 'user',
    color: '#F472B6',
  },
  whatsapp: {
    label: 'WhatsApp',
    shortLabel: 'WhatsApp',
    description: 'Chat directo con mensaje',
    icon: 'message-circle',
    color: '#34D399',
  },
};

export const SCAN_CATEGORY_META: Record<
  ScanCategory,
  { label: string; icon: string; color: string }
> = {
  url: { label: 'Enlace web', icon: 'link', color: '#38BDF8' },
  wifi: { label: 'Red Wi-Fi', icon: 'wifi', color: '#10B981' },
  text: { label: 'Texto', icon: 'type', color: '#A78BFA' },
  contact: { label: 'Contacto', icon: 'user', color: '#F472B6' },
  whatsapp: { label: 'WhatsApp', icon: 'message-circle', color: '#34D399' },
  email: { label: 'Correo', icon: 'mail', color: '#FBBF24' },
  phone: { label: 'Teléfono', icon: 'phone', color: '#60A5FA' },
  sms: { label: 'SMS', icon: 'message-square', color: '#F59E0B' },
  geo: { label: 'Ubicación', icon: 'map-pin', color: '#F87171' },
  other: { label: 'Código QR', icon: 'grid', color: '#94A3B8' },
};

export const EMPTY_VALUES: CreateValues = {
  url: '',
  ssid: '',
  password: '',
  encryption: 'WPA',
  hidden: false,
  text: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  organization: '',
  whatsappPhone: '',
  whatsappMessage: '',
};

function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

function escapeVCard(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, '');
}

function whatsappNumber(value: string) {
  return value.replace(/\D/g, '');
}

function buildQrPayloadUnchecked(
  category: QRCategory,
  values: CreateValues,
): BuildResult {
  const empty = (error: string): BuildResult => ({
    payload: '',
    title: '',
    preview: '',
    error,
    fields: [],
  });

  if (category === 'url') {
    const url = normalizeUrl(values.url);
    if (!url) return empty('Escribe una dirección web para continuar.');
    try {
      // Throws for obviously malformed URLs.
      new URL(url);
    } catch {
      return empty('La dirección web no parece válida.');
    }
    return {
      payload: url,
      title: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      preview: url,
      error: null,
      fields: [{ label: 'URL', value: url }],
    };
  }

  if (category === 'wifi') {
    const ssid = values.ssid.trim();
    if (!ssid) return empty('Escribe el nombre de la red Wi-Fi.');
    if (values.encryption !== 'nopass' && !values.password) {
      return empty('Escribe la contraseña de la red.');
    }
    const payload = [
      'WIFI:',
      `T:${values.encryption};`,
      `S:${escapeWifi(ssid)};`,
      values.encryption !== 'nopass'
        ? `P:${escapeWifi(values.password)};`
        : 'P:;',
      values.hidden ? 'H:true;' : '',
      ';',
    ].join('');
    return {
      payload,
      title: `Wi-Fi · ${ssid}`,
      preview: `${ssid} · ${values.encryption === 'nopass' ? 'Abierta' : values.encryption}`,
      error: null,
      fields: [
        { label: 'Red', value: ssid },
        {
          label: 'Seguridad',
          value: values.encryption === 'nopass' ? 'Abierta' : values.encryption,
        },
        ...(values.encryption !== 'nopass'
          ? [{ label: 'Contraseña', value: values.password }]
          : []),
        ...(values.hidden ? [{ label: 'Oculta', value: 'Sí' }] : []),
      ],
    };
  }

  if (category === 'text') {
    const text = values.text.trim();
    if (!text) return empty('Escribe el texto que quieres guardar en el QR.');
    return {
      payload: text,
      title: text.length > 48 ? `${text.slice(0, 48)}…` : text,
      preview: text.length > 120 ? `${text.slice(0, 120)}…` : text,
      error: null,
      fields: [{ label: 'Texto', value: text }],
    };
  }

  if (category === 'contact') {
    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    const phone = values.phone.trim();
    const email = values.email.trim();
    if (!firstName && !lastName) {
      return empty('Escribe al menos el nombre del contacto.');
    }
    if (!phone && !email) {
      return empty('Añade un teléfono o un correo electrónico.');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return empty('El correo electrónico no parece válido.');
    }
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
      `FN:${escapeVCard(fullName)}`,
      values.organization.trim()
        ? `ORG:${escapeVCard(values.organization.trim())}`
        : '',
      phone ? `TEL;TYPE=CELL:${escapeVCard(phone)}` : '',
      email ? `EMAIL;TYPE=INTERNET:${escapeVCard(email)}` : '',
      'END:VCARD',
    ].filter(Boolean);
    return {
      payload: lines.join('\r\n'),
      title: fullName,
      preview: [phone, email].filter(Boolean).join(' · '),
      error: null,
      fields: [
        { label: 'Nombre', value: fullName },
        ...(phone ? [{ label: 'Teléfono', value: phone }] : []),
        ...(email ? [{ label: 'Correo', value: email }] : []),
        ...(values.organization.trim()
          ? [{ label: 'Empresa', value: values.organization.trim() }]
          : []),
      ],
    };
  }

  const number = whatsappNumber(values.whatsappPhone);
  if (!number) return empty('Escribe el número de WhatsApp con código de país.');
  if (number.length < 8) {
    return empty('El número debe incluir el código de país. Ej: 573001234567.');
  }
  const message = values.whatsappMessage.trim();
  const payload = `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  return {
    payload,
    title: `WhatsApp · +${number}`,
    preview: message || 'Chat de WhatsApp',
    error: null,
    fields: [
      { label: 'Número', value: `+${number}` },
      ...(message ? [{ label: 'Mensaje', value: message }] : []),
    ],
  };
}

/** Conservative byte budget for a version-40 QR with error correction H. */
const MAX_QR_BYTES = 1200;

function utf8Length(value: string) {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function buildQrPayload(
  category: QRCategory,
  values: CreateValues,
): BuildResult {
  const result = buildQrPayloadUnchecked(category, values);
  if (result.payload && utf8Length(result.payload) > MAX_QR_BYTES) {
    return {
      ...result,
      payload: '',
      error:
        'El contenido es demasiado largo para un QR. Acorta el texto o el mensaje e inténtalo de nuevo.',
    };
  }
  return result;
}

function unescapeWifi(value: string) {
  return value.replace(/\\([\\;,:"])/g, '$1');
}

function splitEscapedSemicolons(input: string) {
  const result: string[] = [];
  let current = '';
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      current += `\\${char}`;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === ';') {
      result.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  if (current) result.push(current);
  return result;
}

function parseWifi(raw: string): ParsedCode | null {
  if (!/^WIFI:/i.test(raw)) return null;
  const payload = raw.slice(5).replace(/;;\s*$/, ';');
  const parts = splitEscapedSemicolons(payload).filter(Boolean);

  const fields: Record<string, string> = {};
  for (const part of parts) {
    const index = part.indexOf(':');
    if (index <= 0) continue;
    const key = part.slice(0, index).toUpperCase();
    const value = part.slice(index + 1);
    fields[key] = value;
  }

  const ssid = unescapeWifi(fields.S ?? '');
  if (!ssid) return null;
  const password = unescapeWifi(fields.P ?? '');
  const encryption = (fields.T || 'WPA').toUpperCase();
  const hidden = (fields.H || '').toLowerCase() === 'true';

  return {
    category: 'wifi',
    title: `Wi-Fi · ${ssid}`,
    subtitle: `${encryption === 'NOPASS' ? 'Red abierta' : encryption}${hidden ? ' · Oculta' : ''}`,
    raw,
    fields: [
      { label: 'Red', value: ssid },
      {
        label: 'Seguridad',
        value: encryption === 'NOPASS' ? 'Abierta' : encryption,
      },
      { label: 'Contraseña', value: password || 'Sin contraseña' },
      ...(hidden ? [{ label: 'Red oculta', value: 'Sí' }] : []),
    ],
    actionLabel: 'Conectar a la red',
    actionKind: 'wifi',
    metadata: { ssid, password, encryption, hidden: String(hidden) },
  };
}

function parseVCard(raw: string): ParsedCode | null {
  if (!/^BEGIN:VCARD/i.test(raw.trim())) return null;
  const unfolded = raw.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const get = (name: string) => {
    const line = lines.find((item) =>
      item.toUpperCase().startsWith(`${name.toUpperCase()}:`) ||
      item.toUpperCase().startsWith(`${name.toUpperCase()};`),
    );
    if (!line) return '';
    const index = line.indexOf(':');
    return index >= 0 ? line.slice(index + 1).trim() : '';
  };
  const unescape = (value: string) =>
    value.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

  const fullName = unescape(get('FN'));
  const structured = unescape(get('N'));
  const structuredParts = structured.split(';');
  const fallbackName = [structuredParts[1], structuredParts[0]]
    .filter(Boolean)
    .join(' ');
  const name = fullName || fallbackName || 'Contacto';
  const phone = unescape(get('TEL'));
  const email = unescape(get('EMAIL'));
  const organization = unescape(get('ORG'));

  return {
    category: 'contact',
    title: name,
    subtitle: [phone, email].filter(Boolean).join(' · ') || 'Contacto vCard',
    raw,
    fields: [
      { label: 'Nombre', value: name },
      ...(phone ? [{ label: 'Teléfono', value: phone }] : []),
      ...(email ? [{ label: 'Correo', value: email }] : []),
      ...(organization ? [{ label: 'Empresa', value: organization }] : []),
    ],
    actionLabel: 'Compartir contacto',
    actionKind: 'contact',
    metadata: { name, phone, email, organization },
  };
}

function parseHttpUrl(raw: string): { url: string; isWhatsApp: boolean } | null {
  const trimmed = raw.trim();
  if (!/^(https?:\/\/|www\.)/i.test(trimmed)) return null;
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return null;
    const isWhatsApp =
      /(^|\.)wa\.me$/i.test(parsed.hostname) ||
      /(^|\.)whatsapp\.com$/i.test(parsed.hostname);
    return { url, isWhatsApp };
  } catch {
    return null;
  }
}

export function parseScannedCode(raw: string): ParsedCode {
  const trimmed = raw.trim();
  const wifi = parseWifi(trimmed);
  if (wifi) return wifi;

  const vcard = parseVCard(trimmed);
  if (vcard) return vcard;

  const urlResult = parseHttpUrl(trimmed);
  if (urlResult) {
    return {
      category: urlResult.isWhatsApp ? 'whatsapp' : 'url',
      title: urlResult.isWhatsApp ? 'Chat de WhatsApp' : 'Enlace web',
      subtitle: urlResult.url,
      raw: trimmed,
      fields: [{ label: 'URL', value: urlResult.url }],
      actionLabel: urlResult.isWhatsApp ? 'Abrir WhatsApp' : 'Abrir enlace',
      actionKind: urlResult.isWhatsApp ? 'whatsapp' : 'url',
      metadata: { url: urlResult.url },
    };
  }

  if (/^mailto:/i.test(trimmed)) {
    const address = trimmed.slice(7).split('?')[0];
    return {
      category: 'email',
      title: 'Correo electrónico',
      subtitle: address,
      raw: trimmed,
      fields: [{ label: 'Correo', value: address }],
      actionLabel: 'Enviar correo',
      actionKind: 'email',
      metadata: { email: address },
    };
  }

  if (/^tel:/i.test(trimmed)) {
    const phone = trimmed.slice(4);
    return {
      category: 'phone',
      title: 'Número de teléfono',
      subtitle: phone,
      raw: trimmed,
      fields: [{ label: 'Teléfono', value: phone }],
      actionLabel: 'Llamar',
      actionKind: 'phone',
      metadata: { phone },
    };
  }

  if (/^smsto:/i.test(trimmed) || /^sms:/i.test(trimmed)) {
    const body = trimmed.replace(/^smsto:/i, '').replace(/^sms:/i, '');
    const [phone, message] = body.split(/[?&]body=/);
    return {
      category: 'sms',
      title: 'Mensaje SMS',
      subtitle: phone,
      raw: trimmed,
      fields: [
        { label: 'Teléfono', value: phone },
        ...(message ? [{ label: 'Mensaje', value: decodeURIComponent(message) }] : []),
      ],
      actionLabel: 'Enviar SMS',
      actionKind: 'sms',
      metadata: { phone, message: message ? decodeURIComponent(message) : '' },
    };
  }

  if (/^geo:/i.test(trimmed)) {
    const coordinates = trimmed.slice(4).split(',');
    return {
      category: 'geo',
      title: 'Ubicación',
      subtitle: coordinates.slice(0, 2).join(', '),
      raw: trimmed,
      fields: [{ label: 'Coordenadas', value: coordinates.slice(0, 2).join(', ') }],
      actionLabel: 'Ver en el mapa',
      actionKind: 'geo',
      metadata: { coordinates: coordinates.slice(0, 2).join(',') },
    };
  }

  const preview = trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;
  return {
    category: trimmed ? 'text' : 'other',
    title: trimmed ? 'Texto escaneado' : 'Código vacío',
    subtitle: preview || 'Sin contenido',
    raw: trimmed,
    fields: [{ label: 'Contenido', value: trimmed || '(vacío)' }],
    actionLabel: 'Copiar texto',
    actionKind: 'text',
    metadata: {},
  };
}

export function createHistoryTitle(parsed: ParsedCode, source: ScanSource) {
  return parsed.category === 'text' && parsed.raw.length > 64
    ? `${parsed.raw.slice(0, 64)}…`
    : parsed.title + (source === 'gallery' ? ' · Galería' : '');
}

export function categoryFromPayload(raw: string): ScanCategory {
  return parseScannedCode(raw).category;
}
