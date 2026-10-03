import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import Controller from './Controller';
import { CARTRIDGES, type CartridgeId, cartridge } from './cartridges';
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
  insertedCartridge = 'starfall',
  onCartridge,
}: {
  children: ReactNode;
  onInput?: (input: RomInput) => void;
  powerState: PowerState;
  onPower: () => void;
  onReset?: () => void;
  insertedCartridge?: CartridgeId | null;
  onCartridge?: (id: CartridgeId | null) => void;
}) {
  const { t } = useTranslation('common');
  const [powerKeyPressed, setPowerKeyPressed] = useState(false);
  const scene = useRef<HTMLElement>(null);
  const cartridgeFocus = useRef(false);
  useEffect(() => {
    if (!cartridgeFocus.current) return;
    cartridgeFocus.current = false;
    scene.current
      ?.querySelector<HTMLButtonElement>(
        insertedCartridge
          ? '[data-cartridge-action="eject"]'
          : '[data-cartridge-id]:not(:disabled)',
      )
      ?.focus();
  }, [insertedCartridge]);
  return (
    <section
      ref={scene}
      className={styles.scene}
      aria-label="Desktop hardware scene"
      data-power-state={powerState}
      data-inserted={insertedCartridge ?? 'empty'}
      style={
        {
          '--shutdown-duration': `${SHUTDOWN_DURATION}ms`,
          '--wake-duration': `${WAKE_DURATION}ms`,
        } as CSSProperties
      }
    >
      <div className={styles.identity}>
        <span>{t('edition')}</span>
        <strong>
          Ivan
          <br />
          Dmitrievich<span className={styles.identityDot}>.</span>
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
          d="M530 541 C530 608 386 698 405 794 C432 915 848 868 960 802"
          fill="none"
          stroke="#0b0e0d"
          strokeWidth="9"
        />
        <path
          d="M530 541 C530 608 386 698 405 794 C432 915 848 868 960 802"
          fill="none"
          stroke="#606359"
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
          aria-disabled={
            powerState !== 'on' && (powerState !== 'off' || !insertedCartridge)
          }
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
        >
          POWER
        </button>
        <button
          type="button"
          className={`${styles.controllerButton} ${styles.resetButton}`}
          data-console-control="reset"
          aria-label={t('reset')}
          aria-disabled={powerState !== 'on'}
          onClick={() => {
            if (powerState === 'on') onReset?.();
          }}
        >
          RESET
        </button>
      </div>
      <div className={styles.controller} data-hardware="controller">
        <img src={art('controller')} alt="" draggable={false} />
        <Controller onInput={powerState === 'on' ? onInput : undefined} />
      </div>
      <div className={styles.activeCartridge} data-hardware="active-cartridge">
        <button
          type="button"
          data-cartridge-action="eject"
          disabled={powerState !== 'off' || !insertedCartridge}
          onClick={() => {
            cartridgeFocus.current = true;
            onCartridge?.(null);
          }}
          aria-label={t('eject')}
        >
          <img src={art('cartridge-front')} alt="" draggable={false} />
          <span
            className={styles.insertedLabel}
            data-label-theme={insertedCartridge ?? 'starfall'}
          >
            {insertedCartridge
              ? cartridge(insertedCartridge).short
              : t('emptySlot')}
          </span>
          <span className={styles.ejectHint}>{t('ejectShort')}</span>
        </button>
      </div>
      <div
        className={styles.inactiveCartridge}
        data-hardware="inactive-cartridge"
      >
        {CARTRIDGES.map((item) => (
          <button
            key={item.id}
            type="button"
            data-cartridge-id={item.id}
            data-cartridge-stored={insertedCartridge !== item.id}
            disabled={powerState !== 'off' || insertedCartridge !== null}
            onClick={() => {
              cartridgeFocus.current = true;
              onCartridge?.(item.id);
            }}
            aria-label={`${t('insert')} ${item.title}`}
          >
            <img
              src={art(
                item.id === 'starfall' ? 'cartridge-front' : 'cartridge-angled',
              )}
              alt=""
              draggable={false}
            />
            <span className={styles.cartridgeLabel} data-label-theme={item.id}>
              <small>16-BIT / {item.number}</small>
              <strong>{item.short}</strong>
              <em>{item.edition}</em>
              <span aria-hidden="true">
                {item.id === 'starfall' ? '✦' : '◉'}
              </span>
            </span>
            <span className={styles.cartridgeCaption}>
              {item.number} / {item.title}
            </span>
          </button>
        ))}
      </div>
      <p
        className={styles.cartridgeStatus}
        aria-live="polite"
        data-cartridge-status
      >
        {powerState !== 'off'
          ? t('swapLocked')
          : insertedCartridge
            ? t('readyToPower', { rom: cartridge(insertedCartridge).title })
            : t('chooseCartridge')}
      </p>
      <div
        className={styles.reserved}
        data-cartridge-position="reserved"
        aria-hidden="true"
      ></div>
      <p className={styles.inputLegend}>{t('inputLegend')}</p>
    </section>
  );
}
