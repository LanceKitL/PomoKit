"use client"

let audioContext: AudioContext | null = null

function playTone(frequency: number, startTime: number, duration: number) {
  if (typeof window.AudioContext === "undefined") return

  audioContext ??= new window.AudioContext()

  const context = audioContext

  const oscillator = context.createOscillator()

  const gain = context.createGain()

  oscillator.type = "sine"

  oscillator.frequency.setValueAtTime(frequency, startTime)

  gain.gain.setValueAtTime(0.0001, startTime)

  gain.gain.exponentialRampToValueAtTime(0.055, startTime + 0.01)

  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)

  gain.connect(context.destination)

  oscillator.start(startTime)

  oscillator.stop(startTime + duration)
}

function withAudioContext(play: (context: AudioContext) => void) {
  if (typeof window.AudioContext === "undefined") return

  audioContext ??= new window.AudioContext()

  const context = audioContext

  if (context.state === "suspended") {
    void context.resume().then(
      () => play(context),

      () => undefined,
    )

    return
  }

  play(context)
}

export function playButtonTap() {
  withAudioContext((context) => {
    playTone(740, context.currentTime, 0.035)
  })
}

export function playTimerComplete() {
  withAudioContext((context) => {
    const start = context.currentTime

    playTone(660, start, 0.2)

    playTone(880, start + 0.14, 0.24)

    playTone(1100, start + 0.3, 0.32)
  })
}
