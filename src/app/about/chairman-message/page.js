import { redirect } from "next/navigation";

export default function ChairmanMessageRedirect() {
  redirect("/about/hospital-message#chairman-message");
}
