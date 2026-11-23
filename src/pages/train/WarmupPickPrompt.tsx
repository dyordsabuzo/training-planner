import { useEffect, useState } from "react";
import { Modal } from "@dyordsabuzo/ui-components";
import { useScrollToTopOnClose } from "../../common/useScrollToTopOnClose";
import { pickRandom } from "../resolveSessionSupersets";
import { OUTLINE_PILL, PRIMARY_PILL } from "../others/HeroTile";

export const WARMUP_PICK_COUNT = 4;

type Props = {
  isOpen: boolean;
  // Unit exercises ({ exercise, targetWeight }).
  exercises: any[];
  onPick: (exercises: any[]) => void;
  onFull: () => void;
};

// Asked at the start of a long warm-up: do a random few, or the full list.
// The pick is run-only; the session itself is unchanged.
export const WarmupPickPrompt = ({ isOpen, exercises, onPick, onFull }: Props) => {
  const [picked, setPicked] = useState<any[]>([]);
  useScrollToTopOnClose(isOpen);

  useEffect(() => {
    if (isOpen) setPicked(pickRandom(exercises, WARMUP_PICK_COUNT));
  }, [isOpen, exercises]);

  return (
    <Modal title="WARM-UP" titleClassName="text-xl font-bold" isOpen={isOpen} onClose={onFull}>
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Do {WARMUP_PICK_COUNT} random exercises, or the full list of {exercises.length}?
        </p>
        <ol className="flex flex-col gap-1.5 text-sm font-medium">
          {picked.map((item, index) => (
            <li key={item.exercise?.name ?? index} className="rounded-xl bg-primary-50 dark:bg-primary-800/30 px-3 py-2">
              {item.exercise?.name}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2">
          <button type="button" className={PRIMARY_PILL} onClick={() => onPick(picked)}>
            Do these {WARMUP_PICK_COUNT}
          </button>
          <button
            type="button"
            className={`${OUTLINE_PILL} min-h-12 text-base`}
            onClick={() => setPicked(pickRandom(exercises, WARMUP_PICK_COUNT))}
          >
            Reshuffle
          </button>
          <button type="button" className={`${OUTLINE_PILL} min-h-12 text-base`} onClick={onFull}>
            Full list ({exercises.length})
          </button>
        </div>
      </div>
    </Modal>
  );
};
