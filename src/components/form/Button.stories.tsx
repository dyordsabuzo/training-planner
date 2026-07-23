import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";
import { Button } from "./Button";
import dayjs from "dayjs";

const meta: Meta<typeof Button> = {
  title: "components/form/Button",
  component: Button,
};

export default meta;

export const Default: StoryObj<typeof Button> = {
  name: "Basic button",
  render: () => {
    return (
      <Button
        label={"Basic button"}
        onClick={() => {
          console.log("button clicked");
        }}
      />
    );
  },
  decorators: [],
};

export const TextOnly: StoryObj<typeof Button> = {
  name: "Text only button",
  render: () => {
    return (
      <Button
        label={"Text only button"}
        decoration="text-only"
        onClick={() => {
          console.log("button clicked");
        }}
      />
    );
  },
  decorators: [],
};
