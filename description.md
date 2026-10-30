# How the debate's voice is made

The debate is spoken in English, but its Sanskrit, from technical terms like *mithyātva* and *dṛśyatva* to the scripture quotes, is pronounced as Sanskrit.

- **Indic Parler-TTS (AI4Bharat)** speaks every line. One model handles both Indian English and Sanskrit, so each debater keeps a single voice across languages: Dinesh for the Advaitin and Chetan for the Dvaitin, chosen by listening to all the candidate voices. A short text description sets each speaker's delivery (calm, firm or formal).
- **Vāgdhenu's techniques** (Prathosh A P, IISc) shape how the Sanskrit is fed to the model. Following its paper, Sanskrit is written in Kannada script rather than Devanagari, so the model keeps the inherent vowel instead of dropping it the Hindi way (*mithyātva*, not *mithyātv*). Its pronunciation rules are applied too: anusvāra becomes the matching nasal (*liṃga* → *liṅga*), and a final visarga is echoed (*hetuḥ* → *hetuhu*).
- **IndicConformer (AI4Bharat)** checks the result. This speech-recognition model transcribes each rendered scripture quote, and the best of three takes is kept. Every other line is re-rendered if its length suggests skipped or repeated words.
- **The pipeline:** `src/data/pronunciation.js` maps each romanized Sanskrit word in the script to its Kannada-script form. The audio is rendered once in Colab (`notebooks/voice_bakeoff.ipynb`) and stored as one MP3 per sentence, which the site plays back in sync with the transcript.
