import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import * as RS from "reactstrap";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {Link, withRouter} from "react-router-dom";
import tags from '../../services/tags';
import {
    DIFFICULTY_ITEM_OPTIONS,
    EXAM_BOARD_ITEM_OPTIONS,
    NOT_FOUND,
    QUESTION_CATEGORY_ITEM_OPTIONS,
    STAGE,
    TAG_ID,
    QUESTION_FINDER_CONCEPT_LABEL_PLACEHOLDER,
    DIFFICULTY_ICON_ITEM_OPTIONS
} from '../../services/constants';
import {Tag} from "../../../IsaacAppTypes";
import {GameboardViewer} from './Gameboard';
import {fetchConcepts, generateTemporaryGameboard, loadGameboard} from '../../state/actions';
import {ShowLoading} from "../handlers/ShowLoading";
import {selectors} from "../../state/selectors";
import queryString from "query-string";
import {useHistory} from "react-router-dom";
import {HierarchyFilterHexagonal, HierarchyFilterSummary, Tier} from "../elements/svg/HierarchyFilter";
import {Item, unwrapValue, isItemEqual} from "../../services/select";
import {useDeviceSize} from "../../services/device";
import Select, {GroupedOptionsType} from "react-select";
import {getFilteredExamBoardOptions, getFilteredStageOptions, useUserContext} from "../../services/userContext";
import {DifficultyFilter} from "../elements/svg/DifficultyFilter";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {groupTagSelectionsByParent} from "../../services/gameboardBuilder";
import {AppState} from "../../state/reducers";
import {ContentSummaryDTO} from "../../../IsaacApiTypes";
import {debounce} from "lodash";
import {History} from "history";
import {Dispatch} from "redux";
import {IsaacSpinner} from "../handlers/IsaacSpinner";
import {siteSpecific} from "../../services/miscUtils";

function itemiseByValue<R extends {value: string}>(values: string[], options: R[]) {
    return options.filter(option => values.includes(option.value));
}
function itemiseTag(tag: Tag) {
    return {value: tag.id, label: tag.title}
}

function itemiseConcepts(concepts: string[]): Item<string>[] {
    return concepts
        .filter(concept => concept !== "")
        .map(concept => ({label: QUESTION_FINDER_CONCEPT_LABEL_PLACEHOLDER, value: concept}));
}

function toCSV<T>(items: Item<T>[]) {
    return items.map(item => item.value).join(",");
}

function arrayFromPossibleCsv(queryParamValue: string[] | string | null | undefined) {
    if (queryParamValue) {
        return queryParamValue instanceof Array ? queryParamValue : queryParamValue.split(",");
    } else {
        return [];
    }
}

interface QueryStringResponse {
    querySelections: Item<TAG_ID>[][];
    queryStages: Item<string>[];
    queryDifficulties: Item<string>[];
    queryQuestionCategories: Item<string>[];
    queryConcepts: Item<string>[];
    queryExamBoards: Item<string>[];
}
function processQueryString(query: string): QueryStringResponse {
    const {subjects, fields, topics, stages, difficulties, questionCategories, concepts, examBoards} = queryString.parse(query);
    const tagHierarchy = tags.getTagHierarchy();

    const stageItems = itemiseByValue(arrayFromPossibleCsv(stages), getFilteredStageOptions());
    const difficultyItems = itemiseByValue(arrayFromPossibleCsv(difficulties), DIFFICULTY_ITEM_OPTIONS);
    const examBoardItems = itemiseByValue(arrayFromPossibleCsv(examBoards), EXAM_BOARD_ITEM_OPTIONS);
    const questionCategoryItems = itemiseByValue(arrayFromPossibleCsv(questionCategories), QUESTION_CATEGORY_ITEM_OPTIONS);
    const conceptItems = itemiseConcepts(arrayFromPossibleCsv(concepts))

    const selectionItems: Item<TAG_ID>[][] = [];
    let plausibleParentHierarchy = true;
    [subjects, fields, topics].forEach((tier, index) => {
        if (tier && plausibleParentHierarchy) {
            const validTierTags = tags
                .getSpecifiedTags(tagHierarchy[index], (tier instanceof Array ? tier : tier.split(",")) as TAG_ID[]);
            // Only allow another layer of specificity if only one parent is selected, or if the site is CS (in which case give all layers)
            plausibleParentHierarchy = validTierTags.length === 1 || SITE_SUBJECT === SITE.CS;
            selectionItems.push(validTierTags.map(itemiseTag));
        }
    });

    return {
        querySelections: selectionItems, queryStages: stageItems, queryDifficulties: difficultyItems, queryQuestionCategories: questionCategoryItems, queryConcepts: conceptItems, queryExamBoards: examBoardItems
    }
}

function generatePhyBoardName(selections: Item<TAG_ID>[][]) {
    let boardName = "Physics, Maths & Chemistry";
    let selectionIndex = selections.length;
    while(selectionIndex-- > 0) {
        if (selections[selectionIndex].length === 1) {
            boardName = selections[selectionIndex][0].label;
            break;
        }
    }
    return boardName;
}

function generateCSBoardName(selections: Item<TAG_ID>[][]) {
    let boardName = "Computer Science";
    let selectionIndex = selections.length;
    while(selectionIndex-- > 0) {
        if (selections[selectionIndex].length > 0 && selections[selectionIndex].length <= 2) {
            boardName = selections[selectionIndex].map(s => s.label).join(" & ");
            break;
        }
    }
    return boardName;
}

// Shared props that both PHY and CS question filters use
interface FilterProps {
    selections : Item<TAG_ID>[][];
    setSelections : React.Dispatch<React.SetStateAction<Item<TAG_ID>[][]>>;
    stages : Item<string>[];
    setStages : React.Dispatch<React.SetStateAction<Item<string>[]>>;
    difficulties : Item<string>[];
    setDifficulties : React.Dispatch<React.SetStateAction<Item<string>[]>>;
}

interface PhysicsFilterProps extends FilterProps {
    tiers: Tier[];
    choices: Item<TAG_ID>[][];
}
const PhysicsFilter = ({tiers, choices, selections, setSelections, stages, setStages, difficulties, setDifficulties} : PhysicsFilterProps) => {

    function setTierSelection(tierIndex: number) {
        return ((values: Item<TAG_ID>[]) => {
            const newSelections = selections.slice(0, tierIndex);
            newSelections.push(values);
            setSelections(newSelections);
        }) as React.Dispatch<React.SetStateAction<Item<TAG_ID>[]>>;
    }

    return <RS.Row className="mb-sm-4">
        <RS.Col xs={12}>
            <div className="mb-1"><strong>Click these buttons to choose your question gameboard</strong></div>
        </RS.Col>
        <RS.Col lg={4}>
            <div>
                <RS.Label className={`mt-2 mt-lg-0`} htmlFor="stage-selector">
                    I am interested in stage...
                    <span id={`stage-help-tooltip`} className="icon-help ml-1" />
                    <RS.UncontrolledTooltip target={`stage-help-tooltip`} placement="bottom">
                        {"Find questions that are suitable for this stage of school learning."} <br />
                        {"Further\u00A0A covers Further\u00A0Maths concepts or topics a little beyond some A\u00A0Level syllabuses."}
                    </RS.UncontrolledTooltip>
                </RS.Label>
                <Select id="stage-selector" onChange={unwrapValue(setStages)} value={stages} options={getFilteredStageOptions()} />
            </div>
            {/*<div>*/}
            {/*    <RS.Label className={`mt-2 mt-lg-3`} htmlFor="question-category-selector">*/}
            {/*        I would like some questions from Isaac to...*/}
            {/*    </RS.Label>*/}
            {/*    <Select id="question-category-selector" isClearable onChange={unwrapValue(setQuestionCategories)} value={questionCategories} options={QUESTION_CATEGORY_ITEM_OPTIONS} />*/}
            {/*</div>*/}
            <div>
                <RS.Label className={`mt-2  mt-lg-3`} htmlFor="difficulty-selector">
                    I would like questions for...
                    <span id={`difficulty-help-tooltip`} className="icon-help ml-1" />
                    <RS.UncontrolledTooltip target={`difficulty-help-tooltip`} placement="bottom" >
                        Practice questions let you directly apply one idea -<br />
                        P1 covers revision of a previous stage or topics near the beginning of a course,<br />
                        P3 covers later topics.<br />
                        Challenge questions are solved by combining multiple concepts and creativity.<br />
                        C1 can be attempted near the beginning of your course,<br />
                        C3 require more creativity and could be attempted later in a course.
                    </RS.UncontrolledTooltip>
                </RS.Label>
                <DifficultyFilter difficultyOptions={DIFFICULTY_ITEM_OPTIONS} difficulties={difficulties} setDifficulties={setDifficulties} />
                {/*<Select id="difficulty-selector" onChange={unwrapValue(setDifficulties)} isClearable isMulti value={difficulties} options={DIFFICULTY_ITEM_OPTIONS} />*/}
            </div>
        </RS.Col>
        <RS.Col lg={8}>
            <RS.Label className={`mt-4 mt-lg-0`}>
                Topics:
            </RS.Label>
            <HierarchyFilterHexagonal {...{tiers, choices, selections, setTierSelection}} />
        </RS.Col>
    </RS.Row>;
}

// Takes a list of "raw" concepts, and returns a map which takes a tag Item, and gives a GroupedOptionsType<Item<string>> containing itemised concepts which relate to that tag
const itemiseAndGroupConceptsByTag = (conceptDTOs : ContentSummaryDTO[]) => ((tag : Item<TAG_ID>) => {
    return {
        label: tag.label,
        options: conceptDTOs.reduce((acc : Item<string>[], dto) =>
            (dto.tags?.includes(tag.value) && dto.id && dto.title)
                ? [...acc, {value: dto.id, label: dto.title}]
                : acc,
            [])
    }
});
interface CSFilterProps extends FilterProps {
    examBoards : Item<string>[];
    setExamBoards : React.Dispatch<React.SetStateAction<Item<string>[]>>;
    concepts : Item<string>[];
    setConcepts : React.Dispatch<React.SetStateAction<Item<string>[]>>;
}
const CSFilter = ({selections, setSelections, stages, setStages, difficulties, setDifficulties, examBoards, setExamBoards, concepts, setConcepts} : CSFilterProps) => {
    const dispatch = useDispatch();

    const topicChoices = tags.allSubcategoryTags.map(groupTagSelectionsByParent);
    const conceptDTOs = useSelector((state: AppState) => selections[2]?.length > 0 ? state?.concepts?.results : undefined);
    const [conceptChoices, setConceptChoices] = useState<GroupedOptionsType<Item<string>>>([]);

    const selectedTopics = selections[2];
    useEffect(() => {
        if (selectedTopics) {
            dispatch(fetchConcepts(undefined, toCSV(selectedTopics)));
        }
    }, [dispatch, selectedTopics]);
    useEffect(function updateConceptChoices() {
        const newChoices = selectedTopics?.map(itemiseAndGroupConceptsByTag(conceptDTOs ?? [])) ?? [];
        setConceptChoices(newChoices);
        const availableConcepts = newChoices.flatMap(c => c.options);
        if (availableConcepts.length > 0) {
            const conceptsFilteredByAvailable = concepts.filter(c => availableConcepts.find(ac => isItemEqual(Object.is, ac, c)) !== undefined);
            if (concepts.filter(c => c.label === QUESTION_FINDER_CONCEPT_LABEL_PLACEHOLDER).length > 0) {
                setConcepts(concepts.reduce((acc: Item<string>[], c) => {
                    const newLabel = availableConcepts.find(ac => ac.value === c.value)?.label;
                    return newLabel ? acc.concat([{value: c.value, label: newLabel}]) : acc;
                }, []));
            } else if (conceptsFilteredByAvailable.length !== concepts.length) {
                setConcepts(conceptsFilteredByAvailable);
            }
        }
    }, [conceptDTOs, concepts]);

    function setTierSelection(topics: Item<TAG_ID>[]) {
        let strands : Set<Tag> = new Set();
        topics.forEach(t => {
            const parent = tags.getById(t.value).parent;
            if (parent) {
                strands = strands.add(tags.getById(parent));
            }
        });
        // Selections always have all 3 tiers in CS
        setSelections([[itemiseTag(tags.getById(TAG_ID.computerScience))], Array.from(strands).map(itemiseTag), topics])
    }

    return <>
        <RS.Row>
            <RS.Col md={6}>
                <RS.Label className={`mt-2 mt-lg-0`} htmlFor="stage-selector">
                    I am interested in stage...
                    <span id={`stage-help-tooltip`} className="icon-help ml-1" />
                    <RS.UncontrolledTooltip target={`stage-help-tooltip`} placement="bottom">
                        {"Find questions that are suitable for this stage of school learning."}
                    </RS.UncontrolledTooltip>
                </RS.Label>
                <Select id="stage-selector" onChange={unwrapValue(setStages)} value={stages} options={getFilteredStageOptions()} />
            </RS.Col>
            <RS.Col md={6}>
                <RS.Label className={`mt-2 mt-lg-0`} htmlFor="exam-boards">
                    and exam board...
                </RS.Label>
                <Select
                    inputId="exam-boards" isClearable placeholder="Any"
                    value={examBoards}
                    options={getFilteredExamBoardOptions({byStages: stages.map(item => item.value as STAGE)})}
                    onChange={unwrapValue(setExamBoards)}
                />
            </RS.Col>
        </RS.Row>
        <RS.Row className="mt-lg-3 mb-sm-3">
            <RS.Col md={6}>
                <RS.Label className={`mt-2 mt-lg-0`} htmlFor="difficulty-selector">
                    with difficulty levels...
                    <span id={`difficulty-help-tooltip`} className="icon-help ml-1" />
                    <RS.UncontrolledTooltip target={`difficulty-help-tooltip`} placement="bottom" >
                        Practice questions let you directly apply one idea -<br />
                        P1 covers revision of a previous stage or topics near the beginning of a course,<br />
                        P3 covers later topics.<br />
                        Challenge questions are solved by combining multiple concepts and creativity.<br />
                        C1 can be attempted near the beginning of your course,<br />
                        C3 require more creativity and could be attempted later in a course.
                    </RS.UncontrolledTooltip>
                </RS.Label>
                <Select id="difficulty-selector" onChange={unwrapValue(setDifficulties)} isClearable isMulti value={difficulties} options={DIFFICULTY_ICON_ITEM_OPTIONS} />
            </RS.Col>
            <RS.Col md={6}>
                <RS.Label className={`mt-2 mt-lg-0`} htmlFor="question-search-topic">from topics...</RS.Label>
                <Select
                    inputId="question-search-topic" isMulti isClearable placeholder="Any" value={selections[2]}
                    options={topicChoices} onChange={(v, {action}) => {
                        if ((Array.isArray(v) && v.length === 0) || v === null) {
                            setConcepts([]);
                        }
                        return unwrapValue(setTierSelection)(v);
                    }}
                />
            </RS.Col>
        </RS.Row>
        <RS.Row>
            <RS.Col md={12}>
                <RS.Label className={`mt-2 mt-lg-0`} htmlFor="concepts">and concepts...</RS.Label>
                {concepts?.filter(c => c.label === QUESTION_FINDER_CONCEPT_LABEL_PLACEHOLDER).length === 0 ?
                    <Select
                        inputId="concepts" isMulti isClearable isDisabled={!(selectedTopics && selectedTopics.length > 0)}
                        placeholder={selectedTopics?.length > 0 ? "Any" : "Please select one or more topics"}
                        value={concepts} options={conceptChoices} onChange={unwrapValue(setConcepts)}
                    /> :
                    <IsaacSpinner/>}
            </RS.Col>
        </RS.Row>
    </>
}

export const GameboardFilter = withRouter(({location}: {location: Location}) => {
    const dispatch = useDispatch();
    const deviceSize = useDeviceSize();

    const userContext = useUserContext();
    const {querySelections, queryStages, queryDifficulties, queryConcepts, queryExamBoards} = processQueryString(location.search);

    const history = useHistory();
    const gameboardOrNotFound = useSelector(selectors.board.currentGameboardOrNotFound);
    const gameboard = useSelector(selectors.board.currentGameboard);
    const gameboardIdAnchor = location.hash ? location.hash.slice(1) : null;

    useEffect(() => {
        if (gameboard && gameboard.id !== gameboardIdAnchor) {
            history.replace({search: location.search, hash: gameboard.id});
        } else if (gameboardIdAnchor && gameboardOrNotFound === NOT_FOUND) {
            // A request returning "gameboard not found" should clear the gameboard.id from the url hash anchor
            history.replace({search: location.search});
        }
    }, [gameboard, gameboardIdAnchor, gameboardOrNotFound])

    const [filterExpanded, setFilterExpanded] = useState(siteSpecific(deviceSize != "xs", true));
    const gameboardRef = useRef<HTMLDivElement>(null);

    const [selections, setSelections] = useState<Item<TAG_ID>[][]>(querySelections);

    const choices = [tags.allSubjectTags.map(itemiseTag)];
    let i;
    if (SITE_SUBJECT === SITE.PHY) {
        for (i = 0; i < selections.length && i < 2; i++) {
            const selection = selections[i];
            if (selection.length !== 1) break;
            choices.push(tags.getChildren(selection[0].value).map(itemiseTag));
        }
    } else {
        i = 2;
    }

    const tiers: Tier[] = siteSpecific([
            {id: "subjects", name: "Subject"},
            {id: "fields", name: "Field"},
            {id: "topics", name: "Topic"},
        ],
        [
            {id: "subjects", name: "Category"},
            {id: "fields", name: "Strand"},
            {id: "topics", name: "Topic"},
        ]).map(tier => ({...tier, for: "for_" + tier.id})).slice(0, i + 1);

    const [stages, setStages] = useState<Item<string>[]>(
        queryStages.length > 0 ? queryStages : itemiseByValue([userContext.stage], getFilteredStageOptions()));
    useEffect(function keepStagesInSyncWithUserContext() {
        if (stages.length === 0) setStages(itemiseByValue([userContext.stage], getFilteredStageOptions()));
    }, [userContext.stage]);

    const [difficulties, setDifficulties] = useState<Item<string>[]>(queryDifficulties);

    // const [questionCategories, setQuestionCategories] = useState<Item<string>[]>(queryQuestionCategories);

    const [examBoards, setExamBoards] = useState<Item<string>[]>(
        queryExamBoards.length > 0 ? queryStages : itemiseByValue([userContext.examBoard], getFilteredExamBoardOptions({byStages: stages.map(item => item.value as STAGE)})));
    useEffect(function keepExamBoardsInSyncWithUserContext() {
        if (examBoards.length === 0) setExamBoards(itemiseByValue([userContext.examBoard], getFilteredExamBoardOptions({byStages: stages.map(item => item.value as STAGE)})));
    }, [userContext.examBoard]);

    const [concepts, setConcepts] = useState<Item<string>[]>(queryConcepts);

    const [boardStack, setBoardStack] = useState<string[]>([]);

    // Shared props that both PHY and CS filters use
    const filterProps : FilterProps = {
        difficulties: difficulties,
        setDifficulties: setDifficulties,
        selections: selections,
        setSelections: setSelections,
        stages: stages,
        setStages: setStages,
    }

    // Title changing states and logic
    const [customBoardTitle, setCustomBoardTitle] = useState<string>();
    const [pendingCustomBoardTitle, setPendingCustomBoardTitle] = useState<string>();
    const defaultBoardTitle = SITE_SUBJECT === SITE.PHY ? generatePhyBoardName(selections) : generateCSBoardName(selections);
    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

    function loadNewGameboard(stages: Item<string>[], difficulties: Item<string>[], concepts: Item<string>[],
                              examBoards: Item<string>[], selections: Item<TAG_ID>[][], boardTitle: string,
                              history: History, dispatch: Dispatch<any>) {
        // Load a gameboard
        const params: {[key: string]: string} = {};
        if (stages.length) params.stages = toCSV(stages);
        if (difficulties.length) params.difficulties = toCSV(difficulties);
        if (concepts.length) params.concepts = toCSV(concepts);
        if (SITE_SUBJECT === SITE.CS && examBoards.length) params.examBoards = toCSV(examBoards);
        if (SITE_SUBJECT === SITE.PHY) {params.questionCategories = "quick_quiz,learn_and_practice";}
        params.title = boardTitle;

        tiers.forEach((tier, i) => {
            if (!selections[i] || selections[i].length === 0) {
                if (i === 0) {
                    params[tier.id] = siteSpecific("physics,maths,chemistry", TAG_ID.computerScience);
                }
                return;
            }
            params[tier.id] = toCSV(selections[i]);
        });

        dispatch(generateTemporaryGameboard(params));
        delete params.questionCategories;
        history.replace({search: queryString.stringify(params, {encode: false})});
    }

    // This is a leading debounced version of loadNewGameboard, used with the shuffle questions button - this stops
    // users from spamming the generateTemporaryGameboard endpoint by clicking the button fast
    const debouncedLeadingLoadGameboard = useCallback(debounce(loadNewGameboard, 200, {leading: true, trailing: false}), []);

    useEffect(() => {
        if (gameboardIdAnchor && gameboardIdAnchor !== gameboard?.id) {
            dispatch(loadGameboard(gameboardIdAnchor));
        } else {
            setBoardStack([]);
            loadNewGameboard(stages, difficulties, concepts, examBoards, selections, customBoardTitle ?? defaultBoardTitle, history, dispatch)
        }
    }, [selections, stages, difficulties, concepts, examBoards]);

    function refresh() {
        if (gameboard) {
            if (!boardStack.includes(gameboard.id as string)) {
                boardStack.push(gameboard.id as string);
                setBoardStack(boardStack);
            }
            debouncedLeadingLoadGameboard(stages, difficulties, concepts, examBoards, selections, customBoardTitle ?? defaultBoardTitle, history, dispatch);
        }
    }

    function previousBoard() {
        if (boardStack.length > 0) {
            const oldBoardId = boardStack.pop() as string;
            setBoardStack(boardStack);
            dispatch(loadGameboard(oldBoardId));
        }
    }

    const pageHelp = <span>
        You can build a gameboard by selecting the areas of interest, stage and difficulties.
        <br />
        You can select more than one entry in each area.
    </span>;

    function scrollToQuestions() {
        if (gameboardRef.current) {
            gameboardRef.current.scrollIntoView({behavior: "smooth"});
        }
    }

    return <RS.Container id="gameboard-generator" className="mb-5">
        <TitleAndBreadcrumb currentPageTitle={siteSpecific("Choose your Questions", "Question Finder")} help={pageHelp} modalId="gameboard_filter_help"/>

        <RS.Card id="filter-panel" className="mt-4 px-2 py-3 p-sm-4 pb-5">
            {/* Filter Summary */}
            {SITE_SUBJECT === SITE.PHY && <RS.Row>
                <RS.Col sm={8} lg={9}>
                    <button className="bg-transparent w-100 p-0" onClick={() => setFilterExpanded(!filterExpanded)}>
                        <RS.Row>
                            <RS.Col lg={6} className="mt-3 mt-lg-0">
                                <RS.Label className="d-block text-left d-sm-flex mb-0 pointer-cursor">
                                    <span>Topics:</span>
                                    <span><HierarchyFilterSummary {...{tiers, choices, selections}} /></span>
                                </RS.Label>
                            </RS.Col>
                        </RS.Row>
                    </button>
                </RS.Col>
                <RS.Col sm={4} lg={3} className={`text-center mt-3 mb-4 m-sm-0`}>
                    {filterExpanded ?
                        <RS.Button color={"link"} block className="filter-action" onClick={scrollToQuestions}>
                            Scroll to questions...
                        </RS.Button>
                        :
                        <RS.Button color={"link"} className="filter-action" onClick={() => setFilterExpanded(true)}>
                            Edit question filters
                        </RS.Button>
                    }
                </RS.Col>
            </RS.Row>}

            {SITE_SUBJECT === SITE.CS && (filterExpanded
                ?
                <RS.Row className={"mb-3"}>
                    <RS.Col>
                        <span>Specify your search criteria and we will generate a random selection of up to 10 questions for your chosen filter(s). Shuffle the questions to get a new random selection.</span>
                    </RS.Col>
                </RS.Row>
                :
                <RS.Col xs={12} className={`text-center mt-3 mb-4 m-sm-0`}>
                    <RS.Button size="sm" color="primary" outline onClick={() => setFilterExpanded(true)}>
                        Edit question filters ✎
                    </RS.Button>
                </RS.Col>)}

            {/* Filter */}
            {filterExpanded && siteSpecific(
                <PhysicsFilter {...filterProps} tiers={tiers} choices={choices}/>,
                <CSFilter {...filterProps} examBoards={examBoards} setExamBoards={setExamBoards} concepts={concepts} setConcepts={setConcepts}/>
            )}

            {/* Buttons */}
            <RS.Row className={filterExpanded ? "mt-4" : ""}>
                <RS.Col>
                    {boardStack.length > 0 && <RS.Button size="sm" color="primary" outline onClick={previousBoard}>
                        <span className="d-md-inline d-none">Undo Shuffle</span> &#9100;
                    </RS.Button>}
                </RS.Col>
                <RS.Col className="text-right">
                    <RS.Button size="sm" color="primary" outline onClick={refresh}>
                        <span className="d-md-inline d-none">Shuffle Questions</span> ⟳
                    </RS.Button>
                </RS.Col>
            </RS.Row>
            <RS.Button color="link" className="filter-go-to-questions" onClick={scrollToQuestions}>
                {siteSpecific("Go to Questions...", "Scroll to Questions...")}
            </RS.Button>
            <RS.Button
                color="link" id="expand-filter-button" onClick={() => setFilterExpanded(!filterExpanded)}
                className={filterExpanded ? "open" : ""} aria-label={filterExpanded ? "Collapse Filter" : "Expand Filter"}
            />
        </RS.Card>

        {gameboard && <div ref={gameboardRef} className="row mt-4 mb-3">
            {siteSpecific(
                // PHY
                <RS.Col xs={12} lg={"auto"} >
                    <h3>{defaultBoardTitle}</h3>
                </RS.Col>,
                // CS
                <>
                    <RS.Col xs={12} lg={"auto"} >
                        {isEditingTitle
                            ? <RS.Input defaultValue={customBoardTitle ?? gameboard?.title}
                                        onChange={e => setPendingCustomBoardTitle(e.target.value)}
                                        className={"mb-2 mb-lg-0"} />
                            : <h3>{customBoardTitle ?? gameboard?.title}</h3>
                        }
                    </RS.Col>
                    <RS.Col xs={12} sm={isEditingTitle ? 7 : 4} lg={isEditingTitle ? 4 : 2} className={"pt-0 pt-lg-1 pb-1 pb-md-0"} >
                        {isEditingTitle ? <>
                                <RS.Button size={"sm"} color="secondary" onClick={() => {
                                    setIsEditingTitle(false);
                                    // Only save the title if the input element changed it
                                    if (pendingCustomBoardTitle) {
                                        setCustomBoardTitle(pendingCustomBoardTitle);
                                    }
                                }}>
                                    Save title
                                </RS.Button>
                                <RS.Button size={"sm"} color="secondary" className={"ml-2"} onClick={() => setIsEditingTitle(false)}>
                                    Cancel
                                </RS.Button>
                            </> :
                            <RS.Button size={"sm"} color="secondary" onClick={() => {
                                setIsEditingTitle(true);
                                setPendingCustomBoardTitle(undefined);
                            }}>
                                Edit title
                            </RS.Button>}
                    </RS.Col>
                </>
            )}
            <RS.Col xs={8} lg={"auto"} className="ml-auto text-right">
                <RS.Button tag={Link} color="secondary" to={`/add_gameboard/${gameboard.id}/${customBoardTitle ?? gameboard.title}`}>
                    Save to My&nbsp;Gameboards
                </RS.Button>
            </RS.Col>
        </div>}

        <div className="pb-4">
            <ShowLoading
                until={gameboardOrNotFound}
                thenRender={gameboard  => (<GameboardViewer gameboard={gameboard} />)}
                ifNotFound={<RS.Alert color="warning">No questions found matching the criteria.</RS.Alert>}
            />
        </div>
    </RS.Container>;
});
