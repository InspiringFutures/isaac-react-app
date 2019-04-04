import {QuestionDTO, RegisteredUserDTO} from "../IsaacApiTypes";

export const registeredUserDTOs: {[key: string]: RegisteredUserDTO} = {
    dameShirley: {
        givenName: "Steve",
        familyName: "Shirley",
        gender: "FEMALE",
        id: 1
    },
    profWheeler: {
        givenName: "David",
        familyName: "Wheeler",
        gender: "MALE",
        id: 2
    }
};

export const questionDTOs: {[key: string]: QuestionDTO} = {
    aToboggan: {
        id: "a_toboggan|123abc"
    },
    manVsHorse: {
        id: "man_vs_horse|test"
    }
};