import { type CSSProperties, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Controller from './Controller';
import styles from './HardwareScene.module.scss';
import { type PowerState, SHUTDOWN_DURATION, WAKE_DURATION } from './power';
import type { RomInput } from './romInput';

const art = (file: string) =>
  `${import.meta.env.BASE_URL}assets/hardware/${file}.webp`;

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
      <div className={styles.identity}>
        <strong>
          Ivan
          <br />
          Dmitrievich
        </strong>
        <p>{t('about:role')}</p>
      </div>
      <img
        className={styles.hardwareArt}
        src={art('crt-console-empty')}
        alt=""
        draggable={false}
        fetchPriority="high"
      />
      <svg className={styles.cable} viewBox="0 0 1600 900" aria-hidden="true">
        <path
          d="M509 488 C503 450 351 485 333 601 C312 739 555 873 748 846 C809 837 823 810 851 782"
          fill="none"
          stroke="#151313"
          strokeWidth="9"
        />
        <path
          d="M509 488 C503 450 351 485 333 601 C312 739 555 873 748 846 C809 837 823 810 851 782"
          fill="none"
          stroke="#625955"
          strokeWidth="2"
        />
        <path
          d="M846 773 L865 776 L863 789 L845 785 Z"
          fill="#211f20"
          stroke="#555050"
          strokeWidth="2"
        />
      </svg>
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
        <img src={art('controller')} alt="" draggable={false} />
        <Controller onInput={powerState === 'on' ? onInput : undefined} />
      </div>
      <div
        className={styles.activeCartridge}
        data-hardware="active-cartridge"
        role="img"
        aria-label="Lantern Trail cartridge"
      >
        <img src={art('cartridge-front')} alt="" draggable={false} />
        <span className={styles.insertedLabel}>
          LANTERN
          <br />
          TRAIL<small>A LITTLE STAR ADVENTURE</small>
        </span>
      </div>
      <p className={styles.inputLegend}>{t('inputLegend')}</p>
    </section>
  );
}
