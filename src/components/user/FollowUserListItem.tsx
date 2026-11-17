import { Link } from "react-router-dom";
import type { FollowUserProfile, FollowUserRow } from "../../lib/followApi";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";
import "../../styles/pages/follow.css";

type FollowUserListItemProps = {
  user: FollowUserRow;
  onFollowChange: (user: FollowUserProfile) => void;
};

export default function FollowUserListItem({ user, onFollowChange }: FollowUserListItemProps) {
  return (
    <li className="list-group-item d-flex align-items-center gap-3 py-3">
      <UserAvatar size="md" />
      <Link to={`/users/${user.id}`} className="fw-bold text-decoration-none flex-grow-1 follow-user-name">
        {user.name}
      </Link>
      {user.isCurrentUser ? (
        <span className="text-muted small flex-shrink-0">あなた</span>
      ) : (
        <FollowButton
          userId={user.id}
          userName={user.name}
          followed={user.followedByCurrentUser}
          onChange={onFollowChange}
        />
      )}
    </li>
  );
}
