import React from "react";
import {withRouter} from "react-router-dom";
import {BreadcrumbTrail} from "../elements/BreadcrumbTrail";

interface PageNotFoundProps {readonly location: {readonly pathname: string}}

const PageNotFoundComponent = ({location: {pathname}}: PageNotFoundProps) => {
    return <React.Fragment>
        <div>
            <BreadcrumbTrail currentPageTitle="Unknown page" />
            <h1 className="h-title">Page Not Found</h1>
            <h3 className="my-4">
                <small>
                    {"We're sorry, page not found: "}
                    <code>
                        {pathname}
                    </code>
                </small>
            </h3>
        </div>
    </React.Fragment>;
};

export const NotFound = withRouter(PageNotFoundComponent);