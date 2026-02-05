import React, { useState, useEffect } from "react";
import { VenmoConnection, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, Trash2, Loader } from "lucide-react";
import { motion } from "framer-motion";

export default function VenmoConnect() {
  const [venmoUsername, setVenmoUsername] = useState("");
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVenmoConnection();
  }, []);

  const loadVenmoConnection = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const connections = await VenmoConnection.filter({
        user_id: { eq: currentUser.id }
      });

      if (connections && connections.length > 0) {
        setConnection(connections[0]);
        setVenmoUsername(connections[0].venmo_username);
      }
    } catch (error) {
      console.error("Error loading Venmo connection:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!venmoUsername.trim()) {
      setError("Please enter a Venmo username");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (connection) {
        await VenmoConnection.update(connection.id, {
          venmo_username: venmoUsername.trim()
        });
        setConnection({ ...connection, venmo_username: venmoUsername.trim() });
      } else {
        const newConnection = await VenmoConnection.create({
          user_id: user.id,
          venmo_username: venmoUsername.trim()
        });
        setConnection(newConnection);
      }
    } catch (error) {
      console.error("Error saving Venmo connection:", error);
      setError("Failed to save Venmo username. Please try again.");
    }
    setIsSaving(false);
  };

  const handleDisconnect = async () => {
    if (
      window.confirm(
        "Are you sure you want to disconnect your Venmo account? Users won't be able to send you payments via Venmo."
      )
    ) {
      setIsSaving(true);
      try {
        await VenmoConnection.delete(connection.id);
        setConnection(null);
        setVenmoUsername("");
      } catch (error) {
        console.error("Error disconnecting Venmo:", error);
        setError("Failed to disconnect. Please try again.");
      }
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
        <CardHeader className="border-b border-slate-200/40">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            Venmo
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {connection ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Connected</p>
                  <p className="text-green-700 text-sm">
                    @{connection.venmo_username}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venmo_username" className="text-slate-700">
                  Update Venmo Username
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="venmo_username"
                    type="text"
                    placeholder="@username"
                    value={venmoUsername}
                    onChange={(e) => setVenmoUsername(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || venmoUsername === connection.venmo_username}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? "Saving..." : "Update"}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleDisconnect}
                disabled={isSaving}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Disconnect Venmo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600 text-sm">
                Add your Venmo username so other users can send you payments directly.
              </p>

              <div className="space-y-2">
                <Label htmlFor="venmo_username" className="text-slate-700">
                  Venmo Username
                </Label>
                <Input
                  id="venmo_username"
                  type="text"
                  placeholder="@username"
                  value={venmoUsername}
                  onChange={(e) => {
                    setVenmoUsername(e.target.value);
                    setError("");
                  }}
                />
                {error && (
                  <div className="flex items-start gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving || !venmoUsername.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? "Connecting..." : "Connect Venmo"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}