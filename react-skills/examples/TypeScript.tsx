interface User {
  id: number;
  name: string;
  email: string;
}

interface UserCardProps {
  user: User;
  onUpdate: (user: User) => void;
}

function UserCard({ user, onUpdate }: UserCardProps) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onUpdate(user)}>Update</button>
    </div>
  );
}

export default UserCard;