export type RomInput =
  | { type: 'navigate'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'confirm' }
  | { type: 'back' }
  | { type: 'secondary' }
  | { type: 'options' };

// Navigation state and locale orchestration stay inside Rom.
export type RomInputHandle = {
  send: (input: RomInput) => void;
  restartForPowerOn: () => void;
};
