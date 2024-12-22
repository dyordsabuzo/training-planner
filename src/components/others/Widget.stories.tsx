import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { Widget } from './Widget';
import dayjs from 'dayjs';

const meta: Meta<typeof Widget> = {
  title: 'components/others/Widget',
  component: Widget,
};

export default meta;
export const Default: StoryObj<typeof Widget> = {
  render: () => {
    return (
      <Widget label={'Weight'} value={'8'} unit={'kgs'}   />
    )
  },
  decorators: []
};