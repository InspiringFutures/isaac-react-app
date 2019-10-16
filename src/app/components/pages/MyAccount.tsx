import React, {useEffect, useMemo, useState} from 'react';
import {connect} from "react-redux";
import classnames from "classnames";
import {
    Card,
    CardFooter,
    Col,
    Container,
    Form,
    Input,
    Nav,
    NavItem,
    NavLink,
    Row,
    TabContent,
    TabPane,
} from "reactstrap";
import {RegisteredUserDTO, UserAuthenticationSettingsDTO} from "../../../IsaacApiTypes";
import {AdminUserGetState, AppState, ErrorState} from "../../state/reducers";
import {resetPassword, updateCurrentUser, adminUserGet} from "../../state/actions";
import {
    LoggedInUser,
    LoggedInValidationUser,
    SubjectInterests,
    UserEmailPreferences,
    UserExamPreferences,
    UserPreferencesDTO
} from "../../../IsaacAppTypes";
import {UserDetails} from "../elements/panels/UserDetails";
import {UserPassword} from "../elements/panels/UserPassword";
import {UserEmailPreference} from "../elements/panels/UserEmailPreferences";
import {
    isDobOverThirteen,
    validateEmail,
    validateEmailPreferences,
    validatePassword,
    validateSubjectInterests,
    validateUserGender,
    validateUserSchool
} from "../../services/validation";
import queryString from "query-string";
import {Link, withRouter} from "react-router-dom";
import {ACCOUNT_TAB} from "../../services/constants";
import {history} from "../../services/history"
import {TeacherConnections} from "../elements/panels/TeacherConnections";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {ifKeyIsEnter} from "../../services/navigation";
import {ShowLoading} from "../handlers/ShowLoading";

const stateToProps = (state: AppState, props: any) => {
    const {location: {search, hash}} = props;
    const searchParams = queryString.parse(search);
    return {
        errorMessage: state ? state.error : null,
        userAuthSettings: state ? state.userAuthSettings : null,
        userPreferences: state ? state.userPreferences : null,
        firstLogin: history.location && history.location.state && history.location.state.firstLogin,
        hashAnchor: (hash && hash.slice(1)) || null,
        authToken: (searchParams && searchParams.authToken) ? (searchParams.authToken as string) : null,
        userOfInterest: (searchParams && searchParams.userId) ? (searchParams.userId as string) : null,
        searchResults: state && state.adminUserGet || null
    }
};

const dispatchToProps = {
    updateCurrentUser,
    resetPassword,
    adminUserGet,
};

interface AccountPageProps {
    user: LoggedInUser;
    errorMessage: ErrorState;
    userAuthSettings: UserAuthenticationSettingsDTO | null;
    userPreferences: UserPreferencesDTO | null;
    updateCurrentUser: (
        updatedUser: LoggedInValidationUser,
        updatedUserPreferences: UserPreferencesDTO,
        passwordCurrent: string | null,
        currentUser: LoggedInUser
    ) => void;
    firstLogin: boolean;
    hashAnchor: string | null;
    authToken: string | null;
    userOfInterest: string | null;
    adminUserGet: (userid: number | undefined) => void;
    searchResults: AdminUserGetState;
}

const AccountPageComponent = ({user, updateCurrentUser, errorMessage, userAuthSettings, userPreferences, adminUserGet, hashAnchor, authToken, userOfInterest, searchResults}: AccountPageProps) => {
    // - Admin user modification
    const [editingOtherUser, _] = useState(!!userOfInterest && user && user.loggedIn && user.id && user.id.toString() !== userOfInterest);
    const [userToEdit, setUserToEdit] = useState();

    const targetUserUpdate = async () => {
        await adminUserGet(Number(userOfInterest));
    };

    useEffect(() =>  {
        if (editingOtherUser && userOfInterest) {
            targetUserUpdate();
        }
    }, [editingOtherUser, userOfInterest]);

    useEffect(() => {
        console.log(searchResults);
        if (searchResults) {
            setUserToEdit(Object.assign({}, searchResults));
        }
    }, [searchResults]);

    // - Copy of user to store changes before saving
    const [userToUpdate, setUserToUpdate] = useState(userToEdit && userToEdit !== {} ? Object.assign({}, userToEdit, {loggedIn: true, password: ""}) : Object.assign({}, user, {password: ""}));
    useMemo(() => {setUserToUpdate(userToEdit ? Object.assign({}, userToEdit, {loggedIn: true, password: ""}) : Object.assign({}, user, {password: ""}))}, [user, userToEdit]);

    // useEffect(() => {
    //     if (userToEdit) {
    //         setUserToUpdate(userToEdit);
    //         console.log(userToEdit);
    //     }
    // }, [userToEdit]);

    // Inputs which trigger re-render
    const [attemptedAccountUpdate, setAttemptedAccountUpdate] = useState(false);

    // - Passwords
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");

    // - User preferences
    const [emailPreferences, setEmailPreferences] = useState<UserEmailPreferences>({});
    const [examPreferences, setExamPreferences] = useState<UserExamPreferences>({});
    const [subjectInterests, setSubjectInterests] = useState<SubjectInterests>({});
    const [myUserPreferences, setMyUserPreferences] = useState<UserPreferencesDTO>({});

    useMemo(() => {
        const currentEmailPreferences = (userPreferences && userPreferences.EMAIL_PREFERENCE) ? userPreferences.EMAIL_PREFERENCE : {};
        const currentExamPreferences = (userPreferences && userPreferences.EXAM_BOARD) ? userPreferences.EXAM_BOARD : {};
        const currentSubjectInterests = (userPreferences && userPreferences.SUBJECT_INTEREST) ? userPreferences.SUBJECT_INTEREST: {};
        const currentUserPreferences = {
            EMAIL_PREFERENCE: currentEmailPreferences,
            EXAM_BOARD: currentExamPreferences,
            SUBJECT_INTEREST: currentSubjectInterests,
        };

        setEmailPreferences(currentEmailPreferences);
        setExamPreferences(currentExamPreferences);
        setSubjectInterests(currentSubjectInterests);
        setMyUserPreferences(currentUserPreferences);
    }, [userPreferences]);


    // Set active tab using hash anchor
    const [activeTab, setActiveTab] = useState(ACCOUNT_TAB.account);
    useMemo(() => {
        // @ts-ignore
        let tab: ACCOUNT_TAB =
            (authToken && ACCOUNT_TAB.teacherconnections) ||
            (hashAnchor && ACCOUNT_TAB[hashAnchor as any]) ||
            ACCOUNT_TAB.account;
        setActiveTab(tab);
    }, [hashAnchor, authToken]);

    // useMemo(() => {
    //     if (userToEdit) {
    //         setUserToUpdate(userToEdit);
    //         setUserToUpdate(Object.assign({}, userToUpdate, {authorisedFullAccess: true}))
    //         console.log(userToUpdate);
    //     }
    // }, [userToEdit]);

    // Values derived from inputs (props and state)
    const isNewPasswordConfirmed = (newPassword == newPasswordConfirm) && validatePassword(newPasswordConfirm);

    // Form's submission method
    const updateAccount = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAttemptedAccountUpdate(true);

        // Only update email preferences on the email preferences tab
        if (activeTab == ACCOUNT_TAB.emailpreferences) {
            if (validateEmailPreferences(emailPreferences)) {
                Object.assign(myUserPreferences.EMAIL_PREFERENCE, emailPreferences);
            } else {
                return; // early exit
            }
        }
        Object.assign(myUserPreferences.EXAM_BOARD, examPreferences);

        if (userToUpdate.loggedIn &&
            validateEmail(userToUpdate.email) &&
            validateUserSchool(userToUpdate) &&
            validateUserGender(userToUpdate) &&
            validateSubjectInterests(subjectInterests) &&
            (isDobOverThirteen(userToUpdate.dateOfBirth) || userToUpdate.dateOfBirth === undefined) &&
            (!userToUpdate.password || isNewPasswordConfirmed)) {
            updateCurrentUser(userToUpdate, myUserPreferences, currentPassword, user);
        }
    };

    console.log(user);
    console.log(userToEdit);
    console.log(userToUpdate);

    return <Container id="account-page" className="mb-5">
        <TitleAndBreadcrumb currentPageTitle="My account" className="mb-4" />
        <h3 className="d-md-none text-center text-muted m-3">
            <small>
                Update your Isaac Computer Science account, or <Link to="/logout" className="text-secondary">Log out</Link>
            </small>
        </h3>

        <ShowLoading until={editingOtherUser ? userToEdit : userToUpdate}>
            {user.loggedIn && userToUpdate.loggedIn && // We can guarantee user and myUser are logged in from the route requirements
                <Card>
                    <Nav tabs className="my-4 flex-wrap">
                        <NavItem>
                            <NavLink
                                className={classnames({"mx-2": true, active: activeTab === ACCOUNT_TAB.account})} tabIndex={0}
                                onClick={() => setActiveTab(ACCOUNT_TAB.account)} onKeyDown={ifKeyIsEnter(() => setActiveTab(ACCOUNT_TAB.account))}
                            >
                                Profile
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({"mx-2": true, active: activeTab === ACCOUNT_TAB.passwordreset})} tabIndex={0}
                                onClick={() => setActiveTab(ACCOUNT_TAB.passwordreset)} onKeyDown={ifKeyIsEnter(() => setActiveTab(ACCOUNT_TAB.passwordreset))}
                            >
                                <span className="d-none d-lg-block">Change Password</span>
                                <span className="d-block d-lg-none">Password</span>
                            </NavLink>
                        </NavItem>
                        {!editingOtherUser &&
                        <NavItem>
                            <NavLink
                                className={classnames({"mx-2": true, active: activeTab === ACCOUNT_TAB.teacherconnections})}
                                tabIndex={0}
                                onClick={() => setActiveTab(ACCOUNT_TAB.teacherconnections)}
                                onKeyDown={ifKeyIsEnter(() => setActiveTab(ACCOUNT_TAB.teacherconnections))}
                            >
                                <span className="d-none d-lg-block d-md-block">Teacher Connections</span>
                                <span className="d-block d-md-none">Connections</span>
                            </NavLink>
                        </NavItem>
                        }
                        {!editingOtherUser &&
                        < NavItem >
                            < NavLink
                                className={classnames({"mx-2": true, active: activeTab === ACCOUNT_TAB.emailpreferences})} tabIndex={0}
                                onClick={() => setActiveTab(ACCOUNT_TAB.emailpreferences)} onKeyDown={ifKeyIsEnter(() => setActiveTab(ACCOUNT_TAB.emailpreferences))}
                            >
                                <span className="d-none d-lg-block">Email Preferences</span>
                                <span className="d-block d-lg-none">Emails</span>
                            </NavLink>
                        </NavItem>
                        }
                    </Nav>

                    <Form name="my-account" onSubmit={updateAccount}>
                        <TabContent activeTab={activeTab}>

                            <TabPane tabId={ACCOUNT_TAB.account}>
                                <UserDetails
                                    userToUpdate={userToUpdate} setUserToUpdate={setUserToUpdate}
                                    examPreferences={examPreferences} setExamPreferences={setExamPreferences}
                                    subjectInterests={subjectInterests} setSubjectInterests={setSubjectInterests}
                                    submissionAttempted={attemptedAccountUpdate}
                                />
                            </TabPane>
                            <TabPane tabId={ACCOUNT_TAB.passwordreset}>
                                <UserPassword
                                    currentUserEmail={user && user.email && user.email} userAuthSettings={userAuthSettings}
                                    myUser={userToUpdate} setMyUser={setUserToUpdate}
                                    setCurrentPassword={setCurrentPassword} currentPassword={currentPassword}
                                    isNewPasswordConfirmed={isNewPasswordConfirmed} newPasswordConfirm={newPasswordConfirm}
                                    setNewPassword={setNewPassword} setNewPasswordConfirm={setNewPasswordConfirm}
                                />
                            </TabPane>
                            {!editingOtherUser &&
                            <TabPane tabId={ACCOUNT_TAB.teacherconnections}>
                                {<TeacherConnections user={user} authToken={authToken}/>}
                            </TabPane>
                            }
                            {!editingOtherUser &&
                            <TabPane tabId={ACCOUNT_TAB.emailpreferences}>
                                <UserEmailPreference
                                    emailPreferences={emailPreferences} setEmailPreferences={setEmailPreferences}
                                    submissionAttempted={attemptedAccountUpdate}
                                />
                            </TabPane>
                            }

                        </TabContent>

                        <CardFooter className="py-4">
                            <Row>
                                <Col size={12} md={{size: 6, offset: 3}}>
                                    {errorMessage && errorMessage.type === "generalError" &&
                                        <h3 role="alert" className="text-danger text-center">
                                            {errorMessage.generalError}
                                        </h3>
                                    }
                                    {/* Teacher connections does not have a save */}
                                    <Input
                                        type="submit" value="Save" className="btn btn-block btn-secondary border-0"
                                        disabled={activeTab === ACCOUNT_TAB.teacherconnections}
                                    />
                                </Col>
                            </Row>
                        </CardFooter>
                    </Form>
                </Card>
            }
        </ShowLoading>
        <Row className="text-muted text-center mt-3">
            <Col>
                If you would like to delete your account please <a href="/contact?preset=accountDeletion" target="_blank" rel="noopener noreferrer">contact us</a>.
            </Col>
        </Row>
    </Container>;
};

export const MyAccount = withRouter(connect(stateToProps, dispatchToProps)(AccountPageComponent));
