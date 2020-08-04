import React, {ChangeEvent, FormEvent, useRef, useState} from "react";
import {SearchButton} from "./SearchButton";
import {pushSearchToHistory} from "../../services/search";
import {History} from "history";
import {withRouter} from "react-router";
import {Collapse, Form, FormGroup, Input, Label, Nav, Navbar, NavbarToggler, NavItem} from "reactstrap";

interface MainSearchProps {
    history: History;
}

const MainSearchComponent = ({history}: MainSearchProps) => {
    const [searchText, setSearchText] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    function doSearch(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (searchText == "") {
            if (searchInputRef.current) searchInputRef.current.focus();
        } else {
            pushSearchToHistory(history, searchText, []);
        }
    }

    function setSearchTextAsValue(e: ChangeEvent<HTMLInputElement>) {
        setSearchText(e.target.value);
    }

    return <Navbar className='search' expand='md'>
        <NavbarToggler
            className={showSearchBox ? 'open' : ''} aria-label={showSearchBox ? 'Close search menu' : 'Open search menu'}
            onClick={() => setShowSearchBox(!showSearchBox)}
        />
        <Collapse navbar isOpen={showSearchBox}>
            <Nav className='ml-auto' navbar id="search-menu">
                <NavItem>
                    <Form inline onSubmit={doSearch}>
                        <FormGroup className='search--main-group'>
                            <Label for='header-search' className='sr-only'>Search</Label>
                            <Input
                                id="header-search" type="search" name="query" placeholder="Search" aria-label="Search"
                                value={searchText} onChange={setSearchTextAsValue} innerRef={searchInputRef}
                            />
                            <SearchButton />
                            <input type="hidden" name="types" value="isaacQuestionPage,isaacConceptPage" />
                        </FormGroup>
                    </Form>
                </NavItem>
            </Nav>
        </Collapse>
    </Navbar>;
};

export const MainSearch = withRouter(MainSearchComponent);
