import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { CartridgeId } from '../../../entities/cartridge';
import {
  cartridge,
  preloadTheme,
  themeAssetUrl,
} from '../../../entities/cartridge';
import { PROJECTS } from '../../../entities/project';
import {
  initialRomState,
  isOptionsScreen,
  romReducer,
  selectionKey,
} from '../../../features/rom-navigation';
import { preloadMainScene } from '../../../shared/assets/scene';
import {
  LOCALES,
  type Locale,
  persistLocale,
} from '../../../shared/config/i18n';
import type { RomInput, RomInputHandle } from '../../../shared/lib/rom-input';
import AboutScreen from './AboutScreen';
import ContactScreen from './ContactScreen';
import ControlsScreen from './ControlsScreen';
import LanguageScreen from './LanguageScreen';
import MainScreen from './MainScreen';
import OptionsScreen from './OptionsScreen';
import ProjectDetailScreen from './ProjectDetailScreen';
import ProjectsScreen from './ProjectsScreen';
import styles from './Rom.module.scss';
import ToolkitScreen from './ToolkitScreen';

export const BOOT_DURATION = 1200;

export default function Rom({
  ref,
  inputEnabled,
  onBootComplete,
  cartridgeId = 'starfall',
}: {
  ref?: Ref<RomInputHandle>;
  inputEnabled: boolean;
  onBootComplete: () => void;
  cartridgeId?: CartridgeId;
}) {
  const { t, i18n } = useTranslation('common');
  const [state, dispatch] = useReducer(romReducer, initialRomState);
  const [playerOffset, setPlayerOffset] = useState(0);
  const content = useRef<HTMLDivElement>(null);
  const project = PROJECTS[state.selectedProjectIndex];
  const selectedKey = selectionKey(state.screen);
  const selectedIndex = selectedKey ? state[selectedKey] : undefined;

  useEffect(() => {
    void preloadTheme(cartridgeId);
    void preloadMainScene();
  }, [cartridgeId]);

  useEffect(() => {
    if (state.screen !== 'boot') return;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'boot-complete' });
      onBootComplete();
    }, BOOT_DURATION);
    return () => window.clearTimeout(timer);
  }, [state.screen, onBootComplete]);

  useEffect(() => {
    // Hardware keeps native focus across navigation, locale changes and power cycles.
    if (
      !inputEnabled ||
      document.activeElement?.closest(
        '[data-hardware="controller"], [data-console-control]',
      )
    )
      return;
    if (selectedIndex !== undefined) {
      content.current
        ?.querySelectorAll<HTMLButtonElement>('nav button')
        [selectedIndex]?.focus({ preventScroll: true });
    } else if (state.screen !== 'boot') {
      content.current
        ?.querySelector<HTMLHeadingElement>('h2')
        ?.focus({ preventScroll: true });
    }
  }, [state.screen, selectedIndex, inputEnabled]);

  const changeLocale = useCallback(
    (locale: Locale) => {
      if (!inputEnabled) return;
      dispatch({ type: 'select', index: LOCALES.indexOf(locale) });
      void i18n.changeLanguage(locale);
      persistLocale(locale);
    },
    [i18n, inputEnabled],
  );

  const activate = useCallback(
    (index?: number) => {
      if (!inputEnabled) return;
      if (state.screen === 'optionsLanguage') {
        changeLocale(LOCALES[index ?? state.selectedLanguageIndex]);
      } else {
        dispatch({
          type: 'activate',
          index,
          activeLocaleIndex: i18n.resolvedLanguage === 'ru' ? 1 : 0,
        });
      }
    },
    [
      state.screen,
      state.selectedLanguageIndex,
      i18n,
      changeLocale,
      inputEnabled,
    ],
  );

  const sendInput = useCallback(
    (input: RomInput) => {
      if (!inputEnabled || state.screen === 'boot') return;
      switch (input.type) {
        case 'navigate':
          if (
            state.screen === 'main' &&
            (input.direction === 'left' || input.direction === 'right')
          ) {
            setPlayerOffset((offset) =>
              Math.max(
                -45,
                Math.min(75, offset + (input.direction === 'left' ? -20 : 20)),
              ),
            );
          }
          if (input.direction === 'up' || input.direction === 'down')
            dispatch({
              type: 'move',
              direction: input.direction === 'up' ? -1 : 1,
            });
          return;
        case 'confirm':
          activate();
          return;
        case 'back':
          dispatch({ type: 'back' });
          return;
        case 'options':
          dispatch({ type: 'open-options' });
          return;
        case 'secondary':
          return;
      }
    },
    [state.screen, activate, inputEnabled],
  );

  useImperativeHandle(
    ref,
    () => ({
      send: sendInput,
      restartForPowerOn: () => {
        setPlayerOffset(0);
        dispatch({ type: 'request-boot' });
      },
    }),
    [sendInput],
  );

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        !inputEnabled ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.isComposing
      )
        return;
      const target = event.target;
      const key = event.key.toLowerCase();
      if (target instanceof HTMLElement) {
        if (
          target.isContentEditable ||
          target.closest(
            'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
          ) ||
          (target.closest('button') &&
            !content.current?.contains(target) &&
            (!target.closest('[data-hardware="controller"]') ||
              key === 'enter' ||
              key === ' '))
        )
          return;
        if (
          target.closest('a') &&
          !(
            content.current?.contains(target) &&
            (key === 'o' ||
              (state.screen === 'contact' &&
                (key === 'escape' || key === 'backspace')))
          )
        )
          return;
      }

      if (
        state.screen === 'contact' &&
        ['arrowup', 'arrowdown', 'w', 's'].includes(key)
      )
        return;
      if (key === 'o') {
        if (state.screen === 'boot' || isOptionsScreen(state.screen)) return;
        event.preventDefault();
        if (
          target instanceof HTMLElement &&
          target.closest('[data-hardware="controller"]')
        )
          target.blur();
        sendInput({ type: 'options' });
        return;
      }
      let input: RomInput;
      switch (key) {
        case 'arrowleft':
          input = { type: 'navigate', direction: 'left' };
          break;
        case 'arrowright':
          input = { type: 'navigate', direction: 'right' };
          break;
        case 'arrowup':
        case 'w':
          input = { type: 'navigate', direction: 'up' };
          break;
        case 'arrowdown':
        case 's':
          input = { type: 'navigate', direction: 'down' };
          break;
        case 'enter':
        case ' ':
          // Non-menu buttons keep native activation; ROM selection owns nav buttons.
          if (
            target instanceof HTMLElement &&
            target.closest('button') &&
            !target.closest('nav')
          )
            return;
          event.preventDefault();
          sendInput({ type: 'confirm' });
          return;
        case 'escape':
        case 'backspace':
          input = { type: 'back' };
          break;
        default:
          return;
      }
      event.preventDefault();
      // Resume CRT keyboard focus when switching from hardware to ROM shortcuts.
      if (
        target instanceof HTMLElement &&
        target.closest('[data-hardware="controller"]')
      )
        target.blur();
      sendInput(input);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [state.screen, sendInput, inputEnabled]);

  const select = (index: number) => {
    if (inputEnabled) dispatch({ type: 'select', index });
  };
  const back = () => {
    if (inputEnabled) dispatch({ type: 'back' });
  };

  return (
    <div
      data-theme={cartridgeId}
      data-screen={state.screen}
      data-location={t(
        `worlds:${cartridgeId}.stages.${state.selectedProjectIndex}`,
      )}
      style={{ backgroundImage: `url("${themeAssetUrl(cartridgeId)}")` }}
      className={`${styles.rom} ${state.screen === 'about' ? styles.about : ''} ${state.screen === 'projectDetail' ? styles.detail : ''} ${state.screen === 'toolkit' ? styles.toolkit : ''} ${state.screen === 'contact' ? styles.contact : ''} ${state.screen === 'optionsControls' ? styles.controlsScreen : ''}`}
      ref={content}
      onClickCapture={(event) => {
        if (!inputEnabled) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {state.screen === 'boot' && (
        <>
          <div className={styles.bootTitle} aria-hidden="true">
            {cartridge(cartridgeId).short}
            <br />
            <small>16-BIT PORTFOLIO SYSTEM</small>
          </div>
          <p role="status">{t('boot')}</p>
          <div className={styles.bootProgress} aria-hidden="true" />
        </>
      )}
      {state.screen === 'main' && (
        <MainScreen
          selectedIndex={state.selectedIndex}
          onSelect={select}
          onActivate={activate}
          cartridgeId={cartridgeId}
          playerOffset={playerOffset}
        />
      )}
      {state.screen === 'options' && (
        <OptionsScreen
          selectedIndex={state.selectedOptionsIndex}
          onSelect={select}
          onActivate={activate}
          onBack={back}
        />
      )}
      {state.screen === 'optionsLanguage' && (
        <LanguageScreen
          selectedIndex={state.selectedLanguageIndex}
          onSelect={select}
          onActivate={changeLocale}
          onBack={back}
        />
      )}
      {state.screen === 'optionsControls' && <ControlsScreen onBack={back} />}
      {state.screen === 'about' && <AboutScreen onBack={back} />}
      {state.screen === 'contact' && <ContactScreen onBack={back} />}
      {state.screen === 'projects' && (
        <ProjectsScreen
          cartridgeId={cartridgeId}
          selectedIndex={state.selectedProjectIndex}
          onSelect={select}
          onActivate={activate}
          onBack={back}
        />
      )}
      {state.screen === 'projectDetail' && (
        <ProjectDetailScreen
          project={project}
          onBack={back}
          cartridgeId={cartridgeId}
        />
      )}
      {state.screen === 'toolkit' && (
        <ToolkitScreen
          selectedIndex={state.selectedToolkitIndex}
          onSelect={select}
          onBack={back}
        />
      )}
    </div>
  );
}
