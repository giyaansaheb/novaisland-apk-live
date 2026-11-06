import { useEffect, useState } from 'react';

export interface RealBatteryState {
  supported: boolean;
  levelPercent: number;
  charging: boolean;
}

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
}

export function useRealDeviceBattery(
  onChargingChange?: (charging: boolean, levelPercent: number) => void
): RealBatteryState {
  const [battery, setBattery] = useState<RealBatteryState>({
    supported: false,
    levelPercent: 88,
    charging: false,
  });

  useEffect(() => {
    let batteryManager: BatteryManagerLike | null = null;
    let mounted = true;

    const updateBattery = () => {
      if (!batteryManager || !mounted) return;
      const pct = Math.round(batteryManager.level * 100);
      setBattery({
        supported: true,
        levelPercent: pct,
        charging: batteryManager.charging,
      });
    };

    const handleChargingChange = () => {
      if (!batteryManager || !mounted) return;
      const pct = Math.round(batteryManager.level * 100);
      setBattery({
        supported: true,
        levelPercent: pct,
        charging: batteryManager.charging,
      });
      if (onChargingChange) {
        onChargingChange(batteryManager.charging, pct);
      }
    };

    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerLike>;
    };

    if (typeof nav.getBattery === 'function') {
      nav
        .getBattery()
        .then((bm) => {
          if (!mounted) return;
          batteryManager = bm;
          updateBattery();
          bm.addEventListener('levelchange', updateBattery);
          bm.addEventListener('chargingchange', handleChargingChange);
        })
        .catch(() => {
          // Ignore if blocked by browser policy
        });
    }

    return () => {
      mounted = false;
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', updateBattery);
        batteryManager.removeEventListener('chargingchange', handleChargingChange);
      }
    };
  }, []);

  return battery;
}

export function triggerDeviceHaptic(pattern: number | number[] = 18): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore on unsupported devices
  }
}

// Web Audio synthesizer for real audible music playback & notification chimes on mobile
class NovaAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlayingSynth = false;
  private intervalId: number | null = null;
  private step = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playNotificationChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.14); // A5
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  startAmbientSynth(tempoBpm = 116): void {
    if (this.isPlayingSynth) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.isPlayingSynth = true;
    const notes = [261.63, 329.63, 392.0, 493.88, 523.25, 392.0, 329.63, 293.66];
    const stepMs = Math.round((60 / tempoBpm / 2) * 1000);

    this.intervalId = window.setInterval(() => {
      if (!this.ctx || !this.isPlayingSynth) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const freq = notes[this.step % notes.length];
      this.step++;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    }, stepMs);
  }

  stopAmbientSynth(): void {
    this.isPlayingSynth = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const novaAudioEngine = new NovaAudioEngine();

// PWA Install Hook
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
