import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import HardwareScene from '../../widgets/hardware-scene';
import App from '../App';
import { setDesktopInput, setReducedMotionPreference } from './setupMediaQuery';

const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let previousActEnvironment: boolean | undefined;

function setViewport(width: number, height: number) {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
  window.dispatchEvent(new Event('resize'));
  vi.advanceTimersToNextFrame();
}

beforeEach(() => {
  vi.useFakeTimers();
  previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  setViewport(1600, 900);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

test('desktop renders one hardware composite around a live CRT viewport', async () => {
  await act(async () => root.render(<App />));
  const scene = container.querySelector(
    '[aria-label="Desktop hardware scene"]',
  );
  expect(scene).not.toBeNull();
  expect(scene?.querySelectorAll('[data-hardware-art]')).toHaveLength(1);
  expect(
    scene?.querySelector('[data-hardware-art]')?.getAttribute('src'),
  ).toContain('hardware-composite');
  expect(scene?.querySelector('[data-hardware="controller"] img')).toBeNull();
  expect(scene?.querySelector('svg')).toBeNull();
  expect(
    scene
      ?.querySelector('[data-hardware="active-cartridge"] img')
      ?.getAttribute('src'),
  ).toContain('comet-trail-label');
  const shell = scene?.querySelector('[data-hardware="crt"]');
  expect(
    shell?.querySelector('[aria-label="CRT viewport"] [role="status"]')
      ?.textContent,
  ).toBe('BOOTING...');
  for (const layer of ['console', 'controller', 'active-cartridge']) {
    expect(scene?.querySelector(`[data-hardware="${layer}"]`)).not.toBeNull();
  }

  expect(shell?.querySelector('button')).toBeNull();
  expect(
    container.querySelectorAll('[data-hardware="controller"] button'),
  ).toHaveLength(11);
  expect(container.textContent).not.toContain(
    'Open the portfolio on a computer with a mouse or trackpad, in a window at least 768 px wide.',
  );
});

test.each([
  [390, 844],
  [767, 700],
  [600, 1000],
])(
  'unsupported %i x %i viewport shows accessible fallback instead of hardware',
  async (width, height) => {
    setViewport(width, height);
    await act(async () => root.render(<App />));
    expect(
      container.querySelector('[aria-label="Desktop hardware scene"]'),
    ).toBeNull();
    expect(container.querySelector('h1')?.textContent).toBe('Ivan Dmitrievich');
    expect(container.textContent).toContain('Frontend Developer');
    expect(container.textContent).toContain(
      'Open the portfolio on a computer with a mouse or trackpad, in a window at least 768 px wide.',
    );
    expect(container.querySelectorAll('details, a, button')).toHaveLength(0);
  },
);

test.each([
  [1920, 1200],
  [1366, 768],
  [1024, 768],
  [900, 700],
  [1000, 1000],
  [1080, 1920],
])('computer at %i x %i opens the scene', async (width, height) => {
  setViewport(width, height);
  await act(async () => root.render(<App />));
  expect(container.querySelector('[aria-label="CRT viewport"]')).not.toBeNull();
});

test.each([
  [768, 1024],
  [1024, 768],
  [1366, 1024],
])('touch-only tablet at %i x %i shows fallback', async (width, height) => {
  setViewport(width, height);
  setDesktopInput(false);
  await act(async () => root.render(<App />));
  expect(container.querySelector('[aria-label="CRT viewport"]')).toBeNull();
  await act(async () => setDesktopInput(true));
  expect(container.querySelector('[aria-label="CRT viewport"]')).not.toBeNull();
});

test('desktop resizing scales one artboard and keeps the hardware mounted', async () => {
  await act(async () => root.render(<App />));
  const scene = container.querySelector(
    '[aria-label="Desktop hardware scene"]',
  );
  const artboard = scene?.parentElement;
  await act(async () => setViewport(1366, 768));
  expect(container.querySelector('[aria-label="Desktop hardware scene"]')).toBe(
    scene,
  );
  expect(artboard?.style.transform).toBe(
    'translate(-50%, -50%) scale(0.8533333333333334)',
  );
  await act(async () => setViewport(1920, 1080));
  expect(artboard?.style.transform).toBe('translate(-50%, -50%) scale(1.2)');
  await act(async () => setViewport(390, 844));
  expect(
    container.querySelector('[aria-label="Desktop hardware scene"]'),
  ).toBeNull();
  await act(async () => setViewport(1600, 900));
  expect(container.querySelector('[aria-label="CRT viewport"]')).not.toBeNull();
});

test('wide desktop window stays usable below 600px height and recovers after resizing', async () => {
  setViewport(1600, 500);
  await act(async () => root.render(<App />));
  expect(container.querySelector('[aria-label="CRT viewport"]')).not.toBeNull();
  await act(async () => setViewport(767, 700));
  expect(container.querySelector('[aria-label="CRT viewport"]')).toBeNull();
  await act(async () => setViewport(1366, 550));
  expect(container.querySelector('[aria-label="CRT viewport"]')).not.toBeNull();
});

test('resize bursts update the scene once per frame using the latest dimensions', async () => {
  await act(async () => root.render(<App />));
  const scene = container.querySelector('[data-power-state]');
  const artboard = scene?.parentElement;
  const requestFrame = vi.spyOn(window, 'requestAnimationFrame');
  const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
  try {
    await act(async () => {
      for (const height of [700, 650, 500]) {
        vi.stubGlobal('innerHeight', height);
        window.dispatchEvent(new Event('resize'));
      }
    });
    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(artboard?.style.transform).toBe('translate(-50%, -50%) scale(1)');
    await act(async () => vi.advanceTimersToNextFrame());
    expect(artboard?.style.transform).toBe(
      'translate(-50%, -50%) scale(0.5555555555555556)',
    );
    expect(container.querySelector('[data-power-state]')).toBe(scene);
    await act(async () => window.dispatchEvent(new Event('resize')));
    await act(async () => root.unmount());
    expect(cancelFrame).toHaveBeenCalledTimes(1);
  } finally {
    requestFrame.mockRestore();
    cancelFrame.mockRestore();
  }
});

test('replacing CRT content preserves the hardware shell and viewport', async () => {
  await act(async () =>
    root.render(
      <HardwareScene powerState="on" onPower={() => {}}>
        First content
      </HardwareScene>,
    ),
  );
  const shell = container.querySelector('[data-hardware="crt"]');
  const viewport = container.querySelector('[aria-label="CRT viewport"]');
  const controller = container.querySelector('[data-hardware="controller"]');
  await act(async () =>
    root.render(
      <HardwareScene powerState="on" onPower={() => {}}>
        Replacement content
      </HardwareScene>,
    ),
  );
  expect(container.querySelector('[data-hardware="crt"]')).toBe(shell);
  expect(container.querySelector('[aria-label="CRT viewport"]')).toBe(viewport);
  expect(container.querySelector('[data-hardware="controller"]')).toBe(
    controller,
  );
  expect(viewport?.textContent).toBe('Replacement content');
});

function press(key: string, target: EventTarget = window, ctrlKey = false) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

async function boot() {
  await act(async () => root.render(<App />));
  await act(async () => vi.advanceTimersByTime(1200));
}

function selected() {
  return container.querySelector('[aria-current="true"]')?.textContent;
}

async function openContact() {
  await boot();
  const contact =
    container.querySelectorAll<HTMLButtonElement>('nav button')[3];
  expect(contact.getAttribute('aria-disabled')).toBe('false');
  await act(async () => contact.click());
}

function copyButton(channel: 'Telegram' | 'email') {
  return container.querySelector<HTMLButtonElement>(
    `[aria-label="Copy ${channel === 'Telegram' ? 'Telegram handle' : 'email address'}"]`,
  ) as HTMLButtonElement;
}

function stubClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  return writeText;
}

test('Contact shows two copy-only channels without exposing handles or addresses', async () => {
  await openContact();
  expect(document.activeElement).toBe(container.querySelector('h2'));
  const channels = container.querySelectorAll(
    '[aria-label="Contact channels"] > li',
  );
  expect(channels).toHaveLength(2);
  for (const [index, label] of ['TELEGRAM', 'EMAIL'].entries()) {
    const row = channels[index];
    expect(row.querySelector('h3')?.textContent).toBe(label);
    expect(row.querySelectorAll('button')).toHaveLength(1);
    expect(row.querySelector('button')?.textContent).toBe('Copy');
  }
  expect(container.querySelectorAll('a')).toHaveLength(0);
  for (const value of [
    '@vedal988',
    'Ragna13377',
    'koseki.bijou987@gmail.com',
    'GITHUB',
    'Open',
  ]) {
    expect(container.textContent).not.toContain(value);
  }
});

test('copy writes exact raw values and shows transient feedback only inside the CRT', async () => {
  const writeText = stubClipboard();
  const alert = vi.spyOn(window, 'alert');
  await openContact();
  for (const [channel, value] of [
    ['Telegram', '@vedal988'],
    ['email', 'koseki.bijou987@gmail.com'],
  ] as const) {
    await act(async () => copyButton(channel).click());
    expect(writeText).toHaveBeenLastCalledWith(value);
    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toBe('COPIED!');
    expect(
      container.querySelector('[aria-label="CRT viewport"]')?.contains(status),
    ).toBe(true);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    await act(async () => vi.advanceTimersByTime(1199));
    expect(status?.textContent).toBe('COPIED!');
    await act(async () => vi.advanceTimersByTime(1));
    expect(status?.textContent).toBe('');
  }
  expect(writeText).toHaveBeenCalledTimes(2);
  expect(alert).not.toHaveBeenCalled();
  alert.mockRestore();
});

test('pending and rejected clipboard writes never claim success and Contact stays usable', async () => {
  let finish: () => void = () => {};
  const writeText = stubClipboard(
    vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ),
  );
  await openContact();
  await act(async () => copyButton('Telegram').click());
  expect(container.textContent).not.toContain('COPIED!');
  await act(async () => finish());
  expect(container.textContent).toContain('COPIED!');
  writeText.mockRejectedValue(new Error('Permission denied'));
  await act(async () => copyButton('email').click());
  expect(container.textContent).not.toContain('COPIED!');
  expect(container.querySelector('h2')?.textContent).toBe('CONTACT');
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
  );
  expect(selected()).toBe('▶CONTACT');
});

test('unavailable clipboard is safe and pending writes are ignored after leaving Contact', async () => {
  vi.stubGlobal('navigator', {});
  await openContact();
  await act(async () => copyButton('Telegram').click());
  expect(container.textContent).not.toContain('COPIED!');
  let finish: () => void = () => {};
  stubClipboard(
    vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ),
  );
  await act(async () => copyButton('email').click());
  await act(async () => press('Escape'));
  await act(async () => press('Enter'));
  await act(async () => finish());
  expect(container.querySelector('h2')?.textContent).toBe('CONTACT');
  expect(container.textContent).not.toContain('COPIED!');
});

test.each(['Escape', 'Backspace', 'button'])(
  'Contact Back via %s restores Main selection/focus and exact hardware nodes',
  async (method) => {
    stubClipboard();
    await boot();
    const selector =
      '[data-hardware], [aria-label="Desktop hardware scene"], [aria-label="CRT viewport"], [data-cartridge-position="reserved"]';
    const hardware = Array.from(container.querySelectorAll(selector));
    const assertHardware = () => {
      const current = Array.from(container.querySelectorAll(selector));
      expect(current).toHaveLength(hardware.length);
      current.forEach((node, index) => {
        expect(node).toBe(hardware[index]);
      });
    };
    await act(async () => press('ArrowUp'));
    await act(async () =>
      press('Enter', document.activeElement as HTMLElement),
    );
    expect(container.querySelector('h2')?.textContent).toBe('CONTACT');
    assertHardware();
    await act(async () => copyButton('Telegram').click());
    assertHardware();
    await act(async () => {
      if (method === 'button')
        container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click();
      else press(method, copyButton('Telegram'));
    });
    expect(selected()).toBe('▶CONTACT');
    expect(document.activeElement).toBe(
      container.querySelectorAll('nav button')[3],
    );
    expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
    expect(container.textContent).not.toContain('BOOTING...');
    assertHardware();
  },
);

test('Contact Copy and Back keep activation and Tab without ROM double dispatch', async () => {
  const writeText = stubClipboard();
  await openContact();
  for (const control of container.querySelectorAll<HTMLElement>('a, button')) {
    await act(async () => {
      control.focus();
      for (const key of ['Enter', ' ', 'Tab']) {
        expect(press(key, control).defaultPrevented).toBe(false);
      }
    });
    expect(container.querySelector('h2')?.textContent).toBe('CONTACT');
    expect(writeText).not.toHaveBeenCalled();
  }
  await act(async () => copyButton('Telegram').click());
  expect(writeText).toHaveBeenCalledTimes(1);
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
  );
  expect(selected()).toBe('▶CONTACT');
});

test('automatic boot and About navigation preserve every hardware element', async () => {
  await act(async () => root.render(<App />));
  const hardware = Array.from(container.querySelectorAll('[data-hardware]'));
  const viewport = container.querySelector('[aria-label="CRT viewport"]');
  for (const key of ['ArrowDown', 'w', 'Enter', ' ', 'Escape', 'Backspace']) {
    await act(async () => expect(press(key).defaultPrevented).toBe(false));
    expect(viewport?.querySelector('[role="status"]')?.textContent).toBe(
      'BOOTING...',
    );
  }
  await act(async () => vi.advanceTimersByTime(1000));
  expect(viewport?.querySelector('[role="status"]')?.textContent).toBe(
    'BOOTING...',
  );
  await act(async () => vi.advanceTimersByTime(200));
  expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
  expect(selected()).toBe('▶ABOUT');
  await act(async () => press('Enter'));
  expect(container.querySelector('h2')?.textContent).toBe('ABOUT');
  for (const text of [
    "Hi, I'm a frontend developer.",
    'I build admin panels and complex interfaces.',
    'university degree',
    'English up to B2',
  ]) {
    expect(container.textContent).toContain(text);
  }
  await act(async () => press('Escape'));
  expect(selected()).toBe('▶ABOUT');
  await act(async () => press(' '));
  expect(container.querySelector('h2')?.textContent).toBe('ABOUT');
  await act(async () => press('Backspace'));
  expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
  for (const element of hardware) {
    expect(element.isConnected).toBe(true);
  }
  expect(container.querySelector('[aria-label="CRT viewport"]')).toBe(viewport);
});

test('keyboard Main selection wraps across four available destinations', async () => {
  await boot();
  expect(
    Array.from(container.querySelectorAll('nav button'), (button) =>
      button.textContent?.replace(/^[▶\s]+/, ''),
    ),
  ).toEqual(['ABOUT', 'PROJECTS', 'TOOLKIT', 'CONTACT']);
  for (const [key, label] of [
    ['ArrowUp', 'CONTACT'],
    ['ArrowDown', 'ABOUT'],
    ['W', 'CONTACT'],
    ['S', 'ABOUT'],
    ['s', 'PROJECTS'],
    ['ArrowDown', 'TOOLKIT'],
    ['ArrowDown', 'CONTACT'],
    ['ArrowDown', 'ABOUT'],
  ]) {
    await act(async () => press(key));
    expect(selected()).toBe(`▶${label}`);
    if (label === 'CONTACT') {
      await act(async () => {
        press('Enter');
        press(' ');
      });
      expect(container.querySelector('h2')?.textContent).toBe('CONTACT');
      await act(async () =>
        container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
      );
    }
  }
  await act(async () => {
    press('Escape');
    press('Backspace');
  });
  expect(selected()).toBe('▶ABOUT');
});

test('About reveals text, can skip with Enter or controller A, and replays on entry', async () => {
  await boot();
  const open = async () =>
    act(async () =>
      container.querySelector<HTMLButtonElement>('nav button')?.click(),
    );
  const visible = () =>
    container.querySelectorAll('[data-about-beat][data-visible="true"]');
  await open();
  expect(container.querySelectorAll('[data-about-beat]')).toHaveLength(6);
  expect(visible()).toHaveLength(0);
  expect(container.textContent).toContain('university degree');
  expect(container.textContent).toContain('English up to B2');
  await act(async () => vi.advanceTimersByTime(200));
  expect(visible()).toHaveLength(1);
  expect(visible()[0].querySelector('[data-about-text]')?.textContent).toBe(
    "Hi, I'm a frontend developer. I usually live somewhere between React, Next.js and TypeScript.",
  );
  await act(async () => vi.advanceTimersByTime(450));
  expect(visible()).toHaveLength(2);
  await act(async () =>
    press('Enter', container.querySelector('h2') as HTMLElement),
  );
  expect(visible()).toHaveLength(6);
  expect(
    container.querySelector('[data-screen]')?.getAttribute('data-screen'),
  ).toBe('about');
  await act(async () => press('b'));
  await open();
  expect(visible()).toHaveLength(0);
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('[data-controller-input="a"]')
      ?.click(),
  );
  expect(visible()).toHaveLength(6);
  expect(
    container.querySelector('[data-screen]')?.getAttribute('data-screen'),
  ).toBe('about');
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('[data-controller-input="b"]')
      ?.click(),
  );
  await open();
  for (const delay of [200, 450, 450, 450, 450, 450])
    await act(async () => vi.advanceTimersByTime(delay));
  expect(visible()).toHaveLength(6);
});

test('About reveals wrapped paragraphs one rendered line at a time', async () => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.matches('[data-about-beat]') ? 59 : 0;
    },
  );
  await boot();
  await act(async () => press('Enter'));
  const paragraphs = container.querySelectorAll('[data-about-beat]');
  await act(async () => vi.advanceTimersByTime(200));
  expect(paragraphs[0].getAttribute('data-revealed-lines')).toBe('1');
  expect(paragraphs[1].getAttribute('data-visible')).toBe('false');
  await act(async () => vi.advanceTimersByTime(150));
  expect(paragraphs[0].getAttribute('data-revealed-lines')).toBe('1');
  await act(async () => vi.advanceTimersByTime(170));
  expect(paragraphs[0].getAttribute('data-revealed-lines')).toBe('2');
  expect(paragraphs[1].getAttribute('data-visible')).toBe('false');
  await act(async () => vi.advanceTimersByTime(450));
  expect(paragraphs[0].getAttribute('data-revealed-lines')).toBe('3');
  await act(async () => vi.advanceTimersByTime(450));
  expect(paragraphs[1].getAttribute('data-revealed-lines')).toBe('1');
  await act(async () => press('Enter'));
  expect(
    Array.from(paragraphs, (paragraph) =>
      paragraph.getAttribute('data-revealed-lines'),
    ),
  ).toEqual(['3', '3', '3', '3', '3', '3']);
});

test('About scrolls before selecting Back and Up restores story navigation', async () => {
  await boot();
  await act(async () => press('Enter'));
  const story = container.querySelector<HTMLElement>(
    '[data-about-scroll]',
  ) as HTMLElement;
  const back = container.querySelector<HTMLButtonElement>(
    '[data-rom-back]',
  ) as HTMLButtonElement;
  Object.defineProperties(story, {
    clientHeight: { value: 176 },
    scrollHeight: { value: 720 },
  });
  await act(async () => press('ArrowDown'));
  expect(story.scrollTop).toBe(64);
  expect(back.hasAttribute('data-rom-selected')).toBe(false);
  for (let step = 0; step < 8; step++)
    await act(async () => press('ArrowDown'));
  expect(story.scrollTop).toBe(544);
  expect(back.hasAttribute('data-rom-selected')).toBe(false);
  await act(async () => press('ArrowDown'));
  expect(back.hasAttribute('data-rom-selected')).toBe(true);
  expect(document.activeElement).toBe(back);
  await act(async () => press('ArrowUp'));
  expect(story.scrollTop).toBe(480);
  expect(back.hasAttribute('data-rom-selected')).toBe(false);
  expect(document.activeElement).not.toBe(back);
  await act(async () => press('Enter'));
  expect(
    container.querySelector('[data-screen]')?.getAttribute('data-screen'),
  ).toBe('about');
  const down = container.querySelector<HTMLButtonElement>(
    '[data-controller-input="down"]',
  ) as HTMLButtonElement;
  await act(async () => down.click());
  expect(back.hasAttribute('data-rom-selected')).toBe(false);
  await act(async () => down.click());
  expect(back.hasAttribute('data-rom-selected')).toBe(true);
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('[data-controller-input="a"]')
      ?.click(),
  );
  expect(
    container.querySelector('[data-screen]')?.getAttribute('data-screen'),
  ).toBe('main');
});

test('holding Down scrolls without waiting for keyboard repeat and stops on release or blur', async () => {
  await boot();
  await act(async () => press('Enter'));
  const story = container.querySelector<HTMLElement>(
    '[data-about-scroll]',
  ) as HTMLElement;
  Object.defineProperties(story, {
    clientHeight: { value: 176 },
    scrollHeight: { value: 720 },
  });
  await act(async () => press('ArrowDown'));
  await act(async () => vi.advanceTimersByTime(300));
  expect(story.scrollTop).toBe(256);
  await act(async () =>
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })),
  );
  await act(async () => vi.advanceTimersByTime(300));
  expect(story.scrollTop).toBe(256);
  await act(async () => press('ArrowDown'));
  await act(async () => window.dispatchEvent(new Event('blur')));
  await act(async () => vi.advanceTimersByTime(300));
  expect(story.scrollTop).toBe(320);
});

test('About shows every beat immediately with reduced motion and updates the preference live', async () => {
  setReducedMotionPreference(true);
  await boot();
  await act(async () =>
    container.querySelector<HTMLButtonElement>('nav button')?.click(),
  );
  expect(
    container.querySelectorAll('[data-about-beat][data-visible="true"]'),
  ).toHaveLength(6);
  await act(async () => press('Escape'));
  setReducedMotionPreference(false);
  await act(async () =>
    container.querySelector<HTMLButtonElement>('nav button')?.click(),
  );
  expect(
    container.querySelectorAll('[data-about-beat][data-visible="true"]'),
  ).toHaveLength(0);
  await act(async () => setReducedMotionPreference(true));
  expect(
    container.querySelectorAll('[data-about-beat][data-visible="true"]'),
  ).toHaveLength(6);
});

test('mouse opens Contact and About directly', async () => {
  await boot();
  for (const index of [3]) {
    await act(async () =>
      container
        .querySelectorAll<HTMLButtonElement>('nav button')
        [index].click(),
    );
    expect(container.querySelector('h2')?.textContent).toBe('CONTACT');
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
    );
  }
  await act(async () =>
    container.querySelector<HTMLButtonElement>('nav button')?.click(),
  );
  expect(container.querySelector('h2')?.textContent).toBe('ABOUT');
  await act(async () =>
    container.querySelector<HTMLButtonElement>('button')?.click(),
  );
  expect(selected()).toBe('▶ABOUT');
});

const projectCases = [
  {
    label: 'TRANSPORT CONTROL',
    type: 'Transport / kicksharing admin platform',
    highlights: [
      'Real-time maps and route visualization',
      'Virtualized large datasets',
      'Complex validated workflows',
      'Nested modal infrastructure',
    ],
    tech: 'React · TypeScript · TanStack Query · TanStack Virtual · React Hook Form · Zod · 2GIS',
  },
  {
    label: 'FINANCIAL PLATFORM',
    type: 'Financial platform',
    highlights: [
      '~7s → ~2s page-load improvement',
      'Transaction state handling',
      'Analytics dashboards',
      'Support/dispute workflows',
    ],
    tech: 'Next.js · TypeScript · Radix UI · shadcn/ui · next-intl · Chart.js',
  },
  {
    label: 'FACADE BUILDER',
    type: 'Visual configuration tool',
    highlights: [
      'Visual DnD editor',
      'Snap + zoom interaction',
      'Undo/redo state model',
      'PDF output workflow',
    ],
    tech: 'React · TypeScript · Redux · React DnD · jsPDF',
  },
  {
    label: 'REAL-TIME PLATFORM',
    type: 'Internal corporate platform',
    highlights: [
      'WebSocket chat',
      'Reconnect / notification flows',
      'Scheduling / planning UI',
      'Role-based access',
    ],
    tech: 'React · Next.js · TypeScript · Redux · React Hook Form · Tailwind CSS · WebSocket',
  },
];

test('keyboard Projects flow wraps, restores selection/focus and preserves hardware nodes', async () => {
  await boot();
  const hardware = Array.from(container.querySelectorAll('[data-hardware]'));
  const scene = container.querySelector(
    '[aria-label="Desktop hardware scene"]',
  );
  const viewport = container.querySelector('[aria-label="CRT viewport"]');
  const reserved = container.querySelector(
    '[data-cartridge-position="reserved"]',
  );
  const assertHardware = () => {
    expect(Array.from(container.querySelectorAll('[data-hardware]'))).toEqual(
      hardware,
    );
    for (const element of hardware) {
      expect(
        container.querySelector(
          `[data-hardware="${element.getAttribute('data-hardware')}"]`,
        ),
      ).toBe(element);
    }
    expect(
      container.querySelector('[aria-label="Desktop hardware scene"]'),
    ).toBe(scene);
    expect(container.querySelector('[aria-label="CRT viewport"]')).toBe(
      viewport,
    );
    expect(
      container.querySelector('[data-cartridge-position="reserved"]'),
    ).toBe(reserved);
    expect(container.textContent).not.toContain('BOOTING...');
  };
  const projectsButton = container.querySelectorAll('nav button')[1];
  expect(projectsButton.textContent).toContain('PROJECTS');
  expect(projectsButton.getAttribute('aria-disabled')).toBe('false');
  await act(async () => press('ArrowDown'));
  expect(document.activeElement).toBe(projectsButton);
  await act(async () => press('Enter', projectsButton));
  expect(container.querySelector('h2')?.textContent).toBe('PROJECTS SELECT');
  expect(
    Array.from(container.querySelectorAll('nav button'), (button) =>
      button.textContent?.replace(/^[▶\s]+/, ''),
    ),
  ).toEqual(projectCases.map((item) => item.label));
  assertHardware();
  for (const [key, index] of [
    ['ArrowUp', 3],
    ['ArrowDown', 0],
    ['W', 3],
    ['S', 0],
    ['s', 1],
    ['ArrowDown', 2],
    ['ArrowDown', 3],
    ['ArrowDown', 0],
    ['w', 3],
  ] as const) {
    if (
      (index === 3 && ['ArrowUp', 'W', 'w'].includes(key)) ||
      (index === 0 &&
        ['ArrowDown', 'S'].includes(key) &&
        selected()?.includes(projectCases[3].label))
    ) {
      await act(async () => press(key));
      expect(document.activeElement).toBe(
        container.querySelector('[data-rom-back]'),
      );
    }
    await act(async () => press(key));
    expect(selected()).toBe(`▶${projectCases[index].label}`);
    expect(document.activeElement).toBe(
      container.querySelectorAll('nav button')[index],
    );
  }
  await act(async () => press(' ', document.activeElement as HTMLElement));
  expect(container.querySelector('h2')?.textContent).toBe('REAL-TIME PLATFORM');
  expect(document.activeElement).toBe(container.querySelector('h2'));
  assertHardware();
  // Direction keys select the shared Back action without changing the project.
  await act(async () => {
    press('ArrowDown');
  });
  expect(document.activeElement).toBe(
    container.querySelector('[data-rom-back]'),
  );
  expect(container.querySelectorAll('h2')).toHaveLength(1);
  expect(container.querySelector('h2')?.textContent).toBe('REAL-TIME PLATFORM');
  await act(async () => press('Backspace'));
  expect(container.querySelector('h2')?.textContent).toBe('PROJECTS SELECT');
  expect(selected()).toBe('▶REAL-TIME PLATFORM');
  expect(document.activeElement).toBe(
    container.querySelectorAll('nav button')[3],
  );
  assertHardware();
  await act(async () => press('Escape'));
  expect(selected()).toBe('▶PROJECTS');
  expect(document.activeElement).toBe(
    container.querySelectorAll('nav button')[1],
  );
  assertHardware();
  await act(async () => {
    press('Escape');
    press('Backspace');
  });
  expect(selected()).toBe('▶PROJECTS');
});

test.each(projectCases)(
  'mouse opens $label with exactly its supplied details and Back hierarchy',
  async (item) => {
    await boot();
    await act(async () =>
      container.querySelectorAll<HTMLButtonElement>('nav button')[1].click(),
    );
    expect(container.querySelector('h2')?.textContent).toBe('PROJECTS SELECT');
    const index = projectCases.indexOf(item);
    await act(async () =>
      container
        .querySelectorAll<HTMLButtonElement>('nav button')
        [index].click(),
    );
    expect(container.querySelectorAll('h2')).toHaveLength(1);
    expect(container.querySelector('h2')?.textContent).toBe(item.label);
    expect(container.textContent).toContain(item.type);
    expect(
      Array.from(container.querySelectorAll('li'), (li) => li.textContent),
    ).toEqual(item.highlights);
    expect(container.textContent).toContain(item.tech);
    expect(
      container.querySelectorAll('[data-hardware="crt"] button'),
    ).toHaveLength(1);
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
    );
    expect(selected()).toBe(`▶${item.label}`);
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-rom-back]')?.click(),
    );
    expect(selected()).toBe('▶PROJECTS');
    expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
  },
);

test('Back buttons keep native activation and unrelated controls are protected on Projects screens', async () => {
  await boot();
  await act(async () =>
    container.querySelectorAll<HTMLButtonElement>('nav button')[1].click(),
  );
  const back = container.querySelector<HTMLButtonElement>('[data-rom-back]');
  expect(back).not.toBeNull();
  await act(async () => {
    back?.focus();
    expect(press('Enter', back as HTMLButtonElement).defaultPrevented).toBe(
      false,
    );
    expect(press(' ', back as HTMLButtonElement).defaultPrevented).toBe(false);
  });
  expect(container.querySelector('h2')?.textContent).toBe('PROJECTS SELECT');
  const controls = ['input', 'textarea', 'select', 'a', 'button', 'div'].map(
    (tag) => {
      const element = document.createElement(tag);
      if (tag === 'div') element.setAttribute('contenteditable', 'true');
      document.body.append(element);
      return element;
    },
  );
  try {
    for (const openDetail of [false, true]) {
      if (openDetail) {
        await act(async () =>
          container.querySelector<HTMLButtonElement>('nav button')?.click(),
        );
      }
      const heading = container.querySelector('h2');
      for (const control of controls) {
        await act(async () => {
          for (const key of [
            'ArrowUp',
            's',
            'Enter',
            ' ',
            'Escape',
            'Backspace',
          ]) {
            expect(press(key, control).defaultPrevented).toBe(false);
          }
        });
      }
      expect(container.querySelector('h2')).toBe(heading);
    }
  } finally {
    for (const control of controls) control.remove();
  }
});

test('keyboard leaves unrelated keys, shortcuts, and text inputs alone', async () => {
  await boot();
  const input = document.createElement('input');
  document.body.append(input);
  try {
    await act(async () => {
      expect(press('Tab').defaultPrevented).toBe(false);
      expect(press('x').defaultPrevented).toBe(false);
      expect(press('s', window, true).defaultPrevented).toBe(false);
      expect(press('ArrowDown', input).defaultPrevented).toBe(false);
      expect(press('Backspace', input).defaultPrevented).toBe(false);
    });
    expect(selected()).toBe('▶ABOUT');
  } finally {
    input.remove();
  }
});
const toolkitNames = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'TanStack Query',
  'Zustand',
  'Zod',
  'React Hook Form',
  'Tailwind CSS',
  'shadcn/ui',
  'Three.js / React Three Fiber',
  'Prisma',
  'Vite',
  'Vitest',
  'Docker',
  'Git',
  'Biome',
  'Socket.IO',
  'NestJS',
  'Node.js',
  'pnpm',
  'XState',
  'MUI',
  'Storybook',
  'Lefthook',
];
function assertToolkit() {
  expect(container.querySelector('h2')?.textContent).toBe('TOOLKIT');
  expect(
    Array.from(
      container.querySelectorAll('[data-tech-id] > span:nth-child(2)'),
      (node) => node.textContent,
    ),
  ).toEqual(expect.arrayContaining(toolkitNames));
  expect(container.querySelectorAll('[data-tech-id]')).toHaveLength(25);
  expect(container.querySelector('[data-toolkit-hero]')).not.toBeNull();
  expect(
    container.querySelectorAll('[data-hardware="crt"] button'),
  ).toHaveLength(1);
}

test('Toolkit movement, pickup, release, Back and hardware continuity', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  try {
    await boot();
    const hardware = Array.from(container.querySelectorAll('[data-hardware]'));
    await act(async () =>
      container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
    );
    assertToolkit();
    expect(document.activeElement).toBe(container.querySelector('h2'));
    const hero = container.querySelector<HTMLImageElement>(
      '[data-toolkit-hero]',
    );
    await act(async () => {
      press('ArrowLeft');
      vi.advanceTimersByTime(300);
    });
    expect(parseFloat(hero?.style.left ?? '50')).toBeLessThan(50);
    expect(hero?.style.transform).toContain('scaleX(-1)');
    expect(hero?.src).toContain('/toolkit_sprites/run_');
    await act(async () =>
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' })),
    );
    const stopped = hero?.style.left;
    await act(async () => vi.advanceTimersByTime(300));
    expect(hero?.style.left).toBe(stopped);
    expect(hero?.src).toContain('/toolkit_sprites/idle_');
    expect(hero?.style.transform).toContain('scaleX(-1)');
    await act(async () => {
      press('d');
      vi.advanceTimersByTime(300);
    });
    await act(async () =>
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' })),
    );
    await act(async () => vi.advanceTimersByTime(2500));
    expect(hero?.src).toContain('/toolkit_sprites/idle_');
    expect(hero?.style.transform).toContain('scaleX(1)');
    expect(
      container
        .querySelector('[data-tech-id="vite"]')
        ?.getAttribute('data-collected'),
    ).toBe('true');
    expect(
      container.querySelector('[data-pickup="vite"]')?.hasAttribute('hidden'),
    ).toBe(true);
    await act(async () => press('o'));
    await act(async () => press('Escape'));
    expect(
      container
        .querySelector('[data-tech-id="vite"]')
        ?.getAttribute('data-collected'),
    ).toBe('true');
    await act(async () => press('b'));
    expect(selected()).toBe('▶TOOLKIT');
    expect(document.activeElement).toBe(
      container.querySelectorAll('nav button')[2],
    );
    Array.from(container.querySelectorAll('[data-hardware]')).forEach(
      (node, index) => {
        expect(node).toBe(hardware[index]);
      },
    );
  } finally {
    vi.restoreAllMocks();
  }
});

test('Toolkit checkpoints expire and spawning ends after every skill is collected', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  try {
    await boot();
    await act(async () =>
      container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
    );
    await act(async () => vi.advanceTimersByTime(9000));
    expect(container.querySelectorAll('[data-collected="true"]')).toHaveLength(
      5,
    );
    expect(container.textContent).toContain('5 SKILLS COLLECTED!');
    await act(async () => vi.advanceTimersByTime(1000));
    expect(container.querySelectorAll('[data-collected="true"]')).toHaveLength(
      6,
    );
    expect(container.textContent).toContain('5 SKILLS COLLECTED!');
    await act(async () => vi.advanceTimersByTime(2700));
    expect(container.textContent).not.toContain('5 SKILLS COLLECTED!');
    await act(async () => vi.advanceTimersByTime(60000));
    expect(container.querySelectorAll('[data-collected="true"]')).toHaveLength(
      25,
    );
    expect(
      container.querySelectorAll('[data-pickup]:not([hidden])'),
    ).toHaveLength(0);
    expect(container.textContent).toContain('STACK COMPLETE!');
    await act(async () => vi.advanceTimersByTime(2700));
    expect(container.textContent).not.toContain('STACK COMPLETE!');
    await act(async () => {
      press('o');
    });
    await act(async () => {
      press('Escape');
      vi.advanceTimersByTime(10000);
    });
    expect(
      container.querySelectorAll('[data-pickup]:not([hidden])'),
    ).toHaveLength(0);
    await act(async () => press('b'));
    await act(async () => press('Enter'));
    expect(container.querySelectorAll('[data-collected="true"]')).toHaveLength(
      0,
    );
    expect(container.textContent).not.toContain('STACK COMPLETE!');
  } finally {
    vi.restoreAllMocks();
  }
});

test('Toolkit pauses spawning at three pickups and resumes when they are collected', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  try {
    await boot();
    await act(async () =>
      container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
    );
    await act(async () => {
      press('ArrowLeft');
      vi.advanceTimersByTime(20000);
    });
    await act(async () =>
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' })),
    );
    const active = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>('[data-pickup]:not([hidden])'),
      );
    expect(active()).toHaveLength(3);
    expect(
      Math.max(...active().map((node) => Number.parseFloat(node.style.top))),
    ).toBe(74.75);
    const ids = active().map((node) => node.dataset.pickup);
    await act(async () => vi.advanceTimersByTime(20000));
    expect(active().map((node) => node.dataset.pickup)).toEqual(ids);
    await act(async () => {
      press('ArrowRight');
      vi.advanceTimersByTime(800);
    });
    await act(async () =>
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' })),
    );
    expect(
      container.querySelectorAll('[data-collected="true"]').length,
    ).toBeGreaterThan(0);
    expect(active().length).toBeLessThanOrEqual(3);
    expect(active().some((node) => node.dataset.falling === 'true')).toBe(true);
  } finally {
    vi.restoreAllMocks();
  }
});

test('Toolkit collection leaves the manually scrolled stack in place', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  try {
    await boot();
    await act(async () =>
      container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
    );
    const stack = container.querySelector<HTMLElement>('[data-toolkit-stack]');
    const row = container.querySelector('[data-tech-id="vite"]');
    const scroll = vi.fn();
    Object.defineProperty(stack, 'scrollTo', { value: scroll });
    Object.defineProperty(stack, 'clientHeight', { value: 100 });
    Object.defineProperty(row, 'offsetTop', { value: 500 });
    if (stack) stack.scrollTop = 120;
    await act(async () => vi.advanceTimersByTime(3000));
    expect(row?.getAttribute('data-collected')).toBe('true');
    expect(scroll).not.toHaveBeenCalled();
    expect(stack?.scrollTop).toBe(120);
  } finally {
    vi.restoreAllMocks();
  }
});

test('Toolkit Back requires deliberate selection and directional input cancels it', async () => {
  await boot();
  await act(async () =>
    container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
  );
  const back = container.querySelector('[data-rom-back]');
  for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'a', 'd']) {
    await act(async () =>
      press('ArrowDown', document.activeElement as HTMLElement),
    );
    expect(document.activeElement).toBe(back);
    expect(back?.hasAttribute('data-rom-selected')).toBe(true);
    await act(async () => press(key, document.activeElement as HTMLElement));
    expect(document.activeElement).toBe(container.querySelector('h2'));
    expect(back?.hasAttribute('data-rom-selected')).toBe(false);
    await act(async () =>
      press('Enter', document.activeElement as HTMLElement),
    );
    assertToolkit();
    await act(async () =>
      window.dispatchEvent(new KeyboardEvent('keyup', { key })),
    );
  }
  const hardware = (id: string) =>
    container.querySelector<HTMLButtonElement>(
      `[data-controller-input="${id}"]`,
    );
  await act(async () => hardware('down')?.click());
  await act(async () => hardware('left')?.click());
  await act(async () => hardware('a')?.click());
  assertToolkit();
  await act(async () => hardware('down')?.click());
  await act(async () => hardware('a')?.click());
  expect(selected()).toBe('▶TOOLKIT');
});

test('Toolkit full inventory is readable before playing and Back keeps native keyboard behavior', async () => {
  await boot();
  await act(async () =>
    container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
  );
  assertToolkit();
  expect(container.querySelectorAll('[data-collected="true"]')).toHaveLength(0);
  const stack = container.querySelector<HTMLElement>('[data-toolkit-stack]');
  await act(async () => stack?.focus());
  expect(press('ArrowDown', stack as HTMLElement).defaultPrevented).toBe(false);
  expect(press('Tab', stack as HTMLElement).defaultPrevented).toBe(false);
  const back = container.querySelector<HTMLButtonElement>('[data-rom-back]');
  expect(press('Enter', back as HTMLElement).defaultPrevented).toBe(false);
  await act(async () => back?.click());
  expect(selected()).toBe('▶TOOLKIT');
});

test('Toolkit keyboard safeguards protect unrelated controls and modified events', async () => {
  await boot();
  await act(async () =>
    container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
  );
  const controls = ['input', 'textarea', 'select', 'a', 'button', 'div'].map(
    (tag) => {
      const control = document.createElement(tag);
      if (tag === 'div') control.setAttribute('contenteditable', 'true');
      document.body.append(control);
      return control;
    },
  );
  try {
    await act(async () => {
      for (const control of controls) {
        for (const key of [
          'ArrowUp',
          'ArrowDown',
          'W',
          'S',
          'Enter',
          ' ',
          'Escape',
          'Backspace',
        ]) {
          expect(press(key, control).defaultPrevented).toBe(false);
        }
      }
      for (const modifiers of [
        { ctrlKey: true },
        { altKey: true },
        { metaKey: true },
        { isComposing: true },
      ]) {
        const event = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
          ...modifiers,
        });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }
      const prevented = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        cancelable: true,
      });
      prevented.preventDefault();
      window.dispatchEvent(prevented);
    });
    assertToolkit();
  } finally {
    for (const control of controls) control.remove();
  }
});

test('Contact arrows select both copy actions and Back, and confirmation copies the selected channel', async () => {
  const writeText = stubClipboard();
  await openContact();
  await act(async () => press('ArrowDown'));
  expect(document.activeElement).toBe(copyButton('Telegram'));
  await act(async () => press('Enter'));
  expect(writeText).toHaveBeenLastCalledWith('@vedal988');
  await act(async () => press('ArrowDown'));
  expect(document.activeElement).toBe(copyButton('email'));
  await act(async () => press('Enter'));
  expect(writeText).toHaveBeenLastCalledWith('koseki.bijou987@gmail.com');
  await act(async () => press('ArrowDown'));
  const back = container.querySelector<HTMLButtonElement>('[data-rom-back]');
  expect(document.activeElement).toBe(back);
  expect(back?.hasAttribute('data-rom-selected')).toBe(true);
  await act(async () => press('ArrowDown'));
  expect(document.activeElement).toBe(copyButton('Telegram'));
  await act(async () => press('ArrowUp'));
  expect(document.activeElement).toBe(back);
  await act(async () => back?.click());
  expect(selected()).toBe('▶CONTACT');
});
