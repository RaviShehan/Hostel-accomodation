const form = document.querySelector("#loginForm");
const errorBox = document.querySelector("#loginError");
const email = document.querySelector("#email");
const password = document.querySelector("#password");

document.querySelectorAll("[data-demo]").forEach(button => button.addEventListener("click", () => {
  const student = button.dataset.demo === "student";
  email.value = student ? "student@havenly.lk" : "admin@havenly.lk";
  password.value = student ? "student123" : "admin123";
}));

form.addEventListener("submit", async event => {
  event.preventDefault();
  const submit = form.querySelector(".submit-btn");
  submit.disabled = true;
  submit.querySelector("span").textContent = "Signing in…";
  errorBox.textContent = "";
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value, password: password.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to sign in");
    localStorage.setItem("havenlyToken", data.token);
    localStorage.setItem("havenlyUser", JSON.stringify(data.user));
    location.href = data.redirect;
  } catch (error) {
    errorBox.textContent = error.message;
    submit.disabled = false;
    submit.querySelector("span").textContent = "Sign in";
  }
});
