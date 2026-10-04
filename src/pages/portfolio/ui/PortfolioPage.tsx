import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../../shared/lib/media-query';
import {
  type PowerState,
  RESET_DURATION,
  SHUTDOWN_DURATION,
} from '../../../shared/lib/power';
import type { RomInputHandle } from '../../../shared/lib/rom-input';
import DesktopFallback from '../../../shared/ui/desktop-fallback';
import HardwareScene, {
  ControllerHints,
} from '../../../widgets/hardware-scene';
import Rom from '../../../widgets/rom';
import styles from './PortfolioPage.module.scss';

// Scale to the available window regardless of height or orientation. Touch-only
// tablets use the fallback; a desktop pointer also supports touch-enabled laptops.
const DESKTOP_QUERY =
  '(min-width: 768px) and (any-pointer: fine) and (any-hover: hover)';

export default function PortfolioPage() {
  const { t, i18n } = useTranslation('common');
  const supported = useMediaQuery(DESKTOP_QUERY);
  const artboard = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    if (!supported) return;
    let frame: number | undefined;
    const updateScale = () => {
      frame = undefined;
      const scale = Math.min(
        window.innerWidth / 1600,
        window.innerHeight / 900,
      );
      if (artboard.current) {
        artboard.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
        // Keep the hint's curved arrow just left of the projected controller.
        // Coordinates refer to the same 1600 × 900 hardware composition.
        const controllerLeft =
          (window.innerWidth - 1600 * scale) / 2 + 368 * scale;
        const controllerTop =
          (window.innerHeight - 900 * scale) / 2 + 730 * scale;
        const scene = artboard.current.parentElement;
        scene?.style.setProperty('--scene-scale', String(scale));
        const hints = scene?.querySelector<HTMLElement>(
          '[data-controller-hints]',
        );
        const arrow = hints?.querySelector('svg');
        if (scene && hints && arrow) {
          // Anchor the actual SVG tip, including the rendered text height.
          // The arrow path ends at (125, 112) in its 140 × 130 viewBox.
          scene.style.setProperty('--hint-arrow-offset', '0px');
          const hintBounds = hints.getBoundingClientRect();
          const arrowBounds = arrow.getBoundingClientRect();
          const tipX =
            arrowBounds.left -
            hintBounds.left +
            (arrowBounds.width * 125) / 140;
          const tipY =
            arrowBounds.top - hintBounds.top + (arrowBounds.height * 112) / 130;
          const gap = Math.max(24, 32 * scale);
          const left = controllerLeft - gap - tipX;
          scene.style.setProperty('--hint-x', `${Math.max(16, left)}px`);
          scene.style.setProperty(
            '--hint-y',
            `${Math.max(16, controllerTop - tipY)}px`,
          );
          // Keep the tip clear even when the text reaches the viewport's edge.
          scene.style.setProperty(
            '--hint-arrow-offset',
            `${Math.min(0, left - 16)}px`,
          );
        }
      }
    };
    const resize = () => {
      if (frame === undefined)
        frame = window.requestAnimationFrame(updateScale);
    };
    updateScale();
    const hints = artboard.current?.parentElement?.querySelector(
      '[data-controller-hints]',
    );
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    if (hints) observer?.observe(hints);
    window.addEventListener('resize', resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [supported]);

  if (!supported) {
    return <DesktopFallback />;
  }

  return (
    <main
      className={styles.desktop}
      aria-label={t('portfolio')}
      onDragStart={(event) => event.preventDefault()}
    >
      <ControllerHints />
      <div className={styles.artboard} ref={artboard}>
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
