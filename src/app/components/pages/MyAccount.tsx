import React, {useEffect, useState} from 'react';
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
import {UserAuthenticationSettingsDTO, UserContext} from "../../../IsaacApiTypes";
import {AppState} from "../../state/reducers";
import {adminUserGet, getChosenUserAuthSettings, resetPassword, updateCurrentUser} from "../../state/actions";
import {
    BooleanNotation,
    DisplaySettings,
    PotentialUser,
    ProgrammingLanguage,
    UserEmailPreferences,
    UserPreferencesDTO,
    ValidationUser,
} from "../../../IsaacAppTypes";
import {UserDetails} from "../elements/panels/UserDetails";
import {UserPassword} from "../elements/panels/UserPassword";
import {UserMFA} from "../elements/panels/UserMFA";
import {UserEmailPreference} from "../elements/panels/UserEmailPreferences";
import {
    allRequiredInformationIsPresent,
    isDobOverThirteen,
    validateEmail,
    validateEmailPreferences,
    validatePassword
} from "../../services/validation";
import queryString from "query-string";
import {Link, withRouter} from "react-router-dom";
import {ACCOUNT_TAB, PROGRAMMING_LANGUAGE} from "../../services/constants";
import {history} from "../../services/history"
import {TeacherConnections} from "../elements/panels/TeacherConnections";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {ifKeyIsEnter} from "../../services/navigation";
import {ShowLoading} from "../handlers/ShowLoading";
import {SITE, SITE_SUBJECT, SITE_SUBJECT_TITLE} from "../../services/siteConstants";
import {isStaff} from "../../services/user";
import {ErrorState} from "../../state/reducers/internalAppState";
import {AdminUserGetState} from "../../state/reducers/adminState";

const stateToProps = (state: AppState, props: any) => {
    const {location: {search, hash}} = props;
    const searchParams = queryString.parse(search);
    return {
        errorMessage: state?.error ?? null,
        userAuthSettings: state?.userAuthSettings ?? null,
        userPreferences: state?.userPreferences ?? null,
        firstLogin: history?.location?.state?.firstLogin,
        hashAnchor: hash?.slice(1) ?? null,
        authToken: searchParams?.authToken as string ?? null,
        userOfInterest: searchParams?.userId as string ?? null,
        userToEdit: state && {...state.adminUserGet, loggedIn: true} || {loggedIn: false}
    }
};

const dispatchToProps = {
    updateCurrentUser,
    resetPassword,
    adminUserGet,
    getChosenUserAuthSettings,
};

interface AccountPageProps {
    user: PotentialUser;
    errorMessage: ErrorState;
    userAuthSettings: UserAuthenticationSettingsDTO | null;
    getChosenUserAuthSettings: (userid: number) => void;
    userPreferences: UserPreferencesDTO | null;
    updateCurrentUser: (
        updatedUser: ValidationUser,
        updatedUserPreferences: UserPreferencesDTO,
        userContexts: UserContext[] | undefined,
        passwordCurrent: string | null,
        currentUser: PotentialUser,
    ) => void;
    firstLogin: boolean;
    hashAnchor: string | null;
    authToken: string | null;
    userOfInterest: string | null;
    adminUserGet: (userid: number | undefined) => void;
    userToEdit: AdminUserGetState;
}

const AccountPageComponent = ({user, updateCurrentUser, getChosenUserAuthSettings, errorMessage, userAuthSettings, userPreferences, adminUserGet, hashAnchor, authToken, userOfInterest, userToEdit}: AccountPageProps) => {
    useEffect(() => {
        if (userOfInterest) {
            adminUserGet(Number(userOfInterest));
            getChosenUserAuthSettings(Number(userOfInterest));
        }
    }, [userOfInterest]);

    // - Admin user modification
    const editingOtherUser = !!userOfInterest && user && user.loggedIn && user?.id?.toString() !== userOfInterest || false;

    // - Copy of user to store changes before saving
    const [userToUpdate, setUserToUpdate] = useState<any>(
        editingOtherUser && userToEdit ?
            {...userToEdit, loggedIn: true, password: ""} :
            {...user, password: ""}
    );

    useEffect(() => {
        if (editingOtherUser && userToEdit) {
            setUserToUpdate({...userToEdit, loggedIn: true});
        } else if (user) {
            setUserToUpdate({...user, password: ""});
        }
    }, [user, editingOtherUser, userToEdit]);

    // Inputs which trigger re-render
    const [attemptedAccountUpdate, setAttemptedAccountUpdate] = useState(false);

    // - Passwords
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");

    // - User preferences
    const [emailPreferences, setEmailPreferences] = useState<UserEmailPreferences>({});
    const [myUserPreferences, setMyUserPreferences] = useState<UserPreferencesDTO>({});

    // - User Contexts
    const [userContextsToUpdate, setUserContextsToUpdate] =
        useState<UserContext[]>(userToUpdate.registeredContexts?.length ? [...userToUpdate.registeredContexts] : [{}]);
    useEffect(function keepUserContextsUpdated() {
        setUserContextsToUpdate(userToUpdate.registeredContexts?.length ? [...userToUpdate.registeredContexts] : [{}]);
    }, [userToUpdate?.registeredContexts]);

    const pageTitle = editingOtherUser ? "Edit user" : "My account";

    useEffect(() => {
        const currentEmailPreferences = (userPreferences?.EMAIL_PREFERENCE) ? userPreferences.EMAIL_PREFERENCE : {};
        const currentProgrammingLanguage = SITE_SUBJECT === SITE.CS ? (userPreferences?.PROGRAMMING_LANGUAGE ? userPreferences.PROGRAMMING_LANGUAGE: {}) : undefined;
        const currentBooleanNotation = SITE_SUBJECT === SITE.CS ? (userPreferences?.BOOLEAN_NOTATION ? userPreferences.BOOLEAN_NOTATION: {}) : undefined;
        const currentDisplaySettings = (userPreferences?.DISPLAY_SETTING) ? userPreferences.DISPLAY_SETTING: {};
        const currentUserPreferences: UserPreferencesDTO = {
            EMAIL_PREFERENCE: currentEmailPreferences,
            PROGRAMMING_LANGUAGE: currentProgrammingLanguage,
            BOOLEAN_NOTATION: currentBooleanNotation,
            DISPLAY_SETTING: currentDisplaySettings,
        };

        setEmailPreferences(currentEmailPreferences);
        setMyUserPreferences(currentUserPreferences);
    }, [userPreferences]);

    // Set active tab using hash anchor
    const [activeTab, setActiveTab] = useState(ACCOUNT_TAB.account);
    useEffect(() => {
        // @ts-ignore
        const tab: ACCOUNT_TAB =
            (authToken && ACCOUNT_TAB.teacherconnections) ||
            (hashAnchor && ACCOUNT_TAB[hashAnchor as any]) ||
            ACCOUNT_TAB.account;
        setActiveTab(tab);
    }, [hashAnchor, authToken]);

    // Values derived from inputs (props and state)
    const isNewPasswordConfirmed = (newPassword == newPasswordConfirm) && validatePassword(newPasswordConfirm);

    function setProgrammingLanguage(newProgrammingLanguage: ProgrammingLanguage) {
        const clearLanguages: { [pl in PROGRAMMING_LANGUAGE]: false } = {
            PSEUDOCODE: false, JAVASCRIPT: false, PYTHON: false, PHP: false, CSHARP: false, PLAINTEXT: false, SQL: false, NONE: false,
        };

        const fullNewProgrammingLanguage = {...clearLanguages, ...newProgrammingLanguage};

        setMyUserPreferences({...myUserPreferences, PROGRAMMING_LANGUAGE: fullNewProgrammingLanguage});
    }

    function setBooleanNotation(newBooleanNotation: BooleanNotation) {
        setMyUserPreferences({...myUserPreferences, BOOLEAN_NOTATION: newBooleanNotation});
    }

    function setDisplaySettings(newDisplaySettings: DisplaySettings) {
        setMyUserPreferences({...myUserPreferences, DISPLAY_SETTING: newDisplaySettings});
    }

    // Form's submission method
    function updateAccount(event: React.FormEvent<HTMLFormElement>) {
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

        if (userToUpdate.loggedIn &&
            validateEmail(userToUpdate.email) &&
            allRequiredInformationIsPresent(userToUpdate, {...myUserPreferences, EMAIL_PREFERENCE: null}, userContextsToUpdate) &&
            (isDobOverThirteen(userToUpdate.dateOfBirth) || userToUpdate.dateOfBirth === undefined) &&
            (!userToUpdate.password || isNewPasswordConfirmed))
        {
            const userContextsUpdated = JSON.stringify(userContextsToUpdate) !== JSON.stringify(userToUpdate.registeredContexts);
            updateCurrentUser(
                userToUpdate,
                editingOtherUser ? {} : myUserPreferences,
                userContextsUpdated ? userContextsToUpdate : undefined,
                currentPassword,
                user,
            );
        }
    }

    return <Container id="account-page" className="mb-5">
        <TitleAndBreadcrumb currentPageTitle={pageTitle} className="mb-4" />
        <h3 className="d-md-none text-center text-muted m-3">
            <small>
                {`Update your Isaac ${SITE_SUBJECT_TITLE} account, or `}
                <Link to="/logout" className="text-secondary">Log out</Link>
            </small>
        </h3>

        <ShowLoading until={editingOtherUser ? userToUpdate.loggedIn && userToUpdate.email : userToUpdate}>
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
                                <span className="d-none d-lg-block">Account security</span>
                                <span className="d-block d-lg-none">Security</span>
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({"mx-2": true, active: activeTab === ACCOUNT_TAB.teacherconnections})}
                                tabIndex={0}
                                onClick={() => setActiveTab(ACCOUNT_TAB.teacherconnections)}
                                onKeyDown={ifKeyIsEnter(() => setActiveTab(ACCOUNT_TAB.teacherconnections))}
                            >
                                <span className="d-none d-lg-block d-md-block">Teacher connections</span>
                                <span className="d-block d-md-none">Connections</span>
                            </NavLink>
                        </NavItem>
                        {!editingOtherUser && <NavItem>
                            <NavLink
                                className={classnames({"mx-2": true, active: activeTab === ACCOUNT_TAB.emailpreferences})} tabIndex={0}
                                onClick={() => setActiveTab(ACCOUNT_TAB.emailpreferences)} onKeyDown={ifKeyIsEnter(() => setActiveTab(ACCOUNT_TAB.emailpreferences))}
                            >
                                <span className="d-none d-lg-block">Email preferences</span>
                                <span className="d-block d-lg-none">Emails</span>
                            </NavLink>
                        </NavItem>}
                    </Nav>

                    <Form name="my-account" onSubmit={updateAccount}>
                        <TabContent activeTab={activeTab}>

                            <TabPane tabId={ACCOUNT_TAB.account}>
                                <UserDetails
                                    userToUpdate={userToUpdate} setUserToUpdate={setUserToUpdate}
                                    userContexts={userContextsToUpdate} setUserContexts={setUserContextsToUpdate}
                                    programmingLanguage={myUserPreferences.PROGRAMMING_LANGUAGE || {}} setProgrammingLanguage={setProgrammingLanguage}
                                    booleanNotation={myUserPreferences.BOOLEAN_NOTATION || {}} setBooleanNotation={setBooleanNotation}
                                    displaySettings={myUserPreferences.DISPLAY_SETTING || {}} setDisplaySettings={setDisplaySettings}
                                    submissionAttempted={attemptedAccountUpdate} editingOtherUser={editingOtherUser}
                                    userAuthSettings={userAuthSettings}
                                />
                            </TabPane>

                            <TabPane tabId={ACCOUNT_TAB.passwordreset}>
                                <UserPassword
                                    currentUserEmail={userToUpdate ? userToUpdate.email : user.email} userAuthSettings={userAuthSettings}
                                    myUser={userToUpdate} setMyUser={setUserToUpdate}
                                    setCurrentPassword={setCurrentPassword} currentPassword={currentPassword}
                                    isNewPasswordConfirmed={isNewPasswordConfirmed} newPasswordConfirm={newPasswordConfirm}
                                    setNewPassword={setNewPassword} setNewPasswordConfirm={setNewPasswordConfirm} editingOtherUser={editingOtherUser}
                                />
                                {isStaff(user) && !editingOtherUser &&
                                    // beta feature just for staff
                                    <UserMFA
                                        userAuthSettings={userAuthSettings}
                                        userToUpdate={userToUpdate}
                                        editingOtherUser={editingOtherUser}
                                    />
                                }
                            </TabPane>

                            <TabPane tabId={ACCOUNT_TAB.teacherconnections}>
                                <TeacherConnections user={user} authToken={authToken} editingOtherUser={editingOtherUser}
                                                    userToEdit={userToEdit}/>
                            </TabPane>

                            {!editingOtherUser && <TabPane tabId={ACCOUNT_TAB.emailpreferences}>
                                <UserEmailPreference
                                    emailPreferences={emailPreferences} setEmailPreferences={setEmailPreferences}
                                    submissionAttempted={attemptedAccountUpdate}
                                />
                            </TabPane>}

                        </TabContent>

                        <CardFooter className="py-4">
                            <Row>
                                <Col size={12} md={{size: 6, offset: 3}}>
                                    {errorMessage?.type === "generalError" && <h3 role="alert" className="text-danger text-center">
                                        {errorMessage.generalError}
                                    </h3>}
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
