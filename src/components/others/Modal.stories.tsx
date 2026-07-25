import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./Modal";
import { Button } from "../form/Button";

const meta: Meta<typeof Modal> = {
  title: "components/others/Modal",
  component: Modal,
};

export default meta;

export const Default: StoryObj<typeof Modal> = {
  name: "Modal",
  render: () => {
    const ModalDemo = () => {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <>
          <Button label="Open modal" onClick={() => setIsOpen(true)} />
          <Modal
            title="Deactivate account"
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          >
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">
              Are you sure you want to deactivate your account? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                decoration="cancel"
                label="Cancel"
                onClick={() => setIsOpen(false)}
              />
              <Button
                decoration="delete"
                label="Deactivate"
                onClick={() => setIsOpen(false)}
              />
            </div>
          </Modal>
        </>
      );
    };
    return <ModalDemo />;
  },
  decorators: [],
};
