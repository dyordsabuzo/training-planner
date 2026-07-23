import type { Meta, StoryObj } from '@storybook/react';
import { SupersetListing } from './SupersetListing';
import { ComponentType } from 'react';
import SourceDataContext from '../context/SourceDataContext';

// const MockContextDecorator = (context, value) => (Story: ComponentType) => (
//   <SourceDataContext.Provider value={value}>
//     <Story />
//   </SourceDataContext.Provider>
// );


const meta: Meta<typeof SupersetListing> = {
  title: 'management/SupersetListing',
  component: SupersetListing,
};

export default meta;
export const EmptyForm: StoryObj<typeof SupersetListing> = {
  name: 'Empty plan listing',
  render: () => {
    const formData = [];
    return (
      <SupersetListing/>
    )
  },
  decorators: []
};
