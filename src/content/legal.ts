export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

const CONTACT = 'e.ine.nicolas.sanchez@cali.edu.co';

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Política de Privacidad',
  updatedAt: '25 de octubre de 2026',
  intro:
    'QRCraft es una aplicación de escaneo y creación de códigos QR. Esta política explica qué información maneja la app, cómo se usa y qué control tienes sobre ella. Al usar QRCraft aceptas las prácticas descritas aquí.',
  sections: [
    {
      title: '1. Datos que procesa QRCraft',
      paragraphs: [
        'QRCraft funciona sin cuentas, sin registro y sin un servidor propio. Los códigos que escaneas o creas, el historial y tus preferencias se guardan únicamente en el almacenamiento local de tu dispositivo.',
        'No enviamos tus códigos QR, tus contactos, tus contraseñas de Wi-Fi ni tu historial a servidores de QRCraft.',
      ],
    },
    {
      title: '2. Cámara y fotografías',
      bullets: [
        'La cámara se usa exclusivamente para detectar códigos QR en tiempo real. Las imágenes no se almacenan ni se transmiten.',
        'Si eliges importar una imagen, accedes al selector del sistema. La imagen solo se procesa en el dispositivo para buscar un código QR.',
        'Cuando guardas un QR, la app solicita permiso de escritura en tu galería. Solo se guardan las imágenes que tú autorizas.',
      ],
    },
    {
      title: '3. Historial y ajustes',
      paragraphs: [
        'El historial de escaneos y creaciones se almacena localmente con AsyncStorage. Puedes eliminar elementos deslizándolos o borrar todo el historial desde la pestaña Historial.',
        'Si desinstalas la aplicación, el historial y los ajustes locales se eliminan con ella.',
      ],
    },
    {
      title: '4. Publicidad y Google AdMob',
      paragraphs: [
        'La versión gratuita muestra anuncios mediante Google AdMob. AdMob puede recoger identificadores del dispositivo, datos aproximados de ubicación y datos de uso para mostrar y medir anuncios, de acuerdo con sus propias políticas.',
        'QRCraft solicita anuncios no personalizados por defecto. Puedes eliminar los anuncios adquiriendo QRCraft Pro.',
        'Consulta la política de privacidad de Google en policies.google.com/privacy para obtener más información sobre AdMob.',
      ],
    },
    {
      title: '5. Permisos del dispositivo',
      bullets: [
        'Cámara: escanear códigos QR.',
        'Fotos/Galería: importar códigos y guardar los QR creados.',
        'Vibración: brindar confirmación táctil opcional al escanear.',
        'Red: cargar anuncios y abrir enlaces que tú elijas. QRCraft no transmite tus códigos.',
      ],
    },
    {
      title: '6. Menores de edad',
      paragraphs: [
        'QRCraft no está dirigida a menores de 13 años. No recopilamos conscientemente datos personales de menores. Si crees que un menor ha proporcionado información, contáctanos para eliminarla.',
      ],
    },
    {
      title: '7. Seguridad',
      paragraphs: [
        'Aplicamos prácticas razonables para proteger la información local. Sin embargo, ningún almacenamiento es completamente seguro. Te recomendamos revisar siempre los enlaces antes de abrirlos y evitar escanear códigos de fuentes no confiables.',
      ],
    },
    {
      title: '8. Tus derechos y cambios',
      paragraphs: [
        'Puedes eliminar tus datos locales borrando el historial o desinstalando la app. Si resides en una región con derechos de protección de datos, puedes contactarnos para ejercer tus derechos.',
        `Para consultas de privacidad escríbenos a ${CONTACT}. Podemos actualizar esta política; la fecha de actualización aparecerá al inicio del documento.`,
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Términos de Uso',
  updatedAt: '25 de octubre de 2026',
  intro:
    'Estos términos regulan el uso de QRCraft. Al descargar o utilizar la aplicación aceptas estas condiciones. Si no estás de acuerdo, no uses la app.',
  sections: [
    {
      title: '1. Licencia de uso',
      paragraphs: [
        'Te otorgamos una licencia personal, no exclusiva, revocable y no transferible para usar QRCraft en dispositivos que controles, conforme a estos términos y a las políticas de las tiendas de aplicaciones.',
      ],
    },
    {
      title: '2. Uso permitido',
      bullets: [
        'No uses QRCraft para crear o distribuir códigos maliciosos, fraudulentos, ilegales o engañosos.',
        'No intentes extraer, modificar o interferir con el funcionamiento de la app.',
        'Eres responsable del contenido que codificas, escaneas, guardas o compartes.',
      ],
    },
    {
      title: '3. Escaneo y seguridad',
      paragraphs: [
        'Los códigos QR pueden dirigir a sitios web o redes desconocidas. QRCraft muestra el contenido antes de abrir enlaces, pero no puede garantizar la seguridad de destinos externos. Abre enlaces y conecta redes bajo tu propio criterio.',
        'La conexión automática a redes Wi-Fi depende de las restricciones de Android e iOS. En versiones modernas del sistema, el usuario debe confirmar la conexión en los ajustes del dispositivo.',
      ],
    },
    {
      title: '4. Anuncios y versión Pro',
      paragraphs: [
        'La versión gratuita incluye anuncios de Google AdMob. QRCraft Pro y sus beneficios previstos todavía no están disponibles para compra en esta versión. No se procesan pagos ni se concede acceso Pro.',
        'Cuando se habiliten compras, se procesarán a través de la tienda correspondiente y estarán sujetas a sus políticas, condiciones y reembolsos.',
      ],
    },
    {
      title: '5. Propiedad intelectual',
      paragraphs: [
        'El nombre QRCraft, su logotipo, el diseño de la interfaz y el código de la aplicación son propiedad de sus autores. El contenido que tú creas con la app sigue siendo tuyo.',
      ],
    },
    {
      title: '6. Limitación de responsabilidad',
      paragraphs: [
        'QRCraft se proporciona "tal cual", sin garantías de disponibilidad ininterrumpida ni de ausencia de errores. En la medida permitida por la ley, no seremos responsables de daños indirectos, pérdida de datos o perjuicios derivados del uso de la app o de enlaces externos.',
      ],
    },
    {
      title: '7. Cambios y contacto',
      paragraphs: [
        'Podemos actualizar estos términos para reflejar cambios en la app o en la ley. El uso continuado después de una actualización implica su aceptación.',
        `Para preguntas sobre estos términos escríbenos a ${CONTACT}.`,
      ],
    },
  ],
};
