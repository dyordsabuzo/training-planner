import type { Meta, StoryObj } from '@storybook/react';
import dayjs from 'dayjs';
import { PlanForm } from './PlanForm';

const meta: Meta<typeof PlanForm> = {
  title: 'forms/PlanForm',
  component: PlanForm,
};

export default meta;
export const EmptyForm: StoryObj<typeof PlanForm> = {
  name: 'Empty plan form',
  render: () => {
    const formData = null;
    return (
      <PlanForm 
        data={formData} 
        type={''} 
        closeForm={() => {
          console.log('close form');
        }}/>
    )
  },
  decorators: []
};

export const ExistingPlan: StoryObj<typeof PlanForm> = {
  name: 'Existing plan',
  render: () => {
    return (
      <PlanForm data={{
        id: '123abc',
        name: 'Strength Plan',
        numberOfWeeks: '8',
        baselineSet: '3',
        baselineRep: '10',
        baselineTime: '',
        sessions: ['Session A', 'Session B'],
        startDate: dayjs(),
      }} type={'edit'}
      closeForm={() => {
        console.log('form closed')
      }}
      />
    )
  },
  decorators: []
};