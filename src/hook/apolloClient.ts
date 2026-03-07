import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloLink,
  CombinedGraphQLErrors,
} from "@apollo/client";
import { store } from "@/redux/store";
import { ErrorLink } from "@apollo/client/link/error";
import { SetContextLink } from "@apollo/client/link/context";
import { graphQLEndPoint } from "@/config";
import { actUserLogout, actGetNewAccessToken } from "@/redux/auth";
import { saveAuthToken } from "./authStorage";

const tokenExpiredMessage = "jwt expired";
const PERMISSION_DENIED = "Permission denied";

const cache = new InMemoryCache();
let shouldRun = true;

const errorLink = () =>
  new ErrorLink(({ error }) => {
    const logOutUser = () => {
      if (store?.dispatch) {
        store?.dispatch(actUserLogout());
      }
    };

    const updateAccessToken = (token: string) => {
      if (store?.dispatch) {
        store?.dispatch(actGetNewAccessToken(token));
      }
    };

    if (error && CombinedGraphQLErrors.is(error)) {
      error?.errors?.map(async ({ message, locations, path }) => {
        if (!shouldRun) {
          return;
        }

        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        );

        if (message.includes(tokenExpiredMessage)) {
          shouldRun = false;

          const {
            Auth: { user },
          } = store?.getState();

          if (user?.refreshToken) {
            try {
              const response = await fetch(graphQLEndPoint!, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  query: `
                      query ($refreshToken: String!) {
                        getNewAccessToken(refreshToken: $refreshToken) {
                          token
                          exprired
                          code
                          message
                        }
                      }
                    `,
                  variables: { refreshToken: user?.refreshToken },
                }),
              });

              const { data } = await response.json();

              if (data?.getNewAccessToken) {
                const newToken = data?.getNewAccessToken?.token;
                updateAccessToken(newToken);
                // Keep safeStorage in sync with the refreshed access token
                const { Auth } = store.getState();
                saveAuthToken(newToken, Auth?.user);
              } else {
                logOutUser();
              }
            } catch (err: any) {
              console.log(`getNewAccessToken error: ${err?.message}`);
            }
          } else {
            logOutUser();
          }
        } else if (message === PERMISSION_DENIED) {
          // logOutUser();
        } else {
          if (!shouldRun) {
            shouldRun = true;
          }
        }
      });
    }
  });

const authLink = () =>
  new SetContextLink(() => {
    const state = store?.getState();
    const token = state?.Auth?.token;

    return {
      headers: { authorization: token || "" },
    };
  });

const graphQLLink = new HttpLink({
  uri: graphQLEndPoint,
});

let apolloClient: any;

const createApolloClient = () => {
  return new ApolloClient({
    ssrMode: false,
    link: ApolloLink.from([errorLink(), authLink(), graphQLLink]),
    cache,
  });
};

const getApolloClient = () => {
  return apolloClient ? apolloClient : createApolloClient();
};

const useApollo = () => {
  return getApolloClient();
};

export { useApollo };
