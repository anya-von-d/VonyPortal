import React, { useState, useEffect } from "react";
import { PayPalConnection } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Link2, Unlink, AlertCircle } from "lucide-react";

export default function PayPalConnect({ userId }) {
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConnection();
  }, [userId]);

  const loadConnection = async () => {
    try {
      const connections = await PayPalConnection.filter({ user_id: userId });
      if (connections.length > 0) {
        setConnection(connections[0]);
        setPaypalEmail(connections[0].paypal_email);
      }
    } catch (err) {
      console.error("Error loading PayPal connection:", err);
    }
    setIsLoading(false);
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    if (!paypalEmail || !paypalEmail.includes("@")) {
      setError("Please enter a valid PayPal email");
      setIsSaving(false);
      return;
    }

    try {
      if (connection) {
        await PayPalConnection.update(connection.id, {
          paypal_email: paypalEmail,
          is_verified: true
        });
        setConnection({ ...connection, paypal_email: paypalEmail, is_verified: true });
      } else {
        const newConnection = await PayPalConnection.create({
          user_id: userId,
          paypal_email: paypalEmail,
          is_verified: true
        });
        setConnection(newConnection);
      }
    } catch (err) {
      setError("Failed to save PayPal connection");
    }
    setIsSaving(false);
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setIsSaving(true);
    try {
      await PayPalConnection.delete(connection.id);
      setConnection(null);
      setPaypalEmail("");
    } catch (err) {
      setError("Failed to disconnect PayPal");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
        <CardContent className="p-6">
          <div className="h-20 bg-slate-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <img 
            src="https://www.paypalobjects.com/webstatic/icon/pp258.png" 
            alt="PayPal" 
            className="w-6 h-6" 
          />
          PayPal Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connection?.is_verified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800">PayPal Connected</p>
                <p className="text-sm text-green-700">{connection.paypal_email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isSaving}
                className="text-red-600 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <p className="text-sm text-slate-600">
              Connect your PayPal account to receive loan payments directly.
            </p>
            
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your-paypal@email.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#0070ba] hover:bg-[#005ea6]"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Connect PayPal
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}