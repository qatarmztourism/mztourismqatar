import { redirect } from "next/navigation";

export default function RootSignupRedirect() {
  redirect("/en/signup");
}
