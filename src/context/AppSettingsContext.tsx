import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getDoc, setDoc } from "firebase/firestore";
import { getDocumentReference } from "../common/firebase";
import AuthContext from "./AuthContext";

// Used until an admin sets a real one in the settings doc (or if it's
// missing/unreadable), so the contact link on Home never goes empty.
export const DEFAULT_ADMIN_EMAIL = "trainingplanner6@gmail.com";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app";
const PLATFORM_DOC_ID = "platform";

const AppSettingsContext = createContext({
  adminEmail: DEFAULT_ADMIN_EMAIL,
  updateAdminEmail: (email: string) => {},
  // Set by the billing guard (functions/src/guard.ts) once Cloud Functions
  // start costing money; anything that calls a function is unavailable.
  functionsSuspended: false,
});

export default AppSettingsContext;

type Props = {
  children: ReactNode;
};

// App-wide settings (currently just the admin contact email shown to users
// with no granted plans), stored in a single settings/app Firestore doc —
// readable by any signed-in user, writable only from the admin page.
export const AppSettingsContextProvider: React.FC<Props> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [adminEmail, setAdminEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [functionsSuspended, setFunctionsSuspended] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    getDoc(getDocumentReference(SETTINGS_COLLECTION, SETTINGS_DOC_ID))
      .then((snapshot) => {
        const email = snapshot.exists() ? snapshot.data()?.adminEmail : undefined;
        if (email) {
          setAdminEmail(email);
        }
      })
      // Offline: keep the default.
      .catch(() => {});
    getDoc(getDocumentReference(SETTINGS_COLLECTION, PLATFORM_DOC_ID))
      .then((snapshot) => setFunctionsSuspended(snapshot.data()?.functionsSuspended === true))
      .catch(() => {});
  }, [user]);

  const updateAdminEmail = async (email: string) => {
    await setDoc(
      getDocumentReference(SETTINGS_COLLECTION, SETTINGS_DOC_ID),
      { adminEmail: email },
      { merge: true }
    );
    setAdminEmail(email);
  };

  return (
    <AppSettingsContext.Provider
      value={{ adminEmail, updateAdminEmail, functionsSuspended }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};
