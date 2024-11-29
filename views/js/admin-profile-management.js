document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");
  const changeProfileImageBtn = document.getElementById("changeProfileImage");
  const imageUpload = document.getElementById("imageUpload");
  const profileImage = document.getElementById("profileImage");

  changeProfileImageBtn.addEventListener("click", () => {
    imageUpload.click();
  });

  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      imageUpload.value = ""; 
    } else if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profileImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

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
    formData.append("image", imageUpload.files[0]);
  }

  const response = await fetch("/update-admin", {
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
    const response = await fetch("/admin-home-data", {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user details");

    const { adminInformation } = await response.json();

    document.getElementById("fullName").value = adminInformation.fullName || "";
    document.getElementById("email").value = adminInformation.email || "";

    const profileImage = document.getElementById("profileImage");
    profileImage.src = adminInformation.imageUrl || "../../assets/images/user_placeholder.png";
  } catch (error) {
    alert(error.message);
  }
});
