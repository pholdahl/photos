import supabase from "./supabaseClient.js";

document
  .getElementById("signInForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;

    const { user, session, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      // alert("Signup successful!");
      console.log("Sing in result:", user, session, error);
      window.location.href = "upload.html"; // Redirect after signup
    }
  });

async function signOut() {
  const { error } = await supabase.auth.signOut();
  console.log(error);
}

document.getElementById("signOutButton").addEventListener("click", signOut);
