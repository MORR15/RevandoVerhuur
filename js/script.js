const ORDER_STORAGE_KEY = "orderdata";
const header = document.querySelector("header");
let lastScrollTop = 0;

function getOrderData() {
  try {
    const data = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

if (header) {
  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (header.classList.contains("nav-open")) {
      header.classList.remove("header-hidden");
    } else if (scrollTop > lastScrollTop && scrollTop > 90) {
      header.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const hamburgerLink = document.querySelector(".hamburger-img");

  if (hamburgerLink && header) {
    hamburgerLink.setAttribute("aria-label", "Menu openen");
    hamburgerLink.setAttribute("aria-expanded", "false");

    hamburgerLink.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = header.classList.toggle("nav-open");
      hamburgerLink.setAttribute("aria-expanded", String(isOpen));
      hamburgerLink.setAttribute("aria-label", isOpen ? "Menu sluiten" : "Menu openen");
    });

    document.querySelectorAll(".nav-links a").forEach(link => {
      link.addEventListener("click", () => {
        header.classList.remove("nav-open");
        hamburgerLink.setAttribute("aria-expanded", "false");
        hamburgerLink.setAttribute("aria-label", "Menu openen");
      });
    });

    document.addEventListener("click", (e) => {
      if (!header.classList.contains("nav-open")) return;
      if (header.contains(e.target)) return;
      header.classList.remove("nav-open");
      hamburgerLink.setAttribute("aria-expanded", "false");
      hamburgerLink.setAttribute("aria-label", "Menu openen");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      header.classList.remove("nav-open");
      hamburgerLink.setAttribute("aria-expanded", "false");
      hamburgerLink.setAttribute("aria-label", "Menu openen");
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) {
        header.classList.remove("nav-open");
        hamburgerLink.setAttribute("aria-expanded", "false");
        hamburgerLink.setAttribute("aria-label", "Menu openen");
      }
    });
  }

  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");
  const closePopup = document.getElementById("closePopup");
  const emailForms = document.querySelectorAll(".contact-form, .contact-page-form, .gegevens-form");

  function getOrCreateFeedback(form) {
    let feedback = form.querySelector(".form-feedback");
    if (!feedback) {
      feedback = document.createElement("p");
      feedback.className = "form-feedback";
      feedback.setAttribute("role", "status");
      form.appendChild(feedback);
    }
    return feedback;
  }

  function showFeedback(form, message, type = "success") {
    if (popup && popupMessage) {
      const popupTitle = popup.querySelector(".popup-title");
      if (popupTitle) {
        popupTitle.textContent = type === "error" ? "Verzenden mislukt" : (form.dataset.successTitle || "Bericht verzonden!");
      }
      popupMessage.textContent = message;
      popup.style.display = "flex";
      return;
    }

    const feedback = getOrCreateFeedback(form);
    feedback.textContent = message;
    feedback.setAttribute("role", type === "error" ? "alert" : "status");
    feedback.classList.remove("is-success", "is-error");
    feedback.classList.add(type === "error" ? "is-error" : "is-success");
  }

  function showInlineFeedback(form, message, type = "success") {
    const feedback = getOrCreateFeedback(form);
    feedback.textContent = message;
    feedback.setAttribute("role", type === "error" ? "alert" : "status");
    feedback.classList.remove("is-success", "is-error");
    feedback.classList.add(type === "error" ? "is-error" : "is-success");
  }

  function clearFeedback(form) {
    const feedback = form.querySelector(".form-feedback");
    if (!feedback) return;
    feedback.textContent = "";
    feedback.classList.remove("is-success", "is-error");
  }

  function setFormLoading(form, isLoading) {
    const submitButton = form.querySelector("button[type='submit']");
    if (!submitButton) return;

    if (!submitButton.dataset.originalText) {
      submitButton.dataset.originalText = submitButton.innerText;
    }

    submitButton.disabled = isLoading;
    submitButton.innerText = isLoading ? "Verzenden..." : submitButton.dataset.originalText;
  }

  function formatProductsForSubmission() {
    const products = getOrderData();
    if (products.length === 0) return "Geen producten geselecteerd.";

    return products.map(product => {
      const options = product.options?.map(option => option.name).join(", ");
      return options ? `${product.title} (${options})` : product.title;
    }).join("\n");
  }

  function padDatePart(value) {
    return String(value).padStart(2, "0");
  }

  function getCurrentDateTimeForSubject() {
    const now = new Date();
    const year = now.getFullYear();
    const month = padDatePart(now.getMonth() + 1);
    const day = padDatePart(now.getDate());
    const hours = padDatePart(now.getHours());
    const minutes = padDatePart(now.getMinutes());
    const seconds = padDatePart(now.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function getCustomerName(formData) {
    return String(formData.get("naam") || "Onbekende klant").trim() || "Onbekende klant";
  }

  // Builds a unique subject so email clients do not group separate submissions into one thread.
  function buildUniqueEmailSubject(form, formData) {
    const formType = form.dataset.formType || "Websiteformulier";
    const customerName = getCustomerName(formData);
    const submittedAt = getCurrentDateTimeForSubject();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return `${formType} | ${customerName} | ${submittedAt} | ${uniqueId}`;
  }

  function getEmailJsConfig() {
    return window.REVANDO_EMAILJS || {};
  }

  function getRequiredEmailJsConfig() {
    const config = getEmailJsConfig();
    const missingFields = ["publicKey", "serviceId", "notificationTemplateId", "confirmationTemplateId"]
      .filter(key => !config[key]);

    if (missingFields.length > 0) {
      throw new Error("EmailJS is nog niet geconfigureerd. Vul de public key, service ID en template IDs in.");
    }

    return config;
  }

  function loadEmailJsSdk(config) {
    if (window.emailjs) {
      return Promise.resolve(window.emailjs);
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector("script[data-emailjs-sdk]");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.emailjs), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("EmailJS kon niet worden geladen.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = config.sdkUrl || "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      script.async = true;
      script.dataset.emailjsSdk = "true";
      script.addEventListener("load", () => resolve(window.emailjs));
      script.addEventListener("error", () => reject(new Error("EmailJS kon niet worden geladen.")));
      document.head.appendChild(script);
    });
  }

  function formatFormData(formData) {
    return Array.from(formData.entries())
      .filter(([name]) => name)
      .map(([name, value]) => `${name}: ${value || "-"}`)
      .join("\n");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatProductsForEmailHtml(productsText) {
    return productsText
      .split("\n")
      .filter(Boolean)
      .map(product => `<li style="margin:0 0 6px;">${escapeHtml(product)}</li>`)
      .join("");
  }

  function getCustomerEmail(formData) {
    return String(formData.get("email") || "").trim();
  }

  function wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  function buildConfirmationHtml(params) {
    const productList = formatProductsForEmailHtml(params.selected_products);
    const message = params.customer_message
      ? `<p style="margin:0 0 18px;"><strong>Je bericht:</strong><br>${escapeHtml(params.customer_message).replace(/\n/g, "<br>")}</p>`
      : "";

    return `
      <div style="font-family:Arial,sans-serif;color:#1f1f1f;line-height:1.55;max-width:620px;margin:0 auto;">
        <div style="background:#EC172A;color:#fff;padding:22px 26px;border-radius:8px 8px 0 0;">
          <h1 style="font-size:24px;line-height:1.2;margin:0;">Bedankt voor je aanvraag</h1>
        </div>
        <div style="border:1px solid #eeeeee;border-top:0;padding:24px 26px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 18px;">Hoi ${escapeHtml(params.customer_name)},</p>
          <p style="margin:0 0 18px;">We hebben je ${escapeHtml(params.form_type).toLowerCase()} ontvangen. We nemen zo snel mogelijk persoonlijk contact met je op om alles door te spreken.</p>
          ${productList ? `<p style="margin:0 0 10px;"><strong>Geselecteerde producten:</strong></p><ul style="margin:0 0 18px;padding-left:20px;">${productList}</ul>` : ""}
          ${message}
          <p style="margin:0 0 6px;"><strong>Verzonden op:</strong> ${escapeHtml(params.submitted_at)}</p>
          <p style="margin:18px 0 0;">Groeten,<br>Revando Verhuur</p>
        </div>
      </div>
    `;
  }

  function buildEmailTemplateParams(form) {
    const formData = new FormData(form);
    const formType = form.dataset.formType || "Websiteformulier";
    const customerName = getCustomerName(formData);
    const customerEmail = getCustomerEmail(formData);
    const submittedAt = getCurrentDateTimeForSubject();
    const products = form.classList.contains("gegevens-form")
      ? formatProductsForSubmission()
      : "Niet van toepassing.";

    const templateParams = {
      owner_email: getEmailJsConfig().ownerEmail || "info@revandoverhuur.nl",
      form_type: formType,
      subject: buildUniqueEmailSubject(form, formData),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: String(formData.get("telefoon") || "").trim(),
      customer_city: String(formData.get("Woonplaats") || "").trim(),
      customer_message: String(formData.get("bericht") || "").trim(),
      submitted_data: formatFormData(formData),
      selected_products: products,
      submitted_at: submittedAt,
      page_url: window.location.href
    };

    Object.assign(templateParams, {
      to_email: customerEmail,
      to_name: customerName,
      from_name: customerName,
      from_email: customerEmail,
      reply_to: customerEmail,
      message: templateParams.customer_message,
      naam: customerName,
      email: customerEmail,
      telefoon: templateParams.customer_phone,
      woonplaats: templateParams.customer_city,
      bericht: templateParams.customer_message,
      formulier: formType,
      producten: products
    });

    templateParams.confirmation_html = buildConfirmationHtml(templateParams);
    templateParams.confirmation_text = [
      `Hoi ${templateParams.customer_name},`,
      `We hebben je ${templateParams.form_type.toLowerCase()} ontvangen.`,
      "",
      `Geselecteerde producten:\n${templateParams.selected_products}`,
      "",
      `Bericht:\n${templateParams.customer_message || "-"}`,
      "",
      "We nemen zo snel mogelijk persoonlijk contact met je op.",
      "Groeten, Revando Verhuur"
    ].join("\n");

    return templateParams;
  }

  function updateVisibleRequestBadges() {
    const orderData = getOrderData();

    document.querySelectorAll(".aanvraag-badge").forEach(badge => {
      badge.innerText = orderData.length;
      badge.hidden = orderData.length === 0;
    });
  }

  function clearOrderData() {
    localStorage.removeItem(ORDER_STORAGE_KEY);
    updateVisibleRequestBadges();
  }

  // The quote form may only be sent when the visitor selected at least one product.
  function setQuoteFormAvailability(form, showMessage = true) {
    if (!form.classList.contains("gegevens-form")) return;

    const submitButton = form.querySelector("button[type='submit']");
    const hasProducts = getOrderData().length > 0;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.title = hasProducts ? "" : "Voeg eerst iets toe aan je aanvraag.";
      submitButton.classList.toggle("is-disabled", !hasProducts);
      submitButton.setAttribute("aria-disabled", String(!hasProducts));
    }

    if (!hasProducts && showMessage) {
      showInlineFeedback(form, "Voeg eerst iets toe aan je aanvraag voordat je het formulier verstuurt.", "error");
    }
  }

  // Sends one owner notification and one customer confirmation through EmailJS.
  async function sendEmailJsForm(form) {
    const config = getRequiredEmailJsConfig();
    const emailjsClient = await loadEmailJsSdk(config);
    const templateParams = buildEmailTemplateParams(form);

    emailjsClient.init({ publicKey: config.publicKey });

    await emailjsClient.send(config.serviceId, config.notificationTemplateId, templateParams);
    await wait(1200);
    await emailjsClient.send(config.serviceId, config.confirmationTemplateId, templateParams);
  }

  emailForms.forEach(form => {
    setQuoteFormAvailability(form);

    const submitButton = form.querySelector("button[type='submit']");
    submitButton?.addEventListener("click", function (e) {
      if (!form.classList.contains("gegevens-form") || getOrderData().length > 0) return;

      e.preventDefault();
      clearFeedback(form);
      setQuoteFormAvailability(form);
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      clearFeedback(form);

      if (form.classList.contains("gegevens-form") && getOrderData().length === 0) {
        setQuoteFormAvailability(form);
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        showFeedback(form, "Vul de verplichte velden correct in.", "error");
        return;
      }

      setFormLoading(form, true);
      form.classList.add("is-submitting");

      try {
        await sendEmailJsForm(form);
        showFeedback(form, form.dataset.successMessage || "Je bericht is verzonden.", "success");
        form.reset();
        if (form.classList.contains("gegevens-form")) {
          clearOrderData();
        }
      } catch (error) {
        console.error("EmailJS formulier fout:", error);
        showFeedback(form, error.message, "error");
      } finally {
        form.classList.remove("is-submitting");
        setFormLoading(form, false);
        setQuoteFormAvailability(form, false);
      }
    });
  });

  if (popup && closePopup) {
    closePopup.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }
});


// ─────────────────────────────────────────────
// ZOEKFUNCTIE — inline uitschuifbalk
// ─────────────────────────────────────────────
(function () {
  const zoekData = [
    {
      naam: "Opblaasbare Tenten",
      beschrijving: "Bekijk ons volledige aanbod opblaasbare tenten",
      url: "opblaasbare-tenten.html",
      kleur: "#EC172A",
      tags: ["tent", "opblaasbaar", "partytent", "feesttent", "overkapping"]
    },
    {
      naam: "Silent Disco",
      beschrijving: "Draadloze hoofdtelefoons voor een stille disco",
      url: "silent-disco.html",
      kleur: "#76D9F8",
      tags: ["silent", "disco", "muziek", "hoofdtelefoon", "feest", "headset"]
    },
    {
      naam: "Lasergames",
      beschrijving: "Spannende lasergame-sets voor elk feest",
      url: "lasergames.html",
      kleur: "#EC172A",
      tags: ["laser", "game", "spel", "kids", "kinderen", "entertainment"]
    },
    {
      naam: "Tentvloer",
      beschrijving: "Stevige tentvloeren voor binnen en buiten",
      url: "tentvloer.html",
      kleur: "#6EC363",
      tags: ["vloer", "tentvloer", "vlonder", "buiten", "camping"]
    },
    {
      naam: "Licht & Geluid",
      beschrijving: "Professioneel licht en geluid voor jouw event",
      url: "licht-en-geluid.html",
      kleur: "#FA961D",
      tags: ["licht", "geluid", "speaker", "verlichting", "audio", "muziek", "lamp"]
    },
    {
      naam: "Offerte aanvragen",
      beschrijving: "Stel jouw eigen pakket samen",
      url: "aanvraag.html",
      kleur: "#FA961D",
      tags: ["offerte", "aanvraag", "bestellen", "boeken", "prijs", "huren"]
    },
    {
      naam: "Contact",
      beschrijving: "Bel, mail of app ons gerust",
      url: "contact.html",
      kleur: "#6EC363",
      tags: ["contact", "bellen", "mail", "telefoon", "appen", "whatsapp"]
    },
    {
      naam: "Over ons",
      beschrijving: "Leer Revando Verhuur Maarheeze kennen",
      url: "index.html#over-ons",
      kleur: "#76D9F8",
      tags: ["over", "ons", "revando", "maarheeze", "bedrijf", "wie"]
    },
    {
      naam: "Opblaasbare Beachbar tent",
      beschrijving: "Zomerse beachbar tent voor circa 30 personen — €240",
      url: "opblaasbare-beachbar-tent.html",
      kleur: "#EC172A",
      tags: ["beachbar", "beach", "bar", "zomer", "strand", "winter", "lodge", "30 personen"],
      zoekOnly: true
    },
    {
      naam: "Opblaasbare Biergarten 8x7",
      beschrijving: "Biertent van 8x7 meter voor 60–70 personen — €345",
      url: "opblaasbare-biergarten-tent.html",
      kleur: "#EC172A",
      tags: ["biergarten", "biertent", "bier", "8x7", "60 personen", "70 personen", "waterdicht"],
      zoekOnly: true
    },
    {
      naam: "Opblaasbare Caribien pub",
      beschrijving: "Sfeervolle kroeg-tent voor 50–60 personen — €345",
      url: "opblaasbare-caribien-tent.html",
      kleur: "#EC172A",
      tags: ["caribien", "caraïben", "pub", "kroeg", "café", "bar", "50 personen", "60 personen"],
      zoekOnly: true
    },
    {
      naam: "Opblaasbare Iglo Ø10x6,5",
      beschrijving: "Grote koepeltent voor 90–100 personen — €400",
      url: "opblaasbare-iglo-tent.html",
      kleur: "#EC172A",
      tags: ["iglo", "dome", "koepel", "iglotent", "dometent", "90 personen", "100 personen"],
      zoekOnly: true
    },
    {
      naam: "Opblaasbare Nachtclub 9x7",
      beschrijving: "Disco-tent met rode loper voor 50–60 personen — €340",
      url: "opblaasbare-nachtclub-tent.html",
      kleur: "#EC172A",
      tags: ["nachtclub", "disco", "discotheek", "club", "9x7", "rode loper", "50 personen", "60 personen", "nightclub"],
      zoekOnly: true
    },
    {
      naam: "Opblaasbare Pub 10x5",
      beschrijving: "Engelse pub-tent voor 50–60 personen — €345",
      url: "opblaasbare-pub-tent.html",
      kleur: "#EC172A",
      tags: ["pub", "bar", "kroeg", "engels", "english", "10x5", "50 personen", "60 personen"],
      zoekOnly: true
    },
    {
      naam: "Opblaasbare Skihut 7x5",
      beschrijving: "Après-ski tent voor 25–30 personen — €245",
      url: "opblaasbare-skihut-tent.html",
      kleur: "#EC172A",
      tags: ["skihut", "ski", "apres-ski", "après-ski", "winter", "sneeuw", "7x5", "25 personen", "30 personen"],
      zoekOnly: true
    }
  ];

  const wrapper    = document.getElementById("zoek-wrapper");
  const input      = document.getElementById("zoek-input");
  const resultaten = document.getElementById("zoek-resultaten");
  const knop       = document.getElementById("zoeken-knop");

  if (!wrapper || !input || !knop) return;

  // Vergrootglas-klik: input focussen (balk is al uitgeschoven via hover)
  knop.addEventListener("click", function (e) {
    e.preventDefault();
    input.focus();
  });

  // Input focussen → dropdown openen
  input.addEventListener("focus", function () {
    toonResultaten(this.value);
    wrapper.classList.add("open");
  });

  // Typen → resultaten filteren
  input.addEventListener("input", function () {
    toonResultaten(this.value);
    wrapper.classList.add("open");
  });

  // Klik buiten wrapper → dropdown sluiten
  document.addEventListener("click", function (e) {
    if (!wrapper.contains(e.target)) {
      sluitDropdown();
    }
  });

  // Escape → dropdown sluiten en focus opheffen
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      sluitDropdown();
      input.blur();
    }
  });

  function sluitDropdown() {
    wrapper.classList.remove("open");
    resultaten.innerHTML = "";
  }

  function toonResultaten(zoekterm) {
    resultaten.innerHTML = "";
    const term = zoekterm.trim().toLowerCase();

    const gevonden = term === ""
      ? zoekData.filter(item => !item.zoekOnly)
      : zoekData.filter(item =>
          item.naam.toLowerCase().includes(term) ||
          item.beschrijving.toLowerCase().includes(term) ||
          item.tags.some(tag => tag.includes(term))
        );

    if (gevonden.length === 0) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="zoek-geen-tekst">Geen resultaten gevonden.</span>`;
      resultaten.appendChild(li);
    } else {
      gevonden.forEach(item => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        a.href      = item.url;
        a.className = "zoek-resultaat";
        a.setAttribute("role", "option");
        a.innerHTML = `
          <span class="zoek-resultaat-kleur" style="background:${item.kleur}"></span>
          <span class="zoek-resultaat-info">
            <span class="zoek-resultaat-naam">${item.naam}</span>
            <span class="zoek-resultaat-beschrijving">${item.beschrijving}</span>
          </span>
        `;
        li.appendChild(a);
        resultaten.appendChild(li);
      });
    }
  }

  function saveOrderData(items) {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(items));
    updateRequestBadge();
  }

  function updateRequestBadge() {
    const orderData = getOrderData();

    document.querySelectorAll('a[href="aanvraag.html"]').forEach(link => {
      if (!link.querySelector(".offerte-img")) return;

      link.classList.add("offerte-link");

      let badge = link.querySelector(".aanvraag-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "aanvraag-badge";
        link.appendChild(badge);
      }

      badge.innerText = orderData.length;
      badge.hidden = orderData.length === 0;
    });
  }

  function getSelectedOptions() {
    return Array.from(document.querySelectorAll(".option-row"))
      .map(row => {
        const input = row.querySelector("input[type='checkbox']");
        if (!input || !input.checked) return null;

        const name = row.querySelector(".option-name")?.innerText.trim() || "";

        return { name };
      })
      .filter(Boolean);
  }

  function orderpage() {
    document.querySelectorAll(".add-to-request").forEach(button => {
      button.addEventListener("click", function () {
        const title = document.querySelector(".product-title")?.innerText.trim();
        if (!title) return;

        const productImage = document.querySelector(".product-img");
        const productUrl = window.location.pathname.split("/").pop();

        const product = {
          id: productUrl || title,
          title,
          image: productImage?.getAttribute("src") || "",
          imageAlt: productImage?.getAttribute("alt") || title,
          options: getSelectedOptions()
        };

        const orderData = getOrderData();
        const existingIndex = orderData.findIndex(item => item.id === product.id);

        if (existingIndex >= 0) {
          orderData[existingIndex] = product;
        } else {
          orderData.push(product);
        }

        saveOrderData(orderData);

        button.innerText = "Toegevoegd aan aanvraag";
        button.classList.add("is-added");

        setTimeout(() => {
          button.innerText = "Toevoegen aan aanvraag";
          button.classList.remove("is-added");
        }, 1800);
      });
    });
  }

  function renderInvoiceItem(item) {
    const listItem = document.createElement("li");
    listItem.className = "aanvraag-item";

    const image = document.createElement("img");
    image.className = "aanvraag-item-img";
    image.src = item.image;
    image.alt = item.imageAlt || item.title;

    const content = document.createElement("div");
    content.className = "aanvraag-item-content";

    const title = document.createElement("h3");
    title.className = "aanvraag-item-title";
    title.innerText = item.title;

    content.appendChild(title);

    if (item.options && item.options.length > 0) {
      const options = document.createElement("ul");
      options.className = "aanvraag-options";

      item.options.forEach(option => {
        const optionItem = document.createElement("li");
        optionItem.innerText = option.name;
        options.appendChild(optionItem);
      });

      content.appendChild(options);
    }

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "aanvraag-remove";
    removeButton.innerText = "×";
    removeButton.setAttribute("aria-label", `${item.title} verwijderen`);
    removeButton.addEventListener("click", () => {
      const nextOrderData = getOrderData().filter(product => product.id !== item.id);
      saveOrderData(nextOrderData);
      invoicePage();
    });

    listItem.append(image, content, removeButton);
    return listItem;
  }

  function invoicePage() {
    const overview = document.querySelector(".aanvraag-overzicht");
    const buttonRow = document.querySelector(".aanvraag-buttons");
    if (!overview) return;

    const orderData = getOrderData();
    overview.innerHTML = "";
    buttonRow?.querySelector(".volgende-stap")?.remove();
    buttonRow?.classList.toggle("has-items", orderData.length > 0);

    if (orderData.length === 0) {
      const emptyText = document.createElement("p");
      emptyText.className = "aanvraag-tekst";
      emptyText.innerText = "Je hebt momenteel geen items in je aanvraag";
      overview.appendChild(emptyText);
      return;
    }

    const list = document.createElement("ul");
    list.className = "aanvraag-lijst";

    orderData.forEach(item => {
      list.appendChild(renderInvoiceItem(item));
    });

    const nextStep = document.createElement("a");
    nextStep.href = "gegevens.html";
    nextStep.className = "volgende-stap";
    nextStep.innerText = "Volgende stap";

    overview.appendChild(list);
    buttonRow?.appendChild(nextStep);
  }

  updateRequestBadge();

  if (document.body.classList.contains("invoice-page")) {
    invoicePage();
  }

  if (document.querySelector(".add-to-request")) {
    orderpage();
  }
})();
