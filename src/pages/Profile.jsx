import React, { useState, useEffect, useRef } from "react";
import { User, PublicProfile } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  MapPin,
  Camera,
  AtSign,
  LogOut,
  Palette,
  Image,
  Trash2,
  PiggyBank,
  Sun,
  Landmark,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PaymentMethodsConnect from "@/components/profile/PaymentMethodsConnect";

// Helper function to sync public profile, moved here to adhere to file structure rules
const syncPublicProfile = async (userData) => {
  if (!userData || !userData.id || !userData.username || !userData.full_name) {
    console.log("syncPublicProfile: Not enough data to sync.", userData);
    return;
  }
  try {
    const existingProfiles = await PublicProfile.filter({ user_id: { eq: userData.id } });
    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent((userData.full_name || 'User').charAt(0))}&background=22c55e&color=fff&size=128`;
    const publicProfileData = {
      user_id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      profile_picture_url: userData.profile_picture_url || defaultAvatarUrl
    };
    if (existingProfiles && existingProfiles.length > 0) {
      const existing = existingProfiles[0];
      if (existing.username !== publicProfileData.username || existing.full_name !== publicProfileData.full_name || existing.profile_picture_url !== publicProfileData.profile_picture_url) {
        await PublicProfile.update(existing.id, publicProfileData);
      }
    } else {
      await PublicProfile.create(publicProfileData);
    }
  } catch (error) {
    console.error("Failed to sync public profile:", error);
  }
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    location: '',
    profile_picture_url: '',
    theme_preference: 'morning'
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData?.full_name || '',
        username: userData?.username || '',
        phone: userData?.phone || '',
        location: userData?.location || '',
        profile_picture_url: userData?.profile_picture_url || '',
        theme_preference: userData?.theme_preference || 'morning'
      });

      // Sync Public Profile using the utility function
      await syncPublicProfile(userData);
    } catch (error) {
      console.error("Error loading user data:", error);
      setError("Failed to load profile data. Please try refreshing the page.");
      if (error.message?.includes("401") || error.message?.includes("unauthorized")) {
        navigate(createPageUrl("Dashboard"));
      }
    }
    setIsLoading(false);
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username === user?.username) {
      setUsernameError(null);
      return true;
    }

    setIsCheckingUsername(true);
    try {
      const users = await User.list() || [];
      const existingUser = users.find(u => u.username === username && u.id !== user?.id);
      if (existingUser) {
        setUsernameError("This username is already taken");
        setIsCheckingUsername(false);
        return false;
      } else {
        setUsernameError(null);
        setIsCheckingUsername(false);
        return true;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Could not verify username availability");
      setIsCheckingUsername(false);
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check username availability when username changes
    if (field === 'username') {
      // Clear previous timeout if any
      if (handleInputChange.usernameCheckTimeout) {
        clearTimeout(handleInputChange.usernameCheckTimeout);
      }
      handleInputChange.usernameCheckTimeout = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    }

    // Auto-save theme preference
    if (field === 'theme_preference') {
      handleThemeChange(value);
    }
  };

  const handleThemeChange = async (theme) => {
    try {
      await User.updateMyUserData({ theme_preference: theme });
      setUser(prev => ({ ...prev, theme_preference: theme }));
      // Dispatch event to notify Layout about theme change
      window.dispatchEvent(new Event('themeChanged'));
    } catch (error) {
      console.error("Error updating theme:", error);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSaving(true);
      setError(null);
      setShowPhotoMenu(false);
      try {
        const { file_url } = await UploadFile({ file, userId: user?.id });
        setFormData(prev => ({...prev, profile_picture_url: file_url }));
        setUser(prev => ({...prev, profile_picture_url: file_url }));
        
        // Save the profile picture to the database immediately
        await User.updateMyUserData({ profile_picture_url: file_url });
        
        // Sync to public profile
        await syncPublicProfile({ ...user, profile_picture_url: file_url });
      } catch (error) {
        console.error("Error uploading profile picture", error);
        setError("Failed to upload profile picture. Please try again.");
      }
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    setError(null);
    setShowPhotoMenu(false);
    try {
      setFormData(prev => ({...prev, profile_picture_url: '' }));
      setUser(prev => ({...prev, profile_picture_url: '' }));
      
      // Save to database
      await User.updateMyUserData({ profile_picture_url: '' });
      
      // Sync to public profile
      await syncPublicProfile({ ...user, profile_picture_url: '' });
    } catch (error) {
      console.error("Error removing profile picture", error);
      setError("Failed to remove profile picture. Please try again.");
    }
    setSaving(false);
  };

  const handleSave = async () => {
    // Check username availability one more time before saving
    const isUsernameAvailable = await checkUsernameAvailability(formData.username);
    if (!isUsernameAvailable && formData.username !== user?.username) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Only include fields that exist in the database schema
      const updateData = {
        full_name: formData.full_name,
        username: formData.username,
        phone: formData.phone,
        location: formData.location,
        profile_picture_url: formData.profile_picture_url,
        theme_preference: formData.theme_preference
      };

      const updatedUser = await User.updateMyUserData(updateData);
      // Sync public profile with all latest data including updatedUser and updateData
      await syncPublicProfile({ ...user, ...updatedUser, ...updateData });
      await loadUserData();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to save profile changes. Please try again.");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error during logout:", error);
      navigate(createPageUrl("Home"));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state for initial load failure
  if (error && !user) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Connection Error</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={loadUserData} className="bg-green-600 hover:bg-green-700">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="relative inline-block group">
            <img 
              src={formData.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.full_name || 'User').charAt(0))}&background=22c55e&color=fff&size=128`} 
              alt="Profile" 
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
            />
            {isEditing && (
              <button 
                onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                className="absolute inset-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isSaving}
              >
                <Camera className="w-8 h-8"/>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleProfilePictureChange}
              className="hidden" 
              accept="image/*"
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleProfilePictureChange}
              className="hidden" 
              accept="image/*"
              capture="environment"
            />
            
            {showPhotoMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10"
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 w-full hover:bg-slate-50 transition-colors text-left"
                >
                  <Image className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Choose from Library</span>
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 w-full hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
                >
                  <Camera className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Take Photo</span>
                </button>
                {formData.profile_picture_url && (
                  <button
                    onClick={handleRemovePhoto}
                    className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-50 transition-colors text-left border-t border-slate-100"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Remove Profile Photo</span>
                  </button>
                )}
              </motion.div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mt-4">
            {formData.full_name || user.full_name}
          </h1>
          <p className="text-lg text-slate-600">
            Member since {user.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}
          </p>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
            className="mt-4"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </motion.div>

        {/* Coming Soon Modal */}
        <Dialog open={showComingSoonModal} onOpenChange={setShowComingSoonModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-6 h-6 text-green-600" />
                Feature Coming Soon
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-600">
                Bank account connections via Plaid & Dwolla are coming soon! This feature will enable secure bank transfers directly through Vony.
              </p>
              <p className="text-sm text-slate-500 mt-3">
                In the meantime, you can use Venmo, Cash App, PayPal, or Zelle for payments.
              </p>
            </div>
            <Button
              onClick={() => setShowComingSoonModal(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Got it!
            </Button>
          </DialogContent>
        </Dialog>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information - First */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-green-600" />
                  </div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-3">
                <div className="space-y-6">
                  {/* Name and Email fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="flex items-center gap-2">
                        <UserIcon className={`w-4 h-4 ${isEditing ? 'text-green-600' : 'text-slate-500'}`} />
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        disabled={!isEditing || isSaving}
                        placeholder="Enter your full name"
                        className={!isEditing ? 'bg-slate-50' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        Email Address
                      </Label>
                      <Input
                        value={user.email || 'Not provided'}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <AtSign className="w-4 h-4 text-green-600" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      disabled={!isEditing || isSaving}
                      placeholder="Choose a unique username"
                      className={!isEditing ? 'bg-slate-50' : usernameError ? 'border-red-300' : ''}
                      required
                    />
                    {isCheckingUsername && (
                      <p className="text-xs text-blue-600">Checking availability...</p>
                    )}
                    {usernameError && (
                      <p className="text-xs text-red-600">{usernameError}</p>
                    )}
                    {isEditing && !usernameError && formData.username && formData.username !== user.username && !isCheckingUsername && (
                      <p className="text-xs text-green-600">Username is available!</p>
                    )}
                  </div>

                  {/* Editable fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing || isSaving}
                        placeholder="Enter your phone number"
                        className={!isEditing ? 'bg-slate-50' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!isEditing || isSaving}
                        placeholder="City, State"
                        className={!isEditing ? 'bg-slate-50' : ''}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || usernameError || isCheckingUsername}
                      className="bg-green-600 hover:bg-green-700 font-semibold"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods - Second */}
            <PaymentMethodsConnect />
          </div>

          {/* Stats & Verification */}
          <div className="space-y-6">
            {/* Bank Account Connection */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-green-600" />
                  Bank Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Securely connect your bank account using Plaid & Dwolla to enable bank transfers.
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowComingSoonModal(true)}
                >
                  <Landmark className="w-4 h-4 mr-2" />
                  Connect Bank Account
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Powered by Plaid & Dwolla - Bank grade security
                </p>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Verified</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phone Verified</span>
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profile Complete</span>
                  <Badge className={user.full_name && user.username ?
                    "bg-green-100 text-green-800 border-green-200" :
                    "bg-gray-100 text-gray-800 border-gray-200"
                  }>
                    {user.full_name && user.username ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Incomplete
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Theme Preference */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Appearance</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('theme_preference', formData.theme_preference === 'morning' ? 'afternoon' : 'morning')}
                    className={`relative w-20 h-10 rounded-full transition-all duration-300 ${
                      formData.theme_preference === 'afternoon' ? 'bg-[#35B276]/30' : 'bg-[#F5DEB3]/30'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                      formData.theme_preference === 'afternoon' ? 'translate-x-10 bg-[#35B276]' : 'translate-x-0 bg-[#F5DEB3]'
                    }`}>
                      {formData.theme_preference === 'morning' ? (
                        <Sun className="w-4 h-4 text-white" />
                      ) : (
                        <PiggyBank className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="mt-8 flex justify-center">
            <Button variant="ghost" onClick={handleLogout} className="text-slate-600 hover:text-red-500">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
            </Button>
        </div>

      </div>
    </div>
  );
}
