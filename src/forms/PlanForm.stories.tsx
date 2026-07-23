import type { Meta, StoryObj } from '@storybook/react';
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

// export const ExistingExercise: StoryObj<typeof PlanForm> = {
//   name: 'Existing exercise',
//   render: () => {
//     const formData = {};
//     return (
//       <PlanForm data={{
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