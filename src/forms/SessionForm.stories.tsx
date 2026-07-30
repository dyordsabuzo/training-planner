import type { Meta, StoryObj } from '@storybook/react';
import { SessionForm } from './SessionForm';
import { withMockSourceDataContext } from '../management/__mock__/MockContext';

const meta: Meta<typeof SessionForm> = {
  title: 'forms/SessionForm',
  component: SessionForm,
};

export default meta;
export const EmptyForm: StoryObj<typeof SessionForm> = {
  name: 'Empty session form',
  render: () => {
    const formData = null;
    return (
      <SessionForm 
        data={formData} 
        type={''} 
        closeForm={() => {
          console.log('close form');
        }}/>
    )
  },
  decorators: []
};

export const ExistingSession: StoryObj<typeof SessionForm> = {
  name: 'Existing session',
  render: () => {
    return (
      <SessionForm data={{
        id: '123abc',
        name: 'Leg day session',
        tags: ['tag1', 'tag2'],
        supersets: ['superset1']
      }} type={'edit'}
      closeForm={() => {
        console.log('form closed')
      }}
      />
    )
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        supersets: {
          superset1: { name: 'superset1' },
          superset2: { name: 'superset2' },
          superset3: { name: 'superset3' },
        },
      },
      editSession: () => {},
      deleteSession: () => {},
    }),
  ]
};