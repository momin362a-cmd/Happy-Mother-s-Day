const pageData = {
  recipientName: "Mom",
  intro:
    "Everything gentle in me started with you. Thank you for your love, your patience, and all the quiet ways you make life feel safe and beautiful.",
  previewHeading: "If I could fold my love into a small card, it would look like this.",
  previewWish:
    "I hope today brings you peaceful moments, warm smiles, and the same kindness you always give to everyone around you.",
  previewSignoff: "With all my love, always.",
  mainMessage:
    "You have been my strength in difficult days and my comfort in soft ones. Thank you for loving me in countless small, beautiful ways that I can never fully repay.",
  signature: "Forever grateful, your child",
  wish:
    "May your heart feel light, your smile stay bright, and your life be filled with the same sweetness, peace, and love that you bring into mine every single day.",
  notes: [
    "Today I want you to feel celebrated, deeply loved, and surrounded by happiness.",
    "I will always carry your love, your lessons, and your care with me everywhere I go."
  ],
  highlights: ["Your hugs", "Your prayers", "Your smile"],
  reasons: [
    {
      title: "Your warm hugs",
      text: "You have a way of making every hard moment feel lighter just by being there."
    },
    {
      title: "Your patient heart",
      text: "You listen, guide, and care with a softness that I will always be thankful for."
    },
    {
      title: "Your quiet strength",
      text: "You carry so much with grace, and your courage teaches me more than words ever could."
    }
  ]
};

const hero = document.getElementById("hero");
const wishPanel = document.getElementById("wishPanel");
const openWish = document.getElementById("openWish");
const replayBtn = document.getElementById("replayBtn");
const heartBurstButton = document.getElementById("heartBurst");
const petalsContainer = document.querySelector(".petals-container");
const musicToggle = document.getElementById("musicToggle");
const musicToggleLabel = document.getElementById("musicToggleLabel");
const introOverlay = document.getElementById("introOverlay");
const countdownNumber = document.getElementById("countdownNumber");
const countdownPopup = document.getElementById("countdownPopup");
const introHint = document.getElementById("introHint");
const pageShell = document.getElementById("pageShell");

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

let audioContext;
let masterGain;
let effectsInput;
let musicLoopTimer = null;
let isMusicPlaying = false;
let lastHeartBurstAt = 0;
let introMusicRequested = false;
let introSequenceRunning = false;

const chordSections = [
  { time: 0.0, notes: [261.63, 329.63, 392.0], bass: 130.81 },
  { time: 2.1, notes: [293.66, 369.99, 440.0], bass: 146.83 },
  { time: 4.2, notes: [220.0, 261.63, 329.63], bass: 110.0 },
  { time: 6.3, notes: [196.0, 246.94, 392.0], bass: 98.0 }
];

const melody = [
  { note: 523.25, time: 0.18, length: 0.32, accent: 1.1 },
  { note: 587.33, time: 0.72, length: 0.28, accent: 0.98 },
  { note: 659.25, time: 1.2, length: 0.42, accent: 1.08 },
  { note: 587.33, time: 1.72, length: 0.28, accent: 0.96 },
  { note: 523.25, time: 2.32, length: 0.32, accent: 1.04 },
  { note: 493.88, time: 2.84, length: 0.28, accent: 0.92 },
  { note: 440.0, time: 3.36, length: 0.52, accent: 1.02 },
  { note: 493.88, time: 4.35, length: 0.28, accent: 0.96 },
  { note: 523.25, time: 4.88, length: 0.34, accent: 1.04 },
  { note: 587.33, time: 5.4, length: 0.42, accent: 1.08 },
  { note: 659.25, time: 5.94, length: 0.52, accent: 1.12 },
  { note: 698.46, time: 6.55, length: 0.3, accent: 0.98 },
  { note: 659.25, time: 6.98, length: 0.28, accent: 0.96 },
  { note: 587.33, time: 7.42, length: 0.62, accent: 1.1 }
];

const loopDurationSeconds = 8.5;

populatePage();
createPetals(16);
runIntroSequence();

openWish.addEventListener("click", async () => {
  await startMusic();
  revealWish();
});

replayBtn.addEventListener("click", () => {
  wishPanel.classList.remove("is-visible");
  wishPanel.classList.add("hidden");
  hero.classList.remove("hidden", "is-leaving");
  window.scrollTo({ top: 0, behavior: "smooth" });
  resetIntroOverlay();
  runIntroSequence();
});

heartBurstButton.addEventListener("click", () => {
  const buttonRect = heartBurstButton.getBoundingClientRect();
  burstHearts(buttonRect.left + buttonRect.width / 2, buttonRect.top + buttonRect.height / 2, 18);
});

musicToggle.addEventListener("click", async () => {
  if (isMusicPlaying) {
    stopMusic();
    return;
  }

  await startMusic();
});

introOverlay.addEventListener("pointerdown", async () => {
  if (introMusicRequested) {
    return;
  }

  introMusicRequested = true;
  await primeMusic();
  introHint.textContent = "Music is ready and will start with the surprise.";
  introHint.classList.add("is-ready");
});

document.addEventListener("pointerdown", (event) => {
  if (wishPanel.classList.contains("hidden")) {
    return;
  }

  const now = Date.now();

  if (now - lastHeartBurstAt < 180) {
    return;
  }

  lastHeartBurstAt = now;
  burstHearts(event.clientX, event.clientY, 7);
});

function populatePage() {
  document.title = `Happy Mother's Day | For ${pageData.recipientName}`;

  document.getElementById("introText").textContent = pageData.intro;
  document.getElementById("previewHeading").textContent = pageData.previewHeading;
  document.getElementById("previewWish").textContent = pageData.previewWish;
  document.getElementById("previewSignoff").textContent = pageData.previewSignoff;
  document.getElementById("recipientHeading").textContent = `To my dearest ${pageData.recipientName}`;
  document.getElementById("mainMessage").textContent = pageData.mainMessage;
  document.getElementById("signatureText").textContent = pageData.signature;
  document.getElementById("wishText").textContent = pageData.wish;
  document.getElementById("noteOneText").textContent = pageData.notes[0];
  document.getElementById("noteTwoText").textContent = pageData.notes[1];
  document.getElementById("highlightOne").textContent = pageData.highlights[0];
  document.getElementById("highlightTwo").textContent = pageData.highlights[1];
  document.getElementById("highlightThree").textContent = pageData.highlights[2];

  document.getElementById("reasonOneTitle").textContent = pageData.reasons[0].title;
  document.getElementById("reasonOneText").textContent = pageData.reasons[0].text;
  document.getElementById("reasonTwoTitle").textContent = pageData.reasons[1].title;
  document.getElementById("reasonTwoText").textContent = pageData.reasons[1].text;
  document.getElementById("reasonThreeTitle").textContent = pageData.reasons[2].title;
  document.getElementById("reasonThreeText").textContent = pageData.reasons[2].text;
}

async function runIntroSequence() {
  if (introSequenceRunning) {
    return;
  }

  introSequenceRunning = true;
  document.body.classList.add("intro-running");

  const steps = ["3", "2", "1"];

  for (const step of steps) {
    countdownNumber.textContent = step;
    countdownNumber.classList.remove("is-popping");
    void countdownNumber.offsetWidth;
    countdownNumber.classList.add("is-popping");
    await wait(850);
  }

  countdownNumber.classList.add("hidden");
  countdownPopup.classList.remove("hidden");

  requestAnimationFrame(() => {
    countdownPopup.classList.add("is-visible");
  });

  burstHearts(window.innerWidth / 2, Math.max(window.innerHeight / 2, 260), 18);

  if (introMusicRequested) {
    await startMusic();
  }

  await wait(1500);
  introOverlay.classList.add("is-fading");
  pageShell.classList.remove("is-pre-reveal");
  document.body.classList.remove("intro-running");

  await wait(620);
  introOverlay.classList.add("hidden");
  introSequenceRunning = false;
}

function resetIntroOverlay() {
  introOverlay.classList.remove("hidden", "is-fading");
  countdownPopup.classList.remove("is-visible");
  countdownPopup.classList.add("hidden");
  countdownNumber.classList.remove("hidden", "is-popping");
  countdownNumber.textContent = "3";
  pageShell.classList.add("is-pre-reveal");
  document.body.classList.add("intro-running");
}

function revealWish() {
  burstHearts(window.innerWidth / 2, Math.max(window.innerHeight / 2, 260), 22);
  hero.classList.add("is-leaving");

  window.setTimeout(() => {
    hero.classList.add("hidden");
    wishPanel.classList.remove("hidden");

    requestAnimationFrame(() => {
      wishPanel.classList.add("is-visible");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, 540);
}

function createPetals(amount) {
  for (let index = 0; index < amount; index += 1) {
    const petal = document.createElement("span");

    petal.className = "petal";
    petal.style.left = `${randomBetween(0, 100)}%`;
    petal.style.animationDuration = `${randomBetween(11, 18)}s`;
    petal.style.animationDelay = `${randomBetween(-18, 0)}s`;
    petal.style.setProperty("--drift", `${randomBetween(-120, 120)}px`);
    petal.style.setProperty("--scale", randomBetween(0.65, 1.25));
    petal.style.opacity = randomBetween(0.42, 0.78);

    petalsContainer.appendChild(petal);
  }
}

function burstHearts(originX, originY, amount) {
  for (let index = 0; index < amount; index += 1) {
    const heart = document.createElement("span");

    heart.className = "floating-heart";
    heart.style.left = `${originX + randomBetween(-24, 24)}px`;
    heart.style.top = `${originY + randomBetween(-12, 12)}px`;
    heart.style.setProperty("--x", `${randomBetween(-120, 120)}px`);
    heart.style.animationDuration = `${randomBetween(1.2, 2.2)}s`;
    heart.style.transform = `rotate(45deg) scale(${randomBetween(0.75, 1.25)})`;

    document.body.appendChild(heart);

    window.setTimeout(() => {
      heart.remove();
    }, 2400);
  }
}

async function primeMusic() {
  if (!AudioContextClass) {
    musicToggle.disabled = true;
    musicToggleLabel.textContent = "Music unavailable";
    return;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
    createAudioChain();
  }

  await audioContext.resume();
}

async function startMusic() {
  await primeMusic();

  if (!audioContext || isMusicPlaying) {
    return;
  }

  isMusicPlaying = true;
  masterGain.gain.cancelScheduledValues(audioContext.currentTime);
  masterGain.gain.setTargetAtTime(0.082, audioContext.currentTime, 0.22);
  scheduleMusicLoop();
  updateMusicButton();
}

function stopMusic() {
  if (!audioContext || !masterGain) {
    return;
  }

  isMusicPlaying = false;
  window.clearTimeout(musicLoopTimer);
  musicLoopTimer = null;
  masterGain.gain.cancelScheduledValues(audioContext.currentTime);
  masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.2);
  updateMusicButton();
}

function scheduleMusicLoop() {
  if (!isMusicPlaying || !audioContext) {
    return;
  }

  const startTime = audioContext.currentTime + 0.06;

  chordSections.forEach((section) => {
    playCelebrationChord(section.notes, startTime + section.time, 2.28);
    playBassNote(section.bass, startTime + section.time, 0.68);
    playBellNote(section.notes[1], startTime + section.time + 0.7, 0.24, 0.44);
    playBellNote(section.notes[2], startTime + section.time + 1.35, 0.24, 0.44);
  });

  melody.forEach((item) => {
    playBellNote(item.note, startTime + item.time, item.length, item.accent);
  });

  musicLoopTimer = window.setTimeout(scheduleMusicLoop, loopDurationSeconds * 1000);
}

function createAudioChain() {
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.0001;

  const lowPass = audioContext.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 3600;
  lowPass.Q.value = 0.4;

  const dryGain = audioContext.createGain();
  dryGain.gain.value = 0.86;

  const delay = audioContext.createDelay(1);
  delay.delayTime.value = 0.24;

  const feedback = audioContext.createGain();
  feedback.gain.value = 0.18;

  const wetGain = audioContext.createGain();
  wetGain.gain.value = 0.16;

  delay.connect(feedback);
  feedback.connect(delay);

  lowPass.connect(dryGain);
  lowPass.connect(delay);
  delay.connect(wetGain);

  dryGain.connect(masterGain);
  wetGain.connect(masterGain);
  masterGain.connect(audioContext.destination);

  effectsInput = lowPass;
}

function playCelebrationChord(notes, startTime, duration) {
  notes.forEach((note, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const endTime = startTime + duration;

    oscillator.type = "sine";
    oscillator.frequency.value = note;

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(0.018 - index * 0.0024, startTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(effectsInput);
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.08);
  });
}

function playBassNote(frequency, startTime, duration) {
  if (!audioContext || !effectsInput) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const endTime = startTime + duration;

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(0.016, startTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(effectsInput);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.05);
}

function playBellNote(frequency, startTime, duration, accent = 1) {
  if (!audioContext || !effectsInput) {
    return;
  }

  const endTime = startTime + duration;
  const baseOscillator = audioContext.createOscillator();
  const shimmerOscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  baseOscillator.type = "triangle";
  baseOscillator.frequency.value = frequency;
  baseOscillator.detune.value = -3;

  shimmerOscillator.type = "sine";
  shimmerOscillator.frequency.value = frequency * 2;
  shimmerOscillator.detune.value = 5;

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(0.031 * accent, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  baseOscillator.connect(gainNode);
  shimmerOscillator.connect(gainNode);
  gainNode.connect(effectsInput);

  baseOscillator.start(startTime);
  shimmerOscillator.start(startTime);
  baseOscillator.stop(endTime + 0.05);
  shimmerOscillator.stop(endTime + 0.05);
}

function updateMusicButton() {
  musicToggle.classList.toggle("is-playing", isMusicPlaying);
  musicToggle.setAttribute("aria-pressed", String(isMusicPlaying));
  musicToggleLabel.textContent = isMusicPlaying ? "Pause Mother's Day music" : "Play Mother's Day music";
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
