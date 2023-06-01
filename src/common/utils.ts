export const sortData = (data: any) => {
    return Object.keys(data).sort()
        .reduce((accumulator: any, key: string) => {
            accumulator[key] = data[key];
            return accumulator
        }, {})
}