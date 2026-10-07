import { useRef, useState } from "react";
import { faArrowsLeftRight, faGripVertical, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ButtonSelection, IncrementDecrement, Input, ReorderableList, SingleSelect, Toggle } from "@dyordsabuzo/ui-components";
import { SessionGroup } from "../pages/resolveSessionSupersets";

type Props = {
  value: SessionGroup[];
  onChange: (groups: SessionGroup[]) => void;
  exerciseOptions: string[];
};

const newGroup = (index: number): SessionGroup => ({
  name: `Group ${index + 1}`,
  exercises: [],
  sets: 3,
  reps: 10,
  measure: "reps",
  distance: 100,
  percent: 0,
  rpe: 0,
  rest: 60,
  leftRight: false,
});

const iconButtonClass = `min-h-11 min-w-11 flex items-center justify-center rounded-full
  hover:bg-gray-100 dark:hover:bg-gray-700
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`;

// One-line recap of a saved group: "Heavy · Squat, Deadlift · 5 × 5 · 80% · RPE 8".
const summarise = (group: SessionGroup) =>
  [
    group.exercises.join(", "),
    group.measure === "distance"
      ? `${group.sets} × ${group.distance} m`
      : `${group.sets} × ${group.reps}`,
    group.percent ? `${group.percent}%` : null,
    group.rpe ? `RPE ${group.rpe}` : null,
    group.rest ? `${group.rest} s rest` : null,
  ]
    .filter(Boolean)
    .join(" · ");

// Ordered exercise groups for a session. Each group is edited in full until
// it's marked Done, then collapses to a summary. Drag the grip to reorder;
// groups run in the order shown. Percent and RPE are optional (0 = not set).
export const SessionGroupEditor = ({ value, onChange, exerciseOptions }: Props) => {
  // Parallel to `value`: true = collapsed. Groups already in the session start
  // collapsed; groups added in this session start open.
  const [collapsed, setCollapsed] = useState<boolean[]>(() => value.map(() => true));
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const updateGroup = (index: number, group: SessionGroup) =>
    onChange(value.map((g, i) => (i === index ? group : g)));

  const addGroup = () => {
    onChange([...value, newGroup(value.length)]);
    setCollapsed([...collapsed, false]);
  };

  const removeGroup = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setCollapsed(collapsed.filter((_, i) => i !== index));
    setErrors({});
  };

  const setCollapsedAt = (index: number, flag: boolean) =>
    setCollapsed(collapsed.map((c, i) => (i === index ? flag : c)));

  const moveGroup = (from: number, to: number) => {
    if (from === to) return;
    const reorder = <T,>(items: T[]) => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    };
    onChange(reorder(value));
    setCollapsed(reorder(collapsed));
    setErrors({});
  };

  const endDrag = () => {
    setDragFrom(null);
    setDragOver(null);
  };

  const markDone = (index: number) => {
    const group = value[index];
    if (!group.name.trim() || group.exercises.length === 0) {
      setErrors({ ...errors, [index]: "Give the group a name and add at least one exercise." });
      return;
    }
    if (group.measure === "distance" && !group.distance) {
      setErrors({ ...errors, [index]: "Set a distance for this group." });
      return;
    }
    const cleared = { ...errors };
    delete cleared[index];
    setErrors(cleared);
    setCollapsedAt(index, true);
  };

  // The grip starts the drag; the whole group card is the drag image.
  const gripProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragFrom(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      const card = cardRefs.current[index];
      if (card) {
        const rect = card.getBoundingClientRect();
        e.dataTransfer.setDragImage(card, e.clientX - rect.left, e.clientY - rect.top);
      }
    },
    onDragEnd: endDrag,
  });

  const cardProps = (index: number) => ({
    ref: (el: HTMLDivElement | null) => {
      cardRefs.current[index] = el;
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragFrom === null) return;
      e.preventDefault();
      setDragOver(index);
    },
    onDragLeave: () => setDragOver((current) => (current === index ? null : current)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragFrom !== null) moveGroup(dragFrom, index);
      endDrag();
    },
    className: `rounded-md border border-primary-200 dark:border-primary-700 bg-white dark:bg-surface-dark transition-shadow ${
      dragOver === index && dragFrom !== index ? "ring-2 ring-primary" : ""
    } ${dragFrom === index ? "opacity-60" : ""}`,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
          Exercise groups
        </span>
        <Button label="Add group" className="text-xs" onClick={addGroup} />
      </div>

      {value.map((group, index) => {
        const label = group.name || `group ${index + 1}`;
        const grip = (
          <span
            {...gripProps(index)}
            role="button"
            tabIndex={0}
            aria-label={`Drag to reorder ${label}`}
            title="Drag to reorder"
            className="min-h-11 min-w-6 flex items-center justify-center cursor-grab text-text-muted-light dark:text-text-muted-dark"
          >
            <FontAwesomeIcon icon={faGripVertical} />
          </span>
        );

        if (collapsed[index]) {
          return (
            <div
              key={index}
              {...cardProps(index)}
              className={`${cardProps(index).className} flex items-center gap-2 px-2 py-2 bg-primary-50/40 dark:bg-primary-800/20`}
            >
              {grip}
              <div className="grow min-w-0">
                <div className="text-sm font-bold break-words">{group.name}</div>
                <div className="text-xs text-text-muted-light dark:text-text-muted-dark break-words">
                  {summarise(group)}
                </div>
                {group.leftRight && (
                  <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-text-muted-light dark:text-text-muted-dark px-2 py-0.5 text-xs font-medium">
                    <FontAwesomeIcon icon={faArrowsLeftRight} />
                    Left &amp; right · each side
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label={`Edit ${label}`}
                title="Edit group"
                onClick={() => setCollapsedAt(index, false)}
                className={`${iconButtonClass} text-primary dark:text-primary-200`}
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                type="button"
                aria-label={`Remove ${label}`}
                title="Remove group"
                onClick={() => removeGroup(index)}
                className={`${iconButtonClass} text-danger`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          );
        }

        return (
          <div key={index} {...cardProps(index)} className={`${cardProps(index).className} flex flex-col gap-3 p-3`}>
            <div className="flex items-center gap-2">
              {grip}
              <div className="grow">
                <Input
                  value={group.name}
                  placeholder="Group name, e.g. Warm-up"
                  changeValue={(name) => updateGroup(index, { ...group, name })}
                />
              </div>
              <button
                type="button"
                aria-label={`Remove ${label}`}
                title="Remove group"
                onClick={() => removeGroup(index)}
                className={`${iconButtonClass} text-danger`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <SingleSelect
                label="Exercises"
                options={exerciseOptions.filter((name) => !group.exercises.includes(name))}
                selected=""
                onChange={(exercise) =>
                  updateGroup(index, { ...group, exercises: [...group.exercises, exercise] })
                }
                placeholder="Select an exercise to add"
              />
              <ReorderableList
                items={group.exercises}
                onReorder={(exercises) => updateGroup(index, { ...group, exercises })}
                onRemove={(exercise) =>
                  updateGroup(index, {
                    ...group,
                    exercises: group.exercises.filter((name) => name !== exercise),
                  })
                }
                emptyMessage="No exercises added yet"
              />
            </div>

            <Toggle
              label="Left & right (each side)"
              labelDirection="row"
              value={!!group.leftRight}
              toggle={(leftRight: boolean) => updateGroup(index, { ...group, leftRight })}
            />

            <ButtonSelection
              label="Measure"
              options={["Reps", "Distance (m)"]}
              selection={group.measure === "distance" ? "Distance (m)" : "Reps"}
              onSelect={(value: string) =>
                updateGroup(index, { ...group, measure: value === "Reps" ? "reps" : "distance" })
              }
            />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <IncrementDecrement
                label="Sets"
                labelDirection="col"
                value={group.sets}
                nonZero
                updateValue={(sets) => updateGroup(index, { ...group, sets })}
              />
              {group.measure === "distance" ? (
                <IncrementDecrement
                  label="Distance"
                  labelDirection="col"
                  unit="m"
                  value={group.distance ?? 0}
                  nonZero
                  updateValue={(distance) => updateGroup(index, { ...group, distance })}
                />
              ) : (
                <IncrementDecrement
                  label="Reps"
                  labelDirection="col"
                  value={group.reps}
                  nonZero
                  updateValue={(reps) => updateGroup(index, { ...group, reps })}
                />
              )}
              <IncrementDecrement
                label="% weight"
                labelDirection="col"
                unit="%"
                value={group.percent}
                updateValue={(percent) => updateGroup(index, { ...group, percent })}
              />
              <IncrementDecrement
                label="RPE"
                labelDirection="col"
                value={group.rpe}
                updateValue={(rpe) => updateGroup(index, { ...group, rpe })}
              />
              <IncrementDecrement
                label="Rest"
                labelDirection="col"
                unit="s"
                value={group.rest ?? 0}
                updateValue={(rest) => updateGroup(index, { ...group, rest })}
              />
            </div>

            {errors[index] && <span className="text-sm text-danger">{errors[index]}</span>}
            <div className="flex justify-end">
              <Button label="Done" className="text-xs" onClick={() => markDone(index)} />
            </div>
          </div>
        );
      })}

      {value.length === 0 && (
        <span className="text-xs italic text-text-muted-light dark:text-text-muted-dark">
          No groups yet. Add a group to choose its exercises and targets.
        </span>
      )}
    </div>
  );
};
