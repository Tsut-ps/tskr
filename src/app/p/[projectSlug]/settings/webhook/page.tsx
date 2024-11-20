import { Separator } from "@/components/ui/separator";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Discord Webhook</h3>
        <p className="text-sm text-muted-foreground">
          Webhookを使ってDiscordで通知を受け取ります。
        </p>
      </div>
      <Separator />
    </div>
  );
}
