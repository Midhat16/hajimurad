import { redirect } from "next/navigation";

export default function AdminsMessageRedirect() {
  redirect("/about/hospital-message#admin-message");
}
