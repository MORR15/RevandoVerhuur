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
        const naam = document.getElementById("naam").value;
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
