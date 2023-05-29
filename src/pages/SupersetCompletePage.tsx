import Button from "../components/Button";

type SupersetCompletePageProps = {
    superset: string,
    nextPageHandler: (flag: boolean) => void
}

const SupersetCompletePage: React.FC<SupersetCompletePageProps> = ({superset, nextPageHandler}) => {
    return (
        <div className={`flex flex-col gap-2`}>
            <div className={`flex flex-col gap-4 shadown-md p-4 border rounded-md`}>
                <h1>SUPERSET {superset} COMPLETE</h1>
            </div>
            <Button label={"NEXT"} clickHandler={nextPageHandler}/>
        </div>
    )
}

export default SupersetCompletePage;