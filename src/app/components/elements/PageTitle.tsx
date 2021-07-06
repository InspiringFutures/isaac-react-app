import React, {ReactElement, useEffect, useRef} from "react";
import {Button, UncontrolledTooltip} from "reactstrap";
import {SITE, SITE_SUBJECT, SITE_SUBJECT_TITLE} from "../../services/siteConstants";
import {closeActiveModal, openActiveModal, setMainContentId} from "../../state/actions";
import {useDispatch, useSelector} from "react-redux";
import {AppState} from "../../state/reducers";
import {PageFragment} from "./PageFragment";
import {LaTeX} from "./LaTeX";

export interface PageTitleProps {
    currentPageTitle: string;
    subTitle?: string;
    help?: string | ReactElement;
    className?: string;
    level?: number;
    modalId?: string;
}

export const PageTitle = ({currentPageTitle, subTitle, help, className, level, modalId}: PageTitleProps) => {
    const dispatch = useDispatch();
    const openModal = useSelector((state: AppState) => Boolean(state?.activeModals?.length));
    const headerRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {dispatch(setMainContentId("main-heading"));}, []);
    useEffect(() => {
        document.title = currentPageTitle + " — Isaac " + SITE_SUBJECT_TITLE;
        const element = headerRef.current;
        if (element && (window as any).followedAtLeastOneSoftLink && !openModal) {
            element.focus();
        }
    }, [currentPageTitle]);

    interface HelpModalProps {
        modalId: string;
    }

    const HelpModal = (props: HelpModalProps) => {
        return <>
            <PageFragment fragmentId={props.modalId}/>
        </>
    };

    const openHelpModal = (modalId: string) => {
        dispatch(openActiveModal({
            closeAction: () => {dispatch(closeActiveModal())},
            size: "xl",
            title: "Help",
            body: <HelpModal modalId={modalId}/>
        }))
    };

    return <h1 id="main-heading" tabIndex={-1} ref={headerRef} className={`h-title h-secondary${className ? ` ${className}` : ""}`}>
        <LaTeX markup={currentPageTitle} />
        {SITE_SUBJECT === SITE.PHY && level !== undefined && level !== 0 &&
            <span className="float-right h-subtitle">Level {level}</span>}
        {help && <span id="title-help">Help</span>}
        {help && <UncontrolledTooltip target="#title-help" placement="bottom">{help}</UncontrolledTooltip>}
        {modalId && <Button color="link" id="title-help-modal" onClick={() => openHelpModal(modalId)}>Help</Button>}
        {subTitle && <span className="h-subtitle d-none d-sm-block">{subTitle}</span>}
    </h1>
};
