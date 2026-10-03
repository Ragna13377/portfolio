import { useTranslation } from 'react-i18next';
import './i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './App.module.scss';
import DesktopFallback from './DesktopFallback';
import HardwareScene from './HardwareScene';
import { type PowerState, RESET_DURATION, SHUTDOWN_DURATION } from './power';
import Rom from './Rom';
import type { RomInputHandle } from './romInput';

// A uniformly scaled landscape scene needs enough room for readable CRT content.
const DESKTOP_MINIMUM = { width: 1000, height: 600 };

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

export default function App() {
  const { t, i18n } = useTranslation('common');
  const [viewport, setViewport] = useState(readViewport);
  const romInput = useRef<RomInputHandle>(null);
  const [powerState, setPowerState] = useState<PowerState>('booting');
  const onBootComplete = useCallback(() => {
    setPowerState((state) => (state === 'booting' ? 'on' : state));
  }, []);

  useEffect(() => {
    if (powerState !== 'shuttingDown') return;
    const timer = window.setTimeout(
      () => setPowerState('off'),
      SHUTDOWN_DURATION,
    );
    return () => window.clearTimeout(timer);
  }, [powerState]);

  useEffect(() => {
    if (powerState !== 'resetting') return;
    const timer = window.setTimeout(() => setPowerState('on'), RESET_DURATION);
    return () => window.clearTimeout(timer);
  }, [powerState]);

  const togglePower = () => {
    if (powerState === 'on') setPowerState('shuttingDown');
    else if (powerState === 'off') {
      romInput.current?.restartForPowerOn();
      setPowerState('booting');
    }
  };

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    const resize = () => setViewport(readViewport());
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  const supported =
    viewport.width >= DESKTOP_MINIMUM.width &&
    viewport.height >= DESKTOP_MINIMUM.height &&
    viewport.width > viewport.height;

  if (!supported) {
    return <DesktopFallback />;
  }

  const scale = Math.min(viewport.width / 1600, viewport.height / 900);
  return (
    <main className={styles.desktop} aria-label={t('portfolio')}>
      <div
        className={styles.artboard}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <HardwareScene
          powerState={powerState}
          onPower={togglePower}
          onReset={() => {
            if (powerState !== 'on') return;
            romInput.current?.restartForPowerOn();
            setPowerState('resetting');
          }}
          onInput={(input) => romInput.current?.send(input)}
        >
          <Rom
            ref={romInput}
            inputEnabled={powerState === 'on'}
            onBootComplete={onBootComplete}
          />
        </HardwareScene>
      </div>
    </main>
  );
}
