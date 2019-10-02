import {useDispatch, useSelector} from "react-redux";
import {AppState} from "../../../state/reducers";
import React, {useEffect, useState} from "react";
import {getEventOverviews} from "../../../state/actions";
import {Accordion} from "../Accordion";
import * as RS from "reactstrap";
import {ShowLoading} from "../../handlers/ShowLoading";
import {Link} from "react-router-dom";
import {DateString} from "../DateString";
import {atLeastOne, zeroOrLess} from "../../../services/validation";
import {sortOnPredicateAndReverse} from "../../../services/sorting";
import {LoggedInUser} from "../../../../IsaacAppTypes";
import {isEventsLeader} from "../../../services/user";

export enum EventOverviewFilter {
    "All events" = "ALL",
    "Upcoming events" = "FUTURE",
    "Recent events" = "RECENT",
    "Past events" = "PAST",
}

export const EventOverviews = ({setSelectedEventId, user}: {user: LoggedInUser; setSelectedEventId: (eventId: string | null) => void}) => {
    const dispatch = useDispatch();
    const eventOverviews = useSelector((state: AppState) => state && state.eventOverviews);

    const [overviewFilter, setOverviewFilter] = useState(EventOverviewFilter["Upcoming events"]);
    const [sortPredicate, setSortPredicate] = useState("date");
    const [reverse, setReverse] = useState(false);

    useEffect(() => {
        setSelectedEventId(null);
        dispatch(getEventOverviews(overviewFilter));
    }, [overviewFilter]);

    return <Accordion title="Events overview" index={0}>
        {isEventsLeader(user) && <div className="bg-grey p-2 mb-4 text-center">
            As an event leader, you are only able to see the details of events which you manage.
        </div>}
        <div className="d-flex justify-content-end mb-4">
            <RS.Label>
                <RS.Input type="select" value={overviewFilter} onChange={e => {setOverviewFilter(e.target.value as EventOverviewFilter)}}>
                    {Object.entries(EventOverviewFilter).map(([filterLabel, filterValue]) =>
                        <option key={filterValue} value={filterValue}>{filterLabel}</option>
                    )}
                </RS.Input>
            </RS.Label>
        </div>

        <ShowLoading until={eventOverviews} thenRender={eventOverviews => <React.Fragment>
            {atLeastOne(eventOverviews.length) && <div className="overflow-auto">
                <RS.Table bordered className="mb-0 bg-white">
                    <thead>
                        <tr>
                            <th className="align-middle text-center">
                                Actions
                            </th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('title'); setReverse(!reverse);}}>
                                Title
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('date'); setReverse(!reverse);}}>
                                Date
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('bookingDeadline'); setReverse(!reverse);}}>
                                Booking deadline
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('location.address.town'); setReverse(!reverse);}}>
                                Location
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('eventStatus'); setReverse(!reverse);}}>
                                Status
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('numberOfConfirmedBookings'); setReverse(!reverse);}}>
                                Number confirmed
                            </RS.Button></th>
                            <th className="align-middle"><RS.Button color="link" onClick={() => {setSortPredicate('numberOfWaitingListBookings'); setReverse(!reverse);}}>
                                Number waiting
                            </RS.Button></th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventOverviews
                            .sort(sortOnPredicateAndReverse(sortPredicate, reverse))
                            .map((event) => <tr key={event.id}>
                                <td className="align-middle"><RS.Button color="primary" outline className="btn-sm" onClick={() => setSelectedEventId(event.id as string)}>
                                    Manage
                                </RS.Button></td>
                                <td className="align-middle"><Link to={`events/${event.id}`} target="_blank">{event.title} - {event.subtitle}</Link></td>
                                <td className="align-middle"><DateString>{event.date}</DateString></td>
                                <td className="align-middle"><DateString>{event.bookingDeadline}</DateString></td>
                                <td className="align-middle">{event.location && event.location.address && event.location.address.town}</td>
                                <td className="align-middle">{event.eventStatus}</td>
                                <td className="align-middle">{event.numberOfConfirmedBookings} / {event.numberOfPlaces}</td>
                                <td className="align-middle">{event.numberOfWaitingListBookings}</td>
                            </tr>)
                        }
                    </tbody>
                </RS.Table>
            </div>}
            {zeroOrLess(eventOverviews.length) && <p className="text-center">
                <strong>No events to display with this filter setting</strong>
            </p>}
        </React.Fragment>} />
    </Accordion>
};
