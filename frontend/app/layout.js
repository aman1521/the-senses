import "@/styles/globals.css";

import Navbar from "@/components/ui/Navbar";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="bg-black text-white antialiased">
                <Navbar />
                {children}
            </body>
        </html>
    );
}
