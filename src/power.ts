export type PowerState =
  | 'booting'
  | 'on'
  | 'resetting'
  | 'shuttingDown'
  | 'off';

export const SHUTDOWN_DURATION = 550;
export const WAKE_DURATION = 240;
export const RESET_DURATION = 180;
