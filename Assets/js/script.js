/* =========================================================
   IKHWEZI HAIR CARE PRODUCTS
   1. Form validation (red errors)
   2. Contact form - Web3Forms
   3. Hair consultation form - Web3Forms
   4. Product search
   5. Product image lightbox
   ========================================================= */


/* =========================================================
   VALIDATION RULES (return "" if valid, or an error message)
   ========================================================= */

const rules = {

    name(value) {
        if (!value) return "Please enter your full name.";
        if (!/^[A-Za-z\u00C0-\u024F' -]{2,}$/.test(value)) {
            return "Enter a name containing at least 2 letters.";
        }
        return "";
    },

    email(value) {
        if (!value) return "Please enter your email address.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
            return "Please enter a valid email address.";
        }
        return "";
    },

    phoneOptional(value) {
        if (!value) return "";
        const digits = value.replace(/[\s()-]/g, "");
        if (!/^(\+27|0)[0-9]{9}$/.test(digits)) {
            return "Enter a valid South African number, e.g. 078 166 7393.";
        }
        return "";
    },

    phoneRequired(value) {
        if (!value) return "Please enter your phone number.";
        return rules.phoneOptional(value);
    },

    select(label) {
        return value => (value ? "" : `Please select ${label}.`);
    },

    text(label, minimumLength) {
        return value => {
            if (!value) return `Please enter ${label}.`;
            if (value.length < minimumLength) {
                return `Please write at least ${minimumLength} characters.`;
            }
            return "";
        };
    }
};


/* =========================================================
   ERROR HELPERS (red text + red box)
   ========================================================= */

function clearError(field) {
    field.classList.remove("input-error");
    field.removeAttribute("aria-invalid");
    field.style.border = "";
    field.style.backgroundColor = "";

    const next = field.nextElementSibling;
    if (next && next.classList.contains("error-message")) {
        next.remove();
    }
}

function showError(field, message) {
    clearError(field);

    // Red box
    field.classList.add("input-error");
    field.setAttribute("aria-invalid", "true");
    field.style.border = "2px solid red";
    field.style.backgroundColor = "#fff5f5";

    // Red text
    const error = document.createElement("span");
    error.className = "error-message";
    error.setAttribute("role", "alert");
    error.textContent = message;
    error.style.color = "red";
    error.style.display = "block";
    error.style.fontSize = "0.85rem";
    error.style.marginTop = "4px";

    field.insertAdjacentElement("afterend", error);
}

function validateField(form, id, rule) {
    const field = form.querySelector("#" + id);
    if (!field) return true;

    const errorMessage = rule(field.value.trim());

    if (errorMessage) {
        showError(field, errorMessage);
        return false;
    }

    clearError(field);
    return true;
}


/* =========================================================
   STATUS MESSAGE (red = error, green = success)
   ========================================================= */

function showStatus(form, message, type) {
    let status = form.querySelector(".form-status");

    if (!status) {
        status = document.createElement("p");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        form.appendChild(status);
    }

    status.className = "form-status " + type;
    status.textContent = message;
    status.style.fontWeight = "bold";

    if (type === "error") {
        status.style.color = "red";
    } else if (type === "success") {
        status.style.color = "darkgreen";
    } else {
        status.style.color = "#555";
    }
}


/* =========================================================
   GENERAL FORM VALIDATION SETUP
   ========================================================= */

function setupValidation(form, fieldRules) {

    form.noValidate = true;

    Object.entries(fieldRules).forEach(([id, rule]) => {

        const field = form.querySelector("#" + id);
        if (!field) return;

        field.addEventListener("blur", () => {
            validateField(form, id, rule);
        });

        field.addEventListener("input", () => {
            if (field.classList.contains("input-error")) {
                validateField(form, id, rule);
            }
        });

        if (field.tagName === "SELECT") {
            field.addEventListener("change", () => {
                validateField(form, id, rule);
            });
        }
    });
}

function validateForm(form, fieldRules) {

    let firstInvalid = null;

    Object.entries(fieldRules).forEach(([id, rule]) => {
        const valid = validateField(form, id, rule);

        if (!valid && !firstInvalid) {
            firstInvalid = form.querySelector("#" + id);
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
        showStatus(form, "Please fix the highlighted fields and try again.", "error");
        return false;
    }

    return true;
}

function getValue(form, id) {
    const field = form.querySelector("#" + id);
    return field ? field.value.trim() : "";
}


/* =========================================================
   SHARED SUBMIT HANDLER (Web3Forms)
   ========================================================= */

function handleSubmit(form, fieldRules, messages) {

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (!validateForm(form, fieldRules)) return;

        const button = form.querySelector("button[type='submit']");
        if (!button) return;

        const originalText = button.textContent.trim();

        button.disabled = true;
        button.textContent = "Sending...";
        showStatus(form, messages.sending, "loading");

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { Accept: "application/json" },
                body: new FormData(form)
            });

            const result = await response.json();

            if (response.ok && result.success) {

                const firstName = getValue(form, "name").split(" ")[0];

                showStatus(form, `Thank you, ${firstName}! ${messages.success}`, "success");

                form.reset();
                form.querySelectorAll("input, textarea, select").forEach(clearError);

            } else {
                showStatus(
                    form,
                    messages.failure + " " +
                    (result.message || "Please check your Web3Forms settings and try again."),
                    "error"
                );
            }

        } catch (error) {
            console.error("Web3Forms error:", error);
            showStatus(
                form,
                "A network error occurred. Please check your internet connection and try again.",
                "error"
            );

        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });
}


/* =========================================================
   CONTACT FORM
   ========================================================= */

function setupContactForm() {

    const form = document.getElementById("contactForm");
    if (!form) return;

    const fieldRules = {
        name: rules.name,
        email: rules.email,
        phone: rules.phoneOptional,
        message: rules.text("your message", 10)
    };

    setupValidation(form, fieldRules);

    handleSubmit(form, fieldRules, {
        sending: "Sending your message...",
        success: "Your message has been sent successfully. We will get back to you soon.",
        failure: "Your message could not be sent."
    });
}


/* =========================================================
   HAIR CONSULTATION FORM
   ========================================================= */

function setupConsultationForm() {

    const form = document.getElementById("consultationForm");
    if (!form) return;

    const fieldRules = {
        name: rules.name,
        email: rules.email,
        phone: rules.phoneRequired,
        "hair-type": rules.select("your hair type"),
        "hair-condition": rules.select("your current hair condition"),
        concern: rules.select("your main hair concern"),
        goals: rules.text("your hair goals", 10)
    };

    setupValidation(form, fieldRules);

    handleSubmit(form, fieldRules, {
        sending: "Sending your consultation...",
        success: "Your consultation has been sent successfully. We will review your details and contact you with suitable product recommendations.",
        failure: "Your consultation could not be sent."
    });
}


/* =========================================================
   PRODUCTS PAGE - SEARCH
   ========================================================= */

function filterProducts() {

    const input = document.getElementById("searchInput");
    const cards = document.querySelectorAll(".product-card");
    const container = document.querySelector(".product-container");

    if (!input || cards.length === 0 || !container) return;

    const words = input.value
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    let visible = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matches = words.every(word => text.includes(word));

        card.style.display = matches ? "" : "none";
        if (matches) visible++;
    });

    let note = document.getElementById("noResults");

    if (!note) {
        note = document.createElement("p");
        note.id = "noResults";
        note.setAttribute("role", "status");
        note.style.cssText =
            "text-align:center; color:darkgreen; font-weight:bold; margin:20px 0;";
        container.insertAdjacentElement("afterend", note);
    }

    note.textContent = visible === 0
        ? `No products found for "${input.value.trim()}". Try another word.`
        : "";
}


/* =========================================================
   PRODUCTS PAGE - IMAGE LIGHTBOX
   ========================================================= */

function openLightbox(src, alt) {
    const modal = document.getElementById("lightboxModal");
    const image = document.getElementById("lightboxImg");
    if (!modal || !image) return;

    image.src = src;
    image.alt = alt || "";
    modal.style.display = "block";
}

function closeLightbox() {
    const modal = document.getElementById("lightboxModal");
    if (modal) modal.style.display = "none";
}


/* =========================================================
   INITIALISE WEBSITE FEATURES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupContactForm();
    setupConsultationForm();

    // Product search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", filterProducts);
    }

    // Lightbox: open on image click
    document.querySelectorAll(".product-card img").forEach(image => {
        image.style.cursor = "zoom-in";
        image.addEventListener("click", () => {
            openLightbox(image.src, image.alt);
        });
    });

    // Lightbox: close on dark background click
    const modal = document.getElementById("lightboxModal");
    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) closeLightbox();
        });
    }

    // Lightbox: close with Escape
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeLightbox();
    });
});