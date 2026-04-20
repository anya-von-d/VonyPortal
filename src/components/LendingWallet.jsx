import React from "react";
import { formatMoney } from "@/components/utils/formatMoney";

/**
 * Stacked credit-card wallet.
 *
 * cards:        [{ id, name, amount, purpose }]  — one per active loan
 * summaryCard:  { label, amount, sublabel, chips }
 *               chips = [{ name, amount }] up to 3 for the wallet summary
 * onCardClick:  (id) => void  — 'summary' | loan.id
 * selectedId:   string
 * isLending:    bool
 */
export default function LendingWallet({ cards, summaryCard, onCardClick, selectedId, isLending }) {
  const CARD_H   = 110;   // total height of a loan card
  const HEADER_H = 36;    // gradient-band height at top of loan card
  const PEEK     = 74;    // how far each card peeks below the one in front
  const WIDTH    = 240;

  const accentColor  = isLending ? '#03ACEA' : '#1D5B94';
  const gradientCard = isLending
    ? 'linear-gradient(135deg, #1A6B9A 0%, #0288D1 60%, #26C6DA 100%)'
    : 'linear-gradient(135deg, #1A237E 0%, #1D5B94 60%, #1565C0 100%)';

  // Chip colors for the summary wallet card
  const CHIP_COLORS = [
    { bg: '#EBF4FA', border: 'rgba(3,172,234,0.18)',  name: '#5B9EC9', val: '#1A1918' },
    { bg: '#F0EDF8', border: 'rgba(124,58,237,0.15)', name: '#7C5AB8', val: '#1A1918' },
    { bg: '#FEFCE8', border: 'rgba(202,138,4,0.18)',  name: '#A37D10', val: '#1A1918' },
  ];

  const allCards = [
    ...cards.map(c => ({ ...c, isSummary: false })),
    { id: 'summary', isSummary: true, ...summaryCard },
  ];

  const N = allCards.length;
  // Container height: first card full height + each additional card peeks PEEK px below
  const containerH = CARD_H + (N - 1) * PEEK;

  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        height: containerH,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Render back → front so front card visually sits on top */}
      {[...allCards].reverse().map((card, revIdx) => {
        const origIdx  = N - 1 - revIdx; // 0 = front loan card
        const topPx    = origIdx * PEEK;
        const zIdx     = revIdx;           // 0 = back (summary), N-1 = front
        const isActive = selectedId === card.id;

        if (card.isSummary) {
          /* ── Summary / wallet card ── */
          const chips = (summaryCard.chips || []).slice(0, 3);
          const paddedChips = [...chips];
          while (paddedChips.length < 3) paddedChips.push(null);

          return (
            <div
              key="summary"
              onClick={() => onCardClick && onCardClick('summary')}
              style={{
                position: 'absolute',
                top: topPx,
                left: 0,
                width: WIDTH,
                height: CARD_H,
                zIndex: zIdx,
                cursor: 'pointer',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#F4F3F1',
                border: isActive
                  ? `1.5px solid ${accentColor}`
                  : '1px solid rgba(0,0,0,0.10)',
                boxShadow: isActive
                  ? `0 4px 20px ${accentColor}28, 0 2px 8px rgba(0,0,0,0.08)`
                  : '0 2px 10px rgba(0,0,0,0.07)',
                display: 'flex',
                flexDirection: 'column',
                padding: '0 14px',
                justifyContent: 'center',
                gap: 0,
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
              }}
            >
              {/* Chip rows — compact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {paddedChips.map((chip, i) => {
                  const c = CHIP_COLORS[i];
                  return (
                    <div key={i} style={{
                      height: 22, borderRadius: 6,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 8px', gap: 4,
                    }}>
                      <div style={{ width: 10, height: 7, borderRadius: 1.5, background: 'linear-gradient(135deg, #D4AF37 0%, #A37F10 100%)', flexShrink: 0 }} />
                      {chip ? (
                        <>
                          <span style={{ fontSize: 9, fontWeight: 600, color: c.name, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chip.name}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: c.val, flexShrink: 0 }}>
                            {formatMoney(chip.amount)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 9, color: '#C5C3C0', flex: 1 }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#E8E7E5', marginBottom: 7 }} />

              {/* Total */}
              <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9B9A98', marginBottom: 2 }}>
                {summaryCard.label || (isLending ? "You're owed" : 'You owe')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1918', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {summaryCard.amount}
              </div>
              <div style={{ fontSize: 9, color: '#9B9A98', marginTop: 2 }}>
                {summaryCard.sublabel}
              </div>
            </div>
          );
        }

        /* ── Loan / credit card ── */
        return (
          <div
            key={card.id}
            onClick={() => onCardClick && onCardClick(card.id)}
            style={{
              position: 'absolute',
              top: topPx,
              left: 0,
              width: WIDTH,
              height: CARD_H,
              zIndex: zIdx,
              cursor: 'pointer',
              borderRadius: 16,
              overflow: 'hidden',
              border: isActive
                ? `1.5px solid ${accentColor}`
                : '1px solid rgba(0,0,0,0.07)',
              boxShadow: isActive
                ? `0 4px 20px ${accentColor}28, 0 2px 8px rgba(0,0,0,0.08)`
                : origIdx === 0
                  ? '0 6px 18px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)'
                  : '0 2px 10px rgba(0,0,0,0.09)',
              background: '#ffffff',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)'; }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = isActive
                ? `0 4px 20px ${accentColor}28, 0 2px 8px rgba(0,0,0,0.08)`
                : origIdx === 0
                  ? '0 6px 18px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)'
                  : '0 2px 10px rgba(0,0,0,0.09)';
            }}
          >
            {/* Gradient top band */}
            <div style={{
              height: HEADER_H,
              background: gradientCard,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 14px',
            }}>
              {/* Chip icon */}
              <div style={{
                width: 22, height: 16, borderRadius: 3,
                background: 'linear-gradient(135deg, #E8C96B 0%, #C9993A 100%)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 1.5,
                padding: 3,
              }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
                ))}
              </div>
              {/* Signal dots */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', opacity: 0.7 }}>
                {[10, 14, 18].map((s, i) => (
                  <div key={i} style={{ width: s, height: s, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.7)', opacity: 0.4 + i * 0.2 }} />
                ))}
              </div>
            </div>

            {/* White content section */}
            <div style={{
              height: CARD_H - HEADER_H,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 14px',
              gap: 4,
              position: 'relative',
            }}>
              {/* Accent bar */}
              <div style={{
                position: 'absolute',
                left: 0, top: 8, bottom: 8, width: 3,
                borderRadius: '0 2px 2px 0',
                background: accentColor,
                opacity: isActive ? 1 : 0.45,
              }} />
              {/* Line 1: name + amount */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingLeft: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1918', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {card.name}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1A1918', letterSpacing: '-0.02em', flexShrink: 0 }}>
                  {formatMoney(card.amount)}
                </span>
              </div>
              {/* Line 2: purpose */}
              <div style={{ fontSize: 11, color: card.purpose ? '#9B9A98' : '#C5C3C0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 8 }}>
                {card.purpose || 'No purpose specified'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
