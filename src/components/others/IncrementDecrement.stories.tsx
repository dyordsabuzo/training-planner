import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";
import { IncrementDecrement } from "./IncrementDecrement";

const meta: Meta<typeof IncrementDecrement> = {
  title: "components/others/IncrementDecrement",
  component: IncrementDecrement,
};

export default meta;

export const Default: StoryObj<typeof IncrementDecrement> = {
  render: () => {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", {
      name: "Increment decrement label",
    });
    const increment = canvas.getByRole("button", {
      name: "Increase Increment decrement label",
    });

    await expect(input).toHaveValue(100);

    await userEvent.click(increment);
    await expect(input).toHaveValue(101);

    await userEvent.clear(input);
    await userEvent.type(input, "42");
    await userEvent.tab();
    await expect(input).toHaveValue(42);
  },
};

export const ColumnDirection: StoryObj<typeof IncrementDecrement> = {
  render: () => {
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

export const NonZeroFloor: StoryObj<typeof IncrementDecrement> = {
  name: "Disabled at zero (nonZero)",
  render: () => {
    return (
      <IncrementDecrement
        value={0}
        label={"Sets"}
        nonZero
        updateValue={(value) => {
          console.log(value);
        }}
      />
    );
  },
  decorators: [],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const decrement = canvas.getByRole("button", { name: "Decrease Sets" });
    const input = canvas.getByRole("spinbutton", { name: "Sets" });

    await expect(decrement).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, "-5");
    await userEvent.tab();
    await expect(input).toHaveValue(0);
  },
};

export const WithUnit: StoryObj<typeof IncrementDecrement> = {
  name: "With unit suffix",
  render: () => {
    return (
      <IncrementDecrement
        value={30}
        label={"Rest"}
        unit={"s"}
        nonZero
        updateValue={(value) => {
          console.log(value);
        }}
      />
    );
  },
  decorators: [],
};
