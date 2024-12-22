import type { Meta, StoryObj } from '@storybook/react';
import { WeekForm } from './WeekForm';

const meta: Meta<typeof WeekForm> = {
  title: 'forms/WeekForm',
  component: WeekForm,
};

export default meta;
export const EmptyForm: StoryObj<typeof WeekForm> = {
  name: 'Empty week form',
  render: () => {
    const formData = {
      planName: "Sample plan",
      weekNumber: "0",
      annotation: "Sample annotation",
      targetSet: "0",
      targetRep: "0"
    };

    return (
      <WeekForm 
        weekData={formData}    
        clear={() => {
          console.log('close form');
        }}/>
    )
  },
  decorators: []
};
