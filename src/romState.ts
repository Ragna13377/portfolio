import { MENU } from './menu';
import { PROJECTS } from './projects';
import { TOOLKIT_CATEGORIES } from './toolkit';

type PortfolioScreen =
  | 'main'
  | 'about'
  | 'projects'
  | 'projectDetail'
  | 'toolkit'
  | 'contact';
export type RomState = {
  screen:
    | 'boot'
    | PortfolioScreen
    | 'options'
    | 'optionsLanguage'
    | 'optionsControls';
  previousScreen: PortfolioScreen;
  selectedIndex: number;
  selectedProjectIndex: number;
  selectedToolkitIndex: number;
  selectedOptionsIndex: number;
  selectedLanguageIndex: number;
};
export type RomAction =
  | { type: 'request-boot' }
  | { type: 'boot-complete' }
  | { type: 'open-options' }
  | { type: 'move'; direction: -1 | 1 }
  | { type: 'select'; index: number }
  | { type: 'activate'; index?: number; activeLocaleIndex?: number }
  | { type: 'back' };

export const initialRomState: RomState = {
  screen: 'boot',
  previousScreen: 'main',
  selectedIndex: 0,
  selectedProjectIndex: 0,
  selectedToolkitIndex: 0,
  selectedOptionsIndex: 0,
  selectedLanguageIndex: 0,
};

export function isOptionsScreen(screen: RomState['screen']) {
  return (
    screen === 'options' ||
    screen === 'optionsLanguage' ||
    screen === 'optionsControls'
  );
}

export function selectionKey(screen: RomState['screen']) {
  switch (screen) {
    case 'main':
      return 'selectedIndex';
    case 'projects':
      return 'selectedProjectIndex';
    case 'toolkit':
      return 'selectedToolkitIndex';
    case 'options':
      return 'selectedOptionsIndex';
    case 'optionsLanguage':
      return 'selectedLanguageIndex';
    default:
      return undefined;
  }
}

export function romReducer(state: RomState, action: RomAction): RomState {
  if (action.type === 'request-boot') return initialRomState;
  if (action.type === 'boot-complete') {
    return state.screen === 'boot' ? { ...state, screen: 'main' } : state;
  }
  if (state.screen === 'boot') return state;
  if (action.type === 'open-options') {
    if (isOptionsScreen(state.screen)) return state;
    return {
      ...state,
      previousScreen: state.screen as PortfolioScreen,
      screen: 'options',
    };
  }
  if (action.type === 'back') {
    if (state.screen === 'main') return state;
    const screen =
      state.screen === 'options'
        ? state.previousScreen
        : isOptionsScreen(state.screen)
          ? 'options'
          : state.screen === 'projectDetail'
            ? 'projects'
            : 'main';
    return { ...state, screen };
  }

  const key = selectionKey(state.screen);
  if (!key) return state;
  const length =
    state.screen === 'main'
      ? MENU.length
      : state.screen === 'projects'
        ? PROJECTS.length
        : state.screen === 'toolkit'
          ? TOOLKIT_CATEGORIES.length
          : 2;
  switch (action.type) {
    case 'move':
      return {
        ...state,
        [key]: (state[key] + action.direction + length) % length,
      };
    case 'select':
      return { ...state, [key]: action.index };
    case 'activate': {
      const index = action.index ?? state[key];
      if (state.screen === 'toolkit' || state.screen === 'optionsLanguage')
        return state;
      if (state.screen === 'options')
        return {
          ...state,
          selectedOptionsIndex: index,
          selectedLanguageIndex:
            action.activeLocaleIndex ?? state.selectedLanguageIndex,
          screen: index === 0 ? 'optionsLanguage' : 'optionsControls',
        };
      if (state.screen === 'projects')
        return {
          ...state,
          selectedProjectIndex: index,
          screen: 'projectDetail',
        };
      return { ...state, selectedIndex: index, screen: MENU[index] };
    }
  }
}
