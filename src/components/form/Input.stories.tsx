import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { Input } from './Input';
import dayjs from 'dayjs';

const meta: Meta<typeof Input> = {
  title: 'components/form/Input',
  component: Input,
};

export default meta;
export const Default: StoryObj<typeof Input> = {
  render: () => {
    return (
      <Input label={'Sample input'} value={'sample value'} placeholder={'Placeholder'} 
      changeValue={(value) => {
        console.log(value);
      }}/>
    )
  },
  decorators: []
};