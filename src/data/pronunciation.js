// Sanskrit as it should be spoken by the Indic Parler-TTS recordings.
//
// `speech` keeps pronunciation-friendly romanisations because the browser and
// Kokoro voices read it. For the recorded track, scripts/export-speech.mjs
// replaces each romanisation below with its Indic-script form; the renderer
// routes these spans through Kannada script, which keeps the inherent vowel
// (Devanagari triggers Hindi-style schwa deletion). Values may be in any Indic
// script and are converted to Kannada on export.
export const SANSKRIT_SPEECH = {
  // Terms (Kannada script, as in the `en` transcript)
  mithyaa: 'ಮಿಥ್ಯಾ',
  mithyaatva: 'ಮಿಥ್ಯಾತ್ವ',
  drishyatva: 'ದೃಶ್ಯತ್ವ',
  'sadasad-vilakshanatva': 'ಸದಸದ್ವಿಲಕ್ಷಣತ್ವ',
  'trikaala-abaadhyatva': 'ತ್ರಿಕಾಲಾಬಾಧ್ಯತ್ವ',
  Brahman: 'ಬ್ರಹ್ಮನ್',
  'Chhaandogya Upanishad': 'ಛಾಂದೋಗ್ಯ ಉಪನಿಷತ್',
  'Katha Upanishad': 'ಕಠ ಉಪನಿಷತ್',
  'vyaavahaarika sattaa': 'ವ್ಯಾವಹಾರಿಕ ಸತ್ತಾ',
  'paaramaarthika sattaa': 'ಪಾರಮಾರ್ಥಿಕ ಸತ್ತಾ',
  'vritti-vyaapyatva': 'ವೃತ್ತಿವ್ಯಾಪ್ಯತ್ವ',
  'phala-vyaapyatva': 'ಫಲವ್ಯಾಪ್ಯತ್ವ',
  'asva-prakaashatva': 'ಅಸ್ವಪ್ರಕಾಶತ್ವ',
  vyaapti: 'ವ್ಯಾಪ್ತಿ',
  'avyabhichaari linga': 'ಅವ್ಯಭಿಚಾರಿ ಲಿಂಗ',

  // Scripture quotations (the `quote.sa` text, Devanagari)
  'Sad eva somya, idam agra aaseet, ekam eva adviteeyam': 'सदेव सोम्येदमग्र आसीदेकमेवाद्वितीयम्',
  'Vaachaarambhanam vikaaro naamadheyam, mrittiketyeva satyam': 'वाचारम्भणं विकारो नामधेयं मृत्तिकेत्येव सत्यम्',
  'Eko bahoonaam, yo vidadhaati kaamaan': 'एको बहूनां यो विदधाति कामान्',
};
