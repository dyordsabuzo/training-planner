import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";
import { IncrementDecrement } from "./IncrementDecrement";
import dayjs from "dayjs";

const meta: Meta<typeof IncrementDecrement> = {
  title: "components/others/IncrementDecrement",
  component: IncrementDecrement,
};

export default meta;
export const Default: StoryObj<typeof IncrementDecrement> = {
  render: () => {
    const value = 100;
    return (
      <IncrementDecrement
        value={100}
        label={"Increment decrement label"}
        updateValue={(value) => {
          console.log(value);
        }}
      />
    );
  },
  decorators: [],
};

export const ColumnDirection: StoryObj<typeof IncrementDecrement> = {
  render: () => {
    const value = 100;
    return (
      <IncrementDecrement
        value={100}
        label={"Increment decrement label"}
        labelDirection="col"
        updateValue={(value) => {
          console.log(value);
        }}
      />
    );
  },
  decorators: [],
};
