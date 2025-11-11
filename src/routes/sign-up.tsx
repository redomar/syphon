import { SignUp } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {isClient ? <SignUp /> : <div>Loading...</div>}
    </div>
  );
}
