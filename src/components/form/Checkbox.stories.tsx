import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { Checkbox } from './Checkbox';
import dayjs from 'dayjs';

const meta: Meta<typeof Checkbox> = {
  title: 'components/form/Checkbox',
  component: Checkbox,
};

export default meta;
export const Default: StoryObj<typeof Checkbox> = {
  render: () => {
    return (
      <Checkbox label={'Sample checkbox'} toggleSelection={(value) => {
        console.log(value);
      }}      />
    )
  },
  decorators: []
};