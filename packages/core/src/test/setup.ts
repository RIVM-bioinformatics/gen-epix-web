import '@testing-library/jest-dom/vitest';

import {
  beforeAll,
  vi,
} from 'vitest';
import { config as transitionConfig } from 'react-transition-group';
import '../setup/i18next';
import '../setup/yup';
import { cleanup } from '@testing-library/react';

import type { Config } from '../models';
import { ConfigManager } from '../classes';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

vi.mock('@mui/icons-material', () => ({
  //
}));

vi.setConfig({
  testTimeout: 10000,
});

beforeAll(() => {
  ConfigManager.instance.config = {
    epiTree: {
      MIN_SCALE_WIDTH_PX: 48,
      MAX_SCALE_WIDTH_PX: 144,
      SCALE_INCREMENTS: [1, 2, 5, 10, 20, 50],
    },
    epiMap: {
      MIN_PIE_CHART_RADIUS: 4,
    },
    outages: {
      NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES: 8,
    },
  } as Config;
});

afterEach(() => {
  cleanup();
});

transitionConfig.disabled = true;
