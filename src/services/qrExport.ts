import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

function cacheUri(filename: string) {
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) throw new Error('El almacenamiento temporal no está disponible.');
  return `${directory}${filename}`;
}

function cleanBase64(base64: string) {
  return base64.replace(/^data:image\/\w+;base64,/, '');
}

export async function savePngToGallery(base64: string, filename: string) {
  const permission = await requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) {
    throw new Error(
      'Necesitamos permiso para guardar imágenes en tu galería. Actívalo en los ajustes del sistema.',
    );
  }

  const uri = cacheUri(filename);
  await FileSystem.writeAsStringAsync(uri, cleanBase64(base64), {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Asset.create(uri);
  return uri;
}

export async function sharePng(base64: string, filename: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Compartir no está disponible en este dispositivo.');

  const uri = cacheUri(filename);
  await FileSystem.writeAsStringAsync(uri, cleanBase64(base64), {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Compartir código QR',
    UTI: 'public.png',
  });
  return uri;
}

export async function shareSvg(svg: string, filename: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Compartir no está disponible en este dispositivo.');

  const uri = cacheUri(filename);
  await FileSystem.writeAsStringAsync(uri, svg, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(uri, {
    mimeType: 'image/svg+xml',
    dialogTitle: 'Compartir QR vectorial',
    UTI: 'public.svg-image',
  });
  return uri;
}

export async function shareText(message: string, title = 'Compartir contenido') {
  await Share.share({ message, title });
}

export async function saveSvgToFile(svg: string, filename: string) {
  const uri = cacheUri(filename);
  await FileSystem.writeAsStringAsync(uri, svg, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

export function qrFilename(extension: 'png' | 'svg') {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  return `qrcraft-${Platform.OS}-${stamp}.${extension}`;
}
