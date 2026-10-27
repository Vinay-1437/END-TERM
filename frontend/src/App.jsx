import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

/**
 * App entry point.
 * AuthProvider wraps everything so auth state is accessible anywhere.
 * NotificationProvider depends on AuthProvider (reads the logged-in user).
 */
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
