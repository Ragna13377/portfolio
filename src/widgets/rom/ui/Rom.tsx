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
import { MENU } from '../../../shared/config/navigation';
import type { RomInput, RomInputHandle } from '../../../shared/lib/rom-input';
import { preloadScreenBackgrounds } from '../model/preloadScreenBackgrounds';
import type { ToolkitMovement } from '../model/useToolkitScene';
import AboutScreen, { type AboutDialogueHandle } from './AboutScreen';
import ContactScreen from './ContactScreen';
import ControlsScreen from './ControlsScreen';
import LanguageScreen from './LanguageScreen';
import MainScreen from './MainScreen';
import OptionsScreen from './OptionsScreen';
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
  const [collected, setCollected] = useState<ReadonlySet<string>>(new Set());
  const toolkitMovement = useRef<ToolkitMovement>(null);
  const aboutDialogue = useRef<AboutDialogueHandle>(null);
  const collectTech = useCallback((id: string) => {
    setCollected((previous) =>
      previous.has(id) ? previous : new Set([...previous, id]),
    );
  }, []);
  const content = useRef<HTMLDivElement>(null);
  const actionScreen = useRef(state.screen);
  const selectedAction = useRef<HTMLButtonElement | null>(null);
  const selectedKey = selectionKey(state.screen);
  const selectedIndex = selectedKey ? state[selectedKey] : undefined;

  const markAction = useCallback((button: HTMLButtonElement | null) => {
    content.current?.querySelectorAll('[data-rom-selected]').forEach((item) => {
      item.removeAttribute('data-rom-selected');
    });
    selectedAction.current = button;
    button?.setAttribute('data-rom-selected', '');
  }, []);

  const clearToolkitAction = useCallback(() => {
    markAction(null);
    if (document.activeElement?.closest('[data-rom-back]'))
      content.current
        ?.querySelector<HTMLHeadingElement>('h2')
        ?.focus({ preventScroll: true });
  }, [markAction]);

  useEffect(() => {
    void preloadTheme(cartridgeId);
    void preloadMainScene();
  }, [cartridgeId]);

  useEffect(() => {
    if (state.screen !== 'main' || !inputEnabled) return;
    let cancelled = false;
    void Promise.all([preloadTheme(cartridgeId), preloadMainScene()]).then(
      (loaded) => {
        if (!cancelled && loaded.every(Boolean)) preloadScreenBackgrounds();
      },
    );
    return () => {
      cancelled = true;
    };
  }, [cartridgeId, state.screen, inputEnabled]);

  useEffect(() => {
    if (state.screen !== 'boot') return;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'boot-complete' });
      onBootComplete();
    }, BOOT_DURATION);
    return () => window.clearTimeout(timer);
  }, [state.screen, onBootComplete]);

  useEffect(() => {
    if (actionScreen.current !== state.screen) {
      actionScreen.current = state.screen;
      markAction(null);
    }
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
  }, [state.screen, selectedIndex, inputEnabled, markAction]);

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
        if (
          state.screen === 'main' &&
          MENU[index ?? state.selectedIndex] === 'toolkit'
        )
          setCollected(new Set());
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
      state.selectedIndex,
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
          if (state.screen === 'about') {
            if (input.direction === 'down') {
              if (aboutDialogue.current?.scroll('down')) {
                clearToolkitAction();
              } else {
                const button =
                  content.current?.querySelector<HTMLButtonElement>(
                    '[data-rom-back]',
                  ) ?? null;
                markAction(button);
                if (
                  !document.activeElement?.closest(
                    '[data-hardware="controller"]',
                  )
                )
                  button?.focus({ preventScroll: true });
              }
            } else {
              clearToolkitAction();
              if (input.direction === 'up') aboutDialogue.current?.scroll('up');
            }
            return;
          }
          if (state.screen === 'toolkit') {
            if (input.direction === 'down') {
              const backButton =
                content.current?.querySelector<HTMLButtonElement>(
                  '[data-rom-back]',
                ) ?? null;
              markAction(backButton);
              if (
                !document.activeElement?.closest('[data-hardware="controller"]')
              )
                backButton?.focus({ preventScroll: true });
            } else {
              clearToolkitAction();
              if (input.direction === 'left' || input.direction === 'right')
                toolkitMovement.current?.move(
                  input.direction === 'left' ? -1 : 1,
                );
            }
            return;
          }
          if (state.screen === 'projects') {
            if (input.direction === 'up' || input.direction === 'down') {
              const button =
                input.direction === 'down'
                  ? content.current?.querySelector<HTMLButtonElement>(
                      '[data-rom-back]',
                    )
                  : content.current?.querySelectorAll<HTMLButtonElement>(
                      '[data-project-id]',
                    )[state.selectedProjectIndex];
              markAction(button ?? null);
              if (
                !document.activeElement?.closest(
                  '[data-hardware="controller"], [data-console-control]',
                )
              )
                button?.focus({ preventScroll: true });
            } else if (!selectedAction.current?.matches('[data-rom-back]')) {
              markAction(null);
              dispatch({
                type: 'move',
                direction: input.direction === 'left' ? -1 : 1,
              });
            }
            return;
          }
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
          if (input.direction === 'up' || input.direction === 'down') {
            const buttons = Array.from(
              content.current?.querySelectorAll<HTMLButtonElement>(
                'button:not(:disabled)',
              ) ?? [],
            );
            if (!buttons.length) return;
            const current =
              selectedAction.current && buttons.includes(selectedAction.current)
                ? buttons.indexOf(selectedAction.current)
                : (selectedIndex ?? -1);
            const direction = input.direction === 'up' ? -1 : 1;
            const next =
              current === -1
                ? direction === 1
                  ? 0
                  : buttons.length - 1
                : (current + direction + buttons.length) % buttons.length;
            const button = buttons[next];
            markAction(button);
            const menuIndex = Array.from(
              content.current?.querySelectorAll('nav button') ?? [],
            ).indexOf(button);
            if (menuIndex >= 0) dispatch({ type: 'select', index: menuIndex });
            if (
              !document.activeElement?.closest(
                '[data-hardware="controller"], [data-console-control]',
              )
            )
              button.focus({ preventScroll: true });
          }
          return;
        case 'confirm':
          if (state.screen === 'about') {
            if (selectedAction.current?.matches('[data-rom-back]'))
              selectedAction.current.click();
            else aboutDialogue.current?.revealAll();
            return;
          }
          if (state.screen === 'toolkit' && !selectedAction.current) return;
          if (
            selectedAction.current &&
            content.current?.contains(selectedAction.current)
          )
            selectedAction.current.click();
          else if (selectedIndex === undefined)
            content.current
              ?.querySelector<HTMLButtonElement>('button')
              ?.click();
          else activate();
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
    [
      state.screen,
      state.selectedProjectIndex,
      selectedIndex,
      activate,
      inputEnabled,
      markAction,
      clearToolkitAction,
    ],
  );

  useImperativeHandle(
    ref,
    () => ({
      send: sendInput,
      restartForPowerOn: () => {
        setPlayerOffset(0);
        setCollected(new Set());
        dispatch({ type: 'request-boot' });
      },
    }),
    [sendInput],
  );

  useEffect(() => {
    let scrollTimer: number | undefined;
    let scrollKey: string | undefined;
    const stopScrolling = () => {
      window.clearInterval(scrollTimer);
      scrollTimer = undefined;
      scrollKey = undefined;
    };
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
      if (
        state.screen === 'toolkit' &&
        target instanceof HTMLElement &&
        target.closest('[data-toolkit-stack]') &&
        ['arrowup', 'arrowdown', ' '].includes(key)
      )
        return;
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

      if (key === 'o') {
        stopScrolling();
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
      if (state.screen === 'about' && ['a', 'enter'].includes(key)) {
        stopScrolling();
        event.preventDefault();
        sendInput({ type: 'confirm' });
        return;
      }
      if (
        state.screen === 'toolkit' &&
        ['arrowleft', 'arrowright', 'a', 'd'].includes(key)
      ) {
        event.preventDefault();
        clearToolkitAction();
        toolkitMovement.current?.move(
          key === 'arrowleft' || key === 'a' ? -1 : 1,
          true,
        );
        return;
      }
      switch (key) {
        case 'b':
          if (
            state.screen !== 'toolkit' &&
            state.screen !== 'about' &&
            state.screen !== 'projects'
          )
            return;
          input = { type: 'back' };
          break;
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
      if (state.screen === 'about' && input.type === 'navigate') {
        if (input.direction === 'up' || input.direction === 'down') {
          if (scrollKey === key && event.repeat) return;
          stopScrolling();
          scrollKey = key;
          scrollTimer = window.setInterval(() => sendInput(input), 100);
        } else stopScrolling();
      } else stopScrolling();
      // Resume CRT keyboard focus when switching from hardware to ROM shortcuts.
      if (
        target instanceof HTMLElement &&
        target.closest('[data-hardware="controller"]')
      )
        target.blur();
      sendInput(input);
    };
    window.addEventListener('keydown', keydown);
    const keyup = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === scrollKey) stopScrolling();
      if (['arrowleft', 'a'].includes(key))
        toolkitMovement.current?.release(-1);
      if (['arrowright', 'd'].includes(key))
        toolkitMovement.current?.release(1);
    };
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', stopScrolling);
    return () => {
      stopScrolling();
      window.removeEventListener('blur', stopScrolling);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }, [state.screen, sendInput, inputEnabled, clearToolkitAction]);

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
      style={{ backgroundImage: `url("${themeAssetUrl(cartridgeId)}")` }}
      className={`${styles.rom} ${state.screen === 'about' ? styles.about : ''} ${state.screen === 'projects' ? styles.projects : ''} ${state.screen === 'toolkit' ? styles.toolkit : ''} ${state.screen === 'contact' ? styles.contact : ''} ${state.screen === 'optionsControls' ? styles.controlsScreen : ''}`}
      ref={content}
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLButtonElement) markAction(event.target);
        else if (state.screen === 'toolkit') markAction(null);
      }}
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
      {state.screen === 'about' && (
        <AboutScreen
          key={i18n.resolvedLanguage}
          ref={aboutDialogue}
          enabled={inputEnabled}
          onBack={back}
        />
      )}
      {state.screen === 'contact' && <ContactScreen onBack={back} />}
      {state.screen === 'projects' && (
        <ProjectsScreen
          selectedIndex={state.selectedProjectIndex}
          onSelect={select}
          onBack={back}
        />
      )}
      {state.screen === 'toolkit' && (
        <ToolkitScreen
          ref={toolkitMovement}
          enabled={inputEnabled}
          collected={collected}
          onCollect={collectTech}
          onBack={back}
        />
      )}
    </div>
  );
}
