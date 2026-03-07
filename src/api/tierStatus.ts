import { gql } from "@apollo/client";

export const TierStatusFragment = gql`
  fragment TierStatusField on TierStatus {
    _id
    user {
      _id
      email
    }
    pricingTier {
      _id
      name
      price
      expireIn
    }
    expiredAt
    isCurrentTier
    createdAt
    updatedAt
  }
`;