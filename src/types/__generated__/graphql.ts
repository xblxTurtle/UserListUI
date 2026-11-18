/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type GetUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersQuery = { users: Array<{ __typename: 'User', id: string, firstName: string, lastName: string, email: string, role: string, createdAt: string, updatedAt: string }> };
