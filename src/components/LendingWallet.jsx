import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatMoney } from "@/components/utils/formatMoney";

/**
 * Animated wallet component for the Lending/Borrowing overview.
 *
 * Shows up to 3 credit-card-style cards fanned out of a wallet pocket.
 * Each card shows a person's first name + their remaining balance. If
 * there are fewer than 3 loans, the remaining slots show a VISA or
 * Mastercard-style logo instead (keeping the three-card stack visible).
 *
 * On mount, the cards spring up from a tucked-in state.
 */
export default function LendingWallet({ cards, label, amount, sublabel }) {
  const [hidden, setHidden] = useState(true); // start tucked-in

  useEffect(() => {
    const t = setTimeout(() => setHidden(false), 350);
    return () => clearTimeout(t);
  }, []);

  // Fanned-up positions (indexed 0 = back, 2 = front). Y-offsets
  // adjusted for the taller credit-card-shaped cards.
  const REVEALED = [
    { y: -150, x: -10, rot: -4, z: 1 },
    { y: -100, x:   6, rot:  3, z: 2 },
    { y:  -50, x:  -2, rot: -1, z: 3 },
  ];
  const HIDDEN = [
    { y:  8, x: 0, rot: 0, z: 3 },
    { y:  4, x: 0, rot: 0, z: 2 },
    { y:  0, x: 0, rot: 0, z: 1 },
  ];

  // Distinct gradient palettes for cards that have names.
  const CARD_COLORS = [
    { bg: 'linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 100%)', text: '#4C1D95', sub: '#6D28D9' },
    { bg: 'linear-gradient(135deg, #BBF7D0 0%, #86EFAC 100%)', text: '#14532D', sub: '#16A34A' },
    { bg: 'linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)', text: '#1F2937', sub: '#6B7280' },
  ];
  // Brand fallbacks when a slot has no loan: [back, middle, front]
  const BRAND_FALLBACK = ['visa', 'mastercard', 'visa'];

  const WALLET_BG = '#2D5777';
  const WALLET_BG_DARK = '#1E3E58';

  const paddedCards = [...cards.slice(0, 3)];
  while (paddedCards.length < 3) paddedCards.push(null);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 320, margin: '0 auto', paddingTop: 160 }}>
      {/* Wallet back — rounded rectangle behind everything */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: 0, right: 0, top: 140, bottom: 0,
          background: `linear-gradient(180deg, ${WALLET_BG} 0%, ${WALLET_BG_DARK} 100%)`,
          borderRadius: 20,
          boxShadow: '0 14px 34px rgba(45,87,119,0.32), 0 2px 6px rgba(45,87,119,0.18)',
        }}
      />

      {/* Cards layer — taller, credit-card-like */}
      <div style={{ position: 'absolute', left: 14, right: 14, top: 180, height: 80, zIndex: 2 }}>
        {paddedCards.map((card, i) => {
          const t = hidden ? HIDDEN[i] : REVEALED[i];
          const palette = CARD_COLORS[i];
          const isEmpty = !card;
          const brand = BRAND_FALLBACK[i];
          return (
            <motion.div
              key={i}
              initial={{ y: HIDDEN[i].y, x: HIDDEN[i].x, rotate: HIDDEN[i].rot }}
              animate={{ y: t.y, x: t.x, rotate: t.rot, zIndex: t.z }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, mass: 0.95, delay: hidden ? 0 : i * 0.06 }}
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, height: 80,
                borderRadius: 10,
                background: isEmpty
                  ? (brand === 'visa'
                      ? 'linear-gradient(135deg, #1A1F71 0%, #0F1654 100%)'
                      : 'linear-gradient(135deg, #1F2937 0%, #0B0F19 100%)')
                  : palette.bg,
                padding: '12px 16px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {isEmpty ? (
                <>
                  {/* Chip row — just a small metallic square to sell the credit-card illusion */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      width: 24, height: 18, borderRadius: 3,
                      background: 'linear-gradient(135deg, #D4AF37 0%, #A37F10 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
                    }} />
                  </div>
                  {/* Brand logo row, bottom-right */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {brand === 'visa' ? (
                      <span style={{
                        fontSize: 18, fontWeight: 900, color: '#ffffff',
                        letterSpacing: '0.06em', fontStyle: 'italic',
                        fontFamily: "'DM Sans', sans-serif",
                        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                      }}>VISA</span>
                    ) : (
                      // Mastercard double-circle logo
                      <svg width="34" height="22" viewBox="0 0 34 22" aria-label="Mastercard">
                        <circle cx="12" cy="11" r="9" fill="#EB001B" />
                        <circle cx="22" cy="11" r="9" fill="#F79E1B" />
                        <path d="M17 4.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13z" fill="#FF5F00" />
                      </svg>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Top: chip + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 22, height: 16, borderRadius: 3,
                      background: 'linear-gradient(135deg, #D4AF37 0%, #A37F10 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: palette.text, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {card.name}
                    </span>
                  </div>
                  {/* Bottom: balance */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: palette.sub, letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif" }}>
                      {formatMoney(card.amount)}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Wallet front (pocket) — covers the lower half of the cards */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          marginTop: 80,
          height: 140,
          background: `linear-gradient(180deg, ${WALLET_BG} 0%, ${WALLET_BG_DARK} 100%)`,
          borderRadius: 20,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.18), 0 2px 6px rgba(45,87,119,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '18px 22px',
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, color: '#ffffff', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {amount}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', fontWeight: 400, marginTop: 6, textAlign: 'center' }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}
