/**
 * donation-widget.js — MYRQAI floating donation button
 * Include on every page: <script src="/donation-widget.js" defer></script>
 * Shows a floating "Support" button bottom-left.
 * Expands into a small card on click. Dismissed state saved in sessionStorage.
 */

(function () {
  // Don't show on success/payment pages
  if (location.pathname.includes('pro-success')) return;

  const PAYPAL_URL = 'https://www.paypal.com/ncp/payment/6KB667FZRM4VG';
  const DISMISS_KEY = 'myrqai_donate_dismissed';

  // Don't re-inject if already present
  if (document.getElementById('myrqaiDonateBtn')) return;

  const style = document.createElement('style');
  style.textContent = `
    #myrqaiDonateBtn {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 998;
      font-family: 'DM Mono', 'Courier New', monospace;
    }

    #myrqaiDonateBtn .donate-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #0c1525;
      border: 1px solid rgba(167,139,250,0.3);
      border-radius: 999px;
      padding: 10px 18px 10px 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      user-select: none;
    }

    #myrqaiDonateBtn .donate-pill:hover {
      border-color: rgba(167,139,250,0.6);
      box-shadow: 0 8px 32px rgba(167,139,250,0.15);
      transform: translateY(-1px);
    }

    #myrqaiDonateBtn .donate-icon {
      font-size: 16px;
      animation: donateFloat 3s ease-in-out infinite;
    }

    @keyframes donateFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }

    #myrqaiDonateBtn .donate-label {
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #a78bfa;
      font-weight: 500;
    }

    #myrqaiDonateCard {
      position: fixed;
      bottom: 68px;
      left: 20px;
      z-index: 998;
      width: 260px;
      background: #0c1525;
      border: 1px solid rgba(167,139,250,0.25);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(167,139,250,0.06);
      font-family: 'DM Mono', 'Courier New', monospace;
      animation: donateCardIn 0.2s ease both;
      display: none;
    }

    @keyframes donateCardIn {
      from { opacity: 0; transform: translateY(8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    #myrqaiDonateCard .dc-close {
      position: absolute;
      top: 10px;
      right: 12px;
      background: none;
      border: none;
      color: #4e6a8a;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      padding: 2px;
      transition: color 0.15s;
    }

    #myrqaiDonateCard .dc-close:hover {
      color: #e2eeff;
    }

    #myrqaiDonateCard .dc-emoji {
      font-size: 28px;
      margin-bottom: 10px;
      display: block;
    }

    #myrqaiDonateCard .dc-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
      font-family: 'Syne', 'DM Mono', sans-serif;
    }

    #myrqaiDonateCard .dc-sub {
      font-size: 11px;
      color: #4e6a8a;
      line-height: 1.6;
      margin-bottom: 16px;
      letter-spacing: 0.02em;
    }

    #myrqaiDonateCard .dc-btn {
      display: block;
      width: 100%;
      padding: 11px;
      border-radius: 9px;
      background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(77,217,192,0.1));
      border: 1px solid rgba(167,139,250,0.3);
      color: #a78bfa;
      text-align: center;
      text-decoration: none;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      transition: all 0.2s;
      cursor: pointer;
    }

    #myrqaiDonateCard .dc-btn:hover {
      background: linear-gradient(135deg, rgba(167,139,250,0.25), rgba(77,217,192,0.18));
      border-color: rgba(167,139,250,0.5);
      color: #c4b5fd;
      transform: translateY(-1px);
    }

    #myrqaiDonateCard .dc-note {
      font-size: 10px;
      color: #2e4a6a;
      text-align: center;
      margin-top: 10px;
      letter-spacing: 0.06em;
    }

    @media (max-width: 480px) {
      #myrqaiDonateBtn {
        bottom: 80px;
        left: 12px;
      }

      #myrqaiDonateCard {
        left: 12px;
        bottom: 136px;
        width: calc(100vw - 24px);
      }
    }
  `;
  document.head.appendChild(style);

  const card = document.createElement('div');
  card.id = 'myrqaiDonateCard';
  card.innerHTML = `
    <button class="dc-close" id="donateDismiss" title="Dismiss">✕</button>
    <span class="dc-emoji">💜</span>
    <div class="dc-title">Support MYRQAI</div>
    <div class="dc-sub">Built by one person. Runs 24/7. If MYRQAI helped you, your support helps keep it alive.</div>
    <a href="${PAYPAL_URL}" target="_blank" rel="noopener noreferrer" class="dc-btn" id="donateNowBtn">
      Pay with PayPal
    </a>
    <div class="dc-note">Powered by PayPal · Any amount helps</div>
  `;
  document.body.appendChild(card);

  const btn = document.createElement('div');
  btn.id = 'myrqaiDonateBtn';
  btn.innerHTML = `
    <div class="donate-pill" id="donatePill" title="Support MYRQAI">
      <span class="donate-icon">💜</span>
      <span class="donate-label">Support</span>
    </div>
  `;
  document.body.appendChild(btn);

  let cardOpen = false;

  function openCard() {
    card.style.display = 'block';
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = '';
    cardOpen = true;
  }

  function closeCard() {
    card.style.display = 'none';
    cardOpen = false;
  }

  const donatePill = document.getElementById('donatePill');
  const donateDismiss = document.getElementById('donateDismiss');

  donatePill.addEventListener('click', function () {
    if (cardOpen) {
      closeCard();
    } else {
      openCard();
    }
  });

  donateDismiss.addEventListener('click', function (e) {
    e.stopPropagation();
    closeCard();
    btn.style.display = 'none';
    sessionStorage.setItem(DISMISS_KEY, '1');
  });

  document.addEventListener('click', function (e) {
    if (
      cardOpen &&
      !card.contains(e.target) &&
      !donatePill.contains(e.target)
    ) {
      closeCard();
    }
  });

  if (sessionStorage.getItem(DISMISS_KEY)) {
    btn.style.display = 'none';
  }

  if (
    !sessionStorage.getItem(DISMISS_KEY) &&
    !sessionStorage.getItem('myrqai_donate_shown')
  ) {
    sessionStorage.setItem('myrqai_donate_shown', '1');
    setTimeout(function () {
      openCard();
      setTimeout(function () {
        if (cardOpen) closeCard();
      }, 6000);
    }, 8000);
  }
})();