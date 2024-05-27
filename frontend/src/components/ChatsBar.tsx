import React from 'react';
import { Link } from 'react-router-dom';

interface ChatsBarProps {
  username: string;
  friends: string[];
}

export const ChatsBar: React.FC<ChatsBarProps> = ({ username, friends }) => {
  return (
    <div className="chats-bar">
      <div className=' text-3xl'>List of Chats</div>
      <ul>
        {friends.map((friend, index) => (
          <li key={index}>
            <Link to={`/${username}/${friend}/chat`} className="friend-link">
              {friend}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
