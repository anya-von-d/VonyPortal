import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatMoney } from "@/components/utils/formatMoney";

/**
 * Wallet component — cards rest INSIDE the wallet pocket, visible from the top.
 * On mount they slide down into their resting positions from a fully-hidden state.
 */
export default function LendingWallet({ cards, label, amount, sublabel }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  const WALLET_BG      = '#1A1918';
  const WALLET_BG_DARK = '#111110';
  const POCKET_BG      = '#1A1918';

  // Credit-card palettes (back→front order, index 0 = back card)
  const CARD_COLORS = [
    { bg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
    { bg: 'linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)', text: '#1F2937', sub: '#6B7280' },
    { bg: 'linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 100%)', text: '#4C1D95', sub: '#6D28D9' },
  ];
  const BRAND_FALLBACK = ['visa', 'mastercard', 'visa'];

  const paddedCards = [...cards.slice(0, 3)];
  while (paddedCards.length < 3) paddedCards.push(null);

  // How much of each card peeks above the pocket — back card shows least
  const PEEK = [28, 18, 8]; // px above pocket top, index 0 = back, 2 = front

  // Wallet dimensions
  const WALLET_W  = 300;
  const WALLET_H  = 300;
  const POCKET_H  = 160;  // height of the lower "pocket" face
  const CARD_W    = WALLET_W - 28;
  const CARD_H    = 82;
  const POCKET_TOP = WALLET_H - POCKET_H; // y where pocket starts = 140

  // Each card's resting Y inside the wallet (cards sit in the card area above pocket)
  // "Revealed" = card peeks above pocket by PEEK[i] amount
  // Card top = POCKET_TOP - PEEK[i] - CARD_H
  const cardRestY = (i) => POCKET_TOP - PEEK[i] - CARD_H;
  // Hidden = all cards tucked below pocket bottom
  const cardHiddenY = WALLET_H + 10;

  // Slight fan rotations (back card tilted most, front least)
  const ROTS   = [-3, 2, 0];
  const X_OFFS = [-4, 4, 0];

  return (
    <div style={{
      position: 'relative',
      width: WALLET_W,
      height: WALLET_H,
      borderRadius: 28,
      background: `linear-gradient(160deg, ${WALLET_BG} 0%, ${WALLET_BG_DARK} 100%)`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Subtle leather texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 28, zIndex: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
      }} />

      {/* Cards layer — clipped to wallet */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {paddedCards.map((card, i) => {
          const palette   = CARD_COLORS[i];
          const isEmpty   = !card;
          const brand     = BRAND_FALLBACK[i];
          const restY     = cardRestY(i);
          return (
            <motion.div
              key={i}
              initial={{ y: cardHiddenY, rotate: ROTS[i], x: X_OFFS[i] }}
              animate={{ y: revealed ? restY : cardHiddenY, rotate: ROTS[i], x: X_OFFS[i] }}
              transition={{
                type: 'spring', stiffness: 200, damping: 26, mass: 1.1,
                delay: revealed ? (2 - i) * 0.07 : 0,
              }}
              style={{
                position: 'absolute',
                left: 14,
                width: CARD_W,
                height: CARD_H,
                borderRadius: 10,
                background: isEmpty
                  ? (brand === 'visa'
                    ? 'linear-gradient(135deg, #1A1F71 0%, #0F1654 100%)'
                    : 'linear-gradient(135deg, #1F2937 0%, #0B0F19 100%)')
                  : palette.bg,
                padding: '10px 14px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                zIndex: i + 1,
              }}
            >
              {isEmpty ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      width: 22, height: 16, borderRadius: 3,
                      background: 'linear-gradient(135deg, #D4AF37 0%, #A37F10 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {brand === 'visa' ? (
                      <span style={{
                        fontSize: 16, fontWeight: 900, color: '#ffffff',
                        letterSpacing: '0.06em', fontStyle: 'italic',
                        fontFamily: "'DM Sans', sans-serif",
                        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                      }}>VISA</span>
                    ) : (
                      <svg width="32" height="20" viewBox="0 0 34 22" aria-label="Mastercard">
                        <circle cx="12" cy="11" r="9" fill="#EB001B" />
                        <circle cx="22" cy="11" r="9" fill="#F79E1B" />
                        <path d="M17 4.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13z" fill="#FF5F00" />
                      </svg>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 20, height: 15, borderRadius: 3,
                      background: 'linear-gradient(135deg, #D4AF37 0%, #A37F10 100%)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: palette.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{card.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: palette.text,
                      letterSpacing: '-0.01em',
                    }}>{formatMoney(card.amount)}</span>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pocket face — covers lower portion, sits above cards */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        top: POCKET_TOP,
        height: POCKET_H,
        zIndex: 10,
        background: `linear-gradient(180deg, ${POCKET_BG} 0%, ${WALLET_BG_DARK} 100%)`,
        borderRadius: '20px 20px 28px 28px',
        boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '0 24px 24px',
      }}>
        {/* Subtle top-edge curve shadow to sell depth */}
        <div style={{
          position: 'absolute', top: -1, left: 0, right: 0, height: 16,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)',
          borderRadius: '20px 20px 0 0',
        }} />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginBottom: 4, letterSpacing: '0.02em' }}>
          {label}
        </div>
        <div style={{ fontSize: 30, color: '#ffffff', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {amount}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 400, marginTop: 5 }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}
