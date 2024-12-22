import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { DateInput } from './DateInput';
import dayjs from 'dayjs';

const meta: Meta<typeof DateInput> = {
  title: 'components/date/Date Input',
  component: DateInput,
};

export default meta;
type Story = StoryObj<typeof DateInput>;


export const Default: StoryObj<typeof DateInput> = {
  render: () => {
    return (
      <DateInput 
        label='date input label'
        value={dayjs(new Date())} 
        placeholder={''} 
        changeValue={function (value: dayjs.Dayjs | null): void {
          throw new Error('Function not implemented.');
        }}
      />
    )
  },
  decorators: []
};