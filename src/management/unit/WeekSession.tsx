import { useContext, useEffect, useState } from "react";
import SourceDataContext from "../../context/SourceDataContext";
import { Override } from "./Override";

type Props = {
  data: any;
  plan: any;
  weekData: any;
};

type SourceData = {
  supersets?: {
    [key: string]: any;
  };
};

export const WeekSession = ({ data, plan, weekData }: Props) => {
  // console.log(data);
  // console.log(data, plan, week);

  const [selectedSuperset, setSelectedSuperset] = useState<string>("");
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const sourceDataContext = useContext(SourceDataContext);
  const { sourceData, updateWeekPlan } = sourceDataContext as {
    sourceData: SourceData;
    updateWeekPlan: (plan: string, week: any) => void;
  };
  const supersets = Object.values(sourceData?.supersets || {});
  const [exercises, setExercises] = useState<any[]>([]);

  const overrideSuperset = (data: any) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => value !== 0)
    );

    const currentOverrides = weekData.overrides || {};
    const currentSupersetOverrides = currentOverrides?.supersets || {};

    const overrides = {
      ...currentOverrides,
      supersets: {
        ...currentSupersetOverrides,
        [selectedSuperset]: {
          name: selectedSuperset,
          ...filteredData,
        },
      },
    };

    updateWeekPlan(plan.name, {
      ...weekData,
      overrides,
    });
  };

  const overrideExercise = (data: any) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => value !== 0)
    );

    const currentOverrides = weekData.overrides || {};
    const currentSupersetOverrides = currentOverrides?.supersets || {};
    const currentExerciseOverrides =
      currentSupersetOverrides?.[selectedSuperset]?.exercises || {};

    const overrides = {
      ...currentOverrides,
      supersets: {
        ...currentSupersetOverrides,
        [selectedSuperset]: {
          ...currentSupersetOverrides?.[selectedSuperset],
          exercises: {
            ...currentExerciseOverrides,
            [selectedExercise]: {
              name: selectedExercise,
              ...filteredData,
            },
          },
        },
      },
    };

    updateWeekPlan(plan.name, {
      ...weekData,
      overrides,
    });
  };

  useEffect(() => {
    if (selectedSuperset) {
      const superset = supersets.find((s: any) => s.name === selectedSuperset);
      setExercises(superset?.exercises || []);
    } else {
      setExercises([]);
    }
  }, [selectedSuperset]);

  return (
    <div
      className={`
        mt-2 flex flex-col
        border border-1 rounded-sm
        px-2 py-1
        `}
    >
      <span className={`font-bold py-2`}>{data.name}</span>

      <div className={`flex flex-wrap gap-1 py-2`}>
        {data.supersets.map((superset: any) => (
          <div
            className={`
            border border-1
            px-2 py-1
            rounded-lg
            cursor-pointer
            ${selectedSuperset === superset ? "bg-blue-500 text-white" : "bg-white text-blue-500"}
            `}
            key={superset}
            onClick={() => {
              setSelectedSuperset(superset);
              setSelectedExercise("");
            }}
          >
            <span>{superset}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {selectedSuperset && !selectedExercise && (
          <Override
            handleOverride={(data: any) => {
              overrideSuperset(data);
            }}
          />
        )}
        <div className={`flex flex-wrap gap-1 py-2`}>
          {exercises.map((exercise: any) => (
            <div
              className={`
            border border-1
            px-2 py-1
            rounded-lg
            ${selectedExercise === exercise ? "bg-green-500 text-white" : "bg-white text-green-500"}
            cursor-pointer
            `}
              key={exercise}
              onClick={() => setSelectedExercise(exercise)}
            >
              <span>{exercise}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {selectedExercise && (
          <Override
            handleOverride={(data: any) => {
              overrideExercise(data);
            }}
          />
        )}
      </div>
    </div>
  );
};
