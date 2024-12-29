import type { Meta, StoryObj } from "@storybook/react";
import { ButtonSelection } from "./ButtonSelection";

const meta: Meta<typeof ButtonSelection> = {
  title: "components/form/ButtonSelection",
  component: ButtonSelection,
};

export default meta;

export const Default: StoryObj<typeof ButtonSelection> = {
  name: "Basic ButtonSelection",
  render: () => {
    return (
      <ButtonSelection
        onSelect={(value: string) => {
          console.log("ButtonSelection clicked");
        }}
        options={["Option 1", "Option 2", "Option 3"]}
        selection={"Option 2"}
      />
    );
  },
  decorators: [],
};
