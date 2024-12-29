import { Exercise } from "./Exercise";

// type Exercise = {
//   name: string;
//   targetWeight?: number;
//   videoLink?: string;
// };

type Superset = {
  name: string;
  exercises?: Exercise[];
  targetRep?: number;
  targetSet?: number;
  annotation?: string;
  rest?: number;
};

export type SessionData = {
  plans: any;
  supersets: Superset[];
  week?: number;
};
