import Image from "next/image";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { getAuthUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Image
          src="/mascot/beealert-logo.png"
          alt="BeeAlert"
          width={56}
          height={56}
          className="h-14 w-14 rounded-xl"
        />
        <div>
          <h1 className="text-xl font-semibold text-navy">Profile</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </header>

      <ProfileForm
        initial={{
          full_name: profile?.full_name ?? "",
          school: profile?.school ?? "",
          city: profile?.city ?? "",
          province: profile?.province ?? "",
          education_level: profile?.education_level ?? null,
          preferred_region: profile?.preferred_region ?? null,
          notification_preferences: profile?.notification_preferences ?? {
            weather: true,
            classes: true,
            school: true,
          },
        }}
      />
    </div>
  );
}
