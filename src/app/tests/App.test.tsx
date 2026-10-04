import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import HardwareScene from '../../widgets/hardware-scene';
import App from '../App';

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
    'This experience is built for desktop.',
  );
});

test.each([
  [390, 844],
  [900, 700],
  [1600, 500],
  [1080, 1920],
  [1000, 1000],
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
      'This experience is built for desktop.',
    );
    expect(container.querySelectorAll('details, a, button')).toHaveLength(0);
  },
);

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

test('Contact has exactly three visible channels and only the required native actions', async () => {
  await openContact();
  expect(document.activeElement).toBe(container.querySelector('h2'));
  const channels = container.querySelectorAll(
    '[aria-label="Contact channels"] > li',
  );
  expect(channels).toHaveLength(3);
  for (const [index, label, value, links, buttons] of [
    [0, 'TELEGRAM', '@vedal988', 1, 1],
    [1, 'GITHUB', 'Ragna13377', 1, 0],
    [2, 'EMAIL', 'koseki.bijou987@gmail.com', 0, 1],
  ] as const) {
    const row = channels[index];
    expect(row.querySelector('h3')?.textContent).toBe(label);
    expect(row.querySelector('p')?.textContent).toBe(value);
    expect(row.querySelectorAll('a')).toHaveLength(links);
    expect(row.querySelectorAll('button')).toHaveLength(buttons);
    expect(row.querySelector('a')?.textContent).toBe(
      links ? 'Open' : undefined,
    );
    expect(row.querySelector('button')?.textContent).toBe(
      buttons ? 'Copy' : undefined,
    );
  }
  const links = container.querySelectorAll('a');
  expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual([
    'https://t.me/vedal988',
    'https://github.com/Ragna13377',
  ]);
  for (const link of links) {
    expect(link.target).toBe('_blank');
    expect(link.rel.split(' ')).toEqual(
      expect.arrayContaining(['noopener', 'noreferrer']),
    );
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
      else press(method, container.querySelector('a') as HTMLAnchorElement);
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

test('Contact native links, Copy and Back keep activation and Tab without ROM double dispatch', async () => {
  const writeText = stubClipboard();
  await openContact();
  for (const control of container.querySelectorAll<HTMLElement>('a, button')) {
    await act(async () => {
      control.focus();
      for (const key of ['Enter', ' ', 'Tab', 'ArrowDown', 'ArrowUp']) {
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
    'Ivan Dmitrievich',
    'Frontend Developer',
    'Higher education',
    'English B2',
    'I spend most of my commercial work building the parts of products that live behind the scenes — admin panels, internal tools and interfaces with far too many states.',
    'Outside work, small ideas have a habit of turning into unnecessarily elaborate side projects. Board games, dark fantasy, figures, hardware — and occasionally remembering that bicycles exist.',
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
  // Direction/confirm keys cannot create a nested detail screen or change project.
  await act(async () => {
    press('ArrowDown');
    press('Enter');
  });
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
const toolkitCases = [
  { label: 'CORE', items: ['React', 'Next.js', 'TypeScript', 'JavaScript'] },
  {
    label: 'DATA',
    items: [
      'TanStack Query',
      'Zustand',
      'Redux / Redux Toolkit',
      'Zod',
      'React Hook Form',
    ],
  },
  { label: 'UI', items: ['Tailwind CSS', 'shadcn/ui', 'Radix UI', 'SCSS'] },
  {
    label: 'INTERACTION',
    items: ['DnD Kit', 'WebSocket', 'TanStack Virtual', '2GIS'],
  },
  {
    label: 'TOOLING',
    items: ['Docker', 'Storybook', 'Biome', 'Git', 'Prisma'],
  },
];

function assertToolkit(index: number) {
  expect(container.querySelector('h2')?.textContent).toBe('TOOLKIT');
  expect(
    Array.from(container.querySelectorAll('nav button'), (button) =>
      button.textContent?.replace(/^[▶\s]+/, ''),
    ),
  ).toEqual(toolkitCases.map((category) => category.label));
  expect(selected()).toBe(`▶${toolkitCases[index].label}`);
  expect(document.activeElement).toBe(
    container.querySelectorAll('nav button')[index],
  );
  expect(
    Array.from(
      container.querySelectorAll('[aria-label="Technologies"] li'),
      (li) => li.textContent,
    ),
  ).toEqual(toolkitCases[index].items);
  expect(
    container.querySelectorAll('[data-hardware="crt"] button'),
  ).toHaveLength(6);
}

test('Toolkit keyboard categories wrap, update contents, restore focus and preserve exact hardware nodes', async () => {
  await boot();
  const hardware = Array.from(
    container.querySelectorAll(
      '[data-hardware], [aria-label="Desktop hardware scene"], [aria-label="CRT viewport"], [data-cartridge-position="reserved"]',
    ),
  );
  const assertHardware = () => {
    const current = Array.from(
      container.querySelectorAll(
        '[data-hardware], [aria-label="Desktop hardware scene"], [aria-label="CRT viewport"], [data-cartridge-position="reserved"]',
      ),
    );
    expect(current).toHaveLength(hardware.length);
    current.forEach((node, index) => {
      expect(node).toBe(hardware[index]);
    });
    expect(container.textContent).not.toContain('BOOTING...');
  };
  const toolkit = container.querySelectorAll('nav button')[2];
  expect(toolkit.getAttribute('aria-disabled')).toBe('false');
  expect(
    container.querySelectorAll('nav button')[3].getAttribute('aria-disabled'),
  ).toBe('false');
  await act(async () => {
    press('ArrowDown');
    press('ArrowDown');
  });
  expect(document.activeElement).toBe(toolkit);
  await act(async () => press('Enter', toolkit));
  assertToolkit(0);
  assertHardware();
  for (const [key, index] of [
    ['ArrowUp', 4],
    ['ArrowDown', 0],
    ['W', 4],
    ['S', 0],
    ['s', 1],
    ['ArrowDown', 2],
    ['ArrowDown', 3],
    ['ArrowDown', 4],
    ['ArrowDown', 0],
    ['w', 4],
  ] as const) {
    await act(async () => press(key, document.activeElement as HTMLElement));
    assertToolkit(index);
    assertHardware();
  }
  await act(async () => {
    press('Enter');
    press(' ');
  });
  assertToolkit(4);
  await act(async () => press('Escape'));
  expect(selected()).toBe('▶TOOLKIT');
  expect(document.activeElement).toBe(
    container.querySelectorAll('nav button')[2],
  );
  assertHardware();
  await act(async () => press(' '));
  assertToolkit(4);
  await act(async () => press('Backspace'));
  expect(selected()).toBe('▶TOOLKIT');
  expect(document.activeElement).toBe(
    container.querySelectorAll('nav button')[2],
  );
  assertHardware();
});

test('mouse opens Toolkit and selects every exact category inventory before returning to Main', async () => {
  await boot();
  await act(async () =>
    container.querySelectorAll<HTMLButtonElement>('nav button')[2].click(),
  );
  assertToolkit(0);
  for (let index = 0; index < toolkitCases.length; index++) {
    await act(async () =>
      container
        .querySelectorAll<HTMLButtonElement>('nav button')
        [index].click(),
    );
    assertToolkit(index);
  }
  const back = container.querySelector<HTMLButtonElement>('[data-rom-back]');
  await act(async () => {
    back?.focus();
    expect(press('Enter', back as HTMLElement).defaultPrevented).toBe(false);
    expect(press(' ', back as HTMLElement).defaultPrevented).toBe(false);
    expect(press('Tab', back as HTMLElement).defaultPrevented).toBe(false);
  });
  await act(async () => back?.click());
  expect(container.querySelector('h1')?.textContent).toBe('IVAN DMITRIEVICH');
  expect(selected()).toBe('▶TOOLKIT');
  expect(document.activeElement).toBe(
    container.querySelectorAll('nav button')[2],
  );
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
    assertToolkit(0);
  } finally {
    for (const control of controls) control.remove();
  }
});
