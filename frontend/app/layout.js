import { ClerkProvider } from "@clerk/nextjs";
import ClientNav from "../components/ClientNav"; // Import the new ClientNav component
import "bootstrap/dist/css/bootstrap.min.css";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ClientNav /> {/* Render the client-side navigation */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
