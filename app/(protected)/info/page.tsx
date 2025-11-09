import { currentUser } from "@/lib/auth";
import { UserInfo } from "@/components/user-info";
import TwoFactorCard from "@/app/settings/TwoFactorCard";

const InfoPage = async () => {
    const user = await currentUser();

    return (
        <div className="space-y-6">
            <UserInfo
                label="info component"
                user={user}
            />

            <TwoFactorCard />
        </div>
    );
};

export default InfoPage;
