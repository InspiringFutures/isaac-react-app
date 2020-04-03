import React, {ChangeEvent, FormEvent, MutableRefObject, useEffect, useRef, useState} from "react";
import {withRouter} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import * as RS from "reactstrap";
import {Col, Container, CustomInput, Form, Input, Label, Row} from "reactstrap";
import queryString from "query-string";
import {fetchConcepts} from "../../state/actions";
import {ShowLoading} from "../handlers/ShowLoading";
import {AppState} from "../../state/reducers";
import {ContentSummaryDTO} from "../../../IsaacApiTypes";
import {History} from "history";
import {LinkToContentSummaryList} from "../elements/list-groups/ContentSummaryListGroupItem";
import {TAG_ID} from "../../services/constants";
import {pushConceptsToHistory} from "../../services/search";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {shortcuts} from "../../services/searchResults";
import {searchResultIsPublic} from "../../services/search"
import {ShortcutResponses} from "../../../IsaacAppTypes";


export const Concepts = withRouter((props: {history: History; location: Location}) => {
    const {location, history} = props;
    const dispatch = useDispatch();
    const user = useSelector((state: AppState) => state && state.user || null);
    const concepts = useSelector((state: AppState) => state && state.concepts && state.concepts.results || null);

    useEffect(() => {
        dispatch(fetchConcepts());
    }, []);

    const searchParsed = queryString.parse(location.search);

    const queryParsed = searchParsed.query || "";
    const query = queryParsed instanceof Array ? queryParsed[0] : queryParsed;

    const filterParsed = (searchParsed.types || (TAG_ID.physics + "," + TAG_ID.maths));
    const filters = (filterParsed instanceof Array ? filterParsed[0] : filterParsed).split(",");

    const physics = filters.includes(TAG_ID.physics);
    const maths = filters.includes(TAG_ID.maths);

    let [searchText, setSearchText] = useState(query);
    let [conceptFilterPhysics, setConceptFilterPhysics] = useState(physics);
    let [conceptFilterMaths, setConceptFilterMaths] = useState(maths);
    let [shortcutResponse, setShortcutResponse] = useState<(ShortcutResponses | ContentSummaryDTO)[]>();

    function doSearch(e?: FormEvent<HTMLFormElement>) {
        if (e) {
            e.preventDefault();
        }
        if (searchText != query || conceptFilterPhysics != physics || conceptFilterMaths != maths) {
            pushConceptsToHistory(history, searchText, conceptFilterPhysics, conceptFilterMaths);
        }
        if (searchText) {
            setShortcutResponse(shortcuts(searchText));
        }
    }

    const timer: MutableRefObject<number | undefined> = useRef();
    useEffect(() => {
        timer.current = window.setTimeout(() => {
            doSearch();
        }, 300);
        return () => {
            clearTimeout(timer.current);
        };
    }, [searchText]);

    useEffect(() => {
        doSearch();
    }, [conceptFilterPhysics, conceptFilterMaths]);

    const searchResults = concepts && concepts.filter(c => c.summary && c.summary.includes(searchText)
        || c.title && c.title.includes(searchText));

    const filteredSearchResults = searchResults &&
        searchResults.filter((result) => result.tags && result.tags.some(t => filters.includes(t)))
            .filter((result) => searchResultIsPublic(result, user));

    const shortcutAndFilteredSearchResults = (shortcutResponse || []).concat(filteredSearchResults || []);

    return (
        <Container id="search-page">
            <Row>
                <Col>
                    <TitleAndBreadcrumb currentPageTitle="Concepts" />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form inline onSubmit={doSearch}>
                        <Input
                            className='search--filter-input mt-4'
                            type="search" value={searchText}
                            placeholder="Search concepts"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                        />
                    </Form>
                </Col>
            </Row>
            <Row>
                <Col className="py-4">
                    <RS.Card>
                        <RS.CardHeader className="search-header">
                            <Col md={5} xs={12}>
                                <h3>
                                    <span className="d-none d-sm-inline-block">Search&nbsp;</span>Results {query != "" ? shortcutAndFilteredSearchResults ? <RS.Badge color="primary">{shortcutAndFilteredSearchResults.length}</RS.Badge> : <RS.Spinner color="primary" /> : null}
                                </h3>
                            </Col>
                            <Col md={7} xs={12}>
                                <Form id="concept-filter" inline className="search-filters">
                                    <Label for="concept-filter" className="d-none d-sm-inline-block">Filter:</Label>
                                    <Label>
                                        <CustomInput id="problem-search" type="checkbox" defaultChecked={conceptFilterPhysics} onChange={(e: ChangeEvent<HTMLInputElement>) => setConceptFilterPhysics(e.target.checked)} />
                                        <span className="sr-only">Show </span>Physics<span className="sr-only"> concept</span>
                                    </Label>
                                    <Label>
                                        <CustomInput id="concept-search" type="checkbox" defaultChecked={conceptFilterMaths} onChange={(e: ChangeEvent<HTMLInputElement>) => setConceptFilterMaths(e.target.checked)} />
                                        <span className="sr-only">Show </span>Maths<span className="sr-only"> concept</span>
                                    </Label>
                                </Form>
                            </Col>
                        </RS.CardHeader>
                        <RS.CardBody>
                            <ShowLoading until={shortcutAndFilteredSearchResults}>
                                {shortcutAndFilteredSearchResults ?
                                    <LinkToContentSummaryList items={shortcutAndFilteredSearchResults} displayTopicTitle={true}/>
                                    : <em>No results found</em>}
                            </ShowLoading>
                        </RS.CardBody>
                    </RS.Card>
                </Col>
            </Row>
        </Container>
    );
});