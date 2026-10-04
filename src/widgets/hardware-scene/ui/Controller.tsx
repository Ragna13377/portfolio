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
  { id: 'c', label: 'C', input: { type: 'secondary' } },
  { id: 'start', label: 'START', input: { type: 'options' } },
  { id: 'x', label: 'X', input: { type: 'confirm' } },
  { id: 'y', label: 'Y', input: { type: 'back' } },
  { id: 'z', label: 'Z', input: { type: 'options' } },
] as const satisfies readonly { id: string; label: string; input: RomInput }[];

export default function Controller({
  onInput,
}: {
  onInput?: (input: RomInput) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <>
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
      onClick={() => onInput?.(control.input)}
    ></button>
  );
}
