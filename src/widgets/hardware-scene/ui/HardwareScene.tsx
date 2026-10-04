import { type CSSProperties, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import labelArt from '../../../shared/assets/scene/comet-trail-label.webp';
import hardwareArt from '../../../shared/assets/scene/hardware-composite.webp';
import {
  type PowerState,
  SHUTDOWN_DURATION,
  WAKE_DURATION,
} from '../../../shared/lib/power';
import type { RomInput } from '../../../shared/lib/rom-input';
import Controller from './Controller';
import styles from './HardwareScene.module.scss';

export default function HardwareScene({
  children,
  onInput,
  powerState,
  onPower,
  onReset,
}: {
  children: ReactNode;
  onInput?: (input: RomInput) => void;
  powerState: PowerState;
  onPower: () => void;
  onReset?: () => void;
}) {
  const { t } = useTranslation('common');
  const [powerKeyPressed, setPowerKeyPressed] = useState(false);
  const [resetKeyPressed, setResetKeyPressed] = useState(false);
  return (
    <section
      className={styles.scene}
      aria-label="Desktop hardware scene"
      data-power-state={powerState}
      style={
        {
          '--shutdown-duration': `${SHUTDOWN_DURATION}ms`,
          '--wake-duration': `${WAKE_DURATION}ms`,
        } as CSSProperties
      }
    >
      <div className={styles.hardware}>
        <img
          data-hardware-art
          className={styles.hardwareArt}
          src={hardwareArt}
          alt=""
          draggable={false}
          fetchPriority="high"
        />
        <div className={styles.crt} data-hardware="crt">
          <section className={styles.viewport} aria-label="CRT viewport">
            <div className={styles.romContent} inert={powerState !== 'on'}>
              <div className={styles.screenScale}>{children}</div>
            </div>
            <div className={styles.powerEffect} aria-hidden="true" />
          </section>
        </div>
        <div className={styles.console} data-hardware="console">
          <span className={styles.powerLed} aria-hidden="true" />
          <button
            type="button"
            className={`${styles.controllerButton} ${styles.powerButton}`}
            data-console-control="power"
            data-key-pressed={powerKeyPressed || undefined}
            aria-disabled={powerState !== 'on' && powerState !== 'off'}
            aria-label={t('power')}
            onClick={onPower}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ')
                setPowerKeyPressed(true);
            }}
            onKeyUp={(event) => {
              if (event.key === 'Enter' || event.key === ' ')
                setPowerKeyPressed(false);
            }}
            onBlur={() => setPowerKeyPressed(false)}
          ></button>
          <button
            type="button"
            className={`${styles.controllerButton} ${styles.resetButton}`}
            data-console-control="reset"
            data-key-pressed={resetKeyPressed || undefined}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ')
                setResetKeyPressed(true);
            }}
            onKeyUp={() => setResetKeyPressed(false)}
            onBlur={() => setResetKeyPressed(false)}
            aria-label={t('reset')}
            aria-disabled={powerState !== 'on'}
            onClick={() => {
              if (powerState === 'on') onReset?.();
            }}
          ></button>
        </div>
        <div className={styles.controller} data-hardware="controller">
          <Controller onInput={powerState === 'on' ? onInput : undefined} />
        </div>
        <div
          className={styles.activeCartridge}
          data-hardware="active-cartridge"
          role="img"
          aria-label="Comet Trail cartridge"
        >
          <img
            className={styles.insertedLabel}
            src={labelArt}
            alt=""
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
