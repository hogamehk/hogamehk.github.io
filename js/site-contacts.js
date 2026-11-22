/**
 * uiduid.com 統一客服聯絡資料
 * 之後只需改這個檔案，所有已接入的商品頁與結帳「聯絡客服購買」會一併更新。
 *
 * 編輯方式：只改下面 SITE_CONTACTS 物件裡的值。
 */
(function (window, document) {
  var SITE_CONTACTS = {
    whatsapp: {
      e164: '85255360181',
      display: '+852 55360181',
      url: 'https://wa.me/85255360181'
    },
    wechat: {
      id: 'HOGAME'
    },
    line: {
      id: 'HOGAME',
      url: 'https://line.me/ti/p/~HOGAME'
    },
    discord: {
      id: '@55360181',
      url: 'https://discord.com/users/55360181'
    }
  };

  window.SITE_CONTACTS = SITE_CONTACTS;

  var KNOWN_IDS = /^(HOGAME|uiduidcs)$/i;
  var PHONE_DIGITS = /(?:\+?852[\s-]*)?(?:55360181|92099527|91234567)/g;
  var KNOWN_DISCORD = /^@?(55360181|92099527)$/;

  function digits(s) {
    return String(s || '').replace(/\D/g, '');
  }

  function isPhoneText(s) {
    var d = digits(s);
    return d === '85255360181' || d === '55360181' || d === '85292099527' || d === '92099527' || d === '85291234567' || d === '91234567';
  }

  function setTextIfContact(el, value) {
    if (!el) return;
    var current = (el.textContent || '').trim();
    if (!current || isPhoneText(current) || KNOWN_IDS.test(current) || KNOWN_DISCORD.test(current)) {
      if ((el.textContent || '') !== value) el.textContent = value;
    }
  }

  function updateLabelText(el, prefix, value) {
    if (!el) return;
    var raw = el.innerHTML;
    // Keep icon elements; replace trailing label text only.
    var text = el.textContent || '';
    if (/WhatsApp/i.test(text) && !isPhoneText(text)) return; // plain "WhatsApp" label stays
    if (/^微信/.test(text.trim()) || /WeChat/i.test(text)) {
      var keepClick = /點擊複製/.test(text);
      el.childNodes.forEach(function (n) {
        if (n.nodeType === 3 && n.nodeValue && /微信|WeChat/i.test(n.nodeValue)) {
          n.nodeValue = n.nodeValue.replace(/微信\s*[:：]\s*\S+(?:\s*\([^)]*\))?/, '微信: ' + value + (keepClick ? ' (點擊複製)' : ''));
          n.nodeValue = n.nodeValue.replace(/WeChat\s*[:：]\s*\S+/i, 'WeChat: ' + value);
        }
      });
      return;
    }
    if (/^LINE/i.test(text.trim())) {
      el.childNodes.forEach(function (n) {
        if (n.nodeType === 3 && n.nodeValue && /LINE/i.test(n.nodeValue)) {
          n.nodeValue = n.nodeValue.replace(/LINE\s*[:：]\s*\S+/i, 'LINE: ' + value);
        }
      });
      return;
    }
    if (/^Discord/i.test(text.trim())) {
      el.childNodes.forEach(function (n) {
        if (n.nodeType === 3 && n.nodeValue && /Discord/i.test(n.nodeValue)) {
          n.nodeValue = n.nodeValue.replace(/Discord\s*[:：]\s*\S+/i, 'Discord: ' + value);
        }
      });
    }
  }

  function applyContacts() {
    var C = window.SITE_CONTACTS;
    if (!C) return;

    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var query = '';
      var q = href.indexOf('?');
      if (q >= 0) query = href.slice(q);
      a.setAttribute('href', C.whatsapp.url + query);
      if (isPhoneText((a.textContent || '').trim())) a.textContent = C.whatsapp.display;
    });

    document.querySelectorAll('a[href*="line.me"]').forEach(function (a) {
      a.setAttribute('href', C.line.url);
    });

    document.querySelectorAll('a[href*="discord.com/users/"]').forEach(function (a) {
      a.setAttribute('href', C.discord.url);
    });

    document.querySelectorAll('.contact-main-item').forEach(function (item) {
      var icon = item.querySelector('i');
      var val = item.querySelector('.contact-main-value');
      if (!icon || !val) return;
      if (icon.classList.contains('fa-whatsapp')) {
        if (val.tagName === 'A') {
          var href = val.getAttribute('href') || '';
          var query = href.indexOf('?') >= 0 ? href.slice(href.indexOf('?')) : '';
          val.setAttribute('href', C.whatsapp.url + query);
        }
        val.textContent = C.whatsapp.display;
      } else if (icon.classList.contains('fa-weixin')) {
        val.textContent = C.wechat.id;
      } else if (icon.classList.contains('fa-line')) {
        val.textContent = C.line.id;
        if (val.tagName === 'A') val.setAttribute('href', C.line.url);
      } else if (icon.classList.contains('fa-discord')) {
        val.textContent = C.discord.id;
        if (val.tagName === 'A') val.setAttribute('href', C.discord.url);
      }
    });

    document.querySelectorAll('.service-item.whatsapp').forEach(function (el) {
      if (el.tagName === 'A') {
        var href = el.getAttribute('href') || '';
        var query = href.indexOf('?') >= 0 ? href.slice(href.indexOf('?')) : '';
        el.setAttribute('href', C.whatsapp.url + query);
      }
    });

    document.querySelectorAll('.service-item.wechat, .service-item[data-copy]').forEach(function (el) {
      if (el.classList.contains('line') || el.classList.contains('discord') || el.classList.contains('whatsapp')) return;
      el.setAttribute('data-copy', C.wechat.id);
      if (el.getAttribute('onclick') && /copyText\(/.test(el.getAttribute('onclick'))) {
        el.setAttribute('onclick', "copyText('" + C.wechat.id.replace(/'/g, "\\'") + "')");
      }
      var aria = el.getAttribute('aria-label');
      if (aria && /微信|WeChat|複製/.test(aria)) {
        el.setAttribute('aria-label', '複製微信號 ' + C.wechat.id);
      }
      updateLabelText(el, '微信', C.wechat.id);
    });

    document.querySelectorAll('.service-item.line').forEach(function (el) {
      if (el.tagName === 'A') el.setAttribute('href', C.line.url);
      var aria = el.getAttribute('aria-label');
      if (aria && /LINE/i.test(aria)) el.setAttribute('aria-label', '聯繫 LINE ' + C.line.id);
      updateLabelText(el, 'LINE', C.line.id);
    });

    document.querySelectorAll('.service-item.discord').forEach(function (el) {
      if (el.tagName === 'A') el.setAttribute('href', C.discord.url);
      var aria = el.getAttribute('aria-label');
      if (aria && /Discord/i.test(aria)) el.setAttribute('aria-label', '聯繫 Discord ' + C.discord.id);
      updateLabelText(el, 'Discord', C.discord.id);
    });

    document.querySelectorAll('.contact-title').forEach(function (el) {
      var html = el.innerHTML;
      var next = html.replace(/\+\s*852\s*(?:55360181|92099527|91234567)/g, C.whatsapp.display);
      if (next !== html) el.innerHTML = next;
    });

    // Invoice / miscellaneous "WhatsApp: +852 …" text nodes
    document.querySelectorAll('p, div, span, text').forEach(function (el) {
      if (el.childElementCount) return;
      var t = el.textContent || '';
      if (!/WhatsApp/i.test(t) || !isPhoneText(t)) return;
      el.textContent = t.replace(/\+?\s*852\s*(?:55360181|92099527|91234567)/g, C.whatsapp.display);
    });
  }

  window.applySiteContacts = applyContacts;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyContacts);
  } else {
    applyContacts();
  }
})(window, document);
