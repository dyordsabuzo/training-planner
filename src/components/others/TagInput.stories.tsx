import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { TagInput } from './TagInput';
import dayjs from 'dayjs';

const meta: Meta<typeof TagInput> = {
  title: 'components/others/TagInput',
  component: TagInput,
};

export default meta;
export const Default: StoryObj<typeof TagInput> = {
  render: () => {
    return (
      <TagInput label={'Sample tag input'} 
        list={[
          'tag1',
          'tag2'
        ]} options={[]} updateList={(value) => {
          console.log(value);
        }}    />
    )
  },
  decorators: []
};