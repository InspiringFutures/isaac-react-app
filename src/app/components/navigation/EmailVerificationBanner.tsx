import React, {useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {Link} from "react-router-dom";
import * as RS from 'reactstrap';
import {requestEmailVerification} from "../../state/actions";
import {WEBMASTER_EMAIL} from '../../services/siteConstants';
import {userOrNull} from "../../state/selectors";

export const EmailVerificationBanner = () => {
    const dispatch = useDispatch();
    const [hidden, setHidden] = useState(false);
    const user = useSelector(userOrNull);
    const status = user?.loggedIn && user?.emailVerificationStatus || null;
    const show = user?.loggedIn && status != "VERIFIED" && !hidden;

    function clickVerify() {
        dispatch(requestEmailVerification());
        setHidden(true);
    }

    return show ? <div className="banner d-print-none" id="email-status-banner">
        <RS.Container className="py-3">

            <RS.Row style={{alignItems: "center"}}>
                <RS.Col xs={12} sm={2} md={1}>
                    <h3 className="text-center">
                        <span role="presentation" aria-labelledby="email-verification-heading">ℹ</span>
                        <span id="email-verification-heading" className="d-inline-block d-sm-none">&nbsp;Email Verification</span>
                    </h3>
                </RS.Col>
                {(status == null || status == "NOT_VERIFIED") && <React.Fragment>
                    <RS.Col xs={12} sm={10} md={8}>
                        <small>Your email address is not verified - please find our email in your inbox and follow the
                            verification link. You can <Link onClick={clickVerify} id="email-verification-request">
                            request a new verification email</Link> if necessary. To change your account email,
                            go to <Link to="/account">My account</Link>.
                        </small>
                    </RS.Col>
                    <RS.Col xs={12} md={3} className="text-center">
                        <RS.Button
                            color="primary" outline className="mt-3 mb-2 d-block d-md-inline-block banner-button"
                            onClick={() => setHidden(true)} id="email-verification-snooze"
                        >
                            Snooze
                        </RS.Button>
                    </RS.Col>
                </React.Fragment>}
                {(status == "DELIVERY_FAILED") &&
                    <RS.Col xs={12} sm={10} md={11}>
                        <small>One or more email(s) sent to your email
                            address failed. This means you won&apos;t receive emails from Isaac, and may prevent you
                            regaining access to your account. <br/>To start receiving emails again, update your email
                            address on your <Link to="/account">My account</Link> page. If you believe this is in
                            error, please <a href={`mailto:${WEBMASTER_EMAIL}`}>email us</a>.
                        </small>
                    </RS.Col>
                }
            </RS.Row>
        </RS.Container>
    </div> : null;
};
