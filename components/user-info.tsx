import type { Session } from "next-auth";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserInfoProps {
  user?: Session["user"];
  label: string;
}

export const UserInfo = ({ user, label }: UserInfoProps) => {
  return (
      <Card className="w-[600px] shadow-md">
        <CardHeader>
          <p className="text-2xl font-semibold text-center">
            Account info
          </p>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Item wrapper */}
          {[
            ["ID", user?.id],
            ["Name", user?.name],
            ["Email", user?.email],
            ["Role", user?.role],
          ].map(([title, value]) => (
              <div
                  key={title}
                  className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3 shadow-sm"
              >
                <p className="text-sm font-medium">{title}</p>
                <p className="
              text-xs
              font-mono
              px-2 py-1
              bg-slate-800/40
              rounded-md
              text-slate-200
              break-all
              max-w-[300px]
              text-right
            ">
                  {value || "---"}
                </p>
              </div>
          ))}

          {/* 2FA */}
          <div className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3 shadow-sm">
            <p className="text-sm font-medium">Two Factor Authentication</p>
            <Badge variant={user?.isTwoFactorEnabled ? "success" : "destructive"}>
              {user?.isTwoFactorEnabled ? "ON" : "OFF"}
            </Badge>
          </div>
        </CardContent>
      </Card>
  );
};
