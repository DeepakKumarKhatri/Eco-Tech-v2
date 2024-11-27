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

    // Here you would typically send the form data to your server
    // For this example, we'll just show an alert
    alert("Profile updated successfully!");
  });

  // Sidebar toggle functionality
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  // User dropdown functionality
  const userAvatar = document.getElementById("userAvatar");
  const userDropdown = document.getElementById("userDropdown");

  userAvatar.addEventListener("click", () => {
    userDropdown.classList.toggle("show");
  });

  // Close the dropdown when clicking outside of it
  window.addEventListener("click", (e) => {
    if (!e.target.matches("#userAvatar")) {
      if (userDropdown.classList.contains("show")) {
        userDropdown.classList.remove("show");
      }
    }
  });
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("fullName", document.getElementById("fullName").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("phone_number", document.getElementById("phone").value);
  formData.append("address", document.getElementById("address").value);

  if (imageUpload.files[0]) {
    formData.append("image", imageUpload.files[0]); // Send as binary
  }

  const response = await fetch("/api/users/user-profile", {
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
    const response = await fetch("/api/users/user-details", {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user details");

    const { user } = await response.json();

    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone_number || "";
    document.getElementById("address").value = user.address || "";

    const profileImage = document.getElementById("profileImage");
    profileImage.src = user.imageUrl || "../../assets/images/demo_user.png";
  } catch (error) {
    console.error("Error fetching user details:", error);
    alert("Failed to load user details. Please try again later.");
  }
});
