import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RomInput } from '../../../shared/lib/rom-input';
import styles from './HardwareScene.module.scss';

const CONTROLS = [
  { id: 'up', label: '↑', input: { type: 'navigate', direction: 'up' } },
  { id: 'left', label: '←', input: { type: 'navigate', direction: 'left' } },
  { id: 'right', label: '→', input: { type: 'navigate', direction: 'right' } },
  { id: 'down', label: '↓', input: { type: 'navigate', direction: 'down' } },
  { id: 'a', label: 'A', input: { type: 'confirm' } },
  { id: 'b', label: 'B', input: { type: 'back' } },
  { id: 'c', label: 'C', input: null },
  { id: 'start', label: 'START', input: { type: 'options' } },
  { id: 'x', label: 'X', input: null },
  { id: 'y', label: 'Y', input: null },
  { id: 'z', label: 'Z', input: null },
] as const satisfies readonly {
  id: string;
  label: string;
  input: RomInput | null;
}[];

export default function Controller({
  onInput,
}: {
  onInput?: (input: RomInput) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <>
      <span className={styles.startLegend} aria-hidden="true">
        START
      </span>
      {CONTROLS.map((control) => (
        <ControlButton
          key={control.id}
          control={control}
          onInput={onInput}
          name={t(`controller.${control.id}`)}
        />
      ))}
    </>
  );
}

function ControlButton({
  control,
  onInput,
  name,
}: {
  control: (typeof CONTROLS)[number];
  onInput?: (input: RomInput) => void;
  name: string;
}) {
  const [keyPressed, setKeyPressed] = useState(false);
  return (
    <button
      type="button"
      className={`${styles.controllerButton} ${styles[control.id]}`}
      aria-label={name}
      data-controller-input={control.id}
      data-key-pressed={keyPressed || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') setKeyPressed(true);
      }}
      onKeyUp={(event) => {
        if (event.key === 'Enter' || event.key === ' ') setKeyPressed(false);
      }}
      onBlur={() => setKeyPressed(false)}
      onClick={() => {
        if (control.input) onInput?.(control.input);
      }}
    >
      {['a', 'b', 'c', 'x', 'y', 'z'].includes(control.id) && (
        <span className={styles.capLegend} aria-hidden="true">
          {control.label}
        </span>
      )}
    </button>
  );
}
