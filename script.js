const products = [
  { name: "Neon Circuit", category: "GAMING / PC", icon: "NX", color: "#ff347f", rating: "4.9", reviews: "2.4k", description: "A sharp, colorful upgrade for your everyday setup.", prices: { NPR: 799, INR: 499, USD: 5.99 }, sale: "14% OFF" },
  { name: "Aim Lab Plus", category: "GAMING / TRAINING", icon: "✳", color: "#72e8e7", rating: "4.8", reviews: "1.8k", description: "Practice tools and session extras for focused play.", prices: { NPR: 599, INR: 369, USD: 4.49 }, sale: "10% OFF" },
  { name: "Pixel Pack", category: "CREATOR / DIGITAL", icon: "PX", color: "#ae8bff", rating: "5.0", reviews: "940", description: "A little extra inspiration for your next project.", prices: { NPR: 449, INR: 279, USD: 3.49 }, sale: "POPULAR" },
  { name: "Night Shift", category: "GAMING / PC", icon: "N°", color: "#ffb957", rating: "4.7", reviews: "1.2k", description: "A custom color set for late-night sessions.", prices: { NPR: 699, INR: 429, USD: 5.25 }, sale: "" },
  { name: "Level Up Kit", category: "PLAYER / DIGITAL", icon: "↑", color: "#67d79e", rating: "4.9", reviews: "780", description: "Useful extras to make your next session yours.", prices: { NPR: 999, INR: 619, USD: 7.49 }, sale: "NEW DROP" },
  { name: "Creator Bundle", category: "CREATOR / DIGITAL", icon: "✦", color: "#ff6aa2", rating: "4.8", reviews: "640", description: "A tidy toolkit for making and sharing your work.", prices: { NPR: 1299, INR: 799, USD: 9.99 }, sale: "" }
];

let currency = "NPR";
let authMode = "login";
let authMethod = "email";
let phoneCodeSent = false;
let toastTimeout;
let supabaseClient;

const productGrid = document.querySelector("#product-grid");
const toast = document.querySelector(".toast");
const signedOutPanel = document.querySelector("#account-signed-out");
const dashboard = document.querySelector("#account-dashboard");
const emailAuthForm = document.querySelector("#email-auth-form");
const emailAuthNotice = document.querySelector("#auth-notice");
const phoneAuthForm = document.querySelector("#phone-auth-form");
const phoneAuthNotice = document.querySelector("#phone-auth-notice");
const otpFields = document.querySelector("#phone-otp-fields");
const phoneSubmit = document.querySelector("#phone-auth-submit");
const formatPrice = (value) => `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(value)}`;
const planMultipliers = { single: 1, bundle: 1.7, annual: 8 };

function getPrice(product, plan) {
  const calculatedPrice = product.prices[currency] * planMultipliers[plan];
  return currency === "USD" ? Math.round(calculatedPrice * 100) / 100 : Math.round(calculatedPrice);
}

function renderProducts() {
  productGrid.innerHTML = products.map((product, index) => `
    <article class="product-card">
      <div class="product-art" style="--art-color: ${product.color}">
        <span class="product-label">IN STOCK</span>
        ${product.sale ? `<span class="product-label product-label--sale">${product.sale}</span>` : ""}
        <div class="art-shape"><span>${product.icon}</span></div>
      </div>
      <div class="product-content">
        <div class="product-category">${product.category}</div>
        <div class="product-title-row">
          <h3 class="product-title">${product.name}</h3>
          <span class="rating" aria-label="${product.rating} out of 5 stars">★ ${product.rating}</span>
        </div>
        <div class="product-meta"><span>★ ${product.rating} <small>(${product.reviews})</small></span><span>✦ PLAYER FAVORITE</span></div>
        <p class="product-description">${product.description}</p>
        <div class="plan-options" role="group" aria-label="Choose ${product.name} option">
          <button class="plan-button is-selected" type="button" data-plan="single" data-product="${index}" aria-pressed="true">Starter</button>
          <button class="plan-button" type="button" data-plan="bundle" data-product="${index}" aria-pressed="false">Plus</button>
          <button class="plan-button" type="button" data-plan="annual" data-product="${index}" aria-pressed="false">Complete</button>
        </div>
        <div class="product-buy-row">
          <div><div class="price-caption">STARTING AT</div><div class="product-price">${formatPrice(product.prices[currency])}</div></div>
          <button class="product-buy" type="button" data-buy="${index}">View details <span>↗</span></button>
        </div>
      </div>
    </article>
  `).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 4000);
}

function setNotice(element, message, state = "") {
  element.textContent = message;
  element.dataset.state = state;
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    const active = button.dataset.authMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelector("#google-auth-label").textContent =
    mode === "register" ? "Sign up with Google" : "Continue with Google";
  emailAuthForm.querySelector(".auth-submit").innerHTML = mode === "register"
    ? "Create account <span>↗</span>"
    : "Login <span>↗</span>";
  emailAuthForm.elements.password.autocomplete = mode === "register" ? "new-password" : "current-password";
  emailAuthForm.elements.password.minLength = mode === "register" ? 8 : 1;
  emailAuthForm.elements.password.setCustomValidity("");
  phoneSubmit.innerHTML = phoneCodeSent ? "Verify and continue <span>↗</span>" : "Send verification code <span>↗</span>";
  phoneSubmit.disabled = false;
  setNotice(emailAuthNotice, supabaseClient ? "" : "Add your Supabase URL and public anon key in config.js before registering.", supabaseClient ? "" : "error");
  setNotice(phoneAuthNotice, supabaseClient ? "" : "Add your Supabase URL and public anon key in config.js before registering.", supabaseClient ? "" : "error");
}

function setAuthMethod(method) {
  authMethod = method;
  document.querySelectorAll("[data-auth-method]").forEach((button) => {
    const active = button.dataset.authMethod === method;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  emailAuthForm.hidden = method !== "email";
  phoneAuthForm.hidden = method !== "phone";
  setAuthMode(authMode);
}

function setSignedIn(user) {
  signedOutPanel.hidden = Boolean(user);
  dashboard.hidden = !user;
  if (!user) return;
  const identity = user.email || user.phone || "Google account";
  document.querySelector("#dashboard-identity").textContent = identity;
  document.querySelector("#profile-name").textContent = identity;
  document.querySelector("#profile-avatar").textContent = identity.charAt(0).toUpperCase();
}

function getAuthErrorMessage(error) {
  if (error.message?.toLowerCase().includes("provider is not enabled")) {
    return "This sign-in method is not enabled yet. Turn it on in Supabase Authentication settings.";
  }
  if (error.message?.toLowerCase().includes("phone") && error.message.toLowerCase().includes("provider")) {
    return "Phone sign-in is not configured yet. Set up an SMS provider in Supabase Authentication settings.";
  }
  return error.message || "Could not complete that request. Please try again.";
}

if (window.supabase?.createClient && window.STORE_CONFIG?.supabaseUrl && window.STORE_CONFIG?.supabaseAnonKey) {
  supabaseClient = window.supabase.createClient(
    window.STORE_CONFIG.supabaseUrl,
    window.STORE_CONFIG.supabaseAnonKey
  );
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("Could not restore the account session:", error);
      setNotice(emailAuthNotice, "Could not restore your account session. Please sign in again.", "error");
      return;
    }
    setSignedIn(data.session?.user || null);
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => setSignedIn(session?.user || null));
  });
} else {
  const setupMessage = "Account setup is not complete. Add your Supabase URL and public anon key in config.js.";
  setNotice(emailAuthNotice, setupMessage, "error");
  setNotice(phoneAuthNotice, setupMessage, "error");
}

document.querySelector(".currency-picker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-currency]");
  if (!button) return;
  currency = button.dataset.currency;
  document.querySelectorAll(".currency-option").forEach((option) => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  document.querySelectorAll(".product-card").forEach((card, index) => {
    const selectedPlan = card.querySelector(".plan-button.is-selected").dataset.plan;
    card.querySelector(".product-price").textContent = formatPrice(getPrice(products[index], selectedPlan));
  });
});

productGrid.addEventListener("click", (event) => {
  const planButton = event.target.closest("[data-plan]");
  if (planButton) {
    const { product, plan } = planButton.dataset;
    const card = planButton.closest(".product-card");
    card.querySelectorAll(".plan-button").forEach((option) => {
      const selected = option === planButton;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    card.querySelector(".product-price").textContent = formatPrice(getPrice(products[product], plan));
    return;
  }
  const buyButton = event.target.closest("[data-buy]");
  if (buyButton) showToast("Product details and secure checkout can be connected here.");
});

document.querySelectorAll("[data-auth-mode]").forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
});
document.querySelectorAll("[data-auth-method]").forEach((button) => {
  button.addEventListener("click", () => setAuthMethod(button.dataset.authMethod));
});

emailAuthForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return setNotice(emailAuthNotice, "Add your Supabase URL and public anon key in config.js before registering.", "error");
  const submit = emailAuthForm.querySelector(".auth-submit");
  submit.disabled = true;
  setNotice(emailAuthNotice, authMode === "register" ? "Creating your account…" : "Signing in…");
  try {
    const email = emailAuthForm.elements.email.value.trim();
    const password = emailAuthForm.elements.password.value;
    const result = authMode === "register"
      ? await supabaseClient.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/#account` } })
      : await supabaseClient.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (authMode === "register" && !result.data.session) {
      setNotice(emailAuthNotice, "Check your email for a confirmation link, then come back to sign in.", "success");
      return;
    }
    emailAuthForm.reset();
    setNotice(emailAuthNotice, authMode === "register" ? "Account created. Welcome!" : "Signed in successfully.", "success");
  } catch (error) {
    console.error("Email authentication failed:", error);
    setNotice(emailAuthNotice, getAuthErrorMessage(error), "error");
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#google-auth").addEventListener("click", async (event) => {
  if (!supabaseClient) return setNotice(emailAuthNotice, "Add your Supabase URL and public anon key in config.js before registering.", "error");
  const button = event.currentTarget;
  button.disabled = true;
  setNotice(authMethod === "phone" ? phoneAuthNotice : emailAuthNotice, "Connecting to Google…");
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/#account` }
    });
    if (error) throw error;
  } catch (error) {
    console.error("Google authentication failed:", error);
    setNotice(authMethod === "phone" ? phoneAuthNotice : emailAuthNotice, getAuthErrorMessage(error), "error");
    button.disabled = false;
  }
});

phoneAuthForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return setNotice(phoneAuthNotice, "Add your Supabase URL and public anon key in config.js before registering.", "error");
  const phone = phoneAuthForm.elements.phone.value.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return setNotice(phoneAuthNotice, "Enter your phone in international format, for example +9779812345678.", "error");
  }
  phoneSubmit.disabled = true;
  try {
    if (!phoneCodeSent) {
      setNotice(phoneAuthNotice, "Sending verification code…");
      const { error } = await supabaseClient.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: authMode === "register" }
      });
      if (error) throw error;
      phoneCodeSent = true;
      otpFields.hidden = false;
      phoneAuthForm.elements.token.required = true;
      phoneSubmit.innerHTML = "Verify and continue <span>↗</span>";
      document.querySelector("#phone-resend").hidden = false;
      setNotice(phoneAuthNotice, "Verification code sent by SMS. Enter it below to finish.", "success");
      phoneSubmit.disabled = false;
      phoneAuthForm.elements.token.focus();
      return;
    }

    setNotice(phoneAuthNotice, "Verifying your code…");
    const { error } = await supabaseClient.auth.verifyOtp({
      phone,
      token: phoneAuthForm.elements.token.value.trim(),
      type: "sms"
    });
    if (error) throw error;
    phoneAuthForm.reset();
    phoneCodeSent = false;
    otpFields.hidden = true;
    phoneAuthForm.elements.token.required = false;
    document.querySelector("#phone-resend").hidden = true;
    phoneSubmit.disabled = false;
    setNotice(phoneAuthNotice, "Phone verified. Your account is ready.", "success");
  } catch (error) {
    console.error("Phone authentication failed:", error);
    setNotice(phoneAuthNotice, getAuthErrorMessage(error), "error");
    phoneSubmit.disabled = false;
  }
});

phoneAuthForm.elements.phone.addEventListener("input", () => {
  if (!phoneCodeSent) return;
  phoneCodeSent = false;
  otpFields.hidden = true;
  phoneAuthForm.elements.token.required = false;
  phoneAuthForm.elements.token.value = "";
  document.querySelector("#phone-resend").hidden = true;
  phoneSubmit.innerHTML = "Send verification code <span>↗</span>";
  setNotice(phoneAuthNotice, "Phone number changed. Send a new verification code.");
});

document.querySelector("#phone-resend").addEventListener("click", async (event) => {
  if (!supabaseClient) return;
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signInWithOtp({
      phone: phoneAuthForm.elements.phone.value.trim(),
      options: { shouldCreateUser: authMode === "register" }
    });
    if (error) throw error;
    setNotice(phoneAuthNotice, "A new verification code was sent.", "success");
  } catch (error) {
    console.error("Could not resend phone verification:", error);
    setNotice(phoneAuthNotice, getAuthErrorMessage(error), "error");
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#sign-out").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error("Could not sign out:", error);
    showToast("Could not sign out. Please try again.");
  }
});

document.querySelectorAll(".header-login, .header-actions .button--pink").forEach((link) => {
  link.addEventListener("click", () => {
    if (link.textContent.toLowerCase().includes("register")) setAuthMode("register");
  });
});

const menuToggle = document.querySelector(".menu-toggle");
const mobileDrawer = document.querySelector(".mobile-drawer");
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  menuToggle.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
  mobileDrawer.classList.toggle("is-open", !expanded);
});
mobileDrawer.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  mobileDrawer.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  if (event.target.closest('a[href="#account"]')) setAuthMode("login");
});

const themeToggle = document.querySelector(".theme-toggle");
themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-theme");
  themeToggle.textContent = isLight ? "☾" : "☼";
  themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
});

document.querySelectorAll('[href="#account"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (link.textContent.toLowerCase().includes("register")) setAuthMode("register");
  });
});

renderProducts();
