// Source registry. Every turn cites one or more of these ids.
// `kind` says how the dialogue uses the work:
//   quotation  – the turn quotes the text verbatim
//   paraphrase – the turn reconstructs an argument found in the work, in new words
// Locators are deliberately kept at the level we can stand behind; finer
// section numbers are not given where they have not been checked against an edition.

export const PROVENANCE = {
  quotation: {
    label: 'Direct scriptural quotation',
    short: 'Śruti quoted',
    description: 'The words inside the quotation block are the actual Upaniṣadic text. The surrounding sentences are composed.',
  },
  paraphrase: {
    label: 'Paraphrase of a historical argument',
    short: 'Historical paraphrase',
    description: 'The reasoning follows a line of argument debated in Nyāyāmṛta and Advaitasiddhi, but the wording is new. It is not a quotation.',
  },
  composed: {
    label: 'Newly composed dialogue',
    short: 'Composed',
    description: 'Written for this prototype to frame the assembly. It does not reproduce any historical text.',
  },
  unverified: {
    label: 'Unverified claim',
    short: 'Unverified',
    description: 'Presented as reflecting the historical discussion, but the exact passage has not been checked against a critical edition.',
  },
};

export const SOURCES = {
  nyayamrta: {
    title: 'Nyāyāmṛta',
    author: 'Vyāsatīrtha (Dvaita, c. 1460–1539)',
    locator: 'First pariccheda · critique of the definitions of mithyātva and of the reason dṛśyatva',
    kind: 'paraphrase',
    note: 'Arguments are reconstructed in new words, not quoted',
    url: 'https://www.ebharatisampat.in/read_chapter.php?bookid=NjMxOTk1NjkzNjM0Njky',
    site: 'ebharatisampat.in',
  },
  advaitasiddhi: {
    title: 'Advaitasiddhi',
    author: 'Madhusūdana Sarasvatī (Advaita, 16th century)',
    locator: 'First pariccheda · defence of the mithyātva definitions and of the dṛśyatva reason',
    kind: 'paraphrase',
    note: 'Arguments are reconstructed in new words, not quoted',
    url: 'https://www.advaitasharada.sringeri.net/read/advaitasiddhi/1/',
    site: 'advaitasharada.sringeri.net',
  },
  chandogya621: {
    title: 'Chāndogya Upaniṣad',
    author: 'Śruti',
    locator: '6.2.1 · sad eva somyedam agra āsīd ekam evādvitīyam',
    kind: 'quotation',
    note: 'Exact Sanskrit quotation; English rendering is ours',
    url: 'https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/1_veda/4_upa/chup___u.htm',
    site: 'GRETIL',
  },
  chandogya614: {
    title: 'Chāndogya Upaniṣad',
    author: 'Śruti',
    locator: '6.1.4 · vācārambhaṇaṃ vikāro nāmadheyaṃ mṛttiketyeva satyam',
    kind: 'quotation',
    note: 'Exact Sanskrit excerpt from a longer verse',
    url: 'https://www.wisdomlib.org/hinduism/book/chandogya-upanishad-english/d/doc239255.html',
    site: 'wisdomlib.org',
  },
  katha2213: {
    title: 'Kaṭha Upaniṣad',
    author: 'Śruti',
    locator: '2.2.13 · eko bahūnāṃ yo vidadhāti kāmān',
    kind: 'quotation',
    note: 'Exact excerpt; its philosophical reading is contested between the schools',
    url: 'https://vedapath.app/en/upanishads/katha/2/2.2/2.2.13',
    site: 'vedapath.app',
  },
};
