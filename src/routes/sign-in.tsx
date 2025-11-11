import { SignIn } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {isClient ? <SignIn /> : <div>Loading...</div>}
    </div>
  );
}
