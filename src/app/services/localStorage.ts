/* eslint-disable no-console */
export enum KEY {
    AFTER_AUTH_PATH = "afterAuthPath",
    CURRENT_USER_ID = "currentUserId",
    FIRST_LOGIN = "firstLogin",
    REQUIRED_MODAL_SHOWN_TIME = "requiredModalShownTime",
    LAST_NOTIFICATION_TIME = "lastNotificationTime",
    ANONYMISE_USERS = "anonymiseUsers",
    MOST_RECENT_ALL_TOPICS_PATH = "mostRecentAllTopicsPath",
}

export const LOADING_FAILURE_VALUE = null;

export const save = function save(key: KEY, value: string) {
    try {
        window.localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.error("Failed to save to local storage. This might be a browser restriction.", e);
        return false;
    }
};

export const load = function load(key: KEY) {
    try {
        return window.localStorage.getItem(key);
    } catch (e) {
        console.error("Failed to read from local storage. This might be a browser restriction.", e);
        return LOADING_FAILURE_VALUE;
    }
};

export const remove = function remove(key: KEY) {
    try {
        window.localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error("Failed to remove from local storage. This might be a browser restriction.", e);
        return false;
    }
};

export const clear = function clear() {
    try {
        window.localStorage.clear();
        return true;
    } catch (e) {
        console.error("Failed to clear local storage. This might be a browser restriction.", e);
        return false;
    }
};

export const session = {
    save: function sessionSave(key: KEY, value: string) {
        try {
            window.sessionStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error("Failed to save to session storage. This might be a browser restriction.", e);
            return false;
        }
    },

    load: function sessionLoad(key: KEY) {
        try {
            return window.sessionStorage.getItem(key);
        } catch (e) {
            console.error("Failed to read from session storage. This might be a browser restriction.", e);
            return LOADING_FAILURE_VALUE;
        }
    },

    remove: function sessionRemove(key: KEY) {
        try {
            window.sessionStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error("Failed to remove from session storage. This might be a browser restriction.", e);
            return false;
        }
    },

    clear: function clear() {
        try {
            window.sessionStorage.clear();
            return true;
        } catch (e) {
            console.error("Failed to clear session storage. This might be a browser restriction.", e);
            return false;
        }
    },
};
