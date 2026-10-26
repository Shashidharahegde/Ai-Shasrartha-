// Runs Kokoro-82M (an open-weight neural TTS model) off the main thread.
// The model is fetched once from the Hugging Face Hub and then served from the
// browser cache.
import { KokoroTTS } from 'kokoro-js';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
let tts = null;

async function hasWebGPU() {
  try {
    return Boolean(await navigator.gpu?.requestAdapter());
  } catch {
    return false;
  }
}

async function load(preference) {
  const files = {};
  const progress_callback = (p) => {
    if (p.status !== 'progress' || !p.total || p.total < 1e6) return;
    files[p.file] = { loaded: p.loaded, total: p.total };
    const all = Object.values(files);
    const loaded = all.reduce((n, f) => n + f.loaded, 0);
    const total = all.reduce((n, f) => n + f.total, 0);
    self.postMessage({ type: 'progress', loaded, total });
  };
  const gpu = preference === 'webgpu' && (await hasWebGPU());
  if (gpu) {
    try {
      tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'fp32', device: 'webgpu', progress_callback });
      return 'webgpu';
    } catch (e) {
      console.warn('Kokoro on WebGPU failed, falling back to WASM:', e);
    }
  }
  tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'wasm', progress_callback });
  return 'wasm';
}

self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    try {
      const device = await load(data.device);
      self.postMessage({ type: 'ready', device });
    } catch (e) {
      self.postMessage({ type: 'load-error', message: String(e?.message || e) });
    }
  } else if (data.type === 'generate') {
    try {
      const out = await tts.generate(data.text, { voice: data.voice, speed: data.speed });
      const audio = out.audio;
      self.postMessage({ type: 'audio', id: data.id, audio, rate: out.sampling_rate }, [audio.buffer]);
    } catch (e) {
      self.postMessage({ type: 'audio-error', id: data.id, message: String(e?.message || e) });
    }
  }
};
