import {Col, Container} from "reactstrap";
import React from "react";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {STUDENTS_CRUMB} from "../../../services/constants";
import {PageFragment} from "../../elements/PageFragment";

export const SolvingPhysProblems = () => {

    const pageHelp = <span>
        The Isaac Physics Guide to Solving Physics Problems
    </span>;

    return <Container className="physics">
        <Col>
            <div className="book-intro">
                <TitleAndBreadcrumb className="mb-5" currentPageTitle="How To Solve Physics Problems" intermediateCrumbs={[STUDENTS_CRUMB]} help={pageHelp} />
                <PageFragment fragmentId="solve_physics_problems_intro"/>
            </div>
        </Col>
    </Container>
};
