export type ExerciseType = {
    exercise: number
    name: string
    targetWeight: number
    targetRep: number
}

export type ExercisePairType = {
    exercise1: ExerciseType,
    exercise2: ExerciseType
}