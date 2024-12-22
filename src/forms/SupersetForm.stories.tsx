import type { Meta, StoryObj } from '@storybook/react';
import { SupersetForm } from './SupersetForm';

const meta: Meta<typeof SupersetForm> = {
  title: 'forms/SupersetForm',
  component: SupersetForm,
};

export default meta;
export const EmptyForm: StoryObj<typeof SupersetForm> = {
  name: 'Empty superset form',
  render: () => {
    const formData = null;
    return (
      <SupersetForm 
        data={formData} 
        type={''} 
        closeForm={() => {
          console.log('close form');
        }}/>
    )
  },
  decorators: []
};
