import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { AdBanner } from '../components/AdBanner';
import { Button, TextLink } from '../components/Buttons';
import { Field } from '../components/Field';
import { Card, Section, SegmentedControl } from '../components/Layout';
import { QRArt, type QRArtHandle } from '../components/QRArt';
import { ScreenHeader } from '../components/ScreenHeader';
import { useToast } from '../components/ToastProvider';
import { useAds } from '../ads/AdsProvider';
import type { AppTabNavigation } from '../navigation/types';
import { sharePng, shareSvg, savePngToGallery, qrFilename } from '../services/qrExport';
import { useStore } from '../store/StoreProvider';
import {
  colors,
  gradients,
  QR_BACKGROUNDS,
  QR_COLORS,
  radius,
  spacing,
} from '../theme';
import type { CreateValues, ModuleShape, QRCategory } from '../types';
import {
  buildQrPayload,
  CATEGORY_META,
  EMPTY_VALUES,
} from '../utils/qr';
import { buildQrSvg } from '../utils/qrSvg';

type ExportAction = 'save' | 'share' | 'hd' | 'svg' | null;

const SHAPES: Array<{
  value: ModuleShape;
  label: string;
  icon: string;
}> = [
  { value: 'square', label: 'Cuadrados', icon: 'grid' },
  { value: 'rounded', label: 'Suaves', icon: 'square' },
  { value: 'dots', label: 'Puntos', icon: 'circle' },
];

function luminance(hex: string) {
  const value = hex.replace('#', '');
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const rgb = [0, 2, 4].map((index) =>
    parseInt(normalized.slice(index, index + 2), 16) / 255,
  );
  const converted = rgb.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * converted[0] + 0.7152 * converted[1] + 0.0722 * converted[2];
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

export function CreateScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<AppTabNavigation>();
  const { addEntry, registerExport, settings, updateSettings } = useStore();
  const { showToast } = useToast();
  const { showInterstitial, showRewarded } = useAds();
  const [category, setCategory] = useState<QRCategory>('url');
  const [values, setValues] = useState<CreateValues>(EMPTY_VALUES);
  const [color, setColor] = useState<string>(QR_COLORS[1]);
  const [backgroundColor, setBackgroundColor] = useState<string>(
    QR_BACKGROUNDS[0],
  );
  const [shape, setShape] = useState<ModuleShape>('square');
  const [attempted, setAttempted] = useState(false);
  const [action, setAction] = useState<ExportAction>(null);
  const [hdUnlocked, setHdUnlocked] = useState(settings.pro);
  const [unlocking, setUnlocking] = useState(false);
  const qrRef = useRef<QRArtHandle>(null);

  useEffect(() => {
    if (settings.pro) setHdUnlocked(true);
  }, [settings.pro]);

  const result = useMemo(
    () => buildQrPayload(category, values),
    [category, values],
  );
  const isValid = Boolean(result.payload) && !result.error;
  const meta = CATEGORY_META[category];
  const qrSize = Math.min(width - 156, 248);
  const ratio = contrastRatio(color, backgroundColor);
  const lowContrast = ratio < 3;

  const updateValue = <K extends keyof CreateValues>(
    key: K,
    value: CreateValues[K],
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const recordCreated = () => {
    addEntry({
      kind: 'created',
      category,
      title: result.title,
      raw: result.payload,
      color,
      backgroundColor,
      moduleShape: shape,
    });
  };

  const requireValid = () => {
    setAttempted(true);
    if (!isValid) {
      showToast(result.error ?? 'Completa los datos para crear tu QR.', 'error');
      return false;
    }
    return true;
  };

  const afterExport = (countsForInterstitial: boolean) => {
    const count = registerExport();
    if (
      countsForInterstitial &&
      !settings.pro &&
      count > 0 &&
      count % 3 === 0
    ) {
      setTimeout(() => {
        void showInterstitial();
      }, 700);
    }
  };

  const getBase64 = async (size: number) => {
    if (!qrRef.current) throw new Error('La vista previa aún no está lista.');
    return qrRef.current.toBase64({ width: size, height: size });
  };

  const handleSave = async () => {
    if (!requireValid() || action) return;
    setAction('save');
    try {
      const base64 = await getBase64(768);
      await savePngToGallery(base64, qrFilename('png'));
      recordCreated();
      afterExport(true);
      showToast('QR guardado en tu galería');
    } catch (error) {
      Alert.alert(
        'No se pudo guardar',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar la imagen.',
      );
    } finally {
      setAction(null);
    }
  };

  const handleShare = async () => {
    if (!requireValid() || action) return;
    setAction('share');
    try {
      const base64 = await getBase64(1024);
      await sharePng(base64, qrFilename('png'));
      recordCreated();
      showToast('QR listo para compartir');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo compartir el QR.';
      if (!message.toLowerCase().includes('cancel')) {
        showToast(message, 'error');
      }
    } finally {
      setAction(null);
    }
  };

  const handleHd = async () => {
    if (!requireValid() || action) return;
    if (!hdUnlocked && !settings.pro) {
      showToast('Desbloquea la exportación HD primero.', 'info');
      return;
    }
    setAction('hd');
    try {
      const base64 = await getBase64(2048);
      await savePngToGallery(base64, qrFilename('png'));
      recordCreated();
      afterExport(true);
      showToast('QR en HD (2048 px) guardado en tu galería');
    } catch (error) {
      Alert.alert(
        'No se pudo exportar en HD',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setAction(null);
    }
  };

  const handleSvg = async () => {
    if (!requireValid() || action) return;
    if (!hdUnlocked && !settings.pro) {
      showToast('Desbloquea la exportación HD primero.', 'info');
      return;
    }
    setAction('svg');
    try {
      const svg = buildQrSvg({
        value: result.payload,
        color,
        backgroundColor,
        shape,
        size: 1600,
      });
      if (!svg) throw new Error('No se pudo generar el SVG.');
      await shareSvg(svg, qrFilename('svg'));
      recordCreated();
      afterExport(false);
      showToast('SVG vectorial listo para compartir');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo exportar el SVG.';
      if (!message.toLowerCase().includes('cancel')) {
        showToast(message, 'error');
      }
    } finally {
      setAction(null);
    }
  };

  const unlockHd = async () => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const rewarded = await showRewarded();
      if (rewarded) {
        setHdUnlocked(true);
        showToast('Exportación HD y SVG desbloqueadas');
      } else {
        showToast('No completaste el anuncio. Inténtalo de nuevo.', 'info');
      }
    } catch {
      showToast('No se pudo cargar el anuncio. Inténtalo más tarde.', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  const goPro = () => navigation.navigate('Pro');

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Crear QR"
        subtitle="Diseña, personaliza y comparte en segundos"
        onSettings={() => navigation.navigate('Settings')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Section
          title="Elige un tipo"
          caption="Cinco formatos listos para lo que necesitas"
        >
          <View style={styles.categoryGrid}>
            {(Object.keys(CATEGORY_META) as QRCategory[]).map(
              (item, index) => {
                const itemMeta = CATEGORY_META[item];
                const selected = category === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setCategory(item);
                      setAttempted(false);
                    }}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      {
                        width: index === 4 ? '100%' : '48%',
                        borderColor: selected
                          ? itemMeta.color
                          : colors.borderSoft,
                        backgroundColor: selected
                          ? `${itemMeta.color}14`
                          : colors.surface,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: `${itemMeta.color}20` },
                      ]}
                    >
                      <Feather
                        name={
                          itemMeta.icon as React.ComponentProps<
                            typeof Feather
                          >['name']
                        }
                        size={19}
                        color={itemMeta.color}
                      />
                    </View>
                    <Text style={styles.categoryLabel}>{itemMeta.label}</Text>
                    <Text style={styles.categoryDescription}>
                      {itemMeta.description}
                    </Text>
                    {selected ? (
                      <View
                        style={[
                          styles.selectedCheck,
                          { backgroundColor: itemMeta.color },
                        ]}
                      >
                        <Feather
                          name="check"
                          size={10}
                          color={colors.backgroundDeep}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              },
            )}
          </View>
        </Section>

        <Section
          title={meta.label}
          caption="Completa los datos y mira la vista previa en tiempo real"
        >
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <View
                style={[
                  styles.formIcon,
                  { backgroundColor: `${meta.color}1F` },
                ]}
              >
                <Feather
                  name={
                    meta.icon as React.ComponentProps<typeof Feather>['name']
                  }
                  size={16}
                  color={meta.color}
                />
              </View>
              <Text style={styles.formTitle}>{meta.label}</Text>
            </View>

            {category === 'url' ? (
              <Field
                label="Enlace web"
                icon="link"
                placeholder="https://tu-sitio.com"
                value={values.url}
                onChangeText={(value) => updateValue('url', value)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                hint="Si no escribes https://, lo añadimos automáticamente."
              />
            ) : null}

            {category === 'wifi' ? (
              <View style={styles.fieldStack}>
                <Field
                  label="Nombre de la red (SSID)"
                  icon="wifi"
                  placeholder="Mi red Wi-Fi"
                  value={values.ssid}
                  onChangeText={(value) => updateValue('ssid', value)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Field
                  label="Contraseña"
                  icon="lock"
                  placeholder="Contraseña de la red"
                  value={values.password}
                  onChangeText={(value) => updateValue('password', value)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={values.encryption !== 'nopass'}
                  hint={
                    values.encryption === 'nopass'
                      ? 'Red abierta: no se necesita contraseña.'
                      : 'La contraseña quedará dentro del QR. Compártelo con cuidado.'
                  }
                />
                <View style={styles.subField}>
                  <Text style={styles.subLabel}>Seguridad</Text>
                  <SegmentedControl
                    options={[
                      { value: 'WPA', label: 'WPA/WPA2' },
                      { value: 'WEP', label: 'WEP' },
                      { value: 'nopass', label: 'Abierta' },
                    ]}
                    value={values.encryption}
                    onChange={(value) => updateValue('encryption', value)}
                  />
                </View>
                <View style={styles.switchRow}>
                  <View style={styles.switchText}>
                    <Text style={styles.switchLabel}>Red oculta</Text>
                    <Text style={styles.switchHint}>
                      Actívalo si la red no difunde su nombre.
                    </Text>
                  </View>
                  <Switch
                    value={values.hidden}
                    onValueChange={(value) => updateValue('hidden', value)}
                    trackColor={{
                      false: colors.border,
                      true: 'rgba(16,185,129,0.55)',
                    }}
                    thumbColor={
                      values.hidden ? colors.accent : colors.textMuted
                    }
                  />
                </View>
              </View>
            ) : null}

            {category === 'text' ? (
              <Field
                label="Texto o nota"
                icon="type"
                placeholder="Escribe el texto que quieres codificar…"
                value={values.text}
                onChangeText={(value) => updateValue('text', value)}
                multiline
                maxLength={1200}
                hint={`${values.text.length}/1200 caracteres`}
              />
            ) : null}

            {category === 'contact' ? (
              <View style={styles.fieldStack}>
                <View style={styles.twoColumns}>
                  <View style={styles.flex}>
                    <Field
                      label="Nombre"
                      icon="user"
                      placeholder="Ana"
                      value={values.firstName}
                      onChangeText={(value) => updateValue('firstName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.flex}>
                    <Field
                      label="Apellido"
                      placeholder="García"
                      value={values.lastName}
                      onChangeText={(value) => updateValue('lastName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <Field
                  label="Teléfono"
                  icon="phone"
                  placeholder="+57 300 123 4567"
                  value={values.phone}
                  onChangeText={(value) => updateValue('phone', value)}
                  keyboardType="phone-pad"
                />
                <Field
                  label="Correo electrónico"
                  icon="mail"
                  placeholder="ana@ejemplo.com"
                  value={values.email}
                  onChangeText={(value) => updateValue('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Field
                  label="Empresa (opcional)"
                  icon="briefcase"
                  placeholder="Estudio García"
                  value={values.organization}
                  onChangeText={(value) =>
                    updateValue('organization', value)
                  }
                  autoCapitalize="words"
                />
              </View>
            ) : null}

            {category === 'whatsapp' ? (
              <View style={styles.fieldStack}>
                <Field
                  label="Número de WhatsApp"
                  icon="phone"
                  prefix="+"
                  placeholder="57 300 123 4567"
                  value={values.whatsappPhone}
                  onChangeText={(value) =>
                    updateValue('whatsappPhone', value)
                  }
                  keyboardType="phone-pad"
                  hint="Incluye el código de país, sin el signo +."
                />
                <Field
                  label="Mensaje predeterminado (opcional)"
                  icon="message-circle"
                  placeholder="¡Hola! Vi tu QR y quiero más información."
                  value={values.whatsappMessage}
                  onChangeText={(value) =>
                    updateValue('whatsappMessage', value)
                  }
                  multiline
                  maxLength={500}
                />
              </View>
            ) : null}

            {attempted && result.error ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={15} color={colors.danger} />
                <Text style={styles.errorText}>{result.error}</Text>
              </View>
            ) : null}
          </Card>
        </Section>

        <Section
          title="Personaliza el diseño"
          caption="Colores y formas para que tu QR destaque"
        >
          <Card style={styles.designCard}>
            <View style={styles.designBlock}>
              <Text style={styles.subLabel}>Color de módulos</Text>
              <View style={styles.swatchRow}>
                {QR_COLORS.map((itemColor) => {
                  const selected = color === itemColor;
                  return (
                    <Pressable
                      key={itemColor}
                      accessibilityRole="button"
                      accessibilityLabel={`Color ${itemColor}`}
                      accessibilityState={{ selected }}
                      onPress={() => setColor(itemColor)}
                      style={({ pressed }) => [
                        styles.swatch,
                        {
                          backgroundColor: itemColor,
                          borderColor: selected
                            ? colors.primaryBright
                            : colors.border,
                          transform: [
                            { scale: selected ? 1.08 : pressed ? 0.92 : 1 },
                          ],
                        },
                      ]}
                    >
                      {selected ? (
                        <Feather
                          name="check"
                          size={14}
                          color={
                            luminance(itemColor) > 0.55
                              ? colors.backgroundDeep
                              : colors.white
                          }
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.designBlock}>
              <Text style={styles.subLabel}>Fondo</Text>
              <View style={styles.swatchRow}>
                {QR_BACKGROUNDS.map((itemColor) => {
                  const selected = backgroundColor === itemColor;
                  return (
                    <Pressable
                      key={itemColor}
                      accessibilityRole="button"
                      accessibilityLabel={`Fondo ${itemColor}`}
                      accessibilityState={{ selected }}
                      onPress={() => setBackgroundColor(itemColor)}
                      style={({ pressed }) => [
                        styles.swatch,
                        styles.backgroundSwatch,
                        {
                          backgroundColor: itemColor,
                          borderColor: selected
                            ? colors.primaryBright
                            : colors.border,
                          transform: [{ scale: selected ? 1.08 : pressed ? 0.92 : 1 }],
                        },
                      ]}
                    >
                      {selected ? (
                        <Feather
                          name="check"
                          size={12}
                          color={colors.backgroundDeep}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.designBlock}>
              <Text style={styles.subLabel}>Forma de los módulos</Text>
              <SegmentedControl
                options={SHAPES}
                value={shape}
                onChange={setShape}
              />
            </View>

            {lowContrast ? (
              <View style={styles.contrastWarning}>
                <Feather name="alert-triangle" size={14} color={colors.warning} />
                <Text style={styles.contrastText}>
                  Poco contraste. Algunos lectores podrían no reconocer el QR.
                </Text>
              </View>
            ) : null}
          </Card>
        </Section>

        <Section title="Vista previa" caption="Se actualiza mientras escribes">
          <View style={styles.previewCard}>
            <LinearGradient
              colors={['rgba(2,132,199,0.16)', 'rgba(16,185,129,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.previewTop}>
              <View style={styles.previewBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.previewBadgeText}>EN VIVO</Text>
              </View>
              <Text style={styles.previewType}>{meta.shortLabel}</Text>
            </View>

            <View style={styles.qrShell}>
              {isValid ? (
                <QRArt
                  ref={qrRef}
                  value={result.payload}
                  color={color}
                  backgroundColor={backgroundColor}
                  shape={shape}
                  size={qrSize}
                />
              ) : (
                <View
                  style={[
                    styles.emptyQr,
                    { width: qrSize, height: qrSize },
                  ]}
                >
                  <Feather name="grid" size={38} color={colors.textFaint} />
                  <Text style={styles.emptyQrTitle}>Tu QR aparecerá aquí</Text>
                  <Text style={styles.emptyQrText}>
                    Completa los datos de la sección anterior.
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.previewSummary} numberOfLines={2}>
              {isValid ? result.preview : 'Sin contenido todavía'}
            </Text>

            <View style={styles.previewActions}>
              <Button
                label="Guardar PNG"
                icon="download"
                onPress={() => {
                  void handleSave();
                }}
                loading={action === 'save'}
                disabled={action !== null}
                style={styles.flex}
              />
              <Button
                label="Compartir"
                icon="share-2"
                variant="secondary"
                onPress={() => {
                  void handleShare();
                }}
                loading={action === 'share'}
                disabled={action !== null}
                style={styles.flex}
              />
            </View>
            <Text style={styles.exportHint}>
              PNG de 768 px · guardado local, sin enviar datos a la nube
            </Text>
          </View>
        </Section>

        <Section
          title="Exportación profesional"
          caption="Para imprimir, web o gran formato"
        >
          <Card style={styles.hdCard}>
            <View style={styles.hdHeader}>
              <View style={styles.hdIcon}>
                <Feather name="award" size={20} color={colors.primaryBright} />
              </View>
              <View style={styles.hdHeaderText}>
                <Text style={styles.hdTitle}>
                  {settings.pro ? 'Incluido en Pro' : 'Calidad de imprenta'}
                </Text>
                <Text style={styles.hdDescription}>
                  PNG en 2048 px y SVG vectorial, sin pérdida de nitidez.
                </Text>
              </View>
              {settings.pro ? (
                <View style={styles.proBadge}>
                  <Feather name="star" size={10} color={colors.backgroundDeep} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              ) : null}
            </View>

            {hdUnlocked || settings.pro ? (
              <>
                <View style={styles.hdActions}>
                  <Button
                    label="PNG HD"
                    icon="maximize"
                    variant="secondary"
                    onPress={() => {
                      void handleHd();
                    }}
                    loading={action === 'hd'}
                    disabled={action !== null}
                    style={styles.flex}
                  />
                  <Button
                    label="SVG"
                    icon="share-2"
                    variant="secondary"
                    onPress={() => {
                      void handleSvg();
                    }}
                    loading={action === 'svg'}
                    disabled={action !== null}
                    style={styles.flex}
                  />
                </View>
                <Text style={styles.hdFootnote}>
                  {settings.pro
                    ? 'Tu plan Pro mantiene los anuncios y los límites fuera.'
                    : 'HD desbloqueado en esta sesión con un anuncio bonificado.'}
                </Text>
                {!settings.pro ? (
                  <TextLink
                    label="Hazte Pro y desbloquea todo para siempre"
                    onPress={goPro}
                  />
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.rewardRow}>
                  <Feather name="film" size={14} color={colors.accent} />
                  <Text style={styles.rewardText}>
                    Mira un video corto de 15 s y descarga gratis en HD.
                  </Text>
                </View>
                <Button
                  label="Ver video y desbloquear HD"
                  icon="play"
                  variant="success"
                  onPress={() => {
                    void unlockHd();
                  }}
                  loading={unlocking}
                  disabled={unlocking}
                />
                <TextLink
                  label="O elimina los anuncios con QRCraft Pro"
                  onPress={goPro}
                />
              </>
            )}
          </Card>
        </Section>

        <View style={styles.localNote}>
          <Feather name="shield" size={14} color={colors.accent} />
          <Text style={styles.localNoteText}>
            Tu contenido se procesa en el dispositivo. QRCraft no envía tus
            códigos a ningún servidor.
          </Text>
        </View>
      </ScrollView>

      <AdBanner onUpgrade={goPro} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 13,
    gap: 6,
    minHeight: 108,
  },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    paddingRight: 18,
  },
  categoryDescription: {
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.textMuted,
  },
  selectedCheck: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    gap: spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  formIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  fieldStack: {
    gap: 14,
  },
  subField: {
    gap: 8,
  },
  subLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  switchHint: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textFaint,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,68,68,0.35)',
    padding: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#FCA5A5',
  },
  designCard: {
    gap: spacing.lg,
  },
  designBlock: {
    gap: 9,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundSwatch: {
    borderWidth: 1.5,
  },
  contrastWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: radius.sm,
    padding: 9,
  },
  contrastText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: '#FCD34D',
  },
  previewCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  previewTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16,185,129,0.14)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  previewBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.accent,
  },
  previewType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  qrShell: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.1)',
  },
  emptyQr: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.backgroundDeep,
    padding: 18,
  },
  emptyQrTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyQrText: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textFaint,
    textAlign: 'center',
  },
  previewSummary: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 9,
    width: '100%',
    marginTop: 2,
  },
  exportHint: {
    fontSize: 9.5,
    color: colors.textFaint,
    textAlign: 'center',
  },
  hdCard: {
    gap: 14,
  },
  hdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  hdIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(56,189,248,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdHeaderText: {
    flex: 1,
    gap: 2,
  },
  hdTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
  },
  hdDescription: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  proBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: colors.backgroundDeep,
  },
  hdActions: {
    flexDirection: 'row',
    gap: 9,
  },
  hdFootnote: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textFaint,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.09)',
    borderRadius: radius.md,
    padding: 11,
  },
  rewardText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
  localNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  localNoteText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textFaint,
  },
});
