import React, { useState, useEffect } from "react";
import { Search, Check, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function UserSelector({ users = [], value, onSelect, placeholder = "Search for a user..." }) {
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
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No users found' : 'No users available'}
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
                      <img 
                        src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=4f46e5&color=fff&size=32`} 
                        alt={user.full_name || 'User'} 
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=User&background=4f46e5&color=fff&size=32`;
                        }}
                      />
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
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}