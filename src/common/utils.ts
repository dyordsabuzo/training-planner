import {
  doc,
  addDoc,
  getDocs,
  setDoc,
  query,
  where,
  documentId,
} from "firebase/firestore";
import {
  database,
  getCollection,
  getDocumentReference,
} from "../common/firebase";

export enum SourceDbReferences {
  EXERCISES = "exercises",
  SUPERSETS = "supersets",
  SESSIONS = "sessions",
  PLANS = "plans",
  USERDATA = "userdata",
}

export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",") : [];

// Full name only when both parts are set — otherwise falls back to the
// portion of the email before "@", since a partial name ("Sam" with no
// last name) is treated the same as no name at all.
export const getDisplayName = (
  firstName?: string,
  lastName?: string,
  email?: string
): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  // `?? "User"` alone doesn't catch this: an empty-string email produces an
  // empty-string prefix (`"".split("@")[0] === ""`), which is falsy but not
  // null/undefined, so the `??` fallback never fires.
  return email?.split("@")[0] || "User";
};

export const isMobileViewport = (): boolean =>
  window.matchMedia("(max-width: 767px)").matches;

// Class toggled on <html> that applies the CSS rotation fallback in
// index.css — needed because Safari/iOS never implements the Screen
// Orientation Lock API below, so it's the only way to keep the page
// visually portrait there.
const PORTRAIT_LOCK_FALLBACK_CLASS = "portrait-lock-fallback";

// Screen Orientation API isn't in the TS DOM lib (hence the `as any` casts)
// and isn't supported everywhere (e.g. Safari/iOS) or without fullscreen on
// some browsers, so failures here are expected and intentionally silent.
export const lockPortraitOrientation = () => {
  const orientation = (screen as any).orientation;
  orientation?.lock?.("portrait")?.catch?.(() => {});
  document.documentElement.classList.add(PORTRAIT_LOCK_FALLBACK_CLASS);
};

export const unlockPortraitOrientation = () => {
  try {
    (screen as any).orientation?.unlock?.();
  } catch {}
  document.documentElement.classList.remove(PORTRAIT_LOCK_FALLBACK_CLASS);
};

// Short beep via Web Audio API rather than a bundled audio asset. Silently
// no-ops if AudioContext is unavailable or blocked (e.g. no user gesture yet).
export const playCountdownWarningSound = () => {
  try {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.2;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.onended = () => audioContext.close();

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {}
};

// Voice announcement via the Web Speech API rather than a bundled audio
// asset. Silently no-ops if speechSynthesis is unavailable.
// Held outside the function scope because Chrome can otherwise garbage
// collect the utterance mid-speech (nothing else references it), silently
// cutting off the speech and never firing onend/onerror.
let activeUtterance: SpeechSynthesisUtterance | null = null;

export const speak = (text: string, onEnd?: () => void) => {
  try {
    if (!("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    const handleDone = () => {
      activeUtterance = null;
      onEnd?.();
    };
    utterance.onend = handleDone;
    utterance.onerror = handleDone;

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
};

// Forces mobile browsers to snap back to scale 1 (e.g. after an accidental
// pinch-zoom), by briefly overriding the viewport meta's max-scale and then
// restoring it so manual zoom stays available afterwards.
export const resetPageZoom = () => {
  try {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      return;
    }

    const originalContent = viewportMeta.getAttribute("content") || "";
    viewportMeta.setAttribute(
      "content",
      `${originalContent}, maximum-scale=1.0, user-scalable=no`
    );
    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      viewportMeta.setAttribute("content", originalContent);
    });
  } catch {}
};

// Synthesized crowd-applause via the Web Audio API rather than a bundled
// audio asset — an approximation, not a recorded clip. Built from many
// short, randomly-timed noise "claps" (dense swell, then a random tail-off)
// instead of one continuous filtered noise burst, which just sounds like a
// whoosh/pouring water rather than clapping.
export const playApplauseSound = () => {
  try {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    // One shared noise buffer, reused (with per-clap filter/pitch/gain
    // variation) for every clap, instead of generating fresh random
    // samples per clap.
    const noiseBufferDuration = 0.08;
    const noiseBufferSize = Math.floor(
      audioContext.sampleRate * noiseBufferDuration
    );
    const noiseBuffer = audioContext.createBuffer(
      1,
      noiseBufferSize,
      audioContext.sampleRate
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioContext.destination);

    const playClap = (time: number, gainValue: number) => {
      const clapDuration = 0.02 + Math.random() * 0.03;

      const noise = audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.playbackRate.value = 0.8 + Math.random() * 0.6;

      const bandpass = audioContext.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.value = 1200 + Math.random() * 3000;
      bandpass.Q.value = 0.7;

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gainValue, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, time + clapDuration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(masterGain);

      noise.start(time);
      noise.stop(time + clapDuration);
    };

    const duration = 2.8;
    const startTime = audioContext.currentTime;
    let t = 0;

    while (t < duration) {
      const progress = t / duration;
      const density =
        progress < 0.15
          ? progress / 0.15
          : Math.max(0.08, 1 - (progress - 0.15) / 0.85);
      const gap = (0.015 + Math.random() * 0.05) / density;

      playClap(startTime + t, 0.25 + Math.random() * 0.35);
      t += gap;
    }

    setTimeout(() => audioContext.close(), (duration + 0.5) * 1000);
  } catch {}
};

export const sortObject = (data: any) => {
  return Object.keys(data)
    .sort((a, b) => {
      const [textA, numA] = a.split(" ");
      const [textB, numB] = b.split(" ");

      // Compare the text part first (alphabetical order)
      if (textA !== textB) {
        return textA.localeCompare(textB);
      }

      // Compare the numeric part (numerical order)
      return Number(numA) - Number(numB);
    })
    .reduce((accumulator: any, key: string) => {
      accumulator[key] = data[key];
      return accumulator;
    }, {});
};

export const saveToDB = async (sourceDb: SourceDbReferences, data: any) => {
  const collection = getCollection(sourceDb);

  if (!(data.id ?? "")) {
    try {
      const doc = await addDoc(collection, data);
      return {
        ...data,
        id: doc.id,
      };
    } catch (error) {
      console.error(`Unable to save to db: ${sourceDb}`, error);
    }
  } else {
    try {
      const { id, ...plaindata } = data;
      const docRef = doc(database, sourceDb, id);
      await setDoc(docRef, plaindata, { merge: true });
      return data;
    } catch (error) {
      console.error(`Unable to update db: ${sourceDb}`, error);
    }
  }
  return null;
};

export const getFromDB = async (
  sourceDb: SourceDbReferences,
  idFilters?: string[]
): Promise<any> => {
  try {
    // `idFilters` omitted (undefined) means "no filter, return everything".
    // An explicit array (including an empty one) is a strict allow-list —
    // empty must mean zero results, not "same as no filter".
    if (idFilters && idFilters.length === 0) {
      return {};
    }

    const collection = getCollection(sourceDb);
    // A broad, unconstrained getDocs(collection) can't be granted by a
    // security rule that depends on which specific document is being read
    // (e.g. "is this plan ID in my grants?") — Firestore can't prove that
    // holds for every possible result and denies the whole query for
    // anyone the rule isn't unconditionally true for (i.e. non-admins).
    // Scoping the query itself to the exact granted IDs lets Firestore
    // verify the rule per requested ID instead.
    const snapshot = idFilters
      ? await getDocs(query(collection, where(documentId(), "in", idFilters)))
      : await getDocs(collection);

    let data = {};
    snapshot.docs.forEach((doc) => {
      const docData = doc.data();

      if (docData.name) {
        data = {
          ...data,
          [docData.name]: { ...docData, id: doc.id },
        };
      } else {
        data = {
          ...data,
          [doc.id]: { ...docData, id: doc.id },
        };
      }
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};
