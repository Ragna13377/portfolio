import { useTranslation } from 'react-i18next';
import './i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './App.module.scss';
import type { CartridgeId } from './cartridges';
import HardwareScene from './HardwareScene';
import { type PowerState, RESET_DURATION, SHUTDOWN_DURATION } from './power';
import ReadablePortfolio from './ReadablePortfolio';
import Rom from './Rom';
import type { RomInputHandle } from './romInput';

// Temporary support limits for placeholder geometry; revisit with final assets.
const DESKTOP_MINIMUM = { width: 1000, height: 600 };

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

export default function App() {
  const { t, i18n } = useTranslation('common');
  const [viewport, setViewport] = useState(readViewport);
  const [readable, setReadable] = useState(false);
  const wasReadable = useRef(false);
  const romInput = useRef<RomInputHandle>(null);
  const [powerState, setPowerState] = useState<PowerState>('booting');
  const [insertedCartridge, setInsertedCartridge] =
    useState<CartridgeId | null>('starfall');
  const [activeCartridge, setActiveCartridge] =
    useState<CartridgeId>('starfall');
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
    const timer = window.setTimeout(
      () => setPowerState('booting'),
      RESET_DURATION,
    );
    return () => window.clearTimeout(timer);
  }, [powerState]);

  const togglePower = () => {
    if (powerState === 'on') setPowerState('shuttingDown');
    else if (powerState === 'off' && insertedCartridge) {
      setActiveCartridge(insertedCartridge);
      romInput.current?.restartForPowerOn();
      setPowerState('booting');
    }
  };

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    if (wasReadable.current && !readable) {
      document
        .querySelector<HTMLElement>(
          powerState === 'on'
            ? '[data-hardware="crt"] [aria-current="true"], [data-hardware="crt"] h2'
            : '[data-console-control="power"]',
        )
        ?.focus();
    }
    wasReadable.current = readable;
  }, [readable, powerState]);

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
    return <ReadablePortfolio />;
  }

  const scale = Math.min(viewport.width / 1600, viewport.height / 900);
  return (
    <>
      <main
        className={styles.desktop}
        aria-label={t('portfolio')}
        hidden={readable}
        inert={readable}
      >
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
            insertedCartridge={insertedCartridge}
            onCartridge={(id) => {
              if (powerState === 'off') setInsertedCartridge(id);
            }}
          >
            <Rom
              ref={romInput}
              inputEnabled={powerState === 'on' && !readable}
              onBootComplete={onBootComplete}
              cartridgeId={activeCartridge}
            />
          </HardwareScene>
        </div>
        <button
          className={styles.readableToggle}
          type="button"
          data-readable-toggle
          onClick={() => setReadable(true)}
        >
          {t('readableView')}
        </button>
      </main>
      {readable && <ReadablePortfolio onReturn={() => setReadable(false)} />}
    </>
  );
}
