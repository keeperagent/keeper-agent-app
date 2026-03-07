import { gql } from "@apollo/client";

export const ConfigurationFragment = gql`
  fragment ConfigutationField on Configuration {
    defaultBrowserVersionWindow
    defaultBrowserVersionMacOSArm
    defaultBrowserVersionMacOSIntel
  }
`;

// query
export const QueryGetConfiguration = gql`
  ${ConfigurationFragment}

  query {
    getPublicConfiguration {
      code
      message
      data {
        ...ConfigutationField
      }
    }
  }
`;
