// The argumentative skeleton of the episode: phases of the debate and the
// Tarkaśāstra function each turn performs.

export const PHASES = [
  { id: 'inference', label: 'Inference', kn: 'ಅನುಮಾನ', blurb: 'The Advaitin states the proposition and its reason in the five-membered form.' },
  { id: 'definition', label: 'Definition', kn: 'ಲಕ್ಷಣ', blurb: 'The Dvaitin demands a precise, non-contradictory definition of mithyātva.' },
  { id: 'scripture', label: 'Śruti', kn: 'ಶ್ರುತಿ', blurb: 'The Advaitin turns to the Chāndogya Upaniṣad and the clay analogy.' },
  { id: 'counterexample', label: 'Counterexample', kn: 'ಪ್ರತ್ಯುದಾಹರಣ', blurb: 'The Dvaitin argues that dependence does not entail unreality, and asks where the world is sublated.' },
  { id: 'response', label: 'Response', kn: 'ಸಮಾಧಾನ', blurb: 'The Advaitin distinguishes empirical reality from ultimate reality.' },
  { id: 'vyapti', label: 'Vyāpti', kn: 'ವ್ಯಾಪ್ತಿ', blurb: 'The Dvaitin asks what dṛśyatva means, and how its invariable concomitance with mithyātva is known.' },
  { id: 'closing', label: 'Closing', kn: 'ಉಪಸಂಹಾರ', blurb: 'No victor is declared. The question of vyāpti is carried to the next dialogue.' },
];

export const FUNCTIONS = {
  prastava: { kn: 'ಪ್ರಸ್ತಾವ', en: 'Opening' },
  pratijna: { kn: 'ಪ್ರತಿಜ್ಞಾ', en: 'Proposition' },
  hetu: { kn: 'ಹೇತು', en: 'Reason' },
  udaharana: { kn: 'ಉದಾಹರಣ', en: 'Example' },
  upanaya: { kn: 'ಉಪನಯ', en: 'Application' },
  nigamana: { kn: 'ನಿಗಮನ', en: 'Conclusion' },
  purvapaksha: { kn: 'ಪೂರ್ವಪಕ್ಷ', en: 'Opposing position' },
  samadhana: { kn: 'ಸಮಾಧಾನ', en: 'Response' },
  shruti: { kn: 'ಶ್ರುತಿ', en: 'Scriptural testimony' },
  vyapti: { kn: 'ವ್ಯಾಪ್ತಿ', en: 'Invariable concomitance' },
  upasamhara: { kn: 'ಉಪಸಂಹಾರ', en: 'Closing' },
};

export const SPEAKERS = {
  moderator: { name: 'The Moderator', kn: 'ಮಧ್ಯಸ್ಥ', school: 'Sabhā', tone: 'moderator' },
  advaita: { name: 'Advaita Scholar', kn: 'ಅದ್ವೈತೀ', school: 'Advaita Vedānta', tone: 'advaita' },
  dvaita: { name: 'Dvaita Scholar', kn: 'ದ್ವೈತೀ', school: 'Dvaita Vedānta', tone: 'dvaita' },
};
