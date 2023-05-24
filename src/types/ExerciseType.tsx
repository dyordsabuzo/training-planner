export type ExerciseType = {
    exercise: number
    name: string
    targetWeight: number
    targetRep: number
    tags: string
    videoLink: string
    supersets: string
}

export type ExercisePairType = {
    exercise1: ExerciseType,
    exercise2: ExerciseType
}