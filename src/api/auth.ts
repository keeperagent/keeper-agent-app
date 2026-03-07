import { gql } from "@apollo/client";
import { TierStatusFragment } from "./tierStatus";

export const UserFragment = gql`
  ${TierStatusFragment}

  fragment UserField on User {
    _id
    email
    roles
    isVerify
    username
    tierStatus {
      ...TierStatusField
    }
    receiveWalletAddress
    discountPercent
    totalMarketplaceItem
    createdAt
    updatedAt
  }
`;

export const QueryGetUseInfo = gql`
  ${UserFragment}

  query {
    getUserInfo {
      data {
        ...UserField
      }
      code
      message
    }
  }
`;

export const QuerySignIn = gql`
  ${UserFragment}

  query (
    $email: String!
    $password: String!
    $isAdmin: Boolean!
    $deviceId: String!
  ) {
    signIn(
      email: $email
      password: $password
      isAdmin: $isAdmin
      deviceId: $deviceId
    ) {
      data {
        ...UserField
      }
      token
      expriredAt
      code
      message
    }
  }
`;

export const QueryLoginAppWithGoogle = gql`
  ${UserFragment}

  query ($authorizationCode: String!, $deviceId: String!) {
    loginAppWithGoogle(
      authorizationCode: $authorizationCode
      deviceId: $deviceId
    ) {
      data {
        ...UserField
      }
      token
      expriredAt
      code
      message
    }
  }
`;
