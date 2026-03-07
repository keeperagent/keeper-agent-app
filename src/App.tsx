import { useCallback, useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import { PersistGate } from "redux-persist/integration/react";
import { ApolloProvider } from "@apollo/client/react";
import enUS from "antd/lib/locale/en_US";
import "antd/dist/reset.css";
import "@xyflow/react/dist/style.css";
import { store, persistor } from "@/redux/store";
import { listLocale, LOCALE, LanguageContext } from "@/language";
import AppRoute from "@/route";
import LoadingFallback from "@/route/LoadingFallback";
import { useApollo, useRestoreAuth } from "@/hook";
import { MESSAGE } from "@/electron/constant";
import { ErrorBoundary } from "@/component";
import "@szhsin/react-menu/dist/index.css";
import "./style/font-faces.css";

const App = () => {
  const [locale, setLocale] = useState(LOCALE.EN);
  const apolloClient = useApollo();
  useRestoreAuth();

  useEffect(() => {
    window?.electron?.send(MESSAGE.INIT_PREFERENCE);
  }, []);

  const onChangeLocale = useCallback((selected: string) => {
    const newLocale = listLocale[selected] ? selected : LOCALE.EN;
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  const contextProvider = useMemo(
    () => ({
      locale,
      onChangeLocale,
    }),
    [locale, onChangeLocale],
  );

  return (
    <ErrorBoundary>
      <ConfigProvider locale={locale === LOCALE.EN ? enUS : enUS}>
        <ApolloProvider client={apolloClient}>
          <Provider store={store}>
            <LanguageContext.Provider value={contextProvider}>
              <PersistGate persistor={persistor} loading={<LoadingFallback />}>
                <ErrorBoundary>
                  <AppRoute />
                </ErrorBoundary>
              </PersistGate>
            </LanguageContext.Provider>
          </Provider>
        </ApolloProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
