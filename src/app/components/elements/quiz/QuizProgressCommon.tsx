import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "reactstrap";
import { IsaacQuizSectionDTO, Mark, QuizAssignmentDTO, QuizUserFeedbackDTO } from "../../../../IsaacApiTypes";
import { PageSettings } from "../../../../IsaacAppTypes";
import { isQuestion } from "../../../services/questions";
import { SITE, SITE_SUBJECT } from "../../../services/siteConstants";
import { closeActiveModal, openActiveModal } from "../../../state/actions";
import { returnQuizToStudent } from "../../../state/actions/quizzes";
import { IsaacSpinner } from "../../handlers/IsaacSpinner";

export const ICON = {
    [SITE.CS]: {
        correct: <img src="/assets/tick-rp.svg" alt="Correct" style={{width: 30}} />,
        incorrect: <img src="/assets/cross-rp.svg" alt="Incorrect" style={{width: 30}} />,
        notAttempted: <img src="/assets/dash.svg" alt="Not attempted" style={{width: 30}} />,
    },
    [SITE.PHY]: {
        correct: <svg style={{width: 30, height: 30}}><use href={`/assets/tick-rp-hex.svg#icon`} xlinkHref={`/assets/tick-rp-hex.svg#icon`}/></svg>,
        incorrect: <svg style={{width: 30, height: 30}}><use href={`/assets/cross-rp-hex.svg#icon`} xlinkHref={`/assets/cross-rp-hex.svg#icon`}/></svg>,
        notAttempted: <svg  style={{width: 30, height: 30}}><use href={`/assets/dash-hex.svg#icon`} xlinkHref={`/assets/dash-hex.svg#icon`}/></svg>,
    }
}[SITE_SUBJECT];

interface ResultsTableProps {
    assignment: QuizAssignmentDTO;
    pageSettings: PageSettings;
}

interface ResultRowProps {
    pageSettings: PageSettings;
    row: QuizUserFeedbackDTO;
    assignment: QuizAssignmentDTO;
}

export function questionsInSection(section?: IsaacQuizSectionDTO) {
    return section?.children?.filter(child => isQuestion(child)) || [];
}

export const passMark = 0.75;

export function markQuestionClasses(row: QuizUserFeedbackDTO, mark: Mark | undefined, totalOrUndefined: number | undefined) {
    if (!row.user?.authorisedFullAccess) {
        return "revoked";
    }

    const correct = mark?.correct as number;
    const incorrect = mark?.incorrect as number;
    const total = totalOrUndefined as number;

    if (correct === total) {
        return "completed";
    } else if ((correct / total) >= passMark) {
        return "passed";
    } else if ((incorrect / total) > (1 - passMark)) {
        return "failed";
    } else if (correct > 0 || incorrect > 0) {
        return "in-progress";
    } else {
        return "not-attempted";
    }
}

export function formatMark(numerator: number, denominator: number, formatAsPercentage: boolean) {
    let result;
    if (formatAsPercentage) {
        result = denominator !== 0 ? Math.round(100 * numerator / denominator) + "%" : "100%";
    } else {
        result = numerator + "/" + denominator;
    }
    return result;
}

export function ResultRow({pageSettings, row, assignment}: ResultRowProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [working, setWorking] = useState(false);
    const dispatch = useDispatch();

    const toggle = () => setDropdownOpen(prevState => !prevState);

    const returnToStudent = async () => {
        dispatch(openActiveModal({
            closeAction: () => {
                dispatch(closeActiveModal())
            },
            title: "Allow another attempt?",
            body: "This will allow the student to attempt the test again.",
            buttons: [
                <Button key={1} color="primary" outline target="_blank" onClick={() => {dispatch(closeActiveModal())}}>
                    Cancel
                </Button>,
                <Button key={0} color="primary" target="_blank" onClick={_returnToStudent}>
                    Confirm
                </Button>,
        ]
        }));    
    }

    const _returnToStudent = async () => {
        try {
            setWorking(true);
            await dispatch(returnQuizToStudent(assignment.id as number, row.user?.id as number));
        } finally {
            setWorking(false);
            dispatch(closeActiveModal());
        }
    };

    const quiz = assignment?.quiz;
    const sections: IsaacQuizSectionDTO[] = quiz?.children || [];

    let message;
    if (!row.user?.authorisedFullAccess) {
        message = "Not sharing";
    } else if (!row.feedback?.complete) {
        message = "Not completed";
    }
    const valid = message === undefined;
    return <tr className={`${row.user?.authorisedFullAccess ? "" : " not-authorised"}`} title={`${row.user?.givenName + " " + row.user?.familyName}`}>
        <th className="student-name">
            {valid ?
                <>
                    <Button color="link" onClick={toggle} disabled={working}>
                        <div
                            tabIndex={0}
                            className="btn quiz-student-menu"
                            data-toggle="dropdown"
                            aria-expanded={dropdownOpen}
                        >
                            {row.user?.givenName}
                            <span className="d-none d-lg-inline"> {row.user?.familyName}</span>
                            <span className="quiz-student-menu-icon">
                            {working ? <IsaacSpinner size="sm" /> : <img src="/assets/menu.svg" alt="Menu" />}
                        </span>
                        </div>
                    </Button>
                    {!working && dropdownOpen && <div className="py-2 px-3">
                        <Button size="sm" onClick={returnToStudent}>Allow another attempt</Button>
                    </div>}
                </>
            :   <>
                    {row.user?.givenName}
                    <span className="d-none d-lg-inline"> {row.user?.familyName}</span>
                </>
            }
        </th>
        {!valid && <td colSpan={sections.map(questionsInSection).flat().length + 1}>{message}</td>}
        {valid && <>
            {sections.map(section => {
                const mark = row.feedback?.sectionMarks?.[section.id as string];
                const outOf = quiz?.sectionTotals?.[section.id as string];
                return questionsInSection(section).map(question => {
                    const questionMark = row.feedback?.questionMarks?.[question.id as string] || {} as Mark;
                    const icon =
                        questionMark.correct === 1 ? ICON.correct :
                        questionMark.incorrect === 1 ? ICON.incorrect :
                        /* default */ ICON.notAttempted;
                    return <td key={question.id} className={markQuestionClasses(row, mark, outOf)}>
                        {icon}
                    </td>
                }).flat()
            })}
            <td className="total-column">
                {formatMark(row.feedback?.overallMark?.correct as number, quiz?.total as number, pageSettings.formatAsPercentage)}
            </td>
        </>}
    </tr>;
}

export function ResultsTable({assignment, pageSettings}: ResultsTableProps) {
    const sections: IsaacQuizSectionDTO[] = assignment.quiz?.children || [];

    return <table className="progress-table w-100 mb-5 border">
        <tbody>
            <tr className="bg-white">
                <th>&nbsp;</th>
                {sections.map(section => <th key={section.id} colSpan={questionsInSection(section).length} className="border font-weight-bold">
                    {section.title}
                </th>)}
                <th rowSpan={2} className="border-bottom">Overall</th>
            </tr>
            <tr className="bg-white">
                <th className="bg-white border-bottom">&nbsp;</th>
                {sections.map(section => questionsInSection(section).map((question, index) => <th key={question.id} className="border">
                    {`Q${index + 1}`}
                </th>)).flat()}
            </tr>
            {assignment.userFeedback?.map(row =>
                <ResultRow key={row.user?.id} pageSettings={pageSettings} row={row} assignment={assignment} />
            )}
        </tbody>
    </table>;
}