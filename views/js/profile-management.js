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
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("fullName", document.getElementById("fullName").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("phone_number", document.getElementById("phone").value);
  formData.append("address", document.getElementById("address").value);
  formData.append("password", document.getElementById("password").value);

  if (imageUpload.files[0]) {
    formData.append("image", imageUpload.files[0]);
  }

  const response = await fetch("/update-user", {
    method: "PUT",
    body: formData,
  });

  const result = await response.json();
  if (response.ok) {
    alert("Profile updated successfully!");
    location.reload();
  } else {
    alert(result.message);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/get-user", {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user details");

    const { user } = await response.json();

    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone_number || "";
    document.getElementById("address").value = user.address || "";

    const profileImage = document.getElementById("profileImage");
    profileImage.src = user.imageUrl || "../../assets/images/user_placeholder.png";
  } catch (error) {
    alert(error.message);
  }
});
