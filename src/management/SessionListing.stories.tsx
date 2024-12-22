import type { Meta, StoryObj } from '@storybook/react';
import { SessionListing } from './SessionListing';
import { ComponentType } from 'react';
import SourceDataContext from '../context/SourceDataContext';

// const MockContextDecorator = (context, value) => (Story: ComponentType) => (
//   <SourceDataContext.Provider value={value}>
//     <Story />
//   </SourceDataContext.Provider>
// );


const meta: Meta<typeof SessionListing> = {
  title: 'management/SessionListing',
  component: SessionListing,
};

export default meta;
export const EmptyForm: StoryObj<typeof SessionListing> = {
  name: 'Empty plan listing',
  render: () => {
    const formData = [];
    return (
      <SessionListing/>
    )
  },
  decorators: []
};
