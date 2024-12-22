import type { Meta, StoryObj } from '@storybook/react';
import { SessionForm } from './SessionForm';

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

// export const ExistingExercise: StoryObj<typeof SessionForm> = {
//   name: 'Existing exercise',
//   render: () => {
//     const formData = {};
//     return (
//       <SessionForm data={{
//         id: '123abc',
//         name: 'Sample exercise',
//         videoLink: '',
//         tags: ['tag1', 'tag2'],
//         targetRep: "",
//         targetSet: "",
//         rest: "",
//         supersets: ['superset1'],
//         alternatives: []
//       }} type={''} 
//       closeForm={() => {
//         console.log('form closed')
//       }}      
//       />
//     )
//   },
//   decorators: []
// };