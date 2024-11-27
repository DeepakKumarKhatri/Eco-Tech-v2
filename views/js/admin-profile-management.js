document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");
  const changeProfileImageBtn = document.getElementById("changeProfileImage");
  const imageUpload = document.getElementById("imageUpload");
  const profileImage = document.getElementById("profileImage");

  // Handle profile image change
  changeProfileImageBtn.addEventListener("click", () => {
    imageUpload.click();
  });

  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      imageUpload.value = ""; // Clear the input
    } else if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profileImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle form submission
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validate password fields
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    alert("Profile updated successfully!");
  });
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("fullName", document.getElementById("fullName").value);
  formData.append("email", document.getElementById("email").value);

  if (imageUpload.files[0]) {
    formData.append("image", imageUpload.files[0]); // Send as binary
  }

  const response = await fetch("/api/admin/user-profile", {
    method: "PUT",
    body: formData,
  });

  const result = await response.json();
  if (response.ok) {
    alert("Profile updated successfully!");
    location.reload();
  } else {
    alert(result.message || "Error updating profile");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/admin/user-details", {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user details");

    const { user } = await response.json();

    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("email").value = user.email || "";

    const profileImage = document.getElementById("profileImage");
    profileImage.src = user.imageUrl || "../../assets/images/demo_user.png";
  } catch (error) {
    console.error("Error fetching user details:", error);
    alert("Failed to load user details. Please try again later.");
  }
});
