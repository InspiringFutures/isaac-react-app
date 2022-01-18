import {ListGroup, ListGroupItem} from "reactstrap";
import {IsaacHintModal} from "./IsaacHintModal";
import React, {useEffect, useState} from "react";
import {ContentDTO} from "../../../IsaacApiTypes";
import {IsaacContent} from "./IsaacContent";
import {AppState} from "../../state/reducers";
import {useDispatch, useSelector} from "react-redux";
import {Tabs} from "../elements/Tabs";
import {logAction} from "../../state/actions";
import {SITE_SUBJECT} from "../../services/siteConstants";

const PrintOnlyHints = ({hints}: {hints?: ContentDTO[]}) => {
    const printHints = useSelector((state: AppState) => state?.printingSettings?.hintsEnabled);
    return <React.Fragment>
        {printHints && hints?.map((hint, index) => (
            <div key={index} className={"question-hints pl-0 py-1 only-print"}>
                <h4>{`Hint ${index + 1}`}</h4>
                <IsaacContent doc={hint}/>
            </div>
        ))}
    </React.Fragment>;
};

interface HintsProps {
    hints?: ContentDTO[];
    questionPartId: string;
}
export const IsaacLinkHints = ({hints, questionPartId}: HintsProps) => {
    const upgradeClient = useSelector((state: AppState) => state?.upgradeClient ?? null);
    const [experimentCondition, setExperimentCondition] = useState<any>()
    useEffect(() => {
        if (upgradeClient) {
            upgradeClient.getExperimentCondition(SITE_SUBJECT, "question", null as any).then(v => setExperimentCondition(v));
        }
    }, [upgradeClient])

    const hintsType = experimentCondition == null ? "AllHints" : experimentCondition.assignedCondition.conditionCode;

    useEffect(() => {
        const start = new Date();
        if (upgradeClient && experimentCondition) {
            upgradeClient.markExperimentPoint("question", hintsType, null as any);
        }
        return () => {
            if (upgradeClient) {
                const end = new Date();
                var difference = new Date();
                difference.setTime(end.getTime() - start.getTime());
                const metrics = [{
                    timestamp: new Date().toISOString(), // Note: Do we need to require this from the user?
                    metrics: {
                        attributes: {
                            durationSeconds: difference.getMilliseconds() * 1000,
                            percentCorrect: Number(50)
                        },
                        groupedMetrics: []
                    }
                }];
                upgradeClient.log(metrics);
            }
        }
    }, [upgradeClient, experimentCondition])

    const filteredHints = hintsType === "AllHints" ? hints : [hints?.[hints?.length || 1 - 1]];
    return <div>
        <ListGroup className="question-hints mb-1 pt-3 mt-3 no-print">
            {filteredHints?.map((hint, index) => <ListGroupItem key={index} className="pl-0 py-1">
                <IsaacHintModal questionPartId={questionPartId} hintIndex={index} label={`Hint ${index + 1}`} title={hint?.title || `Hint ${index + 1}`} body={hint as any} scrollable/>
            </ListGroupItem>)}
        </ListGroup>
        <PrintOnlyHints hints={hints} />
    </div>;
};

export const IsaacTabbedHints = ({hints, questionPartId}: HintsProps) => {
    const dispatch = useDispatch();

    function logHintView(viewedHintIndex: number) {
        if (viewedHintIndex > -1) {
            const eventDetails = {type: "VIEW_HINT", questionId: questionPartId, hintIndex: viewedHintIndex};
            dispatch(logAction(eventDetails));
        }
    }

    return <div className="tabbed-hints">
        {hints && <Tabs onActiveTabChange={logHintView} className="no-print" tabTitleClass="hint-tab-title" tabContentClass="mt-1" deselectable activeTabOverride={-1}>
            {Object.assign({}, ...hints.map((hint, index) => ({
                [`Hint\u00A0${index + 1}`]: <div className="mt-3 mt-lg-4 pt-2">
                    <IsaacContent doc={hint} />
                </div>
            })))}
        </Tabs>}
        <PrintOnlyHints hints={hints} />
    </div>
};
