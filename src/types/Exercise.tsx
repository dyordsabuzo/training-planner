export type Exercise = {
  name: string;
  videoLink?: string;
  tags?: string[];
};

export type ExerciseSuperset = {
  exercise: Exercise;
  targetRep?: number;
  targetWeight?: number;
  targetTimeInSeconds?: number;
};

export type Superset = {
  name: string;
  exercises: ExerciseSuperset[];
  numberOfSets: number;
};

export type Session = {
  sessionNumber: number;
  supersets: Superset[];
  annotation: string;
};

export type Plan = {
  name: string;
  sessions: Session[];
};
