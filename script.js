let lastScrollTop = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', function() {
  // Haal de huidige scrollpositie op
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (scrollTop > lastScrollTop && scrollTop > 90) {
    // Je scrolt naar beneden EN bent de header al voorbij -> verberg header
    header.classList.add('header-hidden');
  } else {
    // Je scrolt naar boven -> toon header
    header.classList.remove('header-hidden');
  }
  
  // Sla de huidige positie op voor de volgende meting (en voorkom negatieve waarden op mobiel)
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; 
});

document.addEventListener("DOMContentLoaded", () => {
  function shortenText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");
  const closePopup = document.getElementById("closePopup");
  const forms = document.querySelectorAll(".contact-form, .contact-page-form");

  if (popup && forms.length > 0) {
    forms.forEach(form => {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const naam = document.querySelector("#naam").value;
        const email = document.getElementById("email").value;
        const telefoon = document.getElementById("telefoon").value;
        const berichtVolledig = document.getElementById("bericht").value;
        const berichtKort = shortenText(berichtVolledig, 150);

        popupMessage.innerHTML = `
          <strong>Beste ${naam},</strong><br><br>
          Bedankt voor je bericht! We hebben de volgende gegevens ontvangen:<br><br>
          <strong>E-mailadres:</strong> ${email}<br>
          <strong>Telefoonnummer:</strong> ${telefoon || "Niet ingevuld"}<br><br>
          <strong>Je bericht:</strong><br>
          "${berichtKort}"<br><br>
          We nemen zo snel mogelijk contact met je op.
        `;
        popup.style.display = "flex";
        form.reset();
      });
    });

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
  }

  function toonResultaten(zoekterm) {
    resultaten.innerHTML = "";
    const term = zoekterm.trim().toLowerCase();

    const gevonden = term === ""
      ? zoekData
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

  function orderpage() {
    document.querySelectorAll('.add-to-request').forEach(button => {
      button.addEventListener('click', function() {
        const title = document.querySelector('.product-title').innerText.trim();
        const floor = document.getElementById('vloer')
        const light = document.getElementById('licht-geluid');
        const orderdata = {
          product: title,
          vloer: floor ? floor.checked : null,
          licht: light ? light.checked : null
        };
        const currentData = JSON.parse(localStorage.getItem('orderdata'));
        const newData = currentData === null ? [] : currentData;
        console.log(newData);
        newData.push(JSON.stringify(orderdata))
        localStorage.setItem('orderdata', {data: newData});
        window.location.href = 'aanvraag.html';
      });
    });
  }
  function invoicePage() {
    const orderdata = JSON.parse(localStorage.getItem('orderdata'));
    console.log(orderdata);
  }
  if (document.querySelectorAll('.invoice-page')) {
    invoicePage();
  }
  if (document.querySelectorAll('.add-to-request')) {
    orderpage();
  }
})();

