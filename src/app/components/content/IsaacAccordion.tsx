import React from "react";
import {ContentDTO} from "../../../IsaacApiTypes";
import {Accordion} from "../elements/Accordion";
import {IsaacContent} from "./IsaacContent";
import {isIntendedAudience, mergeDisplayOptions, useUserContext} from "../../services/userContext";
import {useSelector} from "react-redux";
import {selectors} from "../../state/selectors";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {AppState} from "../../state/reducers";
import {resourceFound} from "../../services/validation";
import {DOCUMENT_TYPE} from "../../services/constants";

const defaultConceptDisplay = {
    [SITE.PHY]: {audience: ["closed"], nonAudience: ["de-emphasised", "closed"]},
    [SITE.CS]: {audience: ["closed"], nonAudience: ["de-emphasised", "closed"]}
}[SITE_SUBJECT];
const defaultQuestionDisplay = {audience: [], nonAudience: []};

function stringifyAudience(audience: ContentDTO["audience"]): string {
    // return audience?.map(audienceObject => Object.values(audienceObject).map(values => values.join(", ")).join(" AND ")).join(" OR ") || "All"
    return audience?.map(audienceObject => audienceObject.stage?.join(", ")).join(" OR ") || "All"; // Stage only
}

interface SectionWithDisplaySettings extends ContentDTO {
    startOpen?: boolean;
    deEmphasised?: boolean;
    hidden?: boolean;
}
export const IsaacAccordion = ({doc}: {doc: ContentDTO}) => {
    const page = useSelector((state: AppState) => (state && state.doc) || null);
    const user = useSelector(selectors.user.orNull);
    const userContext = useUserContext();

    // Select different default display depending on page type
    const defaultDisplay = resourceFound(page) && page.type === DOCUMENT_TYPE.CONCEPT ? defaultConceptDisplay : defaultQuestionDisplay;
    const accordionDisplay = mergeDisplayOptions(defaultDisplay, doc.display);

    return <div className="isaac-accordion">
        {(doc.children as SectionWithDisplaySettings[] | undefined)

            // We take the doc's children's index as a key for each section so that react is not confused between filtering/reordering.
            ?.map((section, index) => ({...section, sectionIndex: index}))

            // For CS we want relevant sections to appear first
            .sort((sectionA, sectionB) => {
                if (SITE_SUBJECT !== SITE.CS) {return 0;}
                const isAudienceA = isIntendedAudience(sectionA.audience, userContext, user);
                const isAudienceB = isIntendedAudience(sectionB.audience, userContext, user);
                return isAudienceA === isAudienceB ? 0 : isAudienceB ? 1 : -1;
            })

            // Handle conditional display settings
            .map(section => {
                let sectionDisplay = mergeDisplayOptions(accordionDisplay, section.display);
                const sectionDisplaySettings = isIntendedAudience(section.audience, userContext, user) ?
                        sectionDisplay?.["audience"] : sectionDisplay?.["nonAudience"];
                if (sectionDisplaySettings?.includes("open")) {section.startOpen = true;}
                if (sectionDisplaySettings?.includes("closed")) {section.startOpen = false;}
                if (sectionDisplaySettings?.includes("de-emphasised")) {section.deEmphasised = true;}
                if (sectionDisplaySettings?.includes("hidden")) {section.hidden = true;}
                return section;
            })

            // If cs have show other content set to false hide non-audience content
            .map(section => {
                if (
                    SITE_SUBJECT === SITE.CS && userContext.showOtherContent === false &&
                    !isIntendedAudience(section.audience, userContext, user)
                ) {
                    section.hidden = true;
                }
                return section;
            })

            // Filter out hidden sections before they mess up indexing
            .filter(section => !section.hidden)

            .map((section , index) =>
                <Accordion
                    key={`${section.sectionIndex} ${index}`} id={section.id} index={index}
                    startOpen={section.startOpen} deEmphasised={section.deEmphasised}
                    trustedTitle={section?.title || ""} audienceString={stringifyAudience(section.audience)}
                >
                    <IsaacContent doc={section} />
                </Accordion>
            )}
    </div>;
};
