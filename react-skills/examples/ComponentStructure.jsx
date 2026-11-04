import { UserCardHeader } from './UserCardHeader';
import { UserCardBody } from './UserCardBody';

export function UserCard({ user }) {
  return (
    <div className="user-card">
      <UserCardHeader user={user} />
      <UserCardBody user={user} />
    </div>
  );
}

export default UserCard;