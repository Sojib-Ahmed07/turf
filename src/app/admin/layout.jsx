// src/app/admin/layout.jsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AdminShell from "./_components/AdminShell";

export const metadata = {
    title: "Admin — TurfZone",
};

export default async function AdminLayout({ children }) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) redirect("/login?callbackUrl=/admin");
    if (session.user.role !== "admin") redirect("/");

    return (
        <AdminShell
            user={{
                name: session.user.name,
                email: session.user.email,
            }}
        >
            {children}
        </AdminShell>
    );
}