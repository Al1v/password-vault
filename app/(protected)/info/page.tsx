import { currentUser } from "@/lib/auth";
import { UserInfo } from "@/components/user-info";

const InfoPage = async () => {
  const user = await currentUser();

  return ( 
    <UserInfo
      label="info component"
      user={user}
    />
   );
}
 
export default InfoPage;