(function () {
  var CONFIG_URL = "/data/pricing-map.json";
  var MYCARD_TW_URL = "/data/mycard-tw-prices.json";
  var TABLE_SELECTOR = ".price-table[data-price-group], .price-table[data-price-source-group]";

  async function loadJson(url) {
    var res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Fetch failed: " + url + " status=" + res.status);
    }
    return res.json();
  }

  function parsePriceNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return null;
    var parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "0";
    if (Math.round(value) === value) return String(value);
    return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  }

  function normalizeSourceGroup(rawGroup) {
    var value = (rawGroup || "").toLowerCase();
    if (value === "mycard") return "mycard-tw";
    return value;
  }

  function parseInlineMapping(nameText) {
    var text = (nameText || "").trim();
    var match = text.match(/^(.*?)-\s*(mycard-tw|mycard-hk|mycard)\s*-?(\d+(?:\.\d+)?)\s*$/i);
    if (!match) {
      match = text.match(/^(.*?)\(\s*(mycard-tw|mycard-hk|mycard)\s*-?(\d+(?:\.\d+)?)\s*\)\s*$/i);
    }
    if (!match) return null;

    return {
      displayName: match[1].trim(),
      sourceGroup: normalizeSourceGroup(match[2]),
      denomination: match[3]
    };
  }

  function parseInlineFixedPrice(nameText) {
    var text = (nameText || "").trim();
    var match = text.match(/^(.*?)\s*=\s*HKD\s*\$?\s*([\d,]+(?:\.\d+)?)\s*$/i);
    if (!match) {
      match = text.match(/^(.*?)\s*=\s*\$\s*([\d,]+(?:\.\d+)?)\s*$/i);
    }
    if (!match) return null;

    return {
      displayName: match[1].trim(),
      fixedPrice: match[2].replace(/,/g, "")
    };
  }

  function resolveRowFixedPrice(row) {
    var cached = row.getAttribute("data-fixed-price");
    if (cached) {
      return parsePriceNumber(cached);
    }

    var nameEl = row.querySelector(".price-item-name");
    if (!nameEl) return null;

    var fixed = parseInlineFixedPrice(nameEl.textContent || "");
    if (!fixed) return null;

    row.setAttribute("data-fixed-price", fixed.fixedPrice);
    nameEl.textContent = fixed.displayName;
    return parsePriceNumber(fixed.fixedPrice);
  }

  function extractDenomination(row) {
    var explicit = row.getAttribute("data-denomination");
    if (explicit) return explicit.trim();

    var nameEl = row.querySelector(".price-item-name");
    if (!nameEl) return null;

    var inlineMapping = parseInlineMapping(nameEl.textContent || "");
    if (inlineMapping) {
      row.setAttribute("data-denomination", inlineMapping.denomination);
      row.setAttribute("data-price-source-group", inlineMapping.sourceGroup);
      nameEl.textContent = inlineMapping.displayName;
      return inlineMapping.denomination;
    }

    var text = (nameEl.textContent || "").replace(/,/g, "");
    var match = text.match(/(\d+(?:\.\d+)?)(?!.*\d)/);
    return match ? match[1] : null;
  }

  function applyPriceGroup(table, groupConfig, sourceGroupConfig, groups) {
    var rows = table.querySelectorAll(".price-item-row");
    var groupPrices = groupConfig && groupConfig.prices ? groupConfig.prices : {};
    var sourcePrices = sourceGroupConfig && sourceGroupConfig.prices ? sourceGroupConfig.prices : {};
    var prefix = groupConfig && typeof groupConfig.currencyPrefix === "string" ? groupConfig.currencyPrefix : "$ ";
    var suffix = groupConfig && typeof groupConfig.currencySuffix === "string" ? groupConfig.currencySuffix : "";

    rows.forEach(function (row) {
      var fixedPrice = resolveRowFixedPrice(row);
      if (fixedPrice !== null) {
        var fixedPriceEl = row.querySelector(".price-item-discount");
        if (fixedPriceEl) {
          fixedPriceEl.textContent = prefix + formatNumber(fixedPrice) + suffix;
        }
        return;
      }

      var denomination = extractDenomination(row);
      if (!denomination) return;

      var mappedValue = groupPrices[denomination];
      if (mappedValue === undefined) {
        var rowSourceGroupId = row.getAttribute("data-price-source-group");
        if (rowSourceGroupId && groups && groups[rowSourceGroupId]) {
          var rowSourcePrices = groups[rowSourceGroupId].prices || {};
          mappedValue = rowSourcePrices[denomination];
        }
      }
      if (mappedValue === undefined) {
        mappedValue = sourcePrices[denomination];
      }
      var normalizedValue = parsePriceNumber(mappedValue);
      if (normalizedValue === null) return;

      var priceEl = row.querySelector(".price-item-discount");
      if (!priceEl) return;

      priceEl.textContent = prefix + formatNumber(normalizedValue) + suffix;
    });
  }

  function refreshFloatingCart() {
    if (typeof window.updateSelectedItems === "function") {
      try {
        window.updateSelectedItems();
      } catch (err) {
        console.warn("updateSelectedItems failed after pricing update", err);
      }
    }
  }

  async function bootstrapPricing() {
    var tables = document.querySelectorAll(TABLE_SELECTOR);
    if (!tables.length) return;

    try {
      var groups = {};
      try {
        var config = await loadJson(CONFIG_URL);
        groups = config && config.groups ? config.groups : {};
      } catch (err) {
        console.warn("pricing-map load failed, fallback to source-only pricing.", err);
      }

      try {
        var mycardTwConfig = await loadJson(MYCARD_TW_URL);
        if (mycardTwConfig && mycardTwConfig.prices) {
          groups["mycard-tw"] = mycardTwConfig;
        }
      } catch (err) {
        console.warn("Dedicated mycard-tw config load failed, fallback to pricing-map group.", err);
      }

      tables.forEach(function (table) {
        var groupId = table.getAttribute("data-price-group");
        var groupConfig = groupId ? groups[groupId] : null;

        var sourceGroupId = table.getAttribute("data-price-source-group");
        var sourceGroupConfig = null;
        if (sourceGroupId) {
          sourceGroupConfig = groups[sourceGroupId];
          if (!sourceGroupConfig) {
            console.warn("Missing source pricing group:", sourceGroupId);
          }
        }

        if (!groupConfig && sourceGroupConfig) {
          groupConfig = {
            currencyPrefix: typeof sourceGroupConfig.currencyPrefix === "string" ? sourceGroupConfig.currencyPrefix : "$ ",
            currencySuffix: typeof sourceGroupConfig.currencySuffix === "string" ? sourceGroupConfig.currencySuffix : "",
            prices: {}
          };
        }

        if (!groupConfig) {
          if (groupId) {
            console.warn("Missing pricing group:", groupId);
          }
          return;
        }

        applyPriceGroup(table, groupConfig, sourceGroupConfig, groups);
      });

      refreshFloatingCart();
    } catch (err) {
      console.error("Shared pricing bootstrap failed:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", bootstrapPricing);
})();