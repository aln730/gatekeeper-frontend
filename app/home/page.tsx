import { redirect } from "next/navigation";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiKeyVariant, mdiDatabase } from "@mdi/js";
import { auth } from "@/lib/auth";

const sections = [
  {
    href: "/keys",
    title: "Keys",
    icon: mdiKeyVariant,
  },
  {
    href: "/logs",
    title: "Logs",
    icon: mdiDatabase,
  },
];

export default async function HomePage() {
  const session = await auth();
  if (!session?.username) {
    redirect("/signin");
  }

  return (
    <div className="container-lg py-5">
      <div className="row g-4 justify-content-center">
        {sections.map((section) => (
          <div key={section.href} className="col-12 col-md-5">
            <Link href={section.href} className="text-decoration-none">
              <div className="card h-100 text-center">
                <div className="card-body py-5">
                  <Icon path={section.icon} size={2} className="mb-3" />
                  <h5 className="card-title">{section.title}</h5>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
