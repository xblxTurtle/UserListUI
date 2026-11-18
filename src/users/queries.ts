import type { TypedDocumentNode } from '@apollo/client'
import { gql } from '@apollo/client'
import type { GetUsersQuery, GetUsersQueryVariables } from '../types/__generated__/graphql.ts'

export const GET_USERS: TypedDocumentNode<GetUsersQuery, GetUsersQueryVariables> = gql`
  query GetUsers {
    users {
      id
      firstName
      lastName
      email
      role
      createdAt
      updatedAt
    }
  }
`
