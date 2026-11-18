import type { TypedDocumentNode } from '@apollo/client'
import { gql } from '@apollo/client'

/** Mirrors the server's `User` type. Every field is non-null. */
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  /** ISO 8601 timestamp */
  createdAt: string
  /** ISO 8601 timestamp */
  updatedAt: string
}

export const GET_USERS: TypedDocumentNode<{ users: User[] }> = gql`
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
