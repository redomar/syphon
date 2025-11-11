import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

function UserCount() {
  const users = useQuery(api.users.list);
  const userCount = users?.length ?? 0;

  return <p>User Count: {userCount}</p>;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div>
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Convex Connection Test</h2>
        {isClient ? <UserCount /> : <p>User Count: Loading...</p>}
      </div>
      <Welcome />
    </div>
  );
}
