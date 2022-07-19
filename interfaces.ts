export interface IdPlusName {
    id: string;
    name: string;
};

export interface IdPlusUrl {
    id: string;
    url: string;
};

export interface FilesPlusPlus {
    files: IdPlusName[];
    comments: string;
    name: string;
    date: number;
}

export interface Event {
    id: string;
    activityId: string;
    end: number;
};

export interface Activity {
    id: string;
    title: string;
    description: string;
    subject: string;
    files: IdPlusName[];
    type: string;
    delivery: string;
    author: IdPlusName;
    date: number;
    expiration: number;
    delivered: FilesPlusPlus;
    result: string;
    viewed: boolean;
    receiver: string[];
};

export interface Child {
    id: string;
    name: string;
};

export interface Person {
    id: string;
    name: string;
    email: string;
    type: string;
    subject: string;
    children: Child[];
};

export interface PersonSelect {
    Name: string;
    Email: string;
    Type: string;
    Subject: string;
    Children: string[];
};

export interface Grade {
    id: string;
    fullName: string;
    subject: string;
    deliberation: string;
    conceptual: string;
    averageFirstFour: string;
    averageSecondFour: string;
    final: string;
}

export interface User {
    id: string;
    name: string;
    schoolName: string;
    schoolLogo?: string;
    tfa: boolean;
    teacher: string;
    administrator: boolean;
    grades: Grade[];
    available: SimpleUser[];
    children: string[]
};

export interface SimpleUser {
    id: string;
    name: string;
    teacher: string;
    children: string[];
    type: string;
};

export interface School {
    id: string;
    name: string;
    logo: string;
};

export interface Message {
    id: string;
    title: string;
    content: string;
    preview?: string;
    pdf?: string;
    files: IdPlusName[];
    author: IdPlusName;
    date: number;
    receiver: IdPlusName[];
};

export interface Report {
    id: string;
    title: string;
    file: IdPlusName;
    author: IdPlusName;
    date: number;
};

export interface Result {
    result: string;
    name: string;
};

export interface Viewed {
    viewed: boolean;
    name: string;
};

export interface OTP {
    secret: string;
    qr: string;
}

export interface Receiver {
    key: string;
    type?: string;
    text?: string;
    noDivider?: boolean;
}

export interface File {
    data: string;
    name: string;
    filename: string;
    type: string;
}