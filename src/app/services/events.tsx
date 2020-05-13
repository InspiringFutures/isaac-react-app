import {IsaacEventPageDTO} from "../../IsaacApiTypes";
import {apiHelper} from "./api";
import {AugmentedEvent} from "../../IsaacAppTypes";
import {DateString, FRIENDLY_DATE, TIME_ONLY} from "../components/elements/DateString";
import React from "react";

export const augmentEvent = (event: IsaacEventPageDTO): AugmentedEvent => {
    const augmentedEvent: AugmentedEvent = Object.assign({}, event);
    if (event.date != null) {
        const startDate = new Date(event.date);
        const now = Date.now();
        if (event.endDate != null) {  // Non-breaking change; if endDate not specified, behaviour as before
            const endDate = new Date(event.endDate);
            augmentedEvent.multiDay = startDate.toDateString() != endDate.toDateString();
            augmentedEvent.expired = now > endDate.getTime();
            augmentedEvent.withinBookingDeadline = event.bookingDeadline ? now <= new Date(event.bookingDeadline).getTime() : true;
            augmentedEvent.inProgress = startDate.getTime() <= now && now <= endDate.getTime();
        } else {
            augmentedEvent.expired = now > startDate.getTime();
            augmentedEvent.inProgress = false;
            augmentedEvent.multiDay = false;
        }
    }

    if (event.tags) {
        augmentedEvent.teacher = event.tags.includes("teacher");
        augmentedEvent.student = event.tags.includes("student");
        augmentedEvent.virtual = event.tags.includes("virtual");
        augmentedEvent.recurring = event.tags.includes("recurring");
        augmentedEvent.field =
            (event.tags.includes("physics") && "physics") ||
            (event.tags.includes("maths") && "maths") ||
            undefined;
    }

    // we have to fix the event image url.
    if(augmentedEvent.eventThumbnail && augmentedEvent.eventThumbnail.src) {
        augmentedEvent.eventThumbnail.src = apiHelper.determineImageUrl(augmentedEvent.eventThumbnail.src);
    } else {
        if (augmentedEvent.eventThumbnail == null) {
            augmentedEvent.eventThumbnail = {};
        }
        augmentedEvent.eventThumbnail.src = 'http://placehold.it/500x276';
        augmentedEvent.eventThumbnail.altText = 'placeholder image.';
    }

    return augmentedEvent;
};

export const formatEventDetailsDate = (event: AugmentedEvent) => {
    if (event.recurring) {
        return <span>Series starts <DateString>{event.date}</DateString></span>;
    } else if (event.multiDay) {
        return <><DateString>{event.date}</DateString>{" — "}<DateString>{event.endDate}</DateString></>;
    } else {
        return <><DateString>{event.date}</DateString>{" — "}<DateString formatter={TIME_ONLY}>{event.endDate}</DateString></>;
    }
}

export const formatEventCardDate = (event: AugmentedEvent, podView?: boolean) => {
    if (event.recurring) {
        return <span>Series starts <DateString formatter={FRIENDLY_DATE}>{event.date}</DateString><br />
            <DateString formatter={TIME_ONLY}>{event.date}</DateString> — <DateString formatter={TIME_ONLY}>{event.endDate}</DateString>
        </span>;
    } else if (event.multiDay) {
        return <>
            <DateString>{event.date}</DateString><br/>
            <DateString>{event.endDate}</DateString>
        </>;
    } else {
        return <>
            <DateString formatter={FRIENDLY_DATE}>{event.endDate}</DateString>{podView ? " " : <br />}
            <DateString formatter={TIME_ONLY}>{event.date}</DateString> — <DateString formatter={TIME_ONLY}>{event.endDate}</DateString>
        </>;
    }
}