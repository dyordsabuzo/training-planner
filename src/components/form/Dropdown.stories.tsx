import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { Dropdown } from './Dropdown';
import dayjs from 'dayjs';

const meta: Meta<typeof Dropdown> = {
  title: 'components/form/Dropdown',
  component: Dropdown,
};

export default meta;
export const Default: StoryObj<typeof Dropdown> = {
  render: () => {
    return (
      <Dropdown label={'Sample dropdown'} 
        options={[
          'Option 1',
          'Option 2',
        ]} 
        required={false} 
        valueHandler={(value) => {
          console.log(value);
        }} />
    )
  },
  decorators: []
};