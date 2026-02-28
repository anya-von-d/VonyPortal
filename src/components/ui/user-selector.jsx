import React, { useState, useEffect } from "react";
import { Search, Check, User as UserIcon, Star, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function UserSelector({ users = [], value, onSelect, placeholder = "Search for a user...", onAddFriends, showAddFriends = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = safeUsers.filter(user => {
        if (!user || !user.username || !user.full_name) return false;
        const searchLower = searchTerm.toLowerCase();
        return (
          user.username.toLowerCase().includes(searchLower) ||
          user.full_name.toLowerCase().includes(searchLower)
        );
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(safeUsers);
    }
  }, [searchTerm, users]);

  const selectedUser = safeUsers.find(user => user && user.username === value);

  const handleSelect = (username) => {
    onSelect(username);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddFriends = () => {
    setIsOpen(false);
    setSearchTerm('');
    if (onAddFriends) {
      onAddFriends();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          placeholder={selectedUser ? `${selectedUser.full_name} (@${selectedUser.username})` : placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full left-0 right-0 z-20 mt-1 max-h-64 overflow-auto shadow-lg border">
            {filteredUsers.length === 0 && !showAddFriends ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No users found' : 'No friends yet. Add friends to send loan offers.'}
              </div>
            ) : (
              <div className="py-2">
                {filteredUsers.map((user) => {
                  if (!user || !user.username) return null;

                  return (
                    <div
                      key={user.username}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelect(user.username)}
                    >
                      <div className="relative">
                        <img
                          src={user.profile_picture_url || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=83F384&color=0A1A10&size=32`}
                          alt={user.full_name || 'User'}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=User&background=83F384&color=0A1A10&size=32`;
                          }}
                        />
                        {user.is_starred && (
                          <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          @{user.username}
                        </div>
                      </div>
                      {value === user.username && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  );
                })}

                {/* Add Friends Option */}
                {showAddFriends && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#DBFFEB] cursor-pointer border-t border-gray-100 bg-[#F0FFF5]"
                    onClick={handleAddFriends}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#00A86B] flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#00A86B]">
                        Add Friends
                      </div>
                      <div className="text-sm text-gray-500">
                        Find and add more friends
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show Add Friends even when no results */}
            {filteredUsers.length === 0 && showAddFriends && (
              <div className="py-2">
                <div className="p-4 text-center text-gray-500 border-b">
                  {searchTerm ? 'No friends found' : 'No friends yet'}
                </div>
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#DBFFEB] cursor-pointer bg-[#F0FFF5]"
                  onClick={handleAddFriends}
                >
                  <div className="w-8 h-8 rounded-full bg-[#00A86B] flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#00A86B]">
                      Add Friends
                    </div>
                    <div className="text-sm text-gray-500">
                      Find and add more friends
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
