import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Layout';
import { ScreenHeader } from '../components/ScreenHeader';
import { PRIVACY_POLICY, TERMS_OF_USE } from '../content/legal';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

export function LegalScreen({ navigation, route }: Props) {
  const document =
    route.params.type === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={document.title}
        subtitle={`Actualizado el ${document.updatedAt}`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.introCard}>
          <Text style={styles.intro}>{document.intro}</Text>
        </Card>

        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets ? (
              <View style={styles.bullets}>
                {section.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <Text style={styles.footer}>
          Si tienes dudas sobre este documento, escríbenos a
          e.ine.nicolas.sanchez@cali.edu.co. Este texto es informativo y debe
          revisarse con asesoría legal antes de publicar la app en una tienda.
        </Text>
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
    gap: spacing.xl,
  },
  introCard: {
    backgroundColor: colors.surfaceSoft,
  },
  intro: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  section: {
    gap: 9,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
  },
  paragraph: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textMuted,
  },
  bullets: {
    gap: 7,
    paddingLeft: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textMuted,
  },
  footer: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
    borderRadius: radius.sm,
  },
});
