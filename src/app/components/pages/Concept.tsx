import React, {useEffect} from "react";
import {withRouter} from "react-router-dom";
import {connect} from "react-redux";
import {Col, Container, Row} from "reactstrap";
import {fetchDoc} from "../../state/actions";
import {ShowLoading} from "../handlers/ShowLoading";
import {IsaacContent} from "../content/IsaacContent";
import {AppState} from "../../state/reducers";
import {ContentBase, ContentDTO} from "../../../IsaacApiTypes";
import {DOCUMENT_TYPE, EDITOR_URL} from "../../services/constants";
import {NOT_FOUND_TYPE} from "../../../IsaacAppTypes";
import {RelatedContent} from "../elements/RelatedContent";
import {WithFigureNumbering} from "../elements/WithFigureNumbering";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {useNavigation} from "../../services/navigation";
import {NavigationLinks} from "../elements/NavigationLinks";
import {TempExamBoardPicker} from "../elements/inputs/TempExamBoardPicker";
import {EditContentButton} from "../elements/EditContentButton";
import {ShareLink} from "../elements/ShareLink";
import {PrintButton} from "../elements/PrintButton";

const stateToProps = (state: AppState, {match: {params: {conceptId}}}: any) => {
    return {
        urlConceptId: conceptId,
        doc: state && state.doc || null,
        segueEnvironment: state && state.constants && state.constants.segueEnvironment || "unknown",
    };
};
const dispatchToProps = {fetchDoc};

interface ConceptPageProps {
    conceptIdOverride?: string;
    urlConceptId: string;
    doc: ContentDTO | NOT_FOUND_TYPE | null;
    fetchDoc: (documentType: DOCUMENT_TYPE, conceptId: string) => void;
    segueEnvironment: string;
}

const ConceptPageComponent = ({urlConceptId, conceptIdOverride, doc, fetchDoc, segueEnvironment}: ConceptPageProps) => {
    const conceptId = conceptIdOverride || urlConceptId;
    useEffect(() => {
        fetchDoc(DOCUMENT_TYPE.CONCEPT, conceptId)
    }, [conceptId, fetchDoc]);

    const navigation = useNavigation(conceptId);

    return <ShowLoading until={doc} thenRender={doc =>
        <div>
            <Container>
                <TitleAndBreadcrumb
                    intermediateCrumbs={navigation.breadcrumbHistory}
                    currentPageTitle={doc.title as string}
                    collectionType={navigation.collectionType}
                />
                <Row className="no-print">
                    {segueEnvironment === "DEV" && (doc as ContentBase).canonicalSourceFile &&
                    <EditContentButton canonicalSourceFile={EDITOR_URL + (doc as ContentBase)['canonicalSourceFile']} />
                    }
                    <div className="question-actions question-actions-leftmost mt-3">
                        <ShareLink linkUrl={`/concepts/${doc.id}`}/>
                    </div>
                    <div className="question-actions mt-3 not_mobile">
                        <PrintButton/>
                    </div>
                </Row>

                <Row>
                    <Col md={{size: 8, offset: 2}} className="py-4">
                        <TempExamBoardPicker className="text-right" />
                        <WithFigureNumbering doc={doc}>
                            <IsaacContent doc={doc} />
                        </WithFigureNumbering>

                        {/* Superseded notice */}

                        <p>{doc.attribution}</p>

                        <NavigationLinks navigation={navigation} />

                        {doc.relatedContent && <RelatedContent content={doc.relatedContent} parentPage={doc} />}
                    </Col>
                </Row>
            </Container>
        </div>
    }/>;
};

export const Concept = withRouter(connect(stateToProps, dispatchToProps)(ConceptPageComponent));
