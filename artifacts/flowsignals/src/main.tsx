import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "./lib/auth";

// Set up custom fetch auth token
setAuthTokenGetter(getToken);

// Force dark mode
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
