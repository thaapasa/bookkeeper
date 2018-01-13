export interface DbObject {
    id: number;
};

export interface Group extends DbObject {
    name: string;
    defaultSourceId?: number | null;
}

export interface UserShare {
    userId: number;
    share: number;
};

export interface Source extends DbObject {
    name: string;
    abbreviation: string | null;
    shares: number;
    users: UserShare[];
}

export interface Category extends DbObject {
    parentId: number | null;
    name: string;
}

export interface MainCategory extends Category {
    parentId: null;
    children: Category[];
}

export interface User extends DbObject {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string;
    defaultGroupId?: number | null;
}

export interface SessionBasicInfo {
    token: string;
    user: User;
    group: Group;
    refreshToken: string;
    loginTime?: Date;
}

export interface Session extends SessionBasicInfo {
    groups: Group[];
    sources: Source[];
    categories: MainCategory[];
    users: User[];
}
