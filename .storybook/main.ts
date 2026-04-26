import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  stories: ['../src/__stories__/**/*.stories.tsx'],
};

export default config;
