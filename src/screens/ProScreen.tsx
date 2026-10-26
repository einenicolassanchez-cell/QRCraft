import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, TextLink } from '../components/Buttons';
import { Card } from '../components/Layout';
import { ScreenHeader } from '../components/ScreenHeader';
import { useToast } from '../components/ToastProvider';
import type { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/StoreProvider';
import { colors, gradients, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Pro'>;

const BENEFITS = [
  {
    icon: 'slash' as const,
    title: 'Cero anuncios',
    description: 'Disfruta de todas las pantallas sin banners ni interstitials.',
  },
  {
    icon: 'maximize' as const,
    title: 'PNG en 2048 px',
    description: 'Exporta en alta definición para imprimir o usar en gran formato.',
  },
  {
    icon: 'layers' as const,
    title: 'SVG vectorial',
    description: 'Escala tu QR sin perder nitidez en diseño e imprenta.',
  },
  {
    icon: 'heart' as const,
    title: 'Apoya a QRCraft',
    description: 'Nos ayudas a mantener la app, sin rastreo ni servidores propios.',
  },
];

export function ProScreen({ navigation }: Props) {
  const { settings, updateSettings } = useStore();
  const { showToast } = useToast();

  const activate = () => {
    Alert.alert(
      'Compra de demostración',
      'Esta compilación no procesa pagos reales. Al continuar, QRCraft Pro se activará localmente para que pruebes la experiencia sin anuncios y la exportación HD.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Activar Pro',
          onPress: () => {
            updateSettings({ pro: true });
            showToast('QRCraft Pro activado en este dispositivo');
          },
        },
      ],
    );
  };

  const restore = () => {
    if (settings.pro) {
      showToast('QRCraft Pro ya está activo', 'info');
      return;
    }
    Alert.alert(
      'Restaurar compra',
      'No encontramos compras asociadas en esta demostración. En una app publicada, aquí se consultaría la tienda de aplicaciones.',
      [{ text: 'Entendido' }],
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="QRCraft Pro"
        subtitle="Menos límites. Más calidad."
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[gradients.pro[0], gradients.pro[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} />
          <View style={styles.crown}>
            <Feather name="star" size={26} color={colors.backgroundDeep} />
          </View>
          <Text style={styles.heroEyebrow}>
            {settings.pro ? 'SUSCRIPCIÓN ACTIVA' : 'VERSIÓN PRO'}
          </Text>
          <Text style={styles.heroTitle}>
            {settings.pro ? 'Todo desbloqueado' : 'Tu QR, sin límites'}
          </Text>
          <Text style={styles.heroText}>
            {settings.pro
              ? 'Gracias por apoyar QRCraft. Los anuncios están desactivados y la exportación HD está incluida.'
              : 'Elimina los anuncios y exporta en calidad profesional. Una sola suscripción, todas las funciones.'}
          </Text>
          {!settings.pro ? (
            <View style={styles.priceRow}>
              <Text style={styles.price}>$1.99</Text>
              <Text style={styles.pricePeriod}>USD / mes</Text>
            </View>
          ) : (
            <View style={styles.activePill}>
              <Feather name="check-circle" size={14} color={colors.backgroundDeep} />
              <Text style={styles.activePillText}>Pro activo</Text>
            </View>
          )}
        </LinearGradient>

        <Card style={styles.benefitsCard}>
          {BENEFITS.map((benefit, index) => (
            <View key={benefit.title}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Feather
                    name={benefit.icon}
                    size={17}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {settings.pro ? (
          <>
            <Button
              label="Volver a QRCraft"
              icon="arrow-left"
              variant="success"
              size="lg"
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.smallPrint}>
              Pro está activo en este dispositivo. Si reinstalas la app en una
              versión de producción, podrás restaurar tu compra desde la tienda.
            </Text>
          </>
        ) : (
          <>
            <Button
              label="Activar Pro · $1.99/mes"
              icon="star"
              variant="success"
              size="lg"
              onPress={activate}
            />
            <Button
              label="Restaurar compra"
              icon="refresh-cw"
              variant="secondary"
              onPress={restore}
            />
            <TextLink
              label="Ver Política de Privacidad"
              onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
            />
            <Text style={styles.smallPrint}>
              Compra de demostración: no se realizará ningún cargo. En
              producción, la suscripción se gestiona con Google Play Billing /
              App Store y puedes cancelarla cuando quieras.
            </Text>
          </>
        )}

        <View style={styles.guarantee}>
          <Feather name="shield" size={15} color={colors.accent} />
          <Text style={styles.guaranteeText}>
            Sin rastreo propio. Tus códigos y tu historial permanecen en tu
            dispositivo.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: 8,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -80,
    right: -40,
  },
  crown: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: 'rgba(255,255,255,0.76)',
  },
  heroTitle: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.white,
  },
  heroText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.86)',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    marginTop: 2,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    color: colors.white,
  },
  pricePeriod: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.76)',
    marginBottom: 7,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.backgroundDeep,
  },
  benefitsCard: {
    gap: 0,
    paddingVertical: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 13,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  benefitDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSoft,
    marginLeft: 48,
  },
  smallPrint: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textMuted,
  },
});
