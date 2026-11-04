import { createElement } from "react";
import type { Preview } from "@storybook/react";
import { UiStyleProvider } from "@dyordsabuzo/ui-components";
import "../src/index.css"; // replace with the name of your tailwind css file
// import * as jest from "jest-mock";
// (window as any).jest = jest;

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators: [(Story) => createElement(UiStyleProvider, { uiStyle: "soft" }, createElement(Story))],

  tags: ["autodocs"],
};

export default preview;
