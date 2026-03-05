import React from "react";
import { Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreateOffer() {
  // Redirect to Lending page with create tab active
  return <Navigate to={createPageUrl("Lending") + "?tab=create"} replace />;
}
