import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PendingLoanOffers({ offers }) {
  const safeOffers = Array.isArray(offers) ? offers : [];

  if (safeOffers.length === 0) {
    return null;
  }

  const offerCount = safeOffers.length;
  const offerText = offerCount === 1 ? "loan offer" : "loan offers";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card style={{backgroundColor: '#dcfce7', borderColor: '#86efac'}} className="backdrop-blur-sm border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">
                  You have {offerCount} pending {offerText}! 🎉
                </h3>
                <p className="text-slate-600 text-sm">
                  Review and accept offers from lenders
                </p>
              </div>
            </div>
            <Link to={createPageUrl("MyLoanOffers")}>
              <Button
                className="bg-green-600 hover:bg-green-700 font-semibold gap-2"
              >
                View Offers
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
