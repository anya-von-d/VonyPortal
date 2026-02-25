import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, Gift, Shirt, Coffee, Sparkles,
  CreditCard, Percent, Star, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function Shop() {
  const categories = [
    {
      icon: Shirt,
      title: "Vony Merch",
      description: "Rep the brand with exclusive apparel",
      color: "bg-purple-100 text-purple-600",
      items: "Coming soon"
    },
    {
      icon: Gift,
      title: "Gift Cards",
      description: "Perfect for any occasion",
      color: "bg-pink-100 text-pink-600",
      items: "Coming soon"
    },
    {
      icon: CreditCard,
      title: "Premium Features",
      description: "Unlock advanced lending tools",
      color: "bg-blue-100 text-blue-600",
      items: "Coming soon"
    },
    {
      icon: Percent,
      title: "Partner Deals",
      description: "Exclusive discounts from our partners",
      color: "bg-green-100 text-green-600",
      items: "Coming soon"
    }
  ];

  const featuredProducts = [
    {
      name: "Vony Premium",
      description: "Advanced analytics, priority support, and more",
      price: "Coming Soon",
      badge: "Most Popular",
      icon: Star
    },
    {
      name: "Vony T-Shirt",
      description: "Soft cotton tee with the Vony logo",
      price: "Coming Soon",
      badge: null,
      icon: Shirt
    },
    {
      name: "Coffee Mug",
      description: "Start your day with Vony",
      price: "Coming Soon",
      badge: null,
      icon: Coffee
    }
  ];

  return (
    <div className="min-h-screen p-3 md:p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-[#35B276]/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-[#35B276]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">
            Shop
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto">
            Merch, premium features, and exclusive deals
          </p>
        </motion.div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-[#35B276] to-[#2d9561] text-white border-0">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <h2 className="text-xl font-bold mb-2">Shop Coming Soon!</h2>
              <p className="opacity-90 max-w-md mx-auto">
                We're building something special. Get ready for merch, premium features, and exclusive partner deals.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories */}
        <div className="grid sm:grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center flex-shrink-0`}>
                      <category.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{category.title}</h3>
                      <p className="text-sm text-slate-500">{category.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Featured Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Featured</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {featuredProducts.map((product, index) => (
              <Card key={product.name} className="bg-white/70 backdrop-blur-sm border-slate-200/60 overflow-hidden">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <product.icon className="w-8 h-8 text-slate-400" />
                  </div>
                  {product.badge && (
                    <Badge className="bg-[#35B276] text-white mb-2">{product.badge}</Badge>
                  )}
                  <h3 className="font-semibold text-slate-800">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-3">{product.description}</p>
                  <p className="text-sm font-medium text-slate-400">{product.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Notify Me */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-slate-800 mb-2">Get early access</h3>
              <p className="text-sm text-slate-500 mb-4">
                Be the first to shop when we launch
              </p>
              <Button className="bg-[#35B276] hover:bg-[#2d9a65]">
                Notify Me
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
