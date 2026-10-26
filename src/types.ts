export type QRCategory = 'url' | 'wifi' | 'text' | 'contact' | 'whatsapp';

export type ScanCategory =
  | QRCategory
  | 'email'
  | 'phone'
  | 'sms'
  | 'geo'
  | 'other';

export type HistoryKind = 'scanned' | 'created';

export type ModuleShape = 'square' | 'rounded' | 'dots';

export type ScanSource = 'camera' | 'gallery';

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  category: ScanCategory;
  title: string;
  raw: string;
  createdAt: string;
  source?: ScanSource;
  color?: string;
  backgroundColor?: string;
  moduleShape?: ModuleShape;
}

export interface ParsedCode {
  category: ScanCategory;
  title: string;
  subtitle: string;
  raw: string;
  fields: Array<{ label: string; value: string }>;
  actionLabel: string;
  actionKind:
    | 'url'
    | 'wifi'
    | 'contact'
    | 'email'
    | 'phone'
    | 'sms'
    | 'geo'
    | 'text'
    | 'whatsapp';
  metadata: Record<string, string>;
}

export interface AppSettings {
  sound: boolean;
  vibration: boolean;
  autoOpenUrls: boolean;
  pro: boolean;
  exportCount: number;
}

export interface CreateValues {
  url: string;
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
  text: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  whatsappPhone: string;
  whatsappMessage: string;
}

export interface BuildResult {
  payload: string;
  title: string;
  preview: string;
  error: string | null;
  fields: Array<{ label: string; value: string }>;
}

export type AdKind = 'banner' | 'interstitial' | 'rewarded';
