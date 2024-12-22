import type { Preview } from "@storybook/react";
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

  tags: ["autodocs"],
};

export default preview;
