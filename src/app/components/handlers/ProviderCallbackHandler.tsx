import React, {useEffect} from 'react';
import {useDispatch} from "react-redux";
import {withRouter} from "react-router-dom";
import {handleProviderCallback} from "../../state/actions";
import {AuthenticationProvider} from "../../../IsaacApiTypes";
import {Spinner} from "reactstrap";

interface ProviderCallbackHandlerProps {
    match: {params: {provider: AuthenticationProvider}};
    location: {search: string};
}
export const ProviderCallbackHandler = withRouter((props: ProviderCallbackHandlerProps) => {
    const {match: {params: {provider}}, location: {search}} = props;
    const dispatch = useDispatch();
    useEffect(() => {dispatch(handleProviderCallback(provider, search))}, [handleProviderCallback, provider, search]);

    return <React.Fragment>
        <div className="w-100 text-center">
            <h2 className="pt-5 pb-2">Signing in...</h2>
            <Spinner color="primary" />
        </div>
    </React.Fragment>;
});
