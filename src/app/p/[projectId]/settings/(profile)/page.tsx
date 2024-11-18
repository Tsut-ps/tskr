import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">プロフィール</h3>
        <p className="text-sm text-muted-foreground">
          使う側の良心の上で成り立っています。他人のものを勝手に変更しないでください。
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  );
}
